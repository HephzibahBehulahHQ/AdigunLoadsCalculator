import { afterEach, describe, expect, it, vi } from "vitest";
import {
  activateWaitingWorker,
  observeUpdates,
  registerUpdateGuard,
  updateBlockers,
} from "../src/pwa/updates";

function fixture() {
  const worker = Object.assign(new EventTarget(), {
    state: "installed",
    postMessage: vi.fn(),
  });
  const registration = Object.assign(new EventTarget(), {
    waiting: worker as typeof worker | null,
    installing: null as typeof worker | null,
  });
  const container = new EventTarget();
  return {
    worker,
    registration,
    container,
    reg: registration as unknown as ServiceWorkerRegistration,
    serviceWorkers: container as ServiceWorkerContainer,
  };
}

afterEach(() => vi.useRealTimers());
describe("safe application updates", () => {
  it("finds a previously installed waiting update on a reopened page", () => {
    const { reg } = fixture();
    const notify = vi.fn();
    const stop = observeUpdates(reg, notify);
    expect(notify).toHaveBeenCalledWith(reg);
    stop();
  });

  it("observes an in-flight installation and detaches observers on unmount", () => {
    const { registration, reg, worker } = fixture();
    registration.waiting = null;
    registration.installing = worker;
    const notify = vi.fn();
    const stop = observeUpdates(reg, notify);
    expect(notify).not.toHaveBeenCalled();
    registration.waiting = worker;
    worker.dispatchEvent(new Event("statechange"));
    expect(notify).toHaveBeenCalledTimes(1);
    stop();
    worker.dispatchEvent(new Event("statechange"));
    registration.dispatchEvent(new Event("updatefound"));
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("does not miss controllerchange fired immediately during activation", async () => {
    const { worker, container, reg, serviceWorkers } = fixture();
    worker.postMessage.mockImplementation(() =>
      container.dispatchEvent(new Event("controllerchange")),
    );
    await expect(
      activateWaitingWorker(reg, serviceWorkers),
    ).resolves.toBeUndefined();
    expect(worker.postMessage).toHaveBeenCalledExactlyOnceWith(
      "ACTIVATE_UPDATE",
    );
  });

  it("reports a worker that disappears before activation without reloading", async () => {
    const { registration, reg, serviceWorkers, worker } = fixture();
    registration.waiting = null;
    await expect(activateWaitingWorker(reg, serviceWorkers)).rejects.toThrow(
      "update-unavailable",
    );
    expect(worker.postMessage).not.toHaveBeenCalled();
  });

  it("reports a failed installation and clears its activation timer", async () => {
    vi.useFakeTimers();
    const { reg, serviceWorkers, worker } = fixture();
    const result = expect(
      activateWaitingWorker(reg, serviceWorkers),
    ).rejects.toThrow("update-failed");
    worker.state = "redundant";
    worker.dispatchEvent(new Event("statechange"));
    await result;
    expect(vi.getTimerCount()).toBe(0);
  });

  it("times out stalled activation and lets a later retry succeed", async () => {
    vi.useFakeTimers();
    const { reg, worker, container, serviceWorkers } = fixture();
    const result = expect(
      activateWaitingWorker(reg, serviceWorkers, 500),
    ).rejects.toThrow("update-timeout");
    await vi.advanceTimersByTimeAsync(500);
    await result;
    worker.postMessage.mockImplementation(() =>
      container.dispatchEvent(new Event("controllerchange")),
    );
    await expect(
      activateWaitingWorker(reg, serviceWorkers),
    ).resolves.toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cleans up after a messaging failure", async () => {
    vi.useFakeTimers();
    const { reg, worker, serviceWorkers } = fixture();
    worker.postMessage.mockImplementation(() => {
      throw new Error("messaging unavailable");
    });
    await expect(activateWaitingWorker(reg, serviceWorkers)).rejects.toThrow(
      "messaging unavailable",
    );
    expect(vi.getTimerCount()).toBe(0);
  });

  it("evaluates current unsaved data and removes only the released guard", () => {
    let dirty = true;
    const removeBill = registerUpdateGuard(() =>
      dirty ? "Customer bill" : undefined,
    );
    const removeReport = registerUpdateGuard(() => "Report details");
    try {
      expect(updateBlockers()).toEqual(["Customer bill", "Report details"]);
      dirty = false;
      expect(updateBlockers()).toEqual(["Report details"]);
      removeReport();
      expect(updateBlockers()).toEqual([]);
    } finally {
      removeBill();
      removeReport();
    }
  });
});
