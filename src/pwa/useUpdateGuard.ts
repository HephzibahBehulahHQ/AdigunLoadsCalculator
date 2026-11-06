import { useEffect, useRef } from "react";
import { registerUpdateGuard, unsavedBlockers } from "./updates";

export function useUpdateGuard(blocked: boolean, label: string, unsaved = blocked) {
  const current = useRef({ blocked, label, unsaved });
  current.current = { blocked, label, unsaved };
  useEffect(
    () =>
      registerUpdateGuard(() =>
        current.current.blocked ? current.current.label : undefined,
        () => current.current.unsaved ? current.current.label : undefined,
      ),
    [],
  );
}

export function useReloadProtection(projectNeedsSave?: () => boolean) {
  const pendingProject = useRef(projectNeedsSave);
  pendingProject.current = projectNeedsSave;
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (pendingProject.current?.() || unsavedBlockers().length) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
}
