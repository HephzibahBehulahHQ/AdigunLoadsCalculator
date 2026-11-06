import { useContext, useState } from "react";
import type { Project } from "../domain/types";
import type { ProjectRecord } from "../storage/projects";
import {
  compareProjectInputs,
  createScenario,
  freezeBaseline,
  applyInputDifferences,
  runSensitivity,
} from "../domain/workspace";
import type {
  ProjectDifference,
  SensitivityParameter,
} from "../domain/workspace";
import { calculateProject } from "../engine/electrical";
import { downloadFile, makeCSV, safeName } from "../import-export/files";
import { Field, Notice } from "./ui";
import { LanguageContext, useT, numberFormat, money } from "../i18n";

const displayValue = (value: unknown) =>
  value === undefined
    ? "—"
    : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);
export function DifferenceTable({
  differences,
  selected,
  onSelection,
}: {
  differences: ProjectDifference[];
  selected?: string[];
  onSelection?: (keys: string[]) => void;
}) {
  const t = useT();
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(differences.length / 50));
  const current = Math.min(page, pageCount - 1);
  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {onSelection && <th>{t("Apply")}</th>}
              <th>{t("Object")}</th>
              <th>{t("Field")}</th>
              <th>{t("Before")}</th>
              <th>{t("After")}</th>
            </tr>
          </thead>
          <tbody>
            {differences
              .slice(current * 50, (current + 1) * 50)
              .map((difference) => (
                <tr key={difference.key}>
                  {onSelection && (
                    <td>
                      <input
                        type="checkbox"
                        aria-label={
                          t("Apply") +
                          " " +
                          difference.label +
                          " " +
                          difference.field
                        }
                        checked={selected?.includes(difference.key) || false}
                        onChange={(e) =>
                          onSelection(
                            e.target.checked
                              ? [...(selected || []), difference.key]
                              : (selected || []).filter(
                                  (key) => key !== difference.key,
                                ),
                          )
                        }
                      />
                    </td>
                  )}
                  <td>
                    {difference.label}
                    <small className="muted"> {difference.collection}</small>
                  </td>
                  <td>
                    {difference.field === "$record"
                      ? t(difference.after === undefined ? "Deleted" : "Added")
                      : difference.field}
                  </td>
                  <td>
                    <details>
                      <summary>
                        {displayValue(difference.before).slice(0, 90)}
                      </summary>
                      <pre className="comparison-value">
                        {displayValue(difference.before)}
                      </pre>
                    </details>
                  </td>
                  <td>
                    <details>
                      <summary>
                        {displayValue(difference.after).slice(0, 90)}
                      </summary>
                      <pre className="comparison-value">
                        {displayValue(difference.after)}
                      </pre>
                    </details>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <div className="button-row">
          <button
            className="button"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            {t("Previous")}
          </button>
          <span>
            {current + 1} / {pageCount}
          </span>
          <button
            className="button"
            disabled={current + 1 >= pageCount}
            onClick={() => setPage(current + 1)}
          >
            {t("Next")}
          </button>
        </div>
      )}
    </>
  );
}

