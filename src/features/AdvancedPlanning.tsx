import {
  PlanningNumberInput as LocaleNumberInput,
  PlanningOptionalNumberInput as OptionalLocaleNumberInput,
  PlanningDraftNumberList as PlanningNumberList,
  PlanningDraftContext,
  usePlanningDraft,
  partDirty,
  planningDirty,
  pendingRaw,
  clearRaw,
  prunePlanningRaw,
  mergePlanning,
  scheduleFor,
  planningText,
} from "./planningDrafts";
import { useContext, useEffect, useRef, useState } from "react";
import type {
  FlexibleLoad,
  LoadSchedule,
  Project,
  ScheduleWindow,
  StartEvent,
} from "../domain/types";
import { newId, validateProjectImport } from "../domain/project";
import {
  simulateRange,
  type CalendarResult,
  type RangeOptions,
} from "../engine/simulation";
import { simulateStartEvents, type StartResult } from "../engine/start-events";
import {
  applyFlexiblePlan,
  scheduleFlexibleLoads,
  type FlexiblePlan,
  type FlexiblePlanOptions,
} from "../engine/flexible";
import { LanguageContext, money, numberFormat, useT } from "../i18n";
import { downloadFile, makeCSV, safeName } from "../import-export/files";
import { Field, LineChart, Notice } from "./ui";
import "./advanced-planning.css";
import { validPlanningInputs } from "./PlanningInputs";
import { parseLocaleNumberList } from "../i18n/numbers";

export type AdvancedPlanningTab =
  "schedules" | "starts" | "flexible" | "billing";
