import { useContext, useEffect, useRef, useState } from "react";
import type { Project } from "../domain/types";
import type { ComparisonOptions, ScenarioMetrics } from "../engine/comparison";
import { LanguageContext, numberFormat, useT } from "../i18n";
import { downloadFile, makeCSV, safeName } from "../import-export/files";
import { Field, Notice } from "./ui";
const rows = [
  ["installedKW", "Installed load", "kW"],
  ["designKW", "Design demand", "kW"],
  ["phaseL1A", "L1 on-state current", "A"],
  ["phaseL2A", "L2 on-state current", "A"],
  ["phaseL3A", "L3 on-state current", "A"],
  ["intervalPeakKW", "Interval peak demand", "kW"],
  ["startPeakKVA", "Explicit start peak", "kVA"],
  ["loadKWh", "Period load energy", "kWh"],
  ["generationKWh", "Generation", "kWh"],
  ["importKWh", "Grid import", "kWh"],
  ["exportKWh", "Grid export", "kWh"],
  ["storageLossKWh", "Storage losses", "kWh"],
  ["curtailedKWh", "Curtailment", "kWh"],
  ["unservedKWh", "Unserved energy", "kWh"],
  ["criticalUnservedKWh", "Unserved critical energy", "kWh"],
  ["feederLossW", "Feeder loss at range start", "W"],
  ["totalCost", "Period cost", "currency"],
  ["carbonKg", "Import emissions", "kg CO₂e"],
  ["unresolvedChecks", "Unresolved checks", ""],
];
export function PeriodComparison({
  project,
  baseline,
}: {
  project: Project;
  baseline: Project;
}) {
  const t = useT(),
    locale = useContext(LanguageContext),
    today = new Date().toISOString().slice(0, 10);
  const [range, setRange] = useState<ComparisonOptions>({
    start: today + "T00:00:00Z",
    end: new Date(Date.parse(today + "T00:00:00Z") + 86400000).toISOString(),
  });
  const [outage, setOutage] = useState(false),
    [outageStart, setOutageStart] = useState(today + "T18:00:00Z"),
    [outageEnd, setOutageEnd] = useState(today + "T22:00:00Z");
  const [result, setResult] = useState<{
      baseline: ScenarioMetrics;
      current: ScenarioMetrics;
      options: ComparisonOptions;
    }>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const worker = useRef<Worker | null>(null),
    generation = useRef(0),
    key = JSON.stringify([
      project.id,
      project.revision,
      baseline.id,
      baseline.revision,
      range,
      outage,
      outageStart,
      outageEnd,
    ]);
  useEffect(() => {
    generation.current++;
    worker.current?.terminate();
    worker.current = null;
    setBusy(false);
    setResult(undefined);
    return () => {
      generation.current++;
      worker.current?.terminate();
    };
  }, [key]);
  function run() {
    const token = ++generation.current;
    worker.current?.terminate();
    setError("");
    setBusy(true);
    const options = {
      ...range,
      outageRange: outage ? { start: outageStart, end: outageEnd } : undefined,
    };
    const job = new Worker(
      new URL("../workers/comparison.ts", import.meta.url),
      { type: "module" },
    );
    worker.current = job;
    job.onmessage = (event) => {
      if (token !== generation.current) return;
      setBusy(false);
      if (event.data.error) setError(event.data.error);
      else setResult({ ...event.data, options });
      job.terminate();
      worker.current = null;
    };
    job.onerror = () => {
      if (token === generation.current) {
        setBusy(false);
        setError(t("Comparison worker failed. Project inputs are unchanged."));
      }
      job.terminate();
    };
    job.postMessage({ baseline, current: project, options });
  }
  function comparable(id: string) {
    return (
      id !== "totalCost" ||
      result?.baseline.currency === result?.current.currency
    );
  }
  return (
    <section className="panel panel-pad period-comparison">
      <h3>{t("Dated engineering comparison")}</h3>
      <Notice>
        {t(
          "Run both saved input sets over one explicit period. Unavailable evidence stays blank; different currencies are not subtracted. Up to 31 elapsed days per comparison.",
        )}
      </Notice>
      <div className="form-grid">
        <Field label={t("Comparison start (explicit offset)")}>
          <input
            value={range.start}
            onChange={(e) => setRange({ ...range, start: e.target.value })}
          />
        </Field>
        <Field label={t("Comparison end (explicit offset)")}>
          <input
            value={range.end}
            onChange={(e) => setRange({ ...range, end: e.target.value })}
          />
        </Field>
      </div>
      <label className="check-row">
        <input
          type="checkbox"
          checked={outage}
          onChange={(e) => setOutage(e.target.checked)}
        />
        {t("Compare the same grid outage")}
      </label>
      {outage && (
        <div className="form-grid">
          <Field label={t("Outage start (explicit offset)")}>
            <input
              value={outageStart}
              onChange={(e) => setOutageStart(e.target.value)}
            />
          </Field>
          <Field label={t("Outage end (explicit offset)")}>
            <input
              value={outageEnd}
              onChange={(e) => setOutageEnd(e.target.value)}
            />
          </Field>
        </div>
      )}
      <div className="button-row">
        <button
          className="button"
          disabled={busy || !project.loads.length}
          onClick={run}
        >
          {t("Run dated comparison")}
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
      {busy && <p role="status">{t("Running comparison")}</p>}
      {error && <Notice tone="error">{t(error)}</Notice>}
      {result && (
        <>
          <p>
            {result.baseline.name} · {t("Revision")} {result.baseline.revision}{" "}
            → {result.current.name} · {t("Revision")} {result.current.revision}
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("Metric")}</th>
                  <th>{t("Baseline")}</th>
                  <th>{t("Current project")}</th>
                  <th>Δ</th>
                  <th>Δ %</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([id, label, unit]) => {
                  const before = result.baseline.values[id],
                    after = result.current.values[id],
                    valid = before !== null && after !== null && comparable(id);
                  return (
                    <tr key={id}>
                      <td>{t(label)}</td>
                      <td>
                        {before === null
                          ? t("Unavailable")
                          : numberFormat(before, 4, locale)}{" "}
                        {unit === "currency" ? result.baseline.currency : unit}
                      </td>
                      <td>
                        {after === null
                          ? t("Unavailable")
                          : numberFormat(after, 4, locale)}{" "}
                        {unit === "currency" ? result.current.currency : unit}
                      </td>
                      <td>
                        {valid
                          ? numberFormat(after! - before!, 4, locale)
                          : "—"}
                      </td>
                      <td>
                        {valid && before !== 0
                          ? numberFormat(
                              ((after! - before!) / Math.abs(before!)) * 100,
                              2,
                              locale,
                            )
                          : valid && after === 0
                            ? "0"
                            : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="button-row">
            <button
              className="button"
              onClick={() =>
                downloadFile(
                  safeName(project.name) + "-dated-comparison.json",
                  JSON.stringify(result, null, 2),
                  "application/json",
                )
              }
            >
              {t("Export dated comparison JSON")}
            </button>
            <button
              className="button"
              onClick={() =>
                downloadFile(
                  safeName(project.name) + "-dated-comparison.csv",
                  makeCSV([
                    [
                      "metric",
                      "unit",
                      "baseline",
                      "current",
                      "difference",
                      "start",
                      "end",
                    ],
                    ...rows.map(([id, , unit]) => {
                      const a = result.baseline.values[id],
                        b = result.current.values[id];
                      return [
                        id,
                        unit,
                        a ?? "unavailable",
                        b ?? "unavailable",
                        a !== null && b !== null && comparable(id)
                          ? b - a
                          : "unavailable",
                        result.options.start,
                        result.options.end,
                      ];
                    }),
                  ]),
                  "text/csv",
                )
              }
            >
              {t("Export dated comparison CSV")}
            </button>
          </div>
          <details>
            <summary>{t("Methods, assumptions and unresolved checks")}</summary>
            {result.current.assumptions.map((value, index) => (
              <p key={index}>{t(value)}</p>
            ))}
            <h4>{t("Baseline")}</h4>
            {result.baseline.issues.map((value, index) => (
              <p key={index}>{t(value)}</p>
            ))}
            <h4>{t("Current project")}</h4>
            {result.current.issues.map((value, index) => (
              <p key={index}>{t(value)}</p>
            ))}
          </details>
        </>
      )}
    </section>
  );
}
