export interface BotSession<Message> {
  messages: Message[];
  draft: string;
}

type Update<Value> = Value | ((previous: Value) => Value);

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