export interface AdvancedPlanningProps {
  project: Project;
  onChange: (mutator: (draft: Project) => void) => boolean | void;
  initialTab?: AdvancedPlanningTab;
  onCalendarComplete?: (
    result: CalendarResult,
    inputs: Record<string, unknown>,
  ) => void;
  onStartComplete?: (
    result: StartResult,
    inputs: Record<string, unknown>,
  ) => void;
}
function WindowEditor({
  prefix,
  windows,
  onChange,
}: {
  prefix: string;
  windows: ScheduleWindow[];
  onChange: (rows: ScheduleWindow[]) => void;
}) {
  const t = useT();
  const edit = (i: number, values: Partial<ScheduleWindow>) =>
    onChange(
      windows.map((row, index) => (index === i ? { ...row, ...values } : row)),
    );
  return (
    <div className="advanced-window-list">
      {windows.map((row, index) => (
        <fieldset className="advanced-window" key={row.id}>
          <legend>
            {t("Operating window")} {index + 1}
          </legend>
          <div className="form-grid three">
            <Field label={t("Start hour")} unit="h">
              <LocaleNumberInput
                min={0}
                max={23.999}
                step="any"
                draftKey={`${prefix}${row.id}:startHour`}
                value={row.startHour}
                onValueChange={(value) => edit(index, { startHour: value })}
              />
            </Field>
            <Field label={t("Duration")} unit="h">
              <LocaleNumberInput
                min={0.001}
                max={24}
                step="any"
                draftKey={`${prefix}${row.id}:durationHours`}
                value={row.durationHours}
                onValueChange={(value) => edit(index, { durationHours: value })}
              />
            </Field>
            <Field
              label={t("Weekdays (0 Sunday–6 Saturday)")}
              hint={t("Leave empty for every day.")}
            >
              <PlanningNumberList
                draftKey={`${prefix}${row.id}:weekdays`}
                value={row.weekdays}
                min={0}
                max={6}
                integer
                onValueChange={(values) => edit(index, { weekdays: values })}
              />
            </Field>
            <Field
              label={t("Months (1–12)")}
              hint={t("Leave empty for every month.")}
            >
              <PlanningNumberList
                draftKey={`${prefix}${row.id}:months`}
                value={row.months}
                min={1}
                max={12}
                integer
                onValueChange={(values) => edit(index, { months: values })}
              />
            </Field>
            <Field label={t("Effective from")}>
              <input
                type="date"
                value={row.effectiveFrom ?? ""}
                onChange={(e) =>
                  edit(index, { effectiveFrom: e.target.value || undefined })
                }
              />
            </Field>
            <Field label={t("Effective to")}>
              <input
                type="date"
                value={row.effectiveTo ?? ""}
                onChange={(e) =>
                  edit(index, { effectiveTo: e.target.value || undefined })
                }
              />
            </Field>
          </div>
          <button
            type="button"
            className="button danger"
            onClick={() => onChange(windows.filter((_, i) => i !== index))}
          >
            {t("Remove window")}
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        className="button"
        onClick={() =>
          onChange([
            ...windows,
            { id: newId("window"), startHour: 8, durationHours: 1 },
          ])
        }
      >
        {t("Add operating window")}
      </button>
    </div>
  );
}

export function AdvancedPlanning(props: AdvancedPlanningProps) {
  const store = usePlanningDraft(props.project);
  return (
    <PlanningDraftContext.Provider value={store}>
      <AdvancedPlanningContent {...props} />
    </PlanningDraftContext.Provider>
  );
}
function AdvancedPlanningContent({
  project,
  onChange,
  initialTab = "schedules",
  onCalendarComplete,
  onStartComplete,
}: AdvancedPlanningProps) {
  const t = useT(),
    locale = useContext(LanguageContext);
  const [tab, setTab] = useState<AdvancedPlanningTab>(initialTab);
  const store = useContext(PlanningDraftContext)!;
  const { draft, update, field } = store;
  const [loadId, setLoadId] = field("loadId");
  const selected = project.loads.find((load) => load.id === loadId);
  const schedule = draft.schedules[loadId]?.value ?? { windows: [] };
  const setSchedule = (value: LoadSchedule) =>
    update((current) => ({
      ...current,
      raw: prunePlanningRaw(current, `schedule:${loadId}:`, value),
      schedules: {
        ...current.schedules,
        [loadId]: { ...current.schedules[loadId], value },
      },
    }));
  const events = draft.events.value;
  const setEvents = (value: StartEvent[]) =>
    update((current) => ({
      ...current,
      raw: prunePlanningRaw(current, "events:", value),
      events: { ...current.events, value },
    }));
  const requirements = draft.requirements.value;
  const setRequirements = (value: FlexibleLoad[]) =>
    update((current) => ({
      ...current,
      raw: prunePlanningRaw(current, "requirements:", value),
      requirements: { ...current.requirements, value },
    }));
  const today = new Date().toISOString().slice(0, 10);
  const [range, setRange] = field("range");
  const [strategy, setStrategy] = field("strategy");
  const [siteLimitKW, setSiteLimitKW] = field("siteLimitKW");
  const [solar, setSolar] = field("solar");
  const [result, setResult] = useState<CalendarResult>();
  const [starts, setStarts] = useState<StartResult>();
  const [plan, setPlan] = useState<FlexiblePlan>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const worker = useRef<Worker | null>(null),
    generation = useRef(0);
  const container = useRef<HTMLElement>(null);
  const rangeKey = JSON.stringify(range);
  const f = (n: number) => numberFormat(n, 3, locale);
  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);
  useEffect(() => {
    if (!project.loads.some((load) => load.id === loadId))
      setLoadId(project.loads[0]?.id ?? "");
  }, [project.loads, loadId]);
  useEffect(() => {
    generation.current++;
    worker.current?.terminate();
    worker.current = null;
    setBusy(false);
    setResult(undefined);
    setStarts(undefined);
    setPlan(undefined);
    setError("");
    return () => {
      generation.current++;
      worker.current?.terminate();
      worker.current = null;
    };
  }, [project.id, project.revision, rangeKey]);
  useEffect(() => {
    setPlan(undefined);
  }, [strategy, siteLimitKW, solar, requirements, draft.raw]);
  useEffect(() => {
    setStarts(undefined);
  }, [events, draft.raw]);
  function commit(
    mutator: (draft: Project) => void,
    section?: "schedule" | "events" | "requirements",
  ) {
    if (!validPlanningInputs(container.current)) {
      setError(t("Correct invalid draft values before applying changes."));
      return;
    }
    try {
      const candidate = structuredClone(project);
      mutator(candidate);
      const checked = validateProjectImport(candidate);
      if (!checked.valid) throw new Error(checked.errors.join(" "));
      let applied = candidate;
      const accepted = onChange((current) => {
        const candidate = structuredClone(current);
        mutator(candidate);
        const checked = validateProjectImport(candidate);
        if (!checked.valid) throw new Error(checked.errors.join(" "));
        mutator(current);
        applied = structuredClone(current);
      });
      if (accepted === false)
        throw new Error(
          t("Correct invalid draft values before applying changes."),
        );
      if (section)
        update((current) => {
          const prefix =
            section === "schedule" ? `schedule:${loadId}:` : `${section}:`;
          const raw = clearRaw(current, prefix);
          if (section === "schedule") {
            const load = applied.loads.find((load) => load.id === loadId)!;
            const value = scheduleFor(load);
            return {
              ...current,
              raw,
              schedules: {
                ...current.schedules,
                [loadId]: { base: structuredClone(value), value },
              },
            };
          }
          if (section === "events") {
            const value = structuredClone(applied.startEvents ?? []);
            return {
              ...current,
              raw,
              events: { base: structuredClone(value), value },
            };
          }
          const value = structuredClone(applied.flexibleLoads ?? []);
          return {
            ...current,
            raw,
            requirements: { base: structuredClone(value), value },
          };
        });
      setError("");
      setMessage(t("Changes saved. Undo is available in the workspace."));
    } catch (caught) {
      const message = (caught as Error).message;
      setError(
        message === planningText.en.conflict
          ? planningText[locale].conflict
          : message,
      );
    }
  }
  function runCalendar() {
    if (!validPlanningInputs(container.current)) return;
    setError("");
    setMessage("");
    setResult(undefined);
    worker.current?.terminate();
    const token = ++generation.current;
    const id = project.id,
      revision = project.revision;
    const inputs = structuredClone(range);
    const accept = (next: CalendarResult) => {
      if (token !== generation.current || next.revision !== revision) return;
      setResult(next);
      setBusy(false);
      onCalendarComplete?.(next, {
        ...inputs,
        projectId: id,
        timezone: project.timezone,
      });
    };
    try {
      setBusy(true);
      if (typeof Worker === "undefined") {
        accept(simulateRange(project, inputs));
        return;
      }
      const task = new Worker(
        new URL("../workers/simulation.ts", import.meta.url),
        { type: "module" },
      );
      worker.current = task;
      task.onmessage = (
        event: MessageEvent<{ result?: CalendarResult; error?: string }>,
      ) => {
        if (token !== generation.current || task !== worker.current) return;
        if (event.data.error) {
          setError(event.data.error);
          setBusy(false);
        } else if (event.data.result) accept(event.data.result);
        task.terminate();
        worker.current = null;
      };
      task.onerror = () => {
        if (token === generation.current) {
          setError(t("Calendar worker failed. Your project is unchanged."));
          setBusy(false);
        }
        task.terminate();
      };
      task.postMessage({ project, options: inputs });
    } catch (caught) {
      setError((caught as Error).message);
      setBusy(false);
    }
  }
  function runStarts() {
    if (!validPlanningInputs(container.current)) return;
    try {
      const inputs = { start: range.start, end: range.end };
      const next = simulateStartEvents(project, inputs);
      setStarts(next);
      onStartComplete?.(next, inputs);
      setError("");
    } catch (caught) {
      setStarts(undefined);
      setError((caught as Error).message);
    }
  }
  function previewFlexible() {
    if (!validPlanningInputs(container.current)) return;
    try {
      const generation =
        strategy === "solar"
          ? parseLocaleNumberList(solar, draft.solarLocale, { min: 0 })
          : undefined;
      if (generation && !generation.ok) throw new Error(generation.message);
      setPlan(
        scheduleFlexibleLoads(project, {
          ...range,
          strategy,
          siteLimitKW,
          generationKW: generation?.ok ? generation.values : undefined,
        }),
      );
      setError("");
    } catch (caught) {
      setPlan(undefined);
      setError((caught as Error).message);
    }
  }
  const requirementsDirty =
    partDirty(draft.requirements) || pendingRaw(draft, "requirements:");
  const eventDirty = partDirty(draft.events) || pendingRaw(draft, "events:");
  return (
    <section
      ref={container}
      className="advanced-planning panel panel-pad"
      aria-label={t("Advanced planning")}
    >
      <div className="section-title">
        <div>
          <span className="eyebrow">
            {t("Calendar and constrained planning")}
          </span>
          <h2>{t("Advanced planning")}</h2>
        </div>
      </div>
      <div
        className="button-row advanced-tabs"
        role="tablist"
        aria-label={t("Planning workspaces")}
      >
        {(["schedules", "starts", "flexible", "billing"] as const).map((id) => (
          <button
            role="tab"
            aria-selected={tab === id}
            key={id}
            className={`button ${tab === id ? "primary" : ""}`}
            onClick={() => setTab(id)}
          >
            {t(
              {
                schedules: "Calendar rules",
                starts: "Start sequences",
                flexible: "Flexible loads",
                billing: "Calendar bill",
              }[id],
            )}
          </button>
        ))}
      </div>
      {planningDirty(draft) && <Notice>{planningText[locale].kept}</Notice>}
      <button
        className="button"
        disabled={!planningDirty(draft)}
        onClick={() => {
          store.discard();
          setError("");
          setMessage("");
          setPlan(undefined);
          setStarts(undefined);
          setResult(undefined);
        }}
      >
        {planningText[locale].discard}
      </button>
      {error && (
        <p className="error-text" role="alert">
          {t(error)}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {tab === "schedules" && (
        <div className="advanced-section">
          <Field label={t("Selected load")}>
            <select value={loadId} onChange={(e) => setLoadId(e.target.value)}>
              <option value="">{t("Select a load")}</option>
              {project.loads.map((load) => (
                <option key={load.id} value={load.id}>
                  {load.name || load.id}
                </option>
              ))}
            </select>
          </Field>
          {selected ? (
            <>
              <Notice>
                {t(
                  "Overlapping operating windows are unioned. Date exceptions override the entire local day, including overnight carry-in. Timed cycles replace average duty; on-state electrical current is unchanged.",
                )}
              </Notice>
              {schedule.absoluteWindows && (
                <Notice>
                  {t(
                    "This load has an applied absolute schedule. Saving recurring rules replaces those timestamped windows.",
                  )}
                </Notice>
              )}
              <WindowEditor
                prefix={`schedule:${loadId}:`}
                windows={schedule.windows}
                onChange={(windows) => setSchedule({ ...schedule, windows })}
              />
              <h3>{t("Holiday and date exceptions")}</h3>
              {(schedule.exceptions ?? []).map((exception, index) => (
                <fieldset className="advanced-window" key={index}>
                  <legend>
                    {t("Date exception")} {index + 1}
                  </legend>
                  <div className="form-grid">
                    <Field label={t("Date")}>
                      <input
                        type="date"
                        value={exception.date}
                        onChange={(e) =>
                          setSchedule({
                            ...schedule,
                            exceptions: schedule.exceptions!.map((row, i) =>
                              i === index
                                ? { ...row, date: e.target.value }
                                : row,
                            ),
                          })
                        }
                      />
                    </Field>
                    <Field label={t("Exception action")}>
                      <select
                        value={exception.mode}
                        onChange={(e) =>
                          setSchedule({
                            ...schedule,
                            exceptions: schedule.exceptions!.map((row, i) =>
                              i === index
                                ? {
                                    ...row,
                                    mode: e.target.value as
                                      "closed" | "replace",
                                    windows: row.windows ?? [],
                                  }
                                : row,
                            ),
                          })
                        }
                      >
                        <option value="closed">
                          {t("Closed / standby only")}
                        </option>
                        <option value="replace">
                          {t("Replacement operating windows")}
                        </option>
                      </select>
                    </Field>
                  </div>
                  {exception.mode === "replace" && (
                    <WindowEditor
                      prefix={`schedule:${loadId}:exception:${index}:`}
                      windows={exception.windows ?? []}
                      onChange={(windows) =>
                        setSchedule({
                          ...schedule,
                          exceptions: schedule.exceptions!.map((row, i) =>
                            i === index ? { ...row, windows } : row,
                          ),
                        })
                      }
                    />
                  )}
                  <button
                    className="button danger"
                    onClick={() =>
                      setSchedule({
                        ...schedule,
                        exceptions: schedule.exceptions!.filter(
                          (_, i) => i !== index,
                        ),
                      })
                    }
                  >
                    {t("Remove exception")}
                  </button>
                </fieldset>
              ))}
              <button
                className="button"
                onClick={() =>
                  setSchedule({
                    ...schedule,
                    exceptions: [
                      ...(schedule.exceptions ?? []),
                      { date: today, mode: "closed" },
                    ],
                  })
                }
              >
                {t("Add date exception")}
              </button>
              <h3>{t("Explicit timed duty")}</h3>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={Boolean(schedule.timedCycle)}
                  onChange={(e) =>
                    setSchedule({
                      ...schedule,
                      timedCycle: e.target.checked
                        ? { onMinutes: 15, offMinutes: 15, offsetMinutes: 0 }
                        : undefined,
                    })
                  }
                />
                {t("Use explicit on/off cycle instead of average duty")}
              </label>
              {schedule.timedCycle && (
                <div className="form-grid three">
                  {(["onMinutes", "offMinutes", "offsetMinutes"] as const).map(
                    (key) => (
                      <Field
                        key={key}
                        label={t(
                          {
                            onMinutes: "On duration",
                            offMinutes: "Off duration",
                            offsetMinutes: "Local midnight offset",
                          }[key],
                        )}
                        unit="min"
                      >
                        <LocaleNumberInput
                          step="any"
                          min={0}
                          draftKey={`schedule:${loadId}:cycle:${key}`}
                          value={schedule.timedCycle![key]}
                          onValueChange={(value) =>
                            setSchedule({
                              ...schedule,
                              timedCycle: {
                                ...schedule.timedCycle!,
                                [key]: value,
                              },
                            })
                          }
                        />
                      </Field>
                    ),
                  )}
                </div>
              )}
              <div className="button-row">
                <button
                  className="button primary"
                  onClick={() =>
                    commit((draft) => {
                      const load = draft.loads.find(
                        (load) => load.id === loadId,
                      );
                      if (!load) throw new Error(t("Select a load"));
                      load.schedule = {
                        ...mergePlanning(
                          store.draft.schedules[loadId].base,
                          schedule,
                          scheduleFor(load),
                        ),
                        absoluteWindows: undefined,
                      };
                    }, "schedule")
                  }
                >
                  {t("Save calendar rules")}
                </button>
                <button
                  className="button"
                  onClick={() =>
                    commit((draft) => {
                      delete draft.loads.find((load) => load.id === loadId)!
                        .schedule;
                    }, "schedule")
                  }
                >
                  {t("Use basic daily schedule")}
                </button>
              </div>
            </>
          ) : (
            <Notice>{t("Add a load before defining its calendar.")}</Notice>
          )}
        </div>
      )}
      {tab === "starts" && (
        <div className="advanced-section">
          <Notice>
            {t(
              "Enter actual starting current, PF and duration from your chosen model or equipment evidence. Each event replaces that load during the stated seconds; simultaneous and staggered starts use the same project. This is not a transient voltage/frequency solver.",
            )}
          </Notice>
          {events.map((event, index) => {
            const edit = (values: Partial<StartEvent>) =>
              setEvents(
                events.map((row, i) =>
                  i === index ? { ...row, ...values } : row,
                ),
              );
            return (
              <fieldset className="advanced-window" key={event.id}>
                <legend>
                  {t("Start event")} {index + 1}
                </legend>
                <div className="form-grid three">
                  <Field label={t("Load")}>
                    <select
                      value={event.loadId}
                      onChange={(e) => edit({ loadId: e.target.value })}
                    >
                      {project.loads.map((load) => (
                        <option key={load.id} value={load.id}>
                          {load.name || load.id}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t("Start instant (explicit offset)")}>
                    <input
                      value={event.start}
                      onChange={(e) => edit({ start: e.target.value })}
                    />
                  </Field>
                  <Field label={t("Duration")} unit="s">
                    <LocaleNumberInput
                      min={0.001}
                      step="any"
                      draftKey={`events:${event.id}:durationSeconds`}
                      value={event.durationSeconds}
                      onValueChange={(value) =>
                        edit({ durationSeconds: value })
                      }
                    />
                  </Field>
                  <Field label={t("Starting current basis")}>
                    <select
                      value={
                        event.currentA === undefined ? "multiplier" : "current"
                      }
                      onChange={(e) =>
                        edit(
                          e.target.value === "current"
                            ? { currentA: 0, multiplier: undefined }
                            : { currentA: undefined, multiplier: 1 },
                        )
                      }
                    >
                      <option value="current">
                        {t("Entered total current (A)")}
                      </option>
                      <option value="multiplier">
                        {t("Entered on-state current multiplier")}
                      </option>
                    </select>
                  </Field>
                  <Field
                    label={
                      event.currentA === undefined
                        ? t("Current multiplier")
                        : t("Total starting current")
                    }
                    unit={event.currentA === undefined ? "×" : "A"}
                  >
                    <LocaleNumberInput
                      min={0.001}
                      step="any"
                      draftKey={`events:${event.id}:${event.currentA === undefined ? "multiplier" : "currentA"}`}
                      value={event.currentA ?? event.multiplier ?? 0}
                      onValueChange={(value) =>
                        edit(
                          event.currentA === undefined
                            ? { multiplier: value }
                            : { currentA: value },
                        )
                      }
                    />
                  </Field>
                  <Field label={t("Starting displacement PF")}>
                    <LocaleNumberInput
                      min={0.001}
                      max={1}
                      step="any"
                      draftKey={`events:${event.id}:pf`}
                      value={event.pf}
                      onValueChange={(value) => edit({ pf: value })}
                    />
                  </Field>
                  <Field label={t("Starting method")}>
                    <select
                      value={event.method}
                      onChange={(e) =>
                        edit({
                          method: e.target.value as StartEvent["method"],
                        })
                      }
                    >
                      {["user", "dol", "star-delta", "soft-starter", "vfd"].map(
                        (method) => (
                          <option key={method} value={method}>
                            {method}
                          </option>
                        ),
                      )}
                    </select>
                  </Field>
                  <Field label={t("Source reference")}>
                    <input
                      value={event.source}
                      onChange={(e) => edit({ source: e.target.value })}
                    />
                  </Field>
                </div>
                <button
                  className="button danger"
                  onClick={() =>
                    setEvents(events.filter((_, i) => i !== index))
                  }
                >
                  {t("Delete start event")}
                </button>
              </fieldset>
            );
          })}
          <div className="button-row">
            <button
              className="button"
              disabled={!project.loads.length}
              onClick={() =>
                setEvents([
                  ...events,
                  {
                    id: newId("start"),
                    loadId: project.loads[0].id,
                    start: range.start,
                    durationSeconds: 1,
                    currentA: 0,
                    pf: 1,
                    method: "user",
                    source: "",
                  },
                ])
              }
            >
              {t("Add start event")}
            </button>
            <button
              className="button primary"
              onClick={() =>
                commit((draft) => {
                  draft.startEvents = mergePlanning(
                    store.draft.events.base,
                    events,
                    draft.startEvents ?? [],
                  );
                }, "events")
              }
            >
              {t("Save start events")}
            </button>
            <button
              className="button"
              disabled={eventDirty || !events.length}
              onClick={runStarts}
            >
              {t("Assess start sequence")}
            </button>
          </div>
          {starts && (
            <>
              <div className="kpi-grid">
                <div className="kpi-card">
                  <span>{t("Peak starting demand")}</span>
                  <strong>
                    {f(starts.peakKW)} kW / {f(starts.peakKVA)} kVA
                  </strong>
                </div>
                {(["L1", "L2", "L3"] as const).map((phase) => (
                  <div className="kpi-card" key={phase}>
                    <span>{phase}</span>
                    <strong>{f(starts.peakPhaseA[phase])} A</strong>
                  </div>
                ))}
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>{t("Timestamp")}</th>
                      <th>s</th>
                      <th>kW</th>
                      <th>kVA</th>
                      <th>L1 A</th>
                      <th>L2 A</th>
                      <th>L3 A</th>
                    </tr>
                  </thead>
                  <tbody>
                    {starts.points
                      .filter(
                        (row, index) => row.eventIds.length || index === 0,
                      )
                      .slice(0, 200)
                      .map((row) => (
                        <tr key={row.timestamp}>
                          <td>{row.timestamp}</td>
                          <td>{f(row.durationSeconds)}</td>
                          <td>{f(row.kw)}</td>
                          <td>{f(row.kva)}</td>
                          <td>{f(row.phaseCurrents.L1)}</td>
                          <td>{f(row.phaseCurrents.L2)}</td>
                          <td>{f(row.phaseCurrents.L3)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <button
                className="button"
                onClick={() =>
                  downloadFile(
                    `${safeName(project.name)}-start-sequence.csv`,
                    makeCSV([
                      [
                        "timestamp",
                        "duration_s",
                        "kw",
                        "kva",
                        "L1_A",
                        "L2_A",
                        "L3_A",
                        "event_ids",
                      ],
                      ...starts.points.map((row) => [
                        row.timestamp,
                        row.durationSeconds,
                        row.kw,
                        row.kva,
                        row.phaseCurrents.L1,
                        row.phaseCurrents.L2,
                        row.phaseCurrents.L3,
                        row.eventIds.join(";"),
                      ]),
                    ]),
                    "text/csv",
                  )
                }
              >
                {t("Export complete start sequence")}
              </button>
              {starts.issues.map((issue) => (
                <Notice key={issue.id}>{t(issue.message)}</Notice>
              ))}
            </>
          )}
        </div>
      )}
      {tab === "flexible" && (
        <div className="advanced-section">
          <Notice>
            {t(
              "Authorize a process window and exact operating energy. The bounded heuristic respects on-state power, minimum uninterrupted runs, phase/site/board/circuit limits and locked or critical equipment. Preview first; applying uses the workspace undo history.",
            )}
          </Notice>
          {requirements.map((requirement, index) => {
            const edit = (values: Partial<FlexibleLoad>) =>
              setRequirements(
                requirements.map((row, i) =>
                  i === index ? { ...row, ...values } : row,
                ),
              );
            return (
              <fieldset className="advanced-window" key={requirement.id}>
                <legend>
                  {t("Flexible process")} {index + 1}
                </legend>
                <div className="form-grid three">
                  <Field label={t("Name")}>
                    <input
                      value={requirement.name}
                      onChange={(e) => edit({ name: e.target.value })}
                    />
                  </Field>
                  <Field label={t("Load")}>
                    <select
                      value={requirement.loadId}
                      onChange={(e) => edit({ loadId: e.target.value })}
                    >
                      {project.loads.map((load) => (
                        <option key={load.id} value={load.id}>
                          {load.name || load.id}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t("Required operating energy")} unit="kWh">
                    <LocaleNumberInput
                      min={0.001}
                      step="any"
                      draftKey={`requirements:${requirement.id}:requiredKWh`}
                      value={requirement.requiredKWh}
                      onValueChange={(value) => edit({ requiredKWh: value })}
                    />
                  </Field>
                  <Field label={t("Minimum uninterrupted run")} unit="min">
                    <LocaleNumberInput
                      min={1}
                      step="1"
                      draftKey={`requirements:${requirement.id}:minimumRunMinutes`}
                      value={requirement.minimumRunMinutes}
                      onValueChange={(value) =>
                        edit({ minimumRunMinutes: value })
                      }
                    />
                  </Field>
                  <Field label={t("Priority (higher first)")}>
                    <LocaleNumberInput
                      min={0}
                      max={1000}
                      draftKey={`requirements:${requirement.id}:priority`}
                      value={requirement.priority}
                      onValueChange={(value) => edit({ priority: value })}
                    />
                  </Field>
                  <Field label={t("Authorization / source")}>
                    <input
                      value={requirement.source}
                      onChange={(e) => edit({ source: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="button-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={requirement.interruptible}
                      onChange={(e) =>
                        edit({ interruptible: e.target.checked })
                      }
                    />{" "}
                    {t("May split into valid run blocks")}
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={requirement.locked}
                      onChange={(e) => edit({ locked: e.target.checked })}
                    />{" "}
                    {t("Locked")}
                  </label>
                </div>
                {requirement.windows.map((window, j) => (
                  <div className="form-grid three" key={j}>
                    <Field label={t("Available from (explicit offset)")}>
                      <input
                        value={window.start}
                        onChange={(e) =>
                          edit({
                            windows: requirement.windows.map((row, k) =>
                              j === k ? { ...row, start: e.target.value } : row,
                            ),
                          })
                        }
                      />
                    </Field>
                    <Field label={t("Deadline / window end")}>
                      <input
                        value={window.end}
                        onChange={(e) =>
                          edit({
                            windows: requirement.windows.map((row, k) =>
                              j === k ? { ...row, end: e.target.value } : row,
                            ),
                          })
                        }
                      />
                    </Field>
                    <button
                      className="button danger"
                      onClick={() =>
                        edit({
                          windows: requirement.windows.filter(
                            (_, k) => j !== k,
                          ),
                        })
                      }
                    >
                      {t("Remove window")}
                    </button>
                  </div>
                ))}
                <div className="button-row">
                  <button
                    className="button"
                    onClick={() =>
                      edit({
                        windows: [
                          ...requirement.windows,
                          { start: range.start, end: range.end },
                        ],
                      })
                    }
                  >
                    {t("Add available window")}
                  </button>
                  <button
                    className="button danger"
                    onClick={() =>
                      setRequirements(
                        requirements.filter((_, i) => i !== index),
                      )
                    }
                  >
                    {t("Remove requirement")}
                  </button>
                </div>
              </fieldset>
            );
          })}
          <div className="button-row">
            <button
              className="button"
              disabled={!project.loads.length}
              onClick={() =>
                setRequirements([
                  ...requirements,
                  {
                    id: newId("flex"),
                    name: "",
                    loadId: project.loads[0].id,
                    windows: [{ start: range.start, end: range.end }],
                    requiredKWh: 0,
                    minimumRunMinutes: 15,
                    interruptible: true,
                    locked: false,
                    priority: 0,
                    source: "",
                  },
                ])
              }
            >
              {t("Add flexible process")}
            </button>
            <button
              className="button primary"
              onClick={() =>
                commit((draft) => {
                  draft.flexibleLoads = mergePlanning(
                    store.draft.requirements.base,
                    requirements,
                    draft.flexibleLoads ?? [],
                  );
                }, "requirements")
              }
            >
              {t("Save requirements")}
            </button>
          </div>
          <div className="form-grid three">
            <Field label={t("Scheduling objective")}>
              <select
                value={strategy}
                onChange={(e) =>
                  setStrategy(e.target.value as FlexiblePlanOptions["strategy"])
                }
              >
                <option value="deadline">{t("Priority and deadline")}</option>
                <option value="cheapest">{t("Lowest entered tariff")}</option>
                <option value="solar">
                  {t("Supplied-generation following")}
                </option>
              </select>
            </Field>
            <Field label={t("Site power limit")} unit="kW">
              <LocaleNumberInput
                min={0.001}
                step="any"
                draftKey="options:siteLimitKW"
                value={siteLimitKW}
                onValueChange={(value) => setSiteLimitKW(value)}
              />
            </Field>
            {strategy === "solar" && (
              <Field label={t("Entered interval generation")} unit="kW">
                <textarea
                  value={solar}
                  onChange={(e) => {
                    setSolar(e.target.value);
                    update((current) => ({
                      ...current,
                      solarLocale: locale,
                    }));
                  }}
                  placeholder={t("One value for every planning interval")}
                />
              </Field>
            )}
          </div>
          <div className="button-row">
            <button
              className="button"
              disabled={requirementsDirty || !requirements.length}
              onClick={previewFlexible}
            >
              {t("Preview constrained schedule")}
            </button>
            <button
              className="button primary"
              disabled={
                requirementsDirty ||
                !plan?.feasible ||
                plan.revision !== project.revision ||
                !plan.blocks.length
              }
              onClick={() => {
                if (plan) commit((draft) => applyFlexiblePlan(draft, plan));
              }}
            >
              {t("Apply reviewed schedule")}
            </button>
          </div>
          {requirementsDirty && (
            <Notice>{t("Save requirements before previewing.")}</Notice>
          )}
          {plan && (
            <>
              <p role="status">
                {t(
                  plan.feasible
                    ? "Feasible within entered constraints"
                    : "Unmet or incomplete requirements",
                )}{" "}
                · {plan.candidateCount} {t("candidates checked")}
              </p>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>{t("Process")}</th>
                      <th>{t("Delivered")}</th>
                      <th>{t("Unmet")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.requirements.map((row) => (
                      <tr key={row.id}>
                        <td>{row.name}</td>
                        <td>{f(row.deliveredKWh)} kWh</td>
                        <td>{f(row.unmetKWh)} kWh</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <table>
                  <thead>
                    <tr>
                      <th>{t("Load")}</th>
                      <th>{t("Start")}</th>
                      <th>{t("End")}</th>
                      <th>kW</th>
                      <th>kWh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.blocks.map((block, i) => (
                      <tr key={i}>
                        <td>
                          {
                            project.loads.find(
                              (load) => load.id === block.loadId,
                            )?.name
                          }
                        </td>
                        <td>{block.start}</td>
                        <td>{block.end}</td>
                        <td>{f(block.kw)}</td>
                        <td>{f(block.kWh)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Notice>{t(plan.method)}</Notice>
              {plan.issues.map((issue) => (
                <Notice key={issue.id}>{t(issue.message)}</Notice>
              ))}
            </>
          )}
        </div>
      )}
      <div className="advanced-section">
        <h3>{t("Actual calendar period")}</h3>
        <div className="form-grid three">
          <Field label={t("Range start (explicit offset)")}>
            <input
              value={range.start}
              onChange={(e) => setRange({ ...range, start: e.target.value })}
            />
          </Field>
          <Field label={t("Range end (explicit offset)")}>
            <input
              value={range.end}
              onChange={(e) => setRange({ ...range, end: e.target.value })}
            />
          </Field>
          <Field label={t("Interval")}>
            <select
              value={range.intervalMinutes}
              onChange={(e) =>
                setRange({
                  ...range,
                  intervalMinutes: Number(e.target.value) as 15 | 60,
                })
              }
            >
              <option value="15">15 {t("minutes")}</option>
              <option value="60">60 {t("minutes")}</option>
            </select>
          </Field>
        </div>
        <p className="muted">
          {t("Timezone")}: {project.timezone}.{" "}
          {t(
            "Explicit offsets select repeated times deliberately; elapsed duration includes daylight-saving changes.",
          )}
        </p>
        <label className="check-label">
          <input
            type="checkbox"
            checked={Boolean(range.includeBilling)}
            onChange={(e) =>
              setRange({ ...range, includeBilling: e.target.checked })
            }
          />
          {t("Include demand, standing and tax billing lines")}
        </label>
        <div className="button-row">
          <button
            className="button primary"
            disabled={busy}
            onClick={runCalendar}
          >
            {t(busy ? "Calculating…" : "Run calendar and bill")}
          </button>
          {busy && (
            <button
              className="button"
              onClick={() => {
                generation.current++;
                worker.current?.terminate();
                worker.current = null;
                setBusy(false);
              }}
            >
              {t("Cancel")}
            </button>
          )}
        </div>
      </div>
      {result && (
        <div className="advanced-section">
          <h3>{t("Completed calendar result")}</h3>
          <p>
            {f(result.totalKWh)} kWh · {f(result.elapsedHours)} h ·{" "}
            {t("Interval peak")}: {f(result.peakKW)} kW · {t("Revision")}{" "}
            {result.revision}
          </p>
          <LineChart
            points={result.points.map((point, index) => ({
              x: index,
              y: point.kw,
            }))}
            label={t("Calendar interval average power") + " · kW"}
          />
          <button
            className="button"
            onClick={() =>
              downloadFile(
                `${safeName(project.name)}-calendar.csv`,
                makeCSV([
                  [
                    "timestamp",
                    "local_time",
                    "elapsed_hours",
                    "kw",
                    "kwh",
                    "cumulative_kwh",
                    "L1_kw",
                    "L2_kw",
                    "L3_kw",
                    "start_events",
                  ],
                  ...result.points.map((point) => [
                    point.timestamp,
                    point.localTime,
                    point.elapsedHours,
                    point.kw,
                    point.kWh,
                    point.cumulativeKWh,
                    point.phaseKW.L1,
                    point.phaseKW.L2,
                    point.phaseKW.L3,
                    point.startEventIds.join(";"),
                  ]),
                ]),
                "text/csv",
              )
            }
          >
            {t("Export complete calendar")}
          </button>
          {result.bill && (
            <>
              <h3>{t("Separate billing lines")}</h3>
              <div className="table-scroll">
                <table>
                  <tbody>
                    {(
                      [
                        ["Import energy", result.bill.energyCharge],
                        ["Export credit", -result.bill.exportCredit],
                        ["Standing charges", result.bill.standingCharge],
                        ["Demand charge", result.bill.demandCharge],
                        ["Tax", result.bill.tax],
                        ["Total", result.bill.total],
                      ] as [string, number][]
                    ).map(([label, value]) => (
                      <tr key={label}>
                        <th>{t(label)}</th>
                        <td>{money(value, project.currency, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p role="status">
                {t(
                  result.bill.complete
                    ? "Complete within the entered billing model"
                    : "Incomplete billing evidence — review missing checks",
                )}
              </p>
              <Notice>{t(result.bill.method)}</Notice>
              {result.bill.demandPeaks.map((peak) => (
                <p key={peak.period}>
                  {peak.period}: {f(peak.kw)} kW · {peak.start} → {peak.end}
                </p>
              ))}
              {result.bill.issues.map((issue) => (
                <Notice key={issue.id}>{t(issue.message)}</Notice>
              ))}
            </>
          )}
          {result.issues.map((issue) => (
            <Notice key={issue.id}>{t(issue.message)}</Notice>
          ))}
        </div>
      )}
    </section>
  );
}
