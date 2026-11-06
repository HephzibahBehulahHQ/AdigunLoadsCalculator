import { describe, expect, it, vi } from "vitest";
import { createBotSessionStore } from "../src/bot/sessionState";

describe("BOT project sessions", () => {
  it("retains separate drafts and conversations when projects are revisited", () => {
    const store = createBotSessionStore<string>();
    store.setDraft("alpha", "unfinished alpha command");
    store.setMessages("alpha", ["alpha conversation"]);
    const alpha = store.get("alpha");
    expect(store.get("beta")).toEqual({ messages: [], draft: "" });
    store.setDraft("beta", "unfinished beta command");
    store.setMessages("beta", ["beta conversation"]);
    expect(store.get("alpha")).toBe(alpha);
    store.setMessages("alpha", (messages) => [
      ...messages,
      "late alpha result",
    ]);
    expect(store.get("beta")).toEqual({
      messages: ["beta conversation"],
      draft: "unfinished beta command",
    });
    expect(store.get("alpha")).toEqual({
      messages: ["alpha conversation", "late alpha result"],
      draft: "unfinished alpha command",
    });
  });

  it("retains drafts across history clearing and subscriber unmounts", () => {
    const store = createBotSessionStore<string>();
    const listener = vi.fn();
    const unsubscribe = store.subscribe("alpha", listener);
    store.setDraft("alpha", "keep this draft");
    store.setMessages("alpha", ["old conversation"]);
    unsubscribe();
    store.setMessages("alpha", []);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(store.get("alpha")).toEqual({
      messages: [],
      draft: "keep this draft",
    });
    expect(createBotSessionStore<string>().get("alpha")).toEqual({
      messages: [],
      draft: "",
    });
  });

  it("notifies only the affected project and keeps unchanged snapshots stable", () => {
    const store = createBotSessionStore<string>();
    const alpha = vi.fn();
    const beta = vi.fn();
    store.subscribe("alpha", alpha);
    store.subscribe("beta", beta);
    const empty = store.get("alpha");
    store.setDraft("alpha", "");
    store.setMessages("alpha", (messages) => messages);
    expect(store.get("alpha")).toBe(empty);
    expect(alpha).not.toHaveBeenCalled();
    store.setDraft("alpha", "draft");
    expect(alpha).toHaveBeenCalledTimes(1);
    expect(beta).not.toHaveBeenCalled();
  });
});
