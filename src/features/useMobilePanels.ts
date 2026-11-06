import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

export const COMPACT_PANELS = "(max-width: 900px)";

export function useCompactPanels() {
  const [compact, setCompact] = useState(
    () => matchMedia(COMPACT_PANELS).matches,
  );
  useEffect(() => {
    const media = matchMedia(COMPACT_PANELS);
    const update = () => setCompact(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return compact;
}

const visible = (element: HTMLElement) =>
  element.isConnected &&
  element.getClientRects().length > 0 &&
  getComputedStyle(element).visibility !== "hidden" &&
  !element.closest("[inert]");
const controls = (panel: HTMLElement) =>
  Array.from(
    panel.querySelectorAll<HTMLElement>(
      'button,input:not([type="hidden"]),select,textarea,a[href],summary,[tabindex]',
    ),
  ).filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.matches(":disabled") &&
      visible(element),
  );
const foregroundDialog = () =>
  document.querySelector('.modal[aria-modal="true"]');

/** Keep panel DOM/state stable across breakpoints; existing editor dialogs take priority. */
export function useMobilePanel(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onClose: () => void,
) {
  const close = useRef(onClose);
  const lastOutside = useRef<HTMLElement | null>(null);
  close.current = onClose;
  useEffect(() => {
    const remember = (event: FocusEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        !ref.current?.contains(target) &&
        !target.closest(".modal") &&
        visible(target)
      )
        lastOutside.current = target;
    };
    document.addEventListener("focusin", remember);
    return () => document.removeEventListener("focusin", remember);
  }, [ref]);
  useEffect(() => {
    const panel = ref.current;
    if (!active || !panel) return;
    const focused = document.activeElement as HTMLElement | null;
    const opener =
      focused && !panel.contains(focused) && !focused.closest(".modal")
        ? focused
        : lastOutside.current;
    let release: (() => void) | undefined;
    const focusFirst = () => (controls(panel)[0] || panel).focus();
    const isolate = () => {
      if (
        release ||
        foregroundDialog() ||
        !panel.isConnected ||
        panel.closest("[inert]")
      )
        return;
      const background: {
        element: HTMLElement;
        inert: boolean;
        hidden: string | null;
      }[] = [];
      const overflow = document.body.style.overflow;
      for (
        let branch: HTMLElement = panel;
        branch.parentElement;
        branch = branch.parentElement
      ) {
        for (const sibling of Array.from(branch.parentElement.children)) {
          if (
            !(sibling instanceof HTMLElement) ||
            sibling === branch ||
            sibling.hasAttribute("data-mobile-panel-backdrop")
          )
            continue;
          background.push({
            element: sibling,
            inert: sibling.inert,
            hidden: sibling.getAttribute("aria-hidden"),
          });
          sibling.inert = true;
          sibling.setAttribute("aria-hidden", "true");
        }
        if (branch.parentElement === document.body) break;
      }
      document.body.style.overflow = "hidden";
      release = () => {
        for (const { element, inert, hidden } of background) {
          element.inert = inert;
          if (hidden === null) element.removeAttribute("aria-hidden");
          else element.setAttribute("aria-hidden", hidden);
        }
        document.body.style.overflow = overflow;
      };
      if (!panel.contains(document.activeElement)) focusFirst();
    };
    const observer = new MutationObserver(isolate);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["inert"],
    });
    isolate();
    const key = (event: KeyboardEvent) => {
      if (!release || foregroundDialog() || panel.closest("[inert]")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close.current();
      } else if (event.key === "Tab") {
        const items = controls(panel),
          first = items[0],
          last = items.at(-1);
        if (!first) {
          event.preventDefault();
          panel.focus();
        } else if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === panel ||
            !panel.contains(document.activeElement))
        ) {
          event.preventDefault();
          last!.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            !panel.contains(document.activeElement))
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", key, true);
      const restore = () => {
        release?.();
        // Resizing into a visible desktop pane keeps focus and selection there.
        if (visible(panel)) return;
        if (opener && visible(opener)) opener.focus();
        else
          document
            .querySelector<HTMLElement>("[data-navigation-toggle], #workspace")
            ?.focus();
      };
      // A shared Modal may have captured our inert state. Let it restore that
      // snapshot first, then release ours, including when resized while editing.
      if (foregroundDialog()) {
        const heldAncestor = panel.closest<HTMLElement>("[inert]");
        const pending = new MutationObserver(() => {
          if (
            !foregroundDialog() &&
            !(heldAncestor?.isConnected && heldAncestor.inert)
          ) {
            pending.disconnect();
            restore();
          }
        });
        pending.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["inert"],
        });
      } else restore();
    };
  }, [ref, active]);
}
