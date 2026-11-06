import type { Project } from "../domain/types";
import {
  restoreBotSession,
  snapshotBotSession,
  validateBotSession,
  type BotSessionSnapshot,
} from "../bot/sessionState";

export interface InterviewProgress {
  step: 1 | 2 | 3;
  completed: boolean;
}

/** Durable only as part of an explicit project checkpoint, never an autosave. */
export interface ProjectSession {
  version: 1;
  interview: InterviewProgress;
  route: string;
  selected?: string;
  botOpen: boolean;
  bot: BotSessionSnapshot;
}

type SessionView = Omit<ProjectSession, "version" | "bot">;
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

export function validateProjectSession(value: unknown): ProjectSession {
  if (
    !object(value) ||
    value.version !== 1 ||
    !object(value.interview) ||
    ![1, 2, 3].includes(Number(value.interview.step)) ||
    typeof value.interview.step !== "number" ||
    typeof value.interview.completed !== "boolean" ||
    typeof value.route !== "string" ||
    !/^[a-z][a-z0-9-]{0,63}$/.test(value.route) ||
    typeof value.botOpen !== "boolean" ||
    (value.selected !== undefined &&
      (typeof value.selected !== "string" || value.selected.length > 240))
  )
    throw new Error("The saved project interview or workspace state is invalid.");
  if (JSON.stringify(value).length > 8_000_000)
    throw new Error(
      "The BOT conversation is too large to save. Clear unneeded history and try Save project again.",
    );
  return {
    version: 1,
    interview: {
      step: value.interview.step as 1 | 2 | 3,
      completed: value.interview.completed,
    },
    route: value.route,
    ...(value.selected ? { selected: value.selected as string } : {}),
    botOpen: value.botOpen,
    bot: validateBotSession(value.bot),
  };
}

export function captureProjectSession(
  projectId: string,
  view: SessionView,
): ProjectSession {
  return validateProjectSession({
    version: 1,
    ...view,
    bot: snapshotBotSession(projectId),
  });
}

export function restoreProjectSession(
  projectId: string,
  session?: ProjectSession,
): ProjectSession {
  const restored = session
    ? validateProjectSession(session)
    : {
        version: 1 as const,
        // Legacy saved projects already have their engineering inputs.
        interview: { step: 1 as const, completed: true },
        route: "overview",
        botOpen: false,
        bot: { messages: [], draft: "" },
      };
  restoreBotSession(projectId, restored.bot);
  return restored;
}

/** View changes never manufacture unsaved engineering/interview work. */
export function projectSessionFingerprint(session: ProjectSession): string {
  return JSON.stringify({
    interview: session.interview,
    bot: {
      draft: session.bot.draft,
      messages: session.bot.messages.map((message) => {
        const copy = { ...message };
        delete copy.restored;
        return copy;
      }),
    },
  });
}

export function projectContentFingerprint(project: Project): string {
  return JSON.stringify({ ...project, revision: 0, updatedAt: "" });
}
