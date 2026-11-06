import type { LocalResponse } from "./adapter";

export interface BotSession<Message> {
  messages: Message[];
  draft: string;
}

type Update<Value> = Value | ((previous: Value) => Value);

export interface BotMessage {
  id: number;
  role: "user" | "assistant";
  text?: string;
  response?: LocalResponse;
  applied?: boolean;
  dismissed?: boolean;
  /** Restored calculation previews are history, never executable proposals. */
  restored?: boolean;
}

export type BotSessionSnapshot = BotSession<BotMessage>;

/** Keeps each project's conversation and unfinished draft for this page session. */
export function createBotSessionStore<Message>() {
  const sessions = new Map<string, BotSession<Message>>();
  const listeners = new Map<string, Set<() => void>>();

  const get = (projectId: string): BotSession<Message> => {
    let session = sessions.get(projectId);
    if (!session) {
      session = { messages: [], draft: "" };
      sessions.set(projectId, session);
    }
    return session;
  };

  const update = (projectId: string, session: BotSession<Message>) => {
    sessions.set(projectId, session);
    listeners.get(projectId)?.forEach((listener) => listener());
  };

  return {
    get,
    snapshot(projectId: string): BotSession<Message> {
      return structuredClone(get(projectId));
    },
    restore(projectId: string, session: BotSession<Message>) {
      update(projectId, structuredClone(session));
    },
    clear(projectId: string) {
      update(projectId, { messages: [], draft: "" });
    },
    subscribe(projectId: string, listener: () => void) {
      const projectListeners =
        listeners.get(projectId) ?? new Set<() => void>();
      listeners.set(projectId, projectListeners);
      projectListeners.add(listener);
      return () => {
        projectListeners.delete(listener);
        if (!projectListeners.size) listeners.delete(projectId);
      };
    },
    setMessages(projectId: string, value: Update<Message[]>) {
      const session = get(projectId);
      const messages =
        typeof value === "function" ? value(session.messages) : value;
      if (messages !== session.messages)
        update(projectId, { ...session, messages });
    },
    setDraft(projectId: string, draft: string) {
      const session = get(projectId);
      if (draft !== session.draft) update(projectId, { ...session, draft });
    },
  };
}

/** Temporary conversations live only in memory until Save project captures them. */
export const botSessions = createBotSessionStore<BotMessage>();

const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown): value is string =>
  typeof value === "string" && value.length <= 20000;
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const issues = (value: unknown) =>
  Array.isArray(value) &&
  value.every((item) => object(item) && text(item.id) && text(item.message));

/** Check every field consumed by the BOT renderer before restoring local data. */
function validResponse(value: unknown): value is LocalResponse {
  if (
    !object(value) ||
    ![
      "summary",
      "explain",
      "issues",
      "balance",
      "load",
      "report",
      "help",
    ].includes(String(value.kind)) ||
    !text(value.projectId) ||
    !Number.isSafeInteger(value.revision) ||
    !object(value.result)
  )
    return false;
  const result = value.result;
  if (
    !finite(result.designKW) ||
    !finite(result.dailyKWh) ||
    !finite(result.apparentKVA) ||
    !issues(result.issues) ||
    !object(result.trace) ||
    !text(result.trace.formula) ||
    (value.issues !== undefined && !issues(value.issues))
  )
    return false;
  const load = value.selectedLoad;
  if (
    load !== undefined &&
    (!object(load) ||
      !text(load.name) ||
      !text(load.entryMode) ||
      ![load.rating, load.voltage, load.pf, load.quantity].every(finite))
  )
    return false;
  const proposal = value.proposal;
  if (proposal === undefined) return true;
  if (
    !object(proposal) ||
    !text(proposal.projectId) ||
    !Number.isSafeInteger(proposal.revision)
  )
    return false;
  if (proposal.kind === "balance") {
    const plan = proposal.plan;
    return (
      object(plan) &&
      finite(plan.beforeImbalance) &&
      finite(plan.afterImbalance) &&
      Array.isArray(plan.moves) &&
      plan.moves.every(
        (move) =>
          object(move) && text(move.loadId) && text(move.from) && text(move.to),
      )
    );
  }
  const proposed = proposal.load;
  return (
    proposal.kind === "load" &&
    object(proposed) &&
    text(proposed.name) &&
    [
      proposed.rating,
      proposed.voltage,
      proposed.pf,
      proposed.hoursPerDay,
      proposal.beforeKW,
      proposal.afterKW,
    ].every(finite)
  );
}

function resumableSession(session: BotSessionSnapshot): BotSessionSnapshot {
  // Do not restore processing flags, timers or executable stale previews.
  const result = structuredClone(session);
  result.messages = result.messages.map((message) =>
    message.response ? { ...message, restored: true } : message,
  );
  const last = result.messages.at(-1);
  if (!result.draft && last?.role === "user")
    result.draft = (last.text ?? "").slice(0, 2000);
  return result;
}

export function validateBotSession(value: unknown): BotSessionSnapshot {
  if (
    !object(value) ||
    !Array.isArray(value.messages) ||
    value.messages.length > 1000 ||
    typeof value.draft !== "string" ||
    value.draft.length > 2000
  )
    throw new Error(
      "The saved BOT conversation or unfinished command is invalid.",
    );
  const ids = new Set<number>();
  for (const message of value.messages) {
    if (
      !object(message) ||
      !Number.isSafeInteger(message.id) ||
      Number(message.id) < 1 ||
      ids.has(Number(message.id)) ||
      !["user", "assistant"].includes(String(message.role)) ||
      (message.text !== undefined && !text(message.text)) ||
      (message.response !== undefined && !validResponse(message.response)) ||
      (message.text === undefined && message.response === undefined) ||
      ["applied", "dismissed", "restored"].some(
        (key) =>
          message[key] !== undefined && typeof message[key] !== "boolean",
      )
    )
      throw new Error("A saved BOT message is invalid.");
    ids.add(Number(message.id));
  }
  return resumableSession(value as unknown as BotSessionSnapshot);
}

export function snapshotBotSession(projectId: string): BotSessionSnapshot {
  return resumableSession(botSessions.get(projectId));
}

export function restoreBotSession(
  projectId: string,
  session: BotSessionSnapshot = { messages: [], draft: "" },
): void {
  botSessions.restore(projectId, validateBotSession(session));
  if (typeof window !== "undefined")
    window.dispatchEvent(
      new CustomEvent("powerlab-bot-session-restored", {
        detail: { projectId },
      }),
    );
}

export function nextBotMessageId(projectId: string): number {
  return (
    Math.max(
      0,
      ...botSessions.get(projectId).messages.map((message) => message.id),
    ) + 1
  );
}
