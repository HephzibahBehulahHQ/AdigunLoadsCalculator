import { LocaleNumberInput, OptionalLocaleNumberInput } from "../i18n/LocaleNumberInput";
import { useContext, useMemo, useState, useEffect, useRef } from "react";
import {
  Plus,
  Save,
  Download,
  Sun,
  CarFront,
  Trash2,
  ArrowRight,
} from "lucide-react";
import type {
  Project,
  CalculationResult,
  EVSession,
  EnergySettings,
  Phase,
} from "../domain/types";
import { createLoad, duplicateProject, validateProjectImport } from "../domain/project";
import { calculateProject } from "../engine/electrical";
import {
  simulateEnergy,
  pvDailyEstimate,
  tariffRate,
  validateTariff,
} from "../engine/simulation";
import type { EnergyResult, EnergyOptions } from "../engine/simulation";
import type { EVPlan } from "../engine/planning";
import { EnergySettingsFields } from "./EnergySettingsFields";
import { formatEditableNumber, parseLocaleNumberList } from "../i18n/numbers";
import { scheduleEV, conservativeDemandProfile } from "../engine/planning";
import { Field, Notice, Modal, LineChart } from "./ui";
import { LanguageContext, useT, numberFormat, money } from "../i18n";
import { downloadFile, makeCSV, safeName } from "../import-export/files";
import type { ProjectRecord } from "../storage/projects";
type Change = (mutator: (draft: Project) => void) => void | boolean;
export function Renewables({
  project,
  change,
  onComplete,
}: {
  project: Project;
  change: Change;
  onComplete?: (result: EnergyResult, inputs: Record<string, unknown>) => void;
}) {
  const t = useT();
  const locale = useContext(LanguageContext);
  const [draft, setDraft] = useState<EnergySettings>(
    structuredClone(project.energy),
  );
  const [profile, setProfile] = useState(
    project.energy.pvHourlyProfile?.map((n) => formatEditableNumber(n, locale)).join("; ") || "",
  );
  const [wind, setWind] = useState(project.energy.windHourlyKW?.map((n) => formatEditableNumber(n, locale)).join("; ") ?? "");
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [actualRange, setActualRange] = useState(false);
  const [range, setRange] = useState({ start: `${today}T00:00:00Z`, end: new Date(Date.parse(`${today}T00:00:00Z`) + 86400000).toISOString() });
  const [outageRange, setOutageRange] = useState({ start: `${today}T18:00:00Z`, end: `${today}T22:00:00Z` });
  const [busy, setBusy] = useState(false);
  const job = useRef<Worker | null>(null), runToken = useRef(0), latest = useRef(project);
  latest.current = project;
  const [outage, setOutage] = useState({
    enabled: false,
    startHour: 18,
    durationHours: 4,
  });
  const [result, setResult] = useState<EnergyResult>();
  const [error, setError] = useState("");
  const profileLocale = useRef(locale), windLocale = useRef(locale);
  const parsedProfile = profile.trim() ? parseLocaleNumberList(profile, profileLocale.current, { min: 0, max: 1 }) : undefined;
  const parsedWind = wind.trim() ? parseLocaleNumberList(wind, windLocale.current, { min: 0 }) : undefined;
  const inputKey = JSON.stringify({ energy: { ...draft, pvHourlyProfile: parsedProfile?.ok ? parsedProfile.values : profile || undefined, windHourlyKW: parsedWind?.ok ? parsedWind.values : wind || undefined }, date, actualRange, range, outageRange, outage });
  const lastRunInput = useRef("");
  const energyKey = JSON.stringify(project.energy);
  useEffect(() => {
    profileLocale.current = locale; windLocale.current = locale;
    setDraft(structuredClone(project.energy));
    setProfile(project.energy.pvHourlyProfile?.map((n) => formatEditableNumber(n, locale)).join("; ") || "");
    setWind(project.energy.windHourlyKW?.map((n) => formatEditableNumber(n, locale)).join("; ") ?? "");
    setError("");
  }, [project.id, energyKey]);
  useEffect(() => {
    const pv = parseLocaleNumberList(profile, profileLocale.current, { min: 0, max: 1 });
    if (pv.ok) { setProfile(pv.values.map((n) => formatEditableNumber(n, locale)).join("; ")); profileLocale.current = locale; }
    const windValues = parseLocaleNumberList(wind, windLocale.current, { min: 0 });
    if (windValues.ok) { setWind(windValues.values.map((n) => formatEditableNumber(n, locale)).join("; ")); windLocale.current = locale; }
  }, [locale]);
  useEffect(() => { if (lastRunInput.current !== inputKey) { runToken.current++; job.current?.terminate(); job.current = null; setBusy(false); setResult(undefined); } }, [inputKey]);
  useEffect(() => () => { runToken.current++; job.current?.terminate(); }, []);
  useEffect(() => {
    runToken.current++; job.current?.terminate(); job.current = null; setBusy(false);
    setResult((previous) =>
      previous?.revision === project.revision ? previous : undefined,
    );
  }, [project.id, project.revision]);
  const f = (n: number) => numberFormat(n, 3, locale);
  function run(e: React.FormEvent) {
    e.preventDefault();
    try {
      lastRunInput.current = inputKey;
      if (parsedProfile && !parsedProfile.ok) throw new Error(parsedProfile.message);
      if (parsedWind && !parsedWind.ok) throw new Error(parsedWind.message);
      const energy = {
        ...draft,
        pvHourlyProfile: parsedProfile?.ok ? parsedProfile.values : undefined,
        windHourlyKW: parsedWind?.ok ? parsedWind.values : undefined,
      };
      if (
        energy.pvHourlyProfile &&
        (energy.pvHourlyProfile.length !== 24 ||
          energy.pvHourlyProfile.some(
            (n) => !Number.isFinite(n) || n < 0 || n > 1,
          ))
      )
        throw new Error(
          "Enter exactly 24 normalized hourly PV values from 0 to 1.",
        );
      const p = { ...project, revision: project.revision + 1, energy };
      const options: EnergyOptions = {
        date,
        range: actualRange ? range : undefined,
        outageRange: actualRange && outage.enabled ? outageRange : undefined,
        outage: !actualRange && outage.enabled
          ? { startHour: outage.startHour, durationHours: outage.durationHours }
          : undefined,
      };
      const checked = validateProjectImport(p);
      if (!checked.valid) throw new Error(checked.errors.join(" "));
      const baseRevision = project.revision, projectId = project.id, token = ++runToken.current;
      const accept = (next: EnergyResult) => {
        if (token !== runToken.current || latest.current.id !== projectId || latest.current.revision !== baseRevision) return;
        const accepted = change((d) => { if (d.revision !== baseRevision) throw new Error("Project changed while dispatch was running; run it again."); d.energy = energy; });
        if (accepted === false) return;
        setResult(next); setError(""); setBusy(false); onComplete?.(next, { ...options, energy: structuredClone(energy) });
      };
      job.current?.terminate();
      if (actualRange && typeof Worker !== "undefined") {
        setBusy(true); setResult(undefined);
        const worker = new Worker(new URL("../workers/energy.ts", import.meta.url), { type: "module" }); job.current = worker;
        worker.onmessage = (event: MessageEvent<{ result?: EnergyResult; error?: string }>) => { if (token !== runToken.current || worker !== job.current) return; if (event.data.error) { setError(event.data.error); setBusy(false); } else if (event.data.result) accept(event.data.result); worker.terminate(); job.current = null; };
        worker.onerror = () => { if (token === runToken.current) { setError("Dispatch worker failed. Your project is unchanged."); setBusy(false); } worker.terminate(); };
        worker.postMessage({ project: p, options });
      } else accept(simulateEnergy(p, options));
    } catch (e) {
      setResult(undefined);
      setError((e as Error).message);
    }
  }
  return (
    <>
      <div className="section-title">
        <div>
          <span className="eyebrow">{t("Renewables & Storage")}</span>
          <h2>
            {t("Energy")} / {t("Grid import")} / {t("Battery stored")}
          </h2>
        </div>
        <Sun size={30} className="gold-text" />
      </div>
      <form className="panel panel-pad" onSubmit={run}>
        <div className="form-grid three">
          {[
            ["pvKW", "PV capacity", "kWp"],
            ["peakSunHours", "Peak sun hours", "h/day"],
            ["pvPerformanceRatio", "Performance ratio", "0–1"],
          ].map(([key, label, unit]) => (
            <Field key={key} label={t(label)} unit={unit}>
              <LocaleNumberInput
                required
                min={0}
                max={key === "pvPerformanceRatio" ? 1 : undefined}
                step="any"
                value={draft[key as keyof EnergySettings] as number}
                onValueChange={(value) => {
                  setDraft((d) => ({ ...d, [key]: value }));
                  setResult(undefined);
                }}
              />
            </Field>
          ))}
        </div>
        <h3>{t("Battery capacity")}</h3>
        <div className="form-grid four">
          {[
            ["capacityKWh", "Battery capacity", "kWh"],
            ["initialSoc", "Initial SOC", "0–1"],
            ["minSoc", "Minimum SOC", "0–1"],
            ["maxSoc", "Maximum SOC", "0–1"],
            ["chargeKW", "Charge power", "kW"],
            ["dischargeKW", "Discharge power", "kW"],
            ["chargeEfficiency", "Charge efficiency", "0–1"],
            ["dischargeEfficiency", "Discharge efficiency", "0–1"],
          ].map(([key, label, unit]) => (
            <Field key={key} label={t(label)} unit={unit}>
              <LocaleNumberInput
                required
                min={0}
                max={unit === "0–1" ? 1 : undefined}
                step="any"
                value={
                  draft.battery[key as keyof typeof draft.battery] as number
                }
                onValueChange={(value) => {
                  setDraft((d) => ({
                    ...d,
                    battery: { ...d.battery, [key]: value },
                  }));
                  setResult(undefined);
                }}
              />
            </Field>
          ))}
        </div>
        <Field label={t("Source reference")}>
          <input
            value={draft.source}
            onChange={(e) => {
              setDraft((d) => ({ ...d, source: e.target.value }));
              setResult(undefined);
            }}
          />
        </Field>
        <Field
          label={t("Hourly PV profile, 00:00–23:00")}
          unit="24 × 0–1"
          hint="Entered generation fractions. Peak-sun-hours alone does not create a chronological profile."
        >
          <textarea
            rows={2}
            value={profile}
            onChange={(e) => {
              profileLocale.current = locale; setProfile(e.target.value);
              setResult(undefined);
            }}
          />
        </Field>
        <EnergySettingsFields project={project} energy={draft} setEnergy={setDraft} wind={wind} setWind={(value) => { windLocale.current = locale; setWind(value); }} />
        <h3>{t("Dispatch period")}</h3>
        <div className="check-row"><label><input type="checkbox" checked={actualRange} onChange={(e) => setActualRange(e.target.checked)} />{t("Use actual timestamped calendar range")}</label></div>
        {actualRange ? <div className="form-grid"><Field label={t("Dispatch range start (explicit offset)")}><input value={range.start} onChange={(e) => setRange({ ...range, start: e.target.value })} /></Field><Field label={t("Dispatch range end (explicit offset)")}><input value={range.end} onChange={(e) => setRange({ ...range, end: e.target.value })} /></Field></div> : <Field label={t("Representative local date for rules and tariffs")}><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>}
        <div className="check-row">
          <label>
            <input
              type="checkbox"
              checked={draft.battery.islandCapable}
              onChange={(e) => {
                setDraft((d) => ({
                  ...d,
                  battery: { ...d.battery, islandCapable: e.target.checked },
                }));
                setResult(undefined);
              }}
            />
            {t(
              "Island-capable supply with verified transfer/isolation arrangement",
            )}
          </label>
          <label>
            <input
              type="checkbox"
              checked={outage.enabled}
              onChange={(e) => {
                setOutage((d) => ({ ...d, enabled: e.target.checked }));
                setResult(undefined);
              }}
            />
            {t("Simulate grid outage")}
          </label>
        </div>
        {outage.enabled && actualRange && <div className="form-grid"><Field label={t("Outage starts (explicit offset)")}><input value={outageRange.start} onChange={(e) => setOutageRange({ ...outageRange, start: e.target.value })} /></Field><Field label={t("Outage ends (explicit offset)")}><input value={outageRange.end} onChange={(e) => setOutageRange({ ...outageRange, end: e.target.value })} /></Field></div>}
        {outage.enabled && !actualRange && (
          <div className="form-grid">
            <Field label={t("Start hour")} unit="h">
              <LocaleNumberInput
                min={0}
                max={23.75}
                step=".25"
                value={outage.startHour}
                onValueChange={(value) => {
                  setOutage((d) => ({
                    ...d,
                    startHour: value,
                  }));
                  setResult(undefined);
                }}
              />
            </Field>
            <Field label={t("Outage duration")} unit="h">
              <LocaleNumberInput
                min={.25}
                max={24}
                step=".25"
                value={outage.durationHours}
                onValueChange={(value) => {
                  setOutage((d) => ({
                    ...d,
                    durationHours: value,
                  }));
                  setResult(undefined);
                }}
              />
            </Field>
          </div>
        )}
        <div className="button-row">
          <button className="button primary" disabled={busy}>
            <Save size={16} />
            {t("Save")} & {t("Run simulation")}
          </button>
          {busy && <button type="button" className="button" onClick={() => { runToken.current++; job.current?.terminate(); job.current = null; setBusy(false); }}>{t("Cancel simulation")}</button>}
        </div>
        {error && (
          <p className="error-text" role="alert">
            {t(error)}
          </p>
        )}
      </form>
      <Notice>
        {t("Daily energy")} PV = kWp × h × PR. {t("Calculated")}:{" "}
        {f(pvDailyEstimate(project))} kWh.{" "}
        {t("All results use entered assumptions.")}
      </Notice>
      {result && result.revision === project.revision && (
        <>
          <Notice>{t(result.method)}</Notice>
          <div className="metric-strip"><div><span>{t("Deliberately shed energy")}</span><strong>{f(result.shedKWh)} kWh</strong></div><div><span>{t("Critical unserved energy")}</span><strong>{f(result.criticalUnservedKWh)} kWh</strong></div><div><span>{t("Grid charging")}</span><strong>{f(result.gridChargeKWh)} kWh</strong></div></div>
          <div className="kpi-grid">
            {[
              [project.energy.windHourlyKW?.some((kw) => kw > 0) ? "PV + wind generation" : "PV generation", result.generationKWh],
              ["Grid import", result.importKWh],
              ["Grid export", result.exportKWh],
              ["Battery stored", result.finalStoredKWh],
            ].map(([label, value]) => (
              <div className="kpi-card cyan" key={label as string}>
                <span>{t(label as string)}</span>
                <div className="kpi-value">
                  {f(value as number)}
                  <small>kWh</small>
                </div>
              </div>
            ))}
          </div>
          <section className="panel">
            <div className="panel-head">
              <h3>
                {t(project.energy.windHourlyKW?.some((kw) => kw > 0) ? "PV + wind generation" : "PV generation")} / {t("Load Schedule")}
              </h3>
              <span className="tag cyan">15 min</span>
            </div>
            <LineChart
              points={result.points.map((p) => ({
                x: p.timestamp ? (Date.parse(p.timestamp) - Date.parse(result.points[0].timestamp!)) / 3600000 : p.hour,
                y: p.generationKW,
              }))}
              secondary={result.points.map((p) => ({ x: p.timestamp ? (Date.parse(p.timestamp) - Date.parse(result.points[0].timestamp!)) / 3600000 : p.hour, y: p.loadKW }))}
              color="var(--gold)"
            />
            <div className="chart-footer">
              <span>{t("Gold: supplied generation · Violet: load")}</span>
              <button
                className="text-button"
                onClick={() =>
                  downloadFile(
                    safeName(project.name) + "-energy.csv",
                    makeCSV([
                      [
                        "hour",
                        "load_kW",
                        "generation_kW",
                        "grid_import_kWh",
                        "grid_export_kWh",
                        "stored_kWh",
                        "losses_kWh",
                        "unserved_kWh",
                        "balance_error_kWh",
                        "timestamp", "duration_hours", "curtailed_kWh", "grid_charge_kWh", "shed_kWh", "critical_unserved_kWh", "served_load_ids", "unserved_load_ids",
                      ],
                      ...result.points.map((p) => [
                        p.hour,
                        p.loadKW,
                        p.generationKW,
                        p.importKWh,
                        p.exportKWh,
                        p.storedKWh,
                        p.lossesKWh,
                        p.unservedKWh,
                        p.balanceErrorKWh,
                        p.timestamp ?? "", p.durationHours, p.curtailedKWh, p.gridChargeKWh, p.shedKWh, p.criticalUnservedKWh, p.servedLoadIds?.join(";") ?? "", p.unservedLoadIds?.join(";") ?? "",
                      ]),
                    ]),
                    "text/csv",
                  )
                }
              >
                <Download size={15} />
                {t("Export series")}
              </button>
            </div>
          </section>
          <section className="panel">
            <div className="panel-head">
              <h3>{t("Battery stored")}</h3>
              <span>{money(result.totalCost, project.currency, locale)}</span>
            </div>
            <LineChart
              points={result.points.map((p) => ({ x: p.timestamp ? (Date.parse(p.timestamp) - Date.parse(result.points[0].timestamp!)) / 3600000 : p.hour, y: p.storedKWh }))}
              color="var(--violet)"
              label="kWh"
            />
            <div className="metric-strip">
              <div>
                <span>{t("Conversion losses")}</span>
                <strong>{f(result.lossesKWh)} kWh</strong>
              </div>
              <div>
                <span>{t("Unmet energy")}</span>
                <strong>{f(result.unservedKWh)} kWh</strong>
              </div>
              <div>
                <span>{t("Energy balance error")}</span>
                <strong>
                  {f(
                    Math.max(
                      ...result.points.map((p) => Math.abs(p.balanceErrorKWh)),
                    ),
                  )}{" "}
                  kWh
                </strong>
              </div>
            </div>
          </section>
          {result.issues.map((i) => (
            <Notice key={i.id} tone="warning">
              {t(i.message)}
            </Notice>
          ))}
        </>
      )}
    </>
  );
}
export function EVPlanner({
  project,
  result,
  change,
  onComplete,
}: {
  project: Project;
  result: CalculationResult;
  change: Change;
  onComplete?: (sessionId: string, plan: EVPlan, inputs: Record<string, unknown>) => void;
}) {
  const t = useT();
  const locale = useContext(LanguageContext);
  const [editing, setEditing] = useState<EVSession | null>(null);
  const [strategy, setStrategy] = useState<"immediate" | "cheapest" | "solar">(
    "immediate",
  );
  const [chargingDate, setChargingDate] = useState(new Date().toISOString().slice(0, 10));
  const completeRef = useRef(onComplete); completeRef.current = onComplete;
  const [error, setError] = useState("");
  const planning = useMemo(() => {
    try {
      const planningProject = { ...project, supply: { ...project.supply, limitA: Math.min(project.supply.limitA, project.boards.find((board) => !board.parentId)?.ratedA ?? project.supply.limitA) } };
      const envelope = conservativeDemandProfile(planningProject, 60, chargingDate);
      const nextDate = new Date(Date.parse(`${chargingDate}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
      const tomorrow = conservativeDemandProfile(planningProject, 60, nextDate);
      const base = [...envelope.kw, ...tomorrow.kw];
      const remaining = { L1: [...envelope.phaseHeadroomKW.L1, ...tomorrow.phaseHeadroomKW.L1], L2: [...envelope.phaseHeadroomKW.L2, ...tomorrow.phaseHeadroomKW.L2], L3: [...envelope.phaseHeadroomKW.L3, ...tomorrow.phaseHeadroomKW.L3] };
      if (strategy === "solar" && !project.energy.pvHourlyProfile && !project.energy.windHourlyKW) throw new Error("Enter a generation profile before using generation-following charging.");
      const rows = project.evSessions.map((session) => {
        const phase = session.phase || "L1";
        const slotIndex = (hour: number) => hour + (session.departureHour < session.arrivalHour && hour < session.arrivalHour ? 24 : 0);
        const headroom = Array.from({ length: 24 }, (_, hour) => { const index = slotIndex(hour); return session.connection === "three" ? Math.min(remaining.L1[index], remaining.L2[index], remaining.L3[index]) * 3 : remaining[phase][index]; });
        const plan = scheduleEV(
          session,
          Array.from({ length: 24 }, (_, hour) => base[slotIndex(hour)]),
          result.profile.map((p) => { const date = slotIndex(p.hour) >= 24 ? nextDate : chargingDate; return tariffRate(project.tariff, p.hour, new Date(`${date}T00:00:00Z`).getUTCDay(), date); }),
          { strategy, phaseHeadroomKW: headroom, generationKW: strategy === "solar" ? Array.from({ length: 24 }, (_, hour) => Math.min((project.energy.pvHourlyProfile?.[hour] ?? 0) * project.energy.pvKW * project.energy.pvPerformanceRatio, project.energy.inverterACLimitKW ?? Infinity) + (project.energy.windHourlyKW?.[hour] ?? 0)) : undefined },
        );
        plan.points.forEach((p, i) => {
          const index = slotIndex(i); base[index] += p.acKW;
          for (const connectionPhase of session.connection === "three" ? ["L1", "L2", "L3"] as Phase[] : [phase]) remaining[connectionPhase][index] = Math.max(0, remaining[connectionPhase][index] - p.acKW / (session.connection === "three" ? 3 : 1));
        });
        return { session, plan };
      });
      return { plans: rows, error: "" };
    } catch (caught) {
      return { plans: [], error: (caught as Error).message };
    }
  }, [project, result, strategy, chargingDate]);
  const plans = planning.plans;
  useEffect(() => { for (const { session, plan } of plans) completeRef.current?.(session.id, plan, { strategy, date: chargingDate, session: structuredClone(session) }); }, [plans]);
  const fresh = () => ({
    id: crypto.randomUUID(),
    name: "",
    arrivalHour: 18,
    departureHour: 7,
    requiredKWh: 0,
    chargerKW: 7.4,
    vehicleKW: 7.4,
    efficiency: 0.9,
    siteLimitKW: (project.supply.limitA * project.supply.voltageLN * 3) / 1000,
    phase: "L1" as Phase,
    connection: "single" as const,
    minimumKW: 0,
    energyBasis: "required" as const,
  });
  return (
    <>
      <div className="page-actions">
        <select
          aria-label={t("Charging strategy")}
          value={strategy}
          onChange={(e) => setStrategy(e.target.value as typeof strategy)}
        >
          <option value="immediate">{t("Immediate charging")}</option>
          <option value="cheapest">
            {t("Lowest-cost available intervals")}
          </option>
          <option value="solar">{t("Follow supplied generation")}</option>
        </select>
        <Field label={t("Charging tariff / calendar date")}><input type="date" value={chargingDate} onChange={(e) => setChargingDate(e.target.value)} /></Field>
        <span className="spacer" />
        <button className="button primary" onClick={() => setEditing(fresh())}>
          <Plus size={16} />
          {t("Add session")}
        </button>
      </div>
      <Notice>
        Sessions reserve conservative on-state demand within each occupied hour,
        share site and phase limits in listed order, and preserve their actual
        duration. {t("All results use entered assumptions.")}
      </Notice>
      {planning.error && <p className="error-text" role="alert">{t(planning.error)}</p>}
      {plans.length === 0 && (
        <section className="panel tool-intro">
          <CarFront size={40} className="cyan-text" />
          <h2>{t("EV & Flexible Loads")}</h2>
          <p>{t("Add session")}</p>
        </section>
      )}
      {plans.map(({ session, plan }) => (
        <section className="panel" key={session.id}>
          <div className="panel-head">
            <div>
              <span className="eyebrow">
                {session.phase} · {session.arrivalHour}:00 →{" "}
                {session.departureHour}:00
              </span>
              <h3>{session.name}</h3>
            </div>
            <div className="button-row">
              <span className={"tag " + (plan.feasible ? "cyan" : "red")}>
                {t(plan.feasible ? "Feasible" : "Infeasible")}
              </span>
              <button
                className="button"
                onClick={() => setEditing(structuredClone(session))}
              >
                {t("Edit")}
              </button>
              <button
                className="icon-button danger"
                aria-label={t("Delete") + " " + session.name}
                onClick={() =>
                  change((p) => {
                    p.evSessions = p.evSessions.filter(
                      (s) => s.id !== session.id,
                    );
                  })
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <div className="metric-strip">
            <div>
              <span>{t("Delivered energy")}</span>
              <strong>{numberFormat(plan.deliveredKWh, 3, locale)} kWh</strong>
            </div>
            <div>
              <span>{t("Unmet energy")}</span>
              <strong>{numberFormat(plan.unmetKWh, 3, locale)} kWh</strong>
            </div>
            <div>
              <span>{t("Cost")}</span>
              <strong>{money(plan.cost, project.currency, locale)}</strong>
            </div>
          </div>
          <LineChart
            points={plan.points.map((p) => ({ x: p.hour, y: p.acKW }))}
          />
          {plan.issues.map((i) => (
            <Notice key={i.id} tone="warning">
              {t(i.message)}
            </Notice>
          ))}
          <div className="panel-pad">
            <button
              className="button"
              onClick={() => {
                if (
                  !confirm(
                    `${t("Apply changes")}: ${session.name} → ${plan.points.filter((p) => p.acKWh > 0).length} hourly load segments? This removes the planning session to prevent duplicate scheduling.`,
                  )
                )
                  return;
                change((p) => {
                  plan.points
                    .filter((point) => point.acKWh > 0)
                    .forEach((point) =>
                      p.loads.push(
                        createLoad({
                          name: session.name + " · " + point.hour + ":00",
                          category: "EV",
                          rating: point.acKW,
                          connection: session.connection ?? "single",
                          voltage: session.connection === "three" ? p.supply.voltageLL : p.supply.voltageLN,
                          phase: session.phase || "L1",
                          startHour: point.startHour,
                          hoursPerDay: point.durationHours,
                          boardId: p.boards.find((board) => !board.parentId)?.id,
                          schedule: { windows: [{ id: crypto.randomUUID(), startHour: point.startHour, durationHours: point.durationHours, effectiveFrom: session.departureHour < session.arrivalHour && point.hour < session.arrivalHour ? new Date(Date.parse(`${chargingDate}T00:00:00Z`) + 86400000).toISOString().slice(0, 10) : chargingDate, effectiveTo: session.departureHour < session.arrivalHour && point.hour < session.arrivalHour ? new Date(Date.parse(`${chargingDate}T00:00:00Z`) + 86400000).toISOString().slice(0, 10) : chargingDate }] },
                          source: {
                            kind: "user",
                            reference:
                              "Applied EV planning result; on-state AC demand and actual permitted duration retained.",
                          },
                          notes:
                            "Required battery energy " +
                            session.requiredKWh +
                            " kWh; charging efficiency " +
                            session.efficiency,
                        }),
                      ),
                    );
                  p.evSessions = p.evSessions.filter(
                    (s) => s.id !== session.id,
                  );
                });
              }}
              disabled={!plan.feasible}
              title={
                !plan.feasible
                  ? "Reduce required energy, extend the permitted time or enter sufficient verified charger, site and phase capacity."
                  : undefined
              }
            >
              {t("Apply changes")}
              <ArrowRight size={15} />
            </button>
            {!plan.feasible && (
              <p className="muted small">
                To apply this schedule, reduce required energy, extend the
                arrival/departure window, or resolve the entered charger, site
                and phase limits. Use Edit to correct the session.
              </p>
            )}
          </div>
        </section>
      ))}
      {editing && (
        <Modal title={t("Add session")} onClose={() => setEditing(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                scheduleEV(editing);
                change((p) => {
                  const i = p.evSessions.findIndex((s) => s.id === editing.id);
                  if (i >= 0) p.evSessions[i] = editing;
                  else p.evSessions.push(editing);
                });
                setEditing(null);
                setError("");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <div className="modal-body">
              <Field label={t("Name")}>
                <input
                  value={editing.name}
                  required
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                />
              </Field>
              <div className="form-grid">
                {[
                  ["arrivalHour", "Arrival", "h", 0, 24],
                  ["departureHour", "Departure", "h", 0, 24],
                  ["requiredKWh", "Required energy", "kWh", 0, 10000],
                  ["chargerKW", "Charger limit", "kW", 0, 10000],
                  ["vehicleKW", "Vehicle limit", "kW", 0, 10000],
                  ["efficiency", "Efficiency", "0–1", 0.01, 1],
                  ["siteLimitKW", "Site limit", "kW", 0, 100000],
                  ["minimumKW", "Minimum charging power", "kW", 0, 100000],
                ].map(([key, label, unit, min, max]) => (
                  <Field
                    key={key as string}
                    label={t(label as string)}
                    unit={unit as string}
                  >
                    <LocaleNumberInput
                      required
                      step="any"
                      min={min as number}
                      max={max as number}
                      value={(editing[key as keyof EVSession] as number) ?? 0}
                      onValueChange={(value) =>
                        setEditing({
                          ...editing,
                          [key]: value,
                        })
                      }
                    />
                  </Field>
                ))}
                <Field label={t("Charging connection")}><select value={editing.connection ?? "single"} onChange={(e) => setEditing({ ...editing, connection: e.target.value as "single" | "three" })}><option value="single">{t("Single phase")}</option><option value="three">{t("Balanced three phase")}</option></select></Field>
                <Field label={t("Required energy basis")}><select value={editing.energyBasis ?? "required"} onChange={(e) => setEditing({ ...editing, energyBasis: e.target.value as "required" | "soc", usableCapacityKWh: editing.usableCapacityKWh ?? 0, initialSoc: editing.initialSoc ?? 0, targetSoc: editing.targetSoc ?? 1 })}><option value="required">{t("Entered battery-delivered energy")}</option><option value="soc">{t("Usable capacity and SOC change")}</option></select></Field>
                {editing.energyBasis === "soc" && ([['usableCapacityKWh', 'Usable vehicle battery capacity', 'kWh'], ['initialSoc', 'Arrival SOC', '0–1'], ['targetSoc', 'Departure target SOC', '0–1']] as const).map(([key, label, unit]) => <Field key={key} label={t(label)} unit={unit}><LocaleNumberInput min={0} max={unit === '0–1' ? 1 : undefined} step="any" value={editing[key] ?? 0} onValueChange={(value) => setEditing({ ...editing, [key]: value })} /></Field>)}
                <Field label={t("Phase")}>
                  <select
                    value={editing.phase}
                    onChange={(e) =>
                      setEditing({ ...editing, phase: e.target.value as Phase })
                    }
                  >
                    {["L1", "L2", "L3"].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </Field>
              </div>
              {error && (
                <p role="alert" className="error-text">
                  {t(error)}
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="button"
                type="button"
                onClick={() => setEditing(null)}
              >
                {t("Cancel")}
              </button>
              <button className="button primary">{t("Save")}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
export function Costs({
  project,
  result,
  change,
}: {
  project: Project;
  result: CalculationResult;
  change: Change;
}) {
  const t = useT();
  const locale = useContext(LanguageContext);
  const [tariff, setTariff] = useState(structuredClone(project.tariff));
  const [error, setError] = useState("");
  const tariffKey = JSON.stringify(project.tariff);
  const demandRule = tariff.demandRule ?? { method: "aligned" as const, windowMinutes: 15, stepMinutes: 15, period: "range" as const };
  const setDemand = (values: Partial<NonNullable<typeof tariff.demandRule>>) => setTariff((draft) => ({ ...draft, demandRule: { ...demandRule, ...values } }));
  useEffect(() => {
    setTariff(structuredClone(project.tariff));
    setError("");
  }, [project.id, tariffKey]);
  return (
    <>
      <div className="kpi-grid">
        {[
          [
            "Daily cost",
            money(result.dailyCost, project.currency, locale),
            "24-hour estimate",
          ],
          [
            "Monthly estimate",
            money(result.monthlyCost, project.currency, locale),
            "30-day assumption",
          ],
          [
            "Daily energy",
            numberFormat(result.dailyKWh, 3, locale) + " kWh",
            "Calculated",
          ],
          [
            "Carbon factor",
            project.tariff.carbonKgPerKWh === undefined
              ? "—"
              : numberFormat(
                  result.dailyKWh * project.tariff.carbonKgPerKWh,
                  3,
                  locale,
                ) + " kg CO₂e",
            "All results use entered assumptions.",
          ],
        ].map(([label, value, note]) => (
          <div className="kpi-card gold" key={label}>
            <span>{t(label)}</span>
            <div className="kpi-value compact">{value}</div>
            <small>{t(note)}</small>
          </div>
        ))}
      </div>
      <form
        className="panel panel-pad"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            const diagnostics = validateTariff(tariff);
            if (diagnostics.length)
              throw new Error(
                diagnostics.map((item) => item.message).join(" "),
              );
            if (
              tariff.carbonKgPerKWh !== undefined &&
              (!Number.isFinite(tariff.carbonKgPerKWh) ||
                tariff.carbonKgPerKWh < 0)
            )
              throw new Error(
                "Carbon intensity must be a nonnegative finite number.",
              );
            change((p) => {
              const checked = validateProjectImport({ ...p, tariff });
              if (!checked.valid) throw new Error(checked.errors.join(" "));
              p.tariff = tariff;
            });
            setError("");
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <h3>{t("Costs & Carbon")}</h3>
        <div className="form-grid three">
          {[
            ["importRate", "Import price", project.currency + "/kWh"],
            ["exportRate", "Export price", project.currency + "/kWh"],
            ["standingPerDay", "Standing charge", project.currency + "/day"],
            ["demandPerKW", "Demand charge", project.currency + "/kW/month"],
            ["taxPercent", "Tax", "%"],
            ["carbonKgPerKWh", "Carbon factor", "kg CO₂e/kWh"],
          ].map(([key, label, unit]) => (
            <Field key={key} label={t(label)} unit={unit}>
              <OptionalLocaleNumberInput
                min={key === "taxPercent" ? 0 : undefined}
                max={key === "taxPercent" ? 100 : undefined}
                step="any"
                value={(tariff[key as keyof typeof tariff] as number) ?? undefined}
                onValueChange={(value) =>
                  setTariff((d) => ({
                    ...d,
                    [key]:
                      value === undefined && key === "carbonKgPerKWh"
                        ? undefined
                        : value,
                  }))
                }
              />
            </Field>
          ))}
        </div>
        <Field label={t("Source reference")}>
          <input
            value={tariff.source}
            onChange={(e) => setTariff({ ...tariff, source: e.target.value })}
          />
        </Field>
        <h3>{t("Time-of-use bands")}</h3>
        <Notice>
          {t("Tariff dates and weekdays use local calendar time. Overlaps are rejected. Choose an explicit base-rate fallback or require complete band coverage. Overview remains a repeated-day estimate; the calendar bill applies actual aligned or rolling demand windows.")}
        </Notice>
        {tariff.bands.map((band, i) => (
          <div className="tariff-row" key={band.id}>
            <input
              aria-label={t("Band name")}
              value={band.name}
              onChange={(e) =>
                setTariff((d) => ({
                  ...d,
                  bands: d.bands.map((b, j) =>
                    j === i ? { ...b, name: e.target.value } : b,
                  ),
                }))
              }
            />
            {(["startHour", "endHour", "importRate", "exportRate"] as const).map((k) => (
              <Field key={k} label={k}>
                <OptionalLocaleNumberInput
                  step="any"
                  min={k === "importRate" || k === "exportRate" ? undefined : 0}
                  max={k === "importRate" || k === "exportRate" ? undefined : 24}
                  value={band[k] ?? undefined}
                  onValueChange={(value) =>
                    setTariff((d) => ({
                      ...d,
                      bands: d.bands.map((b, j) =>
                        j === i ? { ...b, [k]: k === "exportRate" && value === undefined ? undefined : value } : b,
                      ),
                    }))
                  }
                />
              </Field>
            ))}
            {(["effectiveFrom", "effectiveTo"] as const).map((key) => <Field key={key} label={t(key === "effectiveFrom" ? "Effective from" : "Effective to")}><input type="date" value={band[key] ?? ""} onChange={(e) => setTariff((draft) => ({ ...draft, bands: draft.bands.map((row, j) => j === i ? { ...row, [key]: e.target.value || undefined } : row) }))} /></Field>)}
            <Field label={t("Active tariff weekdays")}><select multiple value={band.weekdays?.map(String) ?? ["0", "1", "2", "3", "4", "5", "6"]} onChange={(e) => { const days = [...e.target.selectedOptions].map((option) => Number(option.value)); setTariff((draft) => ({ ...draft, bands: draft.bands.map((row, j) => j === i ? { ...row, weekdays: days } : row) })); }}>{["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, index) => <option key={day} value={index}>{t(day)}</option>)}</select></Field>
            <button
              type="button"
              className="icon-button danger"
              aria-label={t("Delete")}
              onClick={() =>
                setTariff((d) => ({
                  ...d,
                  bands: d.bands.filter((_, j) => j !== i),
                }))
              }
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <h3>{t("Demand and billing-period rules")}</h3>
        <div className="form-grid three"><Field label={t("Demand averaging method")}><select value={demandRule.method} onChange={(e) => setDemand({ method: e.target.value as "aligned" | "rolling" })}><option value="aligned">{t("Aligned intervals")}</option><option value="rolling">{t("Rolling windows")}</option></select></Field><Field label={t("Demand window")} unit="min"><LocaleNumberInput min={1} max={1440} step="1" value={demandRule.windowMinutes} onValueChange={(value) => setDemand({ windowMinutes: value, stepMinutes: Math.min(demandRule.stepMinutes, value) })} /></Field><Field label={t("Rolling step")} unit="min"><LocaleNumberInput min={1} max={demandRule.windowMinutes} step="1" value={demandRule.stepMinutes} onValueChange={(value) => setDemand({ stepMinutes: value })} /></Field><Field label={t("Demand billing period")}><select value={demandRule.period} onChange={(e) => setDemand({ period: e.target.value as "range" | "calendar-month" })}><option value="range">{t("Selected billing period")}</option><option value="calendar-month">{t("Each local calendar month")}</option></select></Field><Field label={t("Alignment origin (optional UTC offset)")}><input value={demandRule.alignmentOrigin ?? ""} onChange={(e) => setDemand({ alignmentOrigin: e.target.value || undefined })} /></Field><Field label={t("Tax basis")}><select value={tariff.taxBasis ?? "net"} onChange={(e) => setTariff({ ...tariff, taxBasis: e.target.value as "net" | "imports-and-fixed" })}><option value="net">{t("Net bill including export credit")}</option><option value="imports-and-fixed">{t("Import, demand and standing charges")}</option></select></Field><Field label={t("Standing-charge day basis")}><select value={tariff.standingBasis ?? "elapsed-24h"} onChange={(e) => setTariff({ ...tariff, standingBasis: e.target.value as "elapsed-24h" | "local-calendar-days" })}><option value="elapsed-24h">{t("Elapsed 24-hour periods")}</option><option value="local-calendar-days">{t("Each local calendar date touched")}</option></select></Field><Field label={t("Tariff coverage")}><select value={tariff.coverage ?? "base-rate"} onChange={(e) => setTariff({ ...tariff, coverage: e.target.value as "base-rate" | "complete-bands" })}><option value="base-rate">{t("Explicit base-rate fallback")}</option><option value="complete-bands">{t("Require complete bands")}</option></select></Field></div>
        <details><summary>{t("Demand-charge time restrictions")}</summary><div className="form-grid"><Field label={t("Eligible demand start hour (optional)")}><OptionalLocaleNumberInput min={0} max={23.999} step="any" value={demandRule.startHour ?? undefined} onValueChange={(value) => setDemand({ startHour: value === undefined ? undefined : value, endHour: value === undefined ? undefined : demandRule.endHour ?? 24 })} /></Field><Field label={t("Eligible demand end hour (optional)")}><OptionalLocaleNumberInput min={0} max={24} step="any" value={demandRule.endHour ?? undefined} onValueChange={(value) => setDemand({ endHour: value === undefined ? undefined : value, startHour: value === undefined ? undefined : demandRule.startHour ?? 0 })} /></Field><Field label={t("Eligible demand weekdays")}><select multiple value={demandRule.weekdays?.map(String) ?? ["0", "1", "2", "3", "4", "5", "6"]} onChange={(e) => setDemand({ weekdays: [...e.target.selectedOptions].map((option) => Number(option.value)) })}>{["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, index) => <option key={day} value={index}>{t(day)}</option>)}</select></Field></div></details>
        <div className="button-row">
          <button
            type="button"
            className="button"
            onClick={() =>
              setTariff((d) => ({
                ...d,
                bands: [
                  ...d.bands,
                  {
                    id: crypto.randomUUID(),
                    name: "",
                    startHour: 0,
                    endHour: 6,
                    importRate: 0,
                  },
                ],
              }))
            }
          >
            <Plus size={16} />
            {t("Add tariff band")}
          </button>
          <button className="button primary">
            <Save size={16} />
            {t("Save")}
          </button>
        </div>
        {error && (
          <p className="error-text" role="alert">
            {t(error)}
          </p>
        )}
      </form>
      <Notice>
        {t("Currency")}: {project.currency}. Changing currency changes the
        denomination only; no exchange rate is assumed.
      </Notice>
    </>
  );
}
export function Scenarios({
  project,
  records,
  onCreate,
  onOpen,
}: {
  project: Project;
  records: ProjectRecord[];
  onCreate: (p: Project) => void;
  onOpen: (p: Project) => void;
}) {
  const t = useT();
  const locale = useContext(LanguageContext);
  const [name, setName] = useState("");
  const base = calculateProject(project);
  const related = records.filter(
    (r) =>
      !r.deleted &&
      r.id !== project.id &&
      (r.project.scenarioOf === (project.scenarioOf || project.id) ||
        r.id === project.scenarioOf),
  );
  return (
    <>
      <form
        className="inline-form panel panel-pad"
        onSubmit={(e) => {
          e.preventDefault();
          const next = duplicateProject(project, name);
          next.scenarioOf = project.scenarioOf || project.id;
          next.baselineRevision = project.revision;
          onCreate(next);
          setName("");
        }}
      >
        <Field label={t("Create scenario")}>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={160}
          />
        </Field>
        <button className="button primary">
          <Plus size={16} />
          {t("Create scenario")}
        </button>
      </form>
      <Notice>
        {t("Baseline")}: {project.name} · {t("Revision")} {project.revision}.
        Each scenario is an independent saved project; open it to edit its
        assumptions.
      </Notice>
      <div className="scenario-grid">
        <section className="panel panel-pad">
          <span className="tag cyan">{t("Baseline")}</span>
          <h3>{project.name}</h3>
          <dl className="detail-list">
            <dt>{t("Installed load")}</dt>
            <dd>{numberFormat(base.installedKW, 3, locale)} kW</dd>
            <dt>{t("Daily energy")}</dt>
            <dd>{numberFormat(base.dailyKWh, 3, locale)} kWh</dd>
            <dt>{t("Daily cost")}</dt>
            <dd>{money(base.dailyCost, project.currency, locale)}</dd>
          </dl>
        </section>
        {related.map((record) => {
          const r = calculateProject(record.project);
          return (
            <section className="panel panel-pad" key={record.id}>
              <span className="tag">
                {t("Revision")} {record.project.revision}
              </span>
              <h3>{record.project.name}</h3>
              <dl className="detail-list">
                <dt>{t("Installed load")}</dt>
                <dd>
                  {numberFormat(r.installedKW, 3, locale)} kW{" "}
                  <small>
                    Δ{" "}
                    {numberFormat(r.installedKW - base.installedKW, 3, locale)}
                  </small>
                </dd>
                <dt>{t("Daily energy")}</dt>
                <dd>
                  {numberFormat(r.dailyKWh, 3, locale)} kWh{" "}
                  <small>
                    Δ {numberFormat(r.dailyKWh - base.dailyKWh, 3, locale)}
                  </small>
                </dd>
                <dt>{t("Daily cost")}</dt>
                <dd>{money(r.dailyCost, record.project.currency, locale)}</dd>
              </dl>
              <button className="button" onClick={() => onOpen(record.project)}>
                {t("Open")}
                <ArrowRight size={15} />
              </button>
            </section>
          );
        })}
      </div>
    </>
  );
}
