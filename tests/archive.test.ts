import { describe, expect, it } from "vitest";
import { createLoad, createProject } from "../src/domain/project";
import { captureProjectSession } from "../src/storage/projectSession";
import {
  canonicalArchiveJson,
  sealWorkspaceArchive,
  validateWorkspaceArchive,
  type ArchivedProject,
} from "../src/import-export/archive";
const entry = (): ArchivedProject => ({
  project: createProject("Archive analytical fixture"),
  deleted: false,
  savedAt: "2026-11-06T00:00:00.000Z",
  history: [],
  bill: null,
  measurements: null,
});

describe("portable workspace backup validation", () => {
  it("round-trips optional saved interview and BOT metadata without changing legacy v1 requirements", async () => {
    const saved = entry();
    saved.session = captureProjectSession(saved.project.id, {
      interview: { step: 2, completed: false },
      route: "overview",
      botOpen: true,
    });
    saved.session.bot.draft = "Continue my engineering question";
    const archive = await sealWorkspaceArchive([saved]);
    const validated = await validateWorkspaceArchive(archive);
    expect(validated.valid).toBe(true);
    expect(validated.archive?.projects[0].session).toEqual(saved.session);
    expect(validated.counts.workingDrafts).toBe(0);
    expect(
      (await validateWorkspaceArchive(await sealWorkspaceArchive([entry()])))
        .valid,
    ).toBe(true);
  });

  it("preserves a working interview separately from the earlier explicitly saved session", async () => {
    const saved = entry();
    saved.session = captureProjectSession(saved.project.id, {
      interview: { step: 1, completed: false },
      route: "overview",
      botOpen: false,
    });
    saved.workingSession = {
      ...structuredClone(saved.session),
      interview: { step: 3, completed: false },
    };
    const validated = await validateWorkspaceArchive(
      await sealWorkspaceArchive([saved]),
    );
    expect(validated.valid).toBe(true);
    expect(validated.counts.workingDrafts).toBe(1);
    expect(validated.archive?.projects[0].session?.interview.step).toBe(1);
    expect(validated.archive?.projects[0].workingSession?.interview.step).toBe(
      3,
    );
  });

  it("rejects invalid optional session metadata even when the archive checksum is valid", async () => {
    const saved = entry();
    saved.session = { version: 99 } as never;
    const validated = await validateWorkspaceArchive(
      await sealWorkspaceArchive([saved]),
    );
    expect(validated.valid).toBe(false);
    expect(validated.errors.join(" ")).toContain("invalid session");
  });

  it("round-trips current records, trash, history, working drafts, equipment templates and observed CSV", async () => {
    const first = entry();
    first.project.equipmentLibrary = [
      createLoad({ name: "Entered template", quantity: 2 }),
    ];
    first.history = [structuredClone(first.project)];
    first.workingDraft = {
      ...structuredClone(first.project),
      name: "Unsaved engineering edit",
    };
    first.measurements = {
      filename: "observed.csv",
      rawCSV:
        "timestamp,power\n2026-10-25T00:00:00Z,1\n2026-10-25T00:15:00Z,-0.5",
      options: {
        timestampColumn: "timestamp",
        powerColumn: "power",
        powerUnit: "kW",
        intervalMinutes: 15,
      },
    };
    const second = entry();
    second.deleted = true;
    const archive = await sealWorkspaceArchive([first, second]);
    const result = await validateWorkspaceArchive(JSON.stringify(archive));
    expect(result.valid).toBe(true);
    expect(result.counts).toMatchObject({
      projects: 2,
      deletedProjects: 1,
      revisions: 1,
      workingDrafts: 1,
      measurements: 1,
    });
    expect(result.archive?.projects[0]).toEqual(first);
  });
  it("rejects modified payloads and unsupported formats before restore", async () => {
    const archive = await sealWorkspaceArchive([entry()]);
    archive.projects[0].project.name = "Tampered";
    expect((await validateWorkspaceArchive(archive)).errors.join(" ")).toMatch(
      /integrity/,
    );
    expect(
      (await validateWorkspaceArchive({ ...archive, version: 99 })).valid,
    ).toBe(false);
  });
  it("rejects duplicate project IDs and invalid measurement mapping even with a valid checksum", async () => {
    const first = entry();
    expect(
      (
        await validateWorkspaceArchive(
          await sealWorkspaceArchive([first, first]),
        )
      ).errors.join(" "),
    ).toMatch(/duplicate project ID/);
    first.measurements = {
      filename: "invalid.csv",
      rawCSV: "timestamp,power\n2026-11-06T00:00:00,2",
      options: {
        timestampColumn: "timestamp",
        powerColumn: "power",
        powerUnit: "kW",
        intervalMinutes: 15,
      },
    };
    expect(
      (await validateWorkspaceArchive(await sealWorkspaceArchive([first])))
        .valid,
    ).toBe(false);
  });
  it("checks equivalent JSON content independently of property order and preserves inert recovery data", async () => {
    expect(canonicalArchiveJson({ b: 2, a: 1 })).toBe(
      canonicalArchiveJson({ a: 1, b: 2 }),
    );
    const archive = await sealWorkspaceArchive(
      [],
      [
        {
          key: "failed-record",
          source: "legacy",
          value: { schemaVersion: 999, text: "<script>inert text</script>" },
          reason: "Unsupported original record",
          capturedAt: "2026-11-06T00:00:00Z",
        },
      ],
    );
    const result = await validateWorkspaceArchive(archive);
    expect(result.valid).toBe(true);
    expect(result.counts.recoveryRecords).toBe(1);
    expect(result.warnings.join(" ")).toMatch(/inert/);
  });
  it("rejects malformed JSON and unbounded nesting with an actionable preview error", async () => {
    expect((await validateWorkspaceArchive("{broken")).valid).toBe(false);
    let value: unknown = 0;
    for (let i = 0; i < 66; i++) value = [value];
    expect(() => canonicalArchiveJson(value)).toThrow(/depth/);
  });
});
