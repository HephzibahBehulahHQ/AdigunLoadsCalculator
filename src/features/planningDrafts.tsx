import { createContext, useContext, useEffect, useId, useRef } from "react";
import type { InputHTMLAttributes } from "react";
import type {
  Load,
  LoadSchedule,
  Project,
  StartEvent,
  FlexibleLoad,
} from "../domain/types";
import type { RangeOptions } from "../engine/simulation";
import { LanguageContext, translate, useT, type Locale } from "../i18n";
import {
  formatEditableNumber,
  parseLocaleNumber,
  parseLocaleNumberList,
} from "../i18n/numbers";
import { registerUpdateGuard } from "../pwa/updates";
import { useProjectDraft } from "./workspaceDrafts";

type Part<T> = { base: T; value: T };
type Raw = { text: string; locale: Locale; error: string; pending: boolean };
export interface PlanningDraft {
  schedules: Record<string, Part<LoadSchedule>>;
  events: Part<StartEvent[]>;
  requirements: Part<FlexibleLoad[]>;
  raw: Record<string, Raw>;
  loadId: string;
  range: RangeOptions;
  strategy: "deadline" | "cheapest" | "solar";
  siteLimitKW: number;
  solar: string;
  solarLocale: Locale;
}
const equal = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
const part = <T,>(value: T): Part<T> => ({
  base: structuredClone(value),
  value: structuredClone(value),
});
export function scheduleFor(load: Load): LoadSchedule {
  return structuredClone(
    load.schedule ?? {
      windows:
        load.hoursPerDay > 0
          ? [
              {
                id: `basic-${load.id}`,
                startHour: load.startHour,
                durationHours: load.hoursPerDay,
                weekdays: load.weekdays,
              },
            ]
          : [],
    },
  );
}
function initial(project: Project): PlanningDraft {
  const today = new Date().toISOString().slice(0, 10);
  return {
    schedules: Object.fromEntries(
      project.loads.map((load) => [load.id, part(scheduleFor(load))]),
    ),
    events: part(project.startEvents ?? []),
    requirements: part(project.flexibleLoads ?? []),
    raw: {},
    loadId: project.loads[0]?.id ?? "",
    range: {
      start: `${today}T00:00:00Z`,
      end: new Date(Date.parse(`${today}T00:00:00Z`) + 86400000).toISOString(),
      intervalMinutes: 15,
      includeBilling: true,
    },
    strategy: "deadline",
    siteLimitKW: (project.supply.limitA * project.supply.voltageLN * 3) / 1000,
    solar: "",
    solarLocale: "en",
  };
}
export function partDirty(part: Part<unknown>) {
  return !equal(part.base, part.value);
}
export function planningDirty(draft: PlanningDraft) {
  return (
    partDirty(draft.events) ||
    partDirty(draft.requirements) ||
    Object.values(draft.schedules).some(partDirty) ||
    Object.values(draft.raw).some((raw) => raw.pending)
  );
}
const drafts = new Map<string, PlanningDraft>();
const listeners = new Map<string, Set<() => void>>();
export const planningDrafts = {
  get: (id: string) => drafts.get(id),
  ensure(id: string, create: () => PlanningDraft) {
    if (!drafts.has(id)) drafts.set(id, create());
    return drafts.get(id)!;
  },
  update(id: string, change: (draft: PlanningDraft) => PlanningDraft) {
    const prior = drafts.get(id);
    if (!prior) return;
    const next = change(prior);
    if (next === prior) return;
    drafts.set(id, next);
    listeners.get(id)?.forEach((notify) => notify());
  },
  subscribe(id: string, notify: () => void) {
    const set = listeners.get(id) ?? new Set();
    listeners.set(id, set);
    set.add(notify);
    return () => {
      set.delete(notify);
      if (!set.size) listeners.delete(id);
    };
  },
};
registerUpdateGuard(() => {
  if (![...drafts.values()].some(planningDirty)) return;
  let locale: Locale = "en";
  try {
    const stored = JSON.parse(
      localStorage.getItem("powerlab:ui:locale") ?? "null",
    );
    if (["en", "de", "yo", "pcm"].includes(stored)) locale = stored;
  } catch {
    /* Harmless preference unavailable. */
  }
  return translate("Advanced planning", locale);
});
export function clearRaw(draft: PlanningDraft, prefix: string) {
  return Object.fromEntries(
    Object.entries(draft.raw).filter(([key]) => !key.startsWith(prefix)),
  );
}
export function prunePlanningRaw(
  draft: PlanningDraft,
  prefix: string,
  value: unknown,
) {
  const ids = new Set<string>();
  function visit(item: unknown) {
    if (!item || typeof item !== "object") return;
    if (Array.isArray(item)) {
      item.forEach(visit);
      return;
    }
    const row = item as Record<string, unknown>;
    if (typeof row.id === "string") ids.add(row.id);
    Object.values(row).forEach(visit);
  }
  visit(value);
  const cycle =
    value &&
    !Array.isArray(value) &&
    typeof value === "object" &&
    "timedCycle" in value &&
    value.timedCycle;
  return Object.fromEntries(
    Object.entries(draft.raw).filter(
      ([key]) =>
        !key.startsWith(prefix) ||
        (cycle && key.startsWith(`${prefix}cycle:`)) ||
        [...ids].some((id) => key.includes(`:${id}:`)),
    ),
  );
}
export function pendingRaw(draft: PlanningDraft, prefix: string) {
  return Object.entries(draft.raw).some(
    ([key, raw]) => key.startsWith(prefix) && raw.pending,
  );
}
export function usePlanningDraft(project: Project) {
  const store = useProjectDraft(planningDrafts, project.id, () =>
    initial(project),
  );
  useEffect(() => {
    store.update((prior) => {
      let next = prior;
      const sync = <T,>(
        old: Part<T> | undefined,
        incoming: T,
        prefix: string,
      ): Part<T> => {
        if (
          old &&
          (pendingRaw(prior, prefix) ||
            (partDirty(old) && !equal(old.value, incoming)))
        )
          return old;
        if (old && equal(old.base, incoming) && equal(old.value, incoming))
          return old;
        next = { ...next, raw: clearRaw(next, prefix) };
        return part(incoming);
      };
      const schedules = { ...prior.schedules };
      for (const load of project.loads)
        schedules[load.id] = sync(
          prior.schedules[load.id],
          scheduleFor(load),
          `schedule:${load.id}:`,
        );
      const events = sync(prior.events, project.startEvents ?? [], "events:");
      const requirements = sync(
        prior.requirements,
        project.flexibleLoads ?? [],
        "requirements:",
      );
      if (
        events === prior.events &&
        requirements === prior.requirements &&
        Object.keys(schedules).length === Object.keys(prior.schedules).length &&
        Object.keys(schedules).every(
          (id) => schedules[id] === prior.schedules[id],
        ) &&
        next === prior
      )
        return prior;
      return { ...next, schedules, events, requirements };
    });
  }, [project.id, project.revision]);
  return {
    ...store,
    discard: () =>
      store.update((prior) => ({
        ...initial(project),
        range: prior.range,
        strategy: prior.strategy,
        siteLimitKW: prior.siteLimitKW,
        solar: prior.solar,
        solarLocale: prior.solarLocale,
        loadId: prior.loadId,
      })),
  };
}