export function RevisionComparison({
  project,
  revisions,
  change,
}: {
  project: Project;
  revisions: Project[];
  change?: (mutator: (draft:Project) => void) => boolean | void;
}) {
  const t = useT();
  const [revision, setRevision] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const baseline = revisions.find((item) => String(item.revision) === revision);
  const differences = baseline ? compareProjectInputs(project, baseline) : [];
  return (
    <section className="panel panel-pad">
      <h3>{t("Compare revisions")}</h3>
      <Field label={t("Earlier revision")}>
        <select value={revision} onChange={(e) => {setRevision(e.target.value);setSelected([]);setError("");}}>
          <option value="">{t("Select a revision")}</option>
          {revisions
            .filter((item) => item.revision !== project.revision)
            .map((item) => (
              <option key={item.revision} value={item.revision}>
                {item.revision} · {new Date(item.updatedAt).toLocaleString()}
              </option>
            ))}
        </select>
      </Field>
      {baseline && (
        <>
          <p>
            {differences.length} {t("changed fields")}
          </p>
          <p className="small muted">{t("Compare current inputs with a saved revision. Select fields to restore; dependent objects must be restored together.")}</p>
          <DifferenceTable differences={differences} selected={selected} onSelection={change ? setSelected : undefined}/>
          {change && <button className="button" disabled={!selected.length} onClick={() => {try {const next=applyInputDifferences(project,project.revision,differences,selected);if(change(p=>{for(const key of Object.keys(p))delete (p as unknown as Record<string,unknown>)[key];Object.assign(p,next);})!==false){setSelected([]);setError("");}}catch(e){setError((e as Error).message);}}}>{t("Restore selected fields")}</button>}
          {error && <Notice tone="error">{error}</Notice>}
          <button
            className="button"
            onClick={() =>
              downloadFile(
                safeName(project.name) + "-revision-diff.json",
                JSON.stringify(
                  {
                    projectId: project.id,
                    fromRevision: project.revision,
                    toRevision: baseline.revision,
                    differences,
                  },
                  null,
                  2,
                ),
                "application/json",
              )
            }
          >
            {t("Export comparison")}
          </button>
        </>
      )}
    </section>
  );
}

