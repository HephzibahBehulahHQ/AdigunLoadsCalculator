import { useContext } from "react";
import type {
  CalculationResult,
  Load,
  NormalizedLoad,
  Project,
} from "../domain/types";
import { resolveSchedule, scheduleDuty } from "../engine/calendar";
import { LanguageContext, numberFormat, useT } from "../i18n";
import "./detailViews.css";

export type DetailMode = "simple" | "engineering";

export function DetailModeControl({
  value,
  onChange,
}: {
  value: DetailMode;
  onChange: (value: DetailMode) => void;
}) {
  const t = useT();
  return (
    <label className="detail-mode-control">
      <span>{t("Detail level")}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as DetailMode)}
      >
        <option value="simple">{t("Simple")}</option>
        <option value="engineering">{t("Engineering")}</option>
      </select>
    </label>
  );
}

export function LoadCalculationDetails({
  load,
  result,
  mode,
  inputValid = true,
}: {
  load: Load;
  result?: NormalizedLoad;
  mode: DetailMode;
  inputValid?: boolean;
}) {
  const t = useT();
  const locale = useContext(LanguageContext);
  const f = (value: number) => numberFormat(value, 3, locale);
  const valid = inputValid && result?.valid;
  const activeHours = valid
    ? (load.schedule
        ? resolveSchedule(load).reduce((sum, [a, b]) => sum + b - a, 0)
        : load.hoursPerDay) * scheduleDuty(load)
    : 0;
  const standbyKW = (load.standbyW * load.quantity) / 1000;
  return (
    <section
      className="detail-calculation"
      aria-label={t("Electrical calculation")}
    >
      {valid ? (
        <>
          <dl className="detail-value-grid">
            <div>
              <dt>{t("On-state current")}</dt>
              <dd>{f(result.currentA)} A</dd>
            </div>
            <div>
              <dt>{t("Daily energy")}</dt>
              <dd>{f(result.energyKWh)} kWh</dd>
            </div>
            {mode === "engineering" && (
              <>
                <div>
                  <dt>{t("Installed load")}</dt>
                  <dd>{f(result.installedKW)} kW</dd>
                </div>
                <div>
                  <dt>{t("On-state power")}</dt>
                  <dd>{f(result.operatingKW)} kW</dd>
                </div>
                <div>
                  <dt>{t("Apparent power")}</dt>
                  <dd>{f(result.apparentKVA)} kVA</dd>
                </div>
                <div>
                  <dt>{t("Reactive power")}</dt>
                  <dd>
                    {result.reactiveKvar === null
                      ? t("unavailable")
                      : f(result.reactiveKvar) + " kvar"}
                  </dd>
                </div>
                <div>
                  <dt>{t("Effective operating time")}</dt>
                  <dd>{f(activeHours)} h</dd>
                </div>
              </>
            )}
          </dl>
          {mode === "engineering" ? (
            <div className="detail-equations">
              <p>
                <strong>{t("Current calculation")}</strong>
                <br />I = {f(result.apparentKVA)} × 1000 / (
                {load.connection === "three" ? "√3 × " : ""}
                {f(load.voltage)}) = {f(result.currentA)} A
              </p>
              <p>
                <strong>{t("Energy calculation")}</strong>
                <br />E = {f(result.operatingKW)} × {f(activeHours)} +{" "}
                {f(standbyKW)} × (24 − {f(activeHours)}) = {f(result.energyKWh)}{" "}
                kWh
              </p>
            </div>
          ) : (
            <p className="detail-help">
              {t(
                "Read current as the load while equipment is on. Read daily energy as the estimated use over 24 hours.",
              )}
            </p>
          )}
        </>
      ) : (
        <p className="detail-help">
          {t("Enter valid values to preview the calculation.")}
        </p>
      )}
      {load.schedule && (
        <p className="detail-help">
          {t(
            "Schedule overrides operating hours and energy duty. Edit it in Schedules & Simulation.",
          )}
        </p>
      )}
      {!!result?.issues.length && (
        <ul className="detail-checks" aria-label={t("Issues")}>
          {result.issues.map((issue) => (
            <li key={issue.id}>
              <strong>{t(issue.assessment)}</strong> — {t(issue.message)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ProjectCalculationDetails({
  project,
  result,
}: {
  project: Project;
  result: CalculationResult;
}) {
  const t = useT();
  const locale = useContext(LanguageContext);
  const f = (value: number | null, unit = "") =>
    value === null || !Number.isFinite(value)
      ? t("unavailable")
      : numberFormat(value, 3, locale) + (unit ? " " + unit : "");
  return (
    <section
      className="panel panel-pad engineering-calculation"
      aria-label={t("Assumptions and intermediate values")}
    >
      <h3>{t("Assumptions and intermediate values")}</h3>
      <dl className="detail-value-grid">
        <div>
          <dt>{t("Installed load")}</dt>
          <dd>{f(result.installedKW, "kW")}</dd>
        </div>
        <div>
          <dt>{t("On-state power")}</dt>
          <dd>{f(result.operatingKW, "kW")}</dd>
        </div>
        <div>
          <dt>{t("Design demand")}</dt>
          <dd>{f(result.designKW, "kW")}</dd>
        </div>
        <div>
          <dt>{t("Apparent power")}</dt>
          <dd>{f(result.apparentKVA, "kVA")}</dd>
        </div>
        <div>
          <dt>{t("Reactive power")}</dt>
          <dd>{f(result.reactiveKvar, "kvar")}</dd>
        </div>
        <div>
          <dt>{t("Power factor")}</dt>
          <dd>{f(result.powerFactor)}</dd>
        </div>
        <div>
          <dt>{t("Coincidence factor")}</dt>
          <dd>{f(project.coincidence)}</dd>
        </div>
        <div>
          <dt>{t("Growth allowance")}</dt>
          <dd>{f(project.growthPercent, "%")}</dd>
        </div>
      </dl>
      <p className="detail-equations">{result.trace.formula}</p>
      <ul className="detail-help">
        {result.trace.assumptions.map((assumption) => (
          <li key={assumption}>{t(assumption)}</li>
        ))}
      </ul>
      <p className="small muted">
        {t("Revision")} {result.revision} · {t("Engine")} {result.engineVersion}{" "}
        · {t(result.trace.assessment)}
      </p>
    </section>
  );
}