/** Apply only changed fields. A conflicting edit remains a draft until reviewed/discarded. */
export function mergePlanning<T>(base: T, draft: T, current: T): T {
  if (equal(base, draft)) return structuredClone(current);
  if (equal(base, current) || equal(draft, current))
    return structuredClone(draft);
  const record = (x: unknown): x is Record<string, unknown> =>
    x !== null && typeof x === "object" && !Array.isArray(x);
  if (record(base) && record(draft) && record(current)) {
    const merged: Record<string, unknown> = { ...current };
    for (const key of new Set([...Object.keys(base), ...Object.keys(draft)])) {
      const value = mergePlanning(base[key], draft[key], current[key]);
      if (value === undefined) delete merged[key];
      else merged[key] = value;
    }
    return merged as T;
  }
  const rows = (
    x: unknown,
  ): x is Array<Record<string, unknown> & { id: string }> =>
    Array.isArray(x) &&
    x.every((row) => record(row) && typeof row.id === "string");
  if (rows(base) && rows(draft) && rows(current)) {
    const find = (list: typeof base, id: string) =>
      list.find((row) => row.id === id);
    const merged = current
      .map((row) => mergePlanning(find(base, row.id), find(draft, row.id), row))
      .filter((row) => row !== undefined);
    for (const row of draft)
      if (!find(current, row.id)) {
        const added = mergePlanning(find(base, row.id), row, undefined);
        if (added) merged.push(added);
      }
    return merged as T;
  }
  throw new Error(
    "Planning inputs changed elsewhere. Your draft is preserved. Review or discard it before applying.",
  );
}

export const planningText: Record<
  Locale,
  { discard: string; kept: string; conflict: string }
