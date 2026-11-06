import { useEffect, useRef } from "react";
import { registerUpdateGuard, updateBlockers } from "./updates";

export function useUpdateGuard(blocked: boolean, label: string) {
  const current = useRef({ blocked, label });
  current.current = { blocked, label };
  useEffect(
    () =>
      registerUpdateGuard(() =>
        current.current.blocked ? current.current.label : undefined,
      ),
    [],
  );
}

export function useReloadProtection() {
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (updateBlockers().length) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
}
