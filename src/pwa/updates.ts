export type UpdateGuard = () => string | undefined;
const guards = new Map<UpdateGuard, UpdateGuard>();

export function updateBlockers(): string[] {
  return [
    ...new Set(
      [...guards.keys()]
        .map((guard) => guard())
        .filter((value): value is string => !!value),
    ),
  ];
}

/** Only edited data should trigger the browser's leave warning. */
export function unsavedBlockers(): string[] {
  return [
    ...new Set(
      [...guards.values()]
        .map((guard) => guard())
        .filter((value): value is string => !!value),
    ),
  ];
}

export function registerUpdateGuard(
  guard: UpdateGuard,
  unsaved: UpdateGuard = guard,
): () => void {
  guards.set(guard, unsaved);
  return () => {
    guards.delete(guard);
  };
}

/** Observe updates already waiting as well as workers installed during this session. */
export function observeUpdates(
  registration: ServiceWorkerRegistration,
  notify: (registration: ServiceWorkerRegistration) => void,
): () => void {
  const workers = new Set<ServiceWorker>();
  const check = () => {
    if (registration.waiting) notify(registration);
  };
  const watch = () => {
    const worker = registration.installing;
    if (worker && !workers.has(worker)) {
      workers.add(worker);
      worker.addEventListener("statechange", check);
    }
    check();
  };
  registration.addEventListener("updatefound", watch);
  watch();
  return () => {
    registration.removeEventListener("updatefound", watch);
    workers.forEach((worker) =>
      worker.removeEventListener("statechange", check),
    );
  };
}

/** Subscribe before activation: controllerchange can precede postMessage returning. */
export function activateWaitingWorker(
  registration: ServiceWorkerRegistration,
  container: ServiceWorkerContainer,
  timeoutMs = 20000,
): Promise<void> {
  const worker = registration.waiting;
  if (!worker) return Promise.reject(new Error("update-unavailable"));
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      container.removeEventListener("controllerchange", changed);
      worker.removeEventListener("statechange", failed);
    };
    const changed = () => {
      cleanup();
      resolve();
    };
    const failed = () => {
      if (worker.state === "redundant") {
        cleanup();
        reject(new Error("update-failed"));
      }
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("update-timeout"));
    }, timeoutMs);
    container.addEventListener("controllerchange", changed);
    worker.addEventListener("statechange", failed);
    try {
      worker.postMessage("ACTIVATE_UPDATE");
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}
