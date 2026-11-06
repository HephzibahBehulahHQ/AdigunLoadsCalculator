import { useCallback, useSyncExternalStore } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Project } from "../domain/types";
import { translate, type Locale } from "../i18n";
import type { DecimalDraft } from "../i18n/LocaleDecimalInput";
import type { BOMPricing } from "../import-export/bom";
import type { EngineeringReportSection } from "../import-export/reports";
import type { MeasurementOptions } from "../import-export/measurements";
import type { MeasurementPayload } from "../storage/measurements";
import { registerUpdateGuard } from "../pwa/updates";

function currentLocale(): Locale {
  try {
    const value = JSON.parse(
      localStorage.getItem("powerlab:ui:locale") ?? "null",
    );
    if (["en", "de", "yo", "pcm"].includes(value)) return value;
  } catch {
    // The guard still works when harmless preferences are unavailable.
  }
  return "en";
}

function createDraftStore<T>(label: string, blocked: (draft: T) => boolean) {
  const drafts = new Map<string, T>();
  const listeners = new Map<string, Set<() => void>>();
  // Session drafts survive a screen unmount, so their guard must survive it too.
  registerUpdateGuard(() =>
    [...drafts.values()].some(blocked)
      ? translate(label, currentLocale())
      : undefined,
  );
  return {
    get: (id: string) => drafts.get(id),
    ensure(id: string, create: () => T): T {
      if (!drafts.has(id)) drafts.set(id, create());
      return drafts.get(id)!;
    },
    update(id: string, change: (draft: T) => T) {
      const current = drafts.get(id);
      if (!current) return;
      const next = change(current);
      if (next === current) return;
      drafts.set(id, next);
      listeners.get(id)?.forEach((notify) => notify());
    },
    subscribe(id: string, notify: () => void) {
      const subscribed = listeners.get(id) ?? new Set<() => void>();
      listeners.set(id, subscribed);
      subscribed.add(notify);
      return () => {
        subscribed.delete(notify);
        if (!subscribed.size) listeners.delete(id);
      };
    },
  };
}

export function useProjectDraft<T>(
  store: ReturnType<typeof createDraftStore<T>>,
  projectId: string,
  create: () => T,
) {
  store.ensure(projectId, create);
  const subscribe = useCallback(
    (notify: () => void) => store.subscribe(projectId, notify),
    [store, projectId],
  );
  const snapshot = useCallback(() => store.get(projectId)!, [store, projectId]);
  const draft = useSyncExternalStore(subscribe, snapshot);
  const update = (change: (value: T) => T) => store.update(projectId, change);
  const field = <K extends keyof T>(
    key: K,
  ): [T[K], Dispatch<SetStateAction<T[K]>>] => [
    draft[key],
    (value) =>
      update((current) => ({
        ...current,
        [key]:
          typeof value === "function"
            ? (value as (previous: T[K]) => T[K])(current[key])
            : value,
      })),
  ];
  return { draft, update, field };
}

export interface ReportDraft {
  details: NonNullable<Project["reportDetails"]>;
  savedDetails: NonNullable<Project["reportDetails"]>;
  detailsDirty: boolean;
  selected: EngineeringReportSection[];
  sectionsDirty: boolean;
  prices: BOMPricing;
  priceLocales: Record<string, Locale>;
  pricingLocale: Locale;
  pricingDirty: boolean;
  contingency: string;
  contingencyLocale: Locale;
  series: "profile" | "calendar" | "energy" | "ev";
}
export const reportDrafts = createDraftStore<ReportDraft>(
  "Report details and sections",
  (draft) => draft.detailsDirty || draft.pricingDirty || draft.sectionsDirty,
);

export interface MeasurementDraft {
  rawCSV: string;
  filename: string;
  headers: string[];
  options: MeasurementOptions;
  interval: DecimalDraft;
  reviewed: MeasurementPayload | null;
  savedRevision: number | null;
  savedAt: string;
  dirty: boolean;
}
export const measurementDrafts = createDraftStore<MeasurementDraft>(
  "Measurements",
  (draft) => draft.dirty,
);

export const discardDraftLabel: Record<Locale, string> = {
  en: "Discard unsaved draft",
  de: "Ungespeicherten Entwurf verwerfen",
  yo: "Pa àkọsílẹ̀ tí a kò tíì fipamọ́ rẹ́",
  pcm: "Discard draft wey never save",
};
