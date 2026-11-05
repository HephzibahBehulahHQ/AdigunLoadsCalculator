export interface BotGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface BotWindowState {
  geometry: BotGeometry;
  minimized: boolean;
  maximized: boolean;
}
export const BOT_WINDOW_STATE_KEY = "adigunpowerlab.bot.window.v2";
const legacyKey = "adigunpowerlab.bot.geometry.v1";

export function clampBotGeometry(
  input: BotGeometry,
  viewport: { width: number; height: number },
): BotGeometry {
  const maxWidth = Math.max(1, viewport.width - 16);
  const maxHeight = Math.max(1, viewport.height - 16);
  const width = Math.min(
    Math.max(Math.min(320, maxWidth), input.width),
    maxWidth,
  );
  const height = Math.min(
    Math.max(Math.min(400, maxHeight), input.height),
    maxHeight,
  );
  return {
    width,
    height,
    x: Math.max(8, Math.min(input.x, viewport.width - width - 8)),
    y: Math.max(8, Math.min(input.y, viewport.height - height - 8)),
  };
}
export function readBotWindowState(
  storage?: Pick<Storage, "getItem">,
  viewport = { width: window.innerWidth, height: window.innerHeight },
): BotWindowState {
  const fallback = {
    geometry: clampBotGeometry(
      {
        x: viewport.width - 448,
        y: viewport.height - 648,
        width: 420,
        height: 600,
      },
      viewport,
    ),
    minimized: false,
    maximized: false,
  };
  try {
    const store = storage ?? localStorage;
    const parsed = JSON.parse(store.getItem(BOT_WINDOW_STATE_KEY) ?? "null");
    const old =
      parsed?.geometry ?? JSON.parse(store.getItem(legacyKey) ?? "null");
    if (
      !old ||
      !["x", "y", "width", "height"].every(
        (key) => typeof old[key] === "number" && Number.isFinite(old[key]),
      )
    )
      return fallback;
    return {
      geometry: clampBotGeometry(old, viewport),
      minimized: parsed?.minimized === true,
      maximized: parsed?.maximized === true,
    };
  } catch {
    return fallback;
  }
}
export function writeBotWindowState(
  state: BotWindowState,
  storage?: Pick<Storage, "setItem">,
): void {
  try {
    (storage ?? localStorage).setItem(
      BOT_WINDOW_STATE_KEY,
      JSON.stringify({
        geometry: state.geometry,
        minimized: state.minimized,
        maximized: state.maximized,
      }),
    );
  } catch {
    /* Optional harmless state only; conversations are never persisted here. */
  }
}
export function resetBotWindowState(): void {
  try {
    localStorage.removeItem(BOT_WINDOW_STATE_KEY);
    localStorage.removeItem(legacyKey);
  } catch {
    /* A reset still restores the open window. */
  }
  window.dispatchEvent(new Event("powerlab-bot-reset"));
}