export function ScenarioWorkspace({
  project,
  records,
  onCreate,
  onOpen,
  change,
  onTrash,
}: {
  project: Project;
  records: ProjectRecord[];
  onCreate: (project: Project) => void;
  onOpen: (project: Project) => void;
  change: (mutator: (draft: Project) => void) => boolean | void;
  onTrash: (id: string) => void;
}) {
  const t = useT(),
    locale = useContext(LanguageContext);
  const [name, setName] = useState("");
  const [baselineId, setBaselineId] = useState("");
  const [comparisonId, setComparisonId] = useState("baseline");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{
    projectId: string;
    revision: number;
    sourceName: string;
    sourceRevision: number;
    differences: ProjectDifference[];
  } | null>(null);
  const [parameter, setParameter] =
    useState<SensitivityParameter>("growthPercent");
  const [values, setValues] = useState("0, 10, 20");
  const [loadId, setLoadId] = useState("");
  const [sweep, setSweep] = useState<ReturnType<typeof runSensitivity> | null>(
    null,
  );
  const base = project.scenarioBaseline?.project || project;
  const calculated = calculateProject(project),
    baseline = calculateProject(base as Project);
  const alternatives = records.filter(
    (item) => !item.deleted && item.id !== project.id,
  );
  const differences = compareProjectInputs(base as Project, project);
  function compare() {
    try {
      const source =
        comparisonId === "baseline"
          ? base
          : alternatives.find((item) => item.id === comparisonId)?.project;
      if (!source) throw new Error("Select a comparison project.");
      setPreview({
        projectId: project.id,
        revision: project.revision,
        sourceName: source.name,
        sourceRevision: source.revision,
        differences: compareProjectInputs(project, source as Project),
      });
      setSelected([]);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="scenario-workspace">
      {error && <Notice tone="error">{t(error)}</Notice>}
      <form
        className="inline-form panel panel-pad"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            onCreate(createScenario(project, name));
            setName("");
          } catch (error) {
            setError((error as Error).message);
          }
        }}
      >
        <Field label={t("Create scenario")}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={160}
          />
        </Field>
        <button className="button primary">{t("Create scenario")}</button>
      </form>
      <section className="panel panel-pad">
        <div className="panel-title">
          <h3>{t("Frozen baseline")}</h3>
          <span className="tag cyan">
            {base.name} · {t("Revision")} {base.revision}
          </span>
        </div>
        <Notice>
          {t(
            project.scenarioBaseline
              ? "The baseline is a saved input snapshot. Later edits to its source project do not change this comparison."
              : "Capture a baseline to preserve the current assumptions before editing.",
          )}
        </Notice>
        <div className="inline-form">
          <Field label={t("Baseline source")}>
            <select
              value={baselineId}
              onChange={(e) => setBaselineId(e.target.value)}
            >
              <option value="">{t("Current project")}</option>
              {alternatives.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.project.name}
                </option>
              ))}
            </select>
          </Field>
          <button
            className="button"
            onClick={() =>
              change((draft) => {
                const source = baselineId
                  ? alternatives.find((item) => item.id === baselineId)?.project
                  : draft;
                if (!source) throw new Error("Baseline source is unavailable.");
                draft.scenarioBaseline = freezeBaseline(source);
                draft.baselineId = source.id;
                draft.baselineRevision = source.revision;
              })
            }
          >
            {t("Set baseline")}
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("Metric")}</th>
                <th>{t("Baseline")}</th>
                <th>{t("Current project")}</th>
                <th>Δ</th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "Installed load",
                  baseline.installedKW,
                  calculated.installedKW,
                  "kW",
                ],
                ["Design demand", baseline.designKW, calculated.designKW, "kW"],
                ["Daily energy", baseline.dailyKWh, calculated.dailyKWh, "kWh"],
                [
                  "Daily cost",
                  baseline.dailyCost,
                  calculated.dailyCost,
                  project.currency,
                ],
              ].map(([label, b, c, unit]) => (
                <tr key={String(label)}>
                  <td>{t(String(label))}</td>
                  <td>
                    {numberFormat(Number(b), 3, locale)} {unit}
                  </td>
                  <td>
                    {numberFormat(Number(c), 3, locale)} {unit}
                  </td>
                  <td>
                    {numberFormat(Number(c) - Number(b), 3, locale)} {unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <details>
          <summary>
            {t("Changes from baseline")} ({differences.length})
          </summary>
          <DifferenceTable differences={differences} />
        </details>
        <button
          className="button"
          onClick={() =>
            downloadFile(
              safeName(project.name) + "-baseline-comparison.json",
              JSON.stringify(
                {
                  baseline: project.scenarioBaseline,
                  currentProjectId: project.id,
                  currentRevision: project.revision,
                  differences,
                },
                null,
                2,
              ),
              "application/json",
            )
          }
        >
          {t("Export comparison")}
        </button>
      </section>
      <section className="panel panel-pad">
        <h3>{t("Preview selected scenario changes")}</h3>
        <div className="inline-form">
          <Field label={t("Compare against")}>
            <select
              value={comparisonId}
              onChange={(e) => {
                setComparisonId(e.target.value);
                setPreview(null);
              }}
            >
              <option value="baseline">{t("Frozen baseline")}</option>
              {alternatives.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.project.name} · r{item.project.revision}
                </option>
              ))}
            </select>
          </Field>
          <button className="button" onClick={compare}>
            {t("Preview changes")}
          </button>
        </div>
        {preview && (
          <>
            <p>
              {preview.sourceName} · r{preview.sourceRevision} → {project.name}{" "}
              · r{preview.revision}
            </p>
            <Notice>
              {t(
                "Select the fields to apply. Dependent objects must remain valid; current work can be restored with Undo.",
              )}
            </Notice>
            <div className="button-row">
              <button
                className="button"
                onClick={() =>
                  setSelected(preview.differences.map((item) => item.key))
                }
              >
                {t("Select all")}
              </button>
              <button className="button" onClick={() => setSelected([])}>
                {t("Clear selection")}
              </button>
            </div>
            <DifferenceTable
              differences={preview.differences}
              selected={selected}
              onSelection={setSelected}
            />
            <button
              className="button primary"
              disabled={
                !selected.length ||
                project.id !== preview.projectId ||
                project.revision !== preview.revision
              }
              onClick={() => {
                try {
                  const applied = change((draft) => {
                    if (draft.id !== preview.projectId)
                      throw new Error(
                        "Project changed. Refresh the comparison.",
                      );
                    Object.assign(
                      draft,
                      applyInputDifferences(
                        draft,
                        preview.revision,
                        preview.differences,
                        selected,
                      ),
                    );
                  });
                  if (applied !== false) {
                    setPreview(null);
                    setSelected([]);
                  }
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              {t("Apply selected changes")} ({selected.length})
            </button>
            {project.revision !== preview.revision && (
              <Notice tone="warning">
                {t(
                  "Project changed. Refresh the comparison before applying changes.",
                )}
              </Notice>
            )}
          </>
        )}
      </section>
      <section className="panel panel-pad">
        <h3>{t("Sensitivity study")}</h3>
        <Notice>
          {t(
            "Each sweep changes one declared input in an isolated copy. No values are applied to the project.",
          )}
        </Notice>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            try {
              setSweep(
                runSensitivity(
                  project,
                  parameter,
                  values
                    .split(/[;,\s]+/)
                    .filter(Boolean)
                    .map(Number),
                  loadId,
                ),
              );
              setError("");
            } catch (e) {
              setSweep(null);
              setError((e as Error).message);
            }
          }}
        >
          <div className="form-grid">
            <Field label={t("Parameter")}>
              <select
                value={parameter}
                onChange={(e) => {
                  setParameter(e.target.value as SensitivityParameter);
                  setSweep(null);
                  setValues(
                    e.target.value === "coincidence" ||
                      e.target.value === "duty"
                      ? "0.5, 0.75, 1"
                      : "0, 10, 20",
                  );
                }}
              >
                <option value="growthPercent">
                  {t("Growth allowance")} (%)
                </option>
                <option value="coincidence">{t("Coincidence factor")}</option>
                <option value="importRate">{t("Import rate")}</option>
                <option value="duty">{t("Energy duty")}</option>
              </select>
            </Field>
            <Field label={t("Sweep values")}>
              <input
                required
                value={values}
                onChange={(e) => setValues(e.target.value)}
              />
            </Field>
            {parameter === "duty" && (
              <Field label={t("Select a load")}>
                <select
                  required
                  value={loadId}
                  onChange={(e) => setLoadId(e.target.value)}
                >
                  <option value="">{t("Select a load")}</option>
                  {project.loads.map((load) => (
                    <option key={load.id} value={load.id}>
                      {load.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>
          <button className="button">{t("Run sensitivity")}</button>
        </form>
        {sweep && sweep[0]?.revision === project.revision && (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t("Input")}</th>
                    <th>{t("Design demand")} (kW)</th>
                    <th>{t("Daily energy")} (kWh)</th>
                    <th>{t("Daily cost")}</th>
                    <th>{t("Issues")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sweep.map((row, index) => (
                    <tr key={index}>
                      <td>{row.value}</td>
                      <td>{numberFormat(row.designKW, 3, locale)}</td>
                      <td>{numberFormat(row.dailyKWh, 3, locale)}</td>
                      <td>{money(row.dailyCost, project.currency, locale)}</td>
                      <td>{row.issues}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              className="button"
              onClick={() =>
                downloadFile(
                  safeName(project.name) + "-sensitivity.csv",
                  makeCSV([
                    [
                      parameter,
                      "design_kW",
                      "daily_kWh",
                      "daily_cost",
                      "issues",
                    ],
                    ...sweep.map((row) => [
                      row.value,
                      row.designKW,
                      row.dailyKWh,
                      row.dailyCost,
                      row.issues,
                    ]),
                  ]),
                  "text/csv",
                )
              }
            >
              {t("Export data")}
            </button>
          </>
        )}
      </section>
      <div className="scenario-grid">
        {alternatives.map((record) => (
          <section className="panel panel-pad" key={record.id}>
            <h3>{record.project.name}</h3>
            <p>
              {t("Revision")} {record.project.revision} ·{" "}
              {record.project.loads.length} {t("loads")}
            </p>
            <div className="button-row">
              <button className="button" onClick={() => onOpen(record.project)}>
                {t("Open")}
              </button>
              <button
                className="button"
                onClick={() => {
                  setComparisonId(record.id);
                  setPreview(null);
                }}
              >
                {t("Compare")}
              </button>
              <button
                className="button danger"
                onClick={() => {
                  if (
                    confirm(
                      t("Move to trash") + " " + record.project.name + "?",
                    )
                  )
                    onTrash(record.id);
                }}
              >
                {t("Move to trash")}
              </button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
