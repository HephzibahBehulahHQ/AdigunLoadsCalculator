import { afterEach, describe, expect, it, vi } from "vitest";
import { createProject } from "../src/domain/project";
import { runLocalCommand } from "../src/bot/adapter";
import {
  botSessions,
  nextBotMessageId,
  restoreBotSession,
  snapshotBotSession,
  validateBotSession,
} from "../src/bot/sessionState";
import {
  captureProjectSession,
  projectContentFingerprint,
  projectSessionFingerprint,
  restoreProjectSession,
  remapProjectSession,
  validateProjectSession,
} from "../src/storage/projectSession";
import {
  captureBillingCheckpoint,
  listProjects,
  saveProject,
  type ProjectRecord,
} from "../src/storage/projects";
import { liveDrafts } from "../src/storage/billing";
import type { BillDocument } from "../src/import-export/reports";
import { openPowerLabDatabase } from "../src/storage/database";

vi.mock("../src/storage/database", () => ({ openPowerLabDatabase: vi.fn() }));

const session = (id: string) =>
  captureProjectSession(id, {
    interview: { step: 2, completed: false },
    route: "overview",
    botOpen: false,
  });

const bill = (): BillDocument => ({
  schemaVersion: 1,
  projectName: "Checkpoint test",
  currency: "EUR",
  locale: "en",
  kind: "estimate",
  number: "TEST-ONLY",
  date: "2026-11-06",
  dueDate: "",
  seller: "",
  sellerTaxId: "",
  customer: "Checkpoint verification fixture",
  customerReference: "",
  notes: "Test fixture; not a customer record.",
  paymentDetails: "",
  discountPercent: "0",
  taxPercent: "0",
  lines: [
    {
      id: "line",
      description: "Test item",
      category: "material",
      quantity: "1",
      unitPrice: "12.50",
    },
  ],
});

type Request = {
  result: unknown;
  onsuccess: (() => void) | null;
  onerror: (() => void) | null;
};

/** Requests can succeed before the browser commits or aborts the transaction. */
function database(current: Record<string, unknown> = {}) {
  const requests = new Map<string, Request>();
  const writes: { store: string; value: unknown }[] = [];
  const tx = {
    error: null as DOMException | null,
    oncomplete: null as (() => void) | null,
    onabort: null as (() => void) | null,
    onerror: null as (() => void) | null,
    objectStore: (name: string) => ({
      get: () => request(name),
      getAll: () => request(name),
      put: (value: unknown) =>
        writes.push({ store: name, value: structuredClone(value) }),
    }),
    abort: vi.fn(() => tx.onabort?.()),
  };
  function request(name: string) {
    const next = { result: current[name], onsuccess: null, onerror: null };
    requests.set(name, next);
    return next;
  }
  const transaction = vi.fn(() => tx);
  const db = { transaction } as unknown as IDBDatabase;
  vi.mocked(openPowerLabDatabase).mockResolvedValue(db);
  return {
    db,
    tx,
    transaction,
    writes,
    read(name: string) {
      requests.get(name)!.onsuccess?.();
    },
    commit() {
      tx.oncomplete?.();
    },
    abort() {
      tx.abort();
    },
  };
}