> = {
  en: {
    discard: "Discard planning drafts",
    kept: "Unsaved planning drafts are kept for each project and load. Save the relevant section or discard these drafts.",
    conflict:
      "Planning inputs changed elsewhere. Your draft is preserved. Review or discard it before applying.",
  },
  de: {
    discard: "Planungsentwürfe verwerfen",
    kept: "Ungespeicherte Planungsentwürfe bleiben je Projekt und Verbraucher erhalten. Speichern Sie den betreffenden Abschnitt oder verwerfen Sie diese Entwürfe.",
    conflict:
      "Planungsdaten wurden an anderer Stelle geändert. Ihr Entwurf bleibt erhalten. Prüfen oder verwerfen Sie ihn vor dem Anwenden.",
  },
  yo: {
    discard: "Pa àwọn àkọsílẹ̀ ètò rẹ́",
    kept: "A pa àwọn àkọsílẹ̀ ètò tí a kò tíì fipamọ́ mọ́ fún iṣẹ́ àti ẹrù kọ̀ọ̀kan. Fi apá tó yẹ pamọ́ tàbí pa àwọn àkọsílẹ̀ yìí rẹ́.",
    conflict:
      "Àwọn àlàyé ètò ti yí padà ní ibòmíràn. Àkọsílẹ̀ rẹ ṣì wà. Ṣàyẹ̀wò rẹ̀ tàbí pa á rẹ́ kí o tó lò ó.",
  },
  pcm: {
    discard: "Discard planning drafts",
    kept: "Planning drafts wey never save stay for each project and load. Save the section wey you change or discard these drafts.",
    conflict:
      "Planning inputs don change for another place. Your draft still dey. Review or discard am before you apply.",
  },
};
export const PlanningDraftContext = createContext<ReturnType<
  typeof usePlanningDraft
> | null>(null);
type NumberProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "min" | "max" | "list"
> & {
  draftKey: string;
  value: number | number[] | undefined;
  onValueChange: (value: any) => void;
  min?: number;
  max?: number;
  integer?: boolean;
  optional?: boolean;
  list?: boolean;
};
function DraftInput({
  draftKey,
  value,
  onValueChange,
  min,
  max,
  integer,
  optional,
  list,
  onBlur,
  onKeyDown,
  ...props
}: NumberProps) {
  const store = useContext(PlanningDraftContext)!;
  const locale = useContext(LanguageContext),
    t = useT(),
    id = useId(),
    ref = useRef<HTMLInputElement>(null);
  const raw = store.draft.raw[draftKey];
  const format = (value: number | number[] | undefined) =>
    Array.isArray(value)
      ? value.map((v) => formatEditableNumber(v, locale)).join("; ")
      : formatEditableNumber(value ?? "", locale);
  const text = raw?.text ?? format(value);
  const parse = (text: string, locale: Locale) => {
    if ((optional || list) && !text.trim())
      return { ok: true as const, value: undefined };
    if (list) {
      const result = parseLocaleNumberList(text, locale, { min, max, integer });
      return result.ok ? { ok: true as const, value: result.values } : result;
    }
    return parseLocaleNumber(text, locale, { min, max, integer });
  };
  const change = (next: Raw) =>
    store.update((draft) => ({
      ...draft,
      raw: { ...draft.raw, [draftKey]: next },
    }));
  const parsed = parse(text, raw?.locale ?? locale);
  const error = raw?.error ?? "";
  useEffect(() => {
    ref.current?.setCustomValidity(error ? t(error) : "");
  }, [error, locale]);
  function commit() {
    if (!raw) return;
    if (!parsed.ok) {
      change({ ...raw, error: parsed.message, pending: true });
      return;
    }
    onValueChange(parsed.value);
    change({ text: format(parsed.value), locale, error: "", pending: false });
  }
  return (
    <>
      <input
        {...props}
        ref={ref}
        type="text"
        inputMode={integer ? "numeric" : "decimal"}
        value={text}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [props["aria-describedby"], error ? id : undefined]
            .filter(Boolean)
            .join(" ") || undefined
        }
        onChange={(event) => {
          const next = parse(event.target.value, locale);
          change({
            text: event.target.value,
            locale,
            error: next.ok ? "" : next.message,
            pending: true,
          });
        }}
        onBlur={(event) => {
          commit();
          onBlur?.(event);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
          onKeyDown?.(event);
        }}
      />
      {error && (
        <span id={id} className="error-text" role="alert">
          {t(error)}
        </span>
      )}
    </>
  );
}
export function PlanningNumberInput(
  props: Omit<NumberProps, "value" | "onValueChange"> & {
    value: number;
    onValueChange: (value: number) => void;
  },
) {
  return <DraftInput {...props} />;
}
export function PlanningOptionalNumberInput(
  props: Omit<NumberProps, "value" | "onValueChange"> & {
    value?: number;
    onValueChange: (value: number | undefined) => void;
  },
) {
  return <DraftInput {...props} value={props.value} optional />;
}
export function PlanningDraftNumberList(
  props: Omit<NumberProps, "value" | "onValueChange"> & {
    value?: number[];
    onValueChange: (value: number[] | undefined) => void;
  },
) {
  return <DraftInput {...props} value={props.value} list />;
}