afterEach(() => {
  liveDrafts.clear();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("explicit project checkpoints", () => {
  it("releases a project-list read that stalls after the database has opened", async () => {
    vi.useFakeTimers();
    const events = database({ projects: [] });
    const pending = listProjects();
    const failed = expect(pending).rejects.toThrow("read timed out");
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(8000);
    await failed;
    expect(events.tx.abort).toHaveBeenCalledOnce();
    events.read("projects");
    events.commit();
    await expect(pending).rejects.toThrow("saved data has not been changed");
  });

  it("confirms nothing before commit and captures engineering, interview and billing at the click", async () => {
    const project = createProject("Before save");
    const progress = session(project.id);
    const document = bill();
    liveDrafts.set(project.id, { bill: document, revision: null, dirty: true });
    const events = database();
    let open!: (db: IDBDatabase) => void;
    vi.mocked(openPowerLabDatabase).mockReturnValue(
      new Promise((resolve) => {
        open = resolve;
      }),
    );
    const settled = vi.fn();
    const pending = saveProject(project, undefined, {
      session: progress,
      expectedCheckpointId: null,
      includeBilling: true,
    });
    void pending.then(settled);
    project.name = "Edited during save";
    progress.interview.step = 3;
    document.customer = "Later unsaved edit";
    open(events.db);
    await Promise.resolve();
    events.read("projects");
    events.read("bills");
    await Promise.resolve();
    expect(events.transaction).toHaveBeenCalledWith(
      ["projects", "history", "bills"],
      "readwrite",
    );
    expect(settled).not.toHaveBeenCalled();
    expect(liveDrafts.get(project.id)?.dirty).toBe(true);
    expect(
      events.writes.find((row) => row.store === "projects")?.value,
    ).toMatchObject({
      project: { name: "Before save" },
      session: { interview: { step: 2 } },
    });
    expect(
      events.writes.find((row) => row.store === "bills")?.value,
    ).toMatchObject({ bill: { customer: "Checkpoint verification fixture" } });
    events.commit();
    const saved = await pending;
    expect(saved.project.name).toBe("Before save");
    expect(liveDrafts.get(project.id)).toMatchObject({
      bill: { customer: "Later unsaved edit" },
      revision: saved.checkpointId,
      dirty: true,
    });
  });

  it("marks an unchanged bill clean only after its project transaction commits", async () => {
    const project = createProject("Atomic bill");
    liveDrafts.set(project.id, { bill: bill(), revision: null, dirty: true });
    const events = database();
    const pending = saveProject(project, undefined, {
      session: session(project.id),
      includeBilling: true,
    });
    await Promise.resolve();
    events.read("projects");
    events.read("bills");
    expect(liveDrafts.get(project.id)?.dirty).toBe(true);
    events.commit();
    const saved = await pending;
    expect(liveDrafts.get(project.id)).toMatchObject({
      revision: saved.checkpointId,
      dirty: false,
    });
  });

  it("rejects a transaction abort after successful writes without clearing the draft", async () => {
    const project = createProject("Abort test");
    liveDrafts.set(project.id, { bill: bill(), revision: null, dirty: true });
    const events = database();
    const pending = saveProject(project, undefined, {
      session: session(project.id),
      includeBilling: true,
    });
    const failed = expect(pending).rejects.toThrow("Local save failed");
    await Promise.resolve();
    events.read("projects");
    events.read("bills");
    events.tx.error = new DOMException("Quota exceeded", "QuotaExceededError");
    events.abort();
    await failed;
    expect(liveDrafts.get(project.id)).toMatchObject({
      revision: null,
      dirty: true,
    });
  });

  it("rejects stale interview checkpoints even when the project revision is unchanged", async () => {
    const project = createProject("Concurrent interview");
    const events = database({
      projects: {
        id: project.id,
        project,
        savedAt: "2026-11-06T00:00:00.000Z",
        deleted: false,
        checkpointId: "newer-checkpoint",
      },
    });
    const pending = saveProject(project, project.revision, {
      session: session(project.id),
      expectedCheckpointId: "older-checkpoint",
    });
    const failed = expect(pending).rejects.toThrow("another tab");
    await Promise.resolve();
    events.read("projects");
    await failed;
    expect(events.tx.abort).toHaveBeenCalledOnce();
    expect(events.writes).toHaveLength(0);
  });

  it("aborts the entire checkpoint on a stale customer bill", async () => {
    const project = createProject("Concurrent bill");
    liveDrafts.set(project.id, {
      bill: bill(),
      revision: "stale",
      dirty: true,
    });
    const events = database({ bills: { revision: "newer" } });
    const pending = saveProject(project, undefined, { includeBilling: true });
    const failed = expect(pending).rejects.toThrow(
      "No part of this project save was committed",
    );
    await Promise.resolve();
    events.read("projects");
    events.read("bills");
    await failed;
    expect(events.tx.abort).toHaveBeenCalledOnce();
    expect(liveDrafts.get(project.id)?.revision).toBe("stale");
  });

  it("bounds a stalled save and never turns a late completion into success", async () => {
    vi.useFakeTimers();
    const events = database();
    const pending = saveProject(createProject("No storage response"));
    const failed = expect(pending).rejects.toThrow("could not be confirmed");
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(8000);
    await failed;
    expect(events.tx.abort).toHaveBeenCalledOnce();
    events.commit();
    await expect(pending).rejects.toThrow("timed out");
  });

  it("rejects invalid inputs before opening storage", async () => {
    const project = createProject("Invalid checkpoint");
    await expect(saveProject({ ...project, revision: 0 })).rejects.toThrow(
      "could not be saved",
    );
    await expect(
      saveProject(project, undefined, {
        session: { ...session(project.id), version: 99 } as never,
      }),
    ).rejects.toThrow("workspace state is invalid");
    expect(openPowerLabDatabase).not.toHaveBeenCalled();
  });

  it("keeps valid legacy projects visible when only saved session metadata is malformed", async () => {
    const project = createProject("Usable old project");
    const row = {
      id: project.id,
      project,
      deleted: false,
      savedAt: "2026-11-06T00:00:00.000Z",
      session: { version: 99 },
    };
    const events = database({ projects: [row] });
    const pending = listProjects();
    await Promise.resolve();
    events.read("projects");
    events.commit();
    const records = await pending;
    expect(records).toHaveLength(1);
    expect(records[0].project).toEqual(project);
    expect(records[0].session).toBeUndefined();
    expect(row.session).toEqual({ version: 99 });
  });

  it("preserves session metadata when an older caller only saves engineering inputs", async () => {
    const project = createProject("Compatible caller");
    const savedSession = session(project.id);
    const old: ProjectRecord = {
      id: project.id,
      project,
      deleted: false,
      savedAt: "2026-11-06T00:00:00.000Z",
      session: savedSession,
    };
    const events = database({ projects: old });
    const pending = saveProject(project, project.revision);
    await Promise.resolve();
    events.read("projects");
    events.commit();
    expect((await pending).session).toEqual(savedSession);
  });

  it("captures a billing checkpoint independently of later edits", () => {
    liveDrafts.set("capture", { bill: bill(), revision: "saved", dirty: true });
    const captured = captureBillingCheckpoint("capture")!;
    liveDrafts.get("capture")!.bill.customer = "Later change";
    expect(captured.bill.customer).toBe("Checkpoint verification fixture");
    expect(captured.expectedRevision).toBe("saved");
  });
});

describe("saved interview and BOT resumption", () => {
  it("remaps copied-project selections and BOT references while retiring saved proposals", () => {
    const project = createProject("Archived conversation");
    botSessions.setMessages(project.id, [
      {
        id: 1,
        role: "assistant",
        response: runLocalCommand(project, "balance"),
      },
    ]);
    const saved = { ...session(project.id), selected: `source:${project.id}` };
    const mapped = remapProjectSession(saved, { [project.id]: "copy-project" });
    expect(mapped.selected).toBe("source:copy-project");
    expect(mapped.bot.messages[0]).toMatchObject({
      restored: true,
      response: {
        projectId: "copy-project",
        proposal: { projectId: "copy-project" },
      },
    });
    expect(saved.selected).toBe(`source:${project.id}`);
    expect(saved.bot.messages[0].response?.projectId).toBe(project.id);
  });

  it("restores the complete transcript and composer, with inert old proposals and unique message IDs", () => {
    const project = createProject("Saved conversation");
    botSessions.setMessages(project.id, [
      { id: 1, role: "user", text: "load: Heater; 2.3 kW; 230 V; PF 1; 8 h" },
      {
        id: 2,
        role: "assistant",
        response: runLocalCommand(
          project,
          "load: Heater; 2.3 kW; 230 V; PF 1; 8 h",
        ),
      },
    ]);
    botSessions.setDraft(project.id, "Continue this command");
    const captured = session(project.id);
    const fingerprint = projectSessionFingerprint(captured);
    botSessions.clear(project.id);
    const restored = restoreProjectSession(project.id, captured);
    expect(restored.interview).toEqual({ step: 2, completed: false });
    expect(botSessions.get(project.id).draft).toBe("Continue this command");
    expect(botSessions.get(project.id).messages[1]).toMatchObject({
      restored: true,
      response: { kind: "load" },
    });
    expect(nextBotMessageId(project.id)).toBe(3);
    expect(projectSessionFingerprint(session(project.id))).toBe(fingerprint);
  });

  it("preserves an interrupted command for manual retry without restoring a processing flag", () => {
    botSessions.setMessages("pending", [
      { id: 1, role: "user", text: "summary" },
    ]);
    const saved = snapshotBotSession("pending");
    expect(saved.draft).toBe("summary");
    restoreBotSession("resumed", saved);
    expect(botSessions.get("resumed")).toEqual({
      messages: [{ id: 1, role: "user", text: "summary" }],
      draft: "summary",
    });
  });

  it("tracks content changes while ignoring viewing preferences and revision bookkeeping", () => {
    const project = createProject("Dirty comparison");
    const original = session(project.id);
    const changedView = {
      ...original,
      route: "loads",
      selected: "load-id",
      botOpen: true,
    };
    expect(projectSessionFingerprint(changedView)).toBe(
      projectSessionFingerprint(original),
    );
    expect(
      projectSessionFingerprint({
        ...original,
        interview: { step: 3, completed: false },
      }),
    ).not.toBe(projectSessionFingerprint(original));
    expect(
      projectContentFingerprint({
        ...project,
        revision: 9,
        updatedAt: "changed",
      }),
    ).toBe(projectContentFingerprint(project));
    expect(
      projectContentFingerprint({ ...project, name: "Changed content" }),
    ).not.toBe(projectContentFingerprint(project));
  });

  it("rejects malformed conversations, duplicate IDs and invalid interview steps", () => {
    expect(() =>
      validateBotSession({
        messages: [{ id: 1, role: "assistant", response: { kind: "summary" } }],
        draft: "",
      }),
    ).toThrow("BOT message");
    expect(() =>
      validateBotSession({
        messages: [
          { id: 1, role: "user", text: "a" },
          { id: 1, role: "user", text: "b" },
        ],
        draft: "",
      }),
    ).toThrow("BOT message");
    expect(() =>
      validateProjectSession({
        ...session("invalid"),
        interview: { step: 4, completed: false },
      }),
    ).toThrow("interview");
  });
});
