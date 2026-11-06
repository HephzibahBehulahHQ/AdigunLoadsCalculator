import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Activity, Download, FolderOpen, RefreshCw, Save } from "lucide-react";
import { Field, LineChart, Notice } from "./ui";
import { LanguageContext, numberFormat, useT, type Locale } from "../i18n";
import { useUpdateGuard } from "../pwa/useUpdateGuard";
import { formatEditableNumber, parseLocaleNumber } from "../i18n/numbers";
import {
  measurementDrafts,
  useProjectDraft,
  discardDraftLabel,
  type MeasurementDraft,
} from "./workspaceDrafts";
import {
  parseMeasurementCSV,
  type MeasurementImport,
  type MeasurementOptions,
} from "../import-export/measurements";
import {
  downloadFile,
  makeCSV,
  parseCSV,
  safeName,
} from "../import-export/files";
import {
  exportMeasurementBackup,
  parseMeasurementBackup,
  readMeasurements,
  saveMeasurements,
  type MeasurementPayload,
} from "../storage/measurements";
import "./measurements.css";

const initialOptions: MeasurementOptions = {
  powerUnit: "kW",
  timestampColumn: "",
  powerColumn: "",
  intervalMinutes: 15,
};
function newMeasurementDraft(locale: Locale): MeasurementDraft {
  return {
    rawCSV: "",
    filename: "",
    headers: [],
    options: { ...initialOptions },
    interval: { text: "15", locale },
    reviewed: null,
    savedRevision: null,
    savedAt: "",
    dirty: false,
  };
}
export function Measurements({ projectId }: { projectId: string }) {
  return <ProjectMeasurements key={projectId} projectId={projectId} />;
}
function ProjectMeasurements({ projectId }: { projectId: string }) {
  const t = useT(),
    locale = useContext(LanguageContext),
    operation = useRef(0),
    activeLocale = useRef(locale),
    owner = useRef(projectId);
  activeLocale.current = locale;
  owner.current = projectId;
  const { draft, update, field } = useProjectDraft(
    measurementDrafts,
    projectId,
    () => newMeasurementDraft(locale),
  );
  const [rawCSV] = field("rawCSV"),
    [filename] = field("filename"),
    [headers] = field("headers"),
    [options] = field("options"),
    [resultPayload, setResultPayload] = field("reviewed"),
    [savedRevision, setSavedRevision] = field("savedRevision"),
    [savedAt, setSavedAt] = field("savedAt"),
    [dirty, setDirty] = field("dirty");
  const preview = useMemo(
    () =>
      resultPayload
        ? parseMeasurementCSV(resultPayload.rawCSV, resultPayload.options)
        : null,
    [resultPayload],
  );
  const [reviewErrors, setReviewErrors] = useState<string[]>([]),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [page, setPage] = useState(0),
    [selected, setSelected] = useState<number | undefined>(),
    [reload, setReload] = useState(0);
  const parsedInterval = parseLocaleNumber(
    draft.interval.text,
    draft.interval.locale,
    { min: 0.001, max: 1440, allowScientific: false },
  );
  useUpdateGuard(busy, t("Measurements"));
  const loadPayload = (
    payload: MeasurementPayload,
    parsed: MeasurementImport | null,
  ) => {
    const labels =
      parseCSV(payload.rawCSV.replace(/^\uFEFF/, ""))[0]?.map((value) =>
        value.trim(),
      ) ?? [];
    update((previous) => ({
      ...previous,
      rawCSV: payload.rawCSV,
      filename: payload.filename,
      headers: labels,
      options: { ...payload.options },
      interval: {
        text: formatEditableNumber(
          payload.options.intervalMinutes,
          activeLocale.current,
        ),
        locale: activeLocale.current,
      },
      reviewed: parsed
        ? { ...payload, options: { ...payload.options } }
        : previous.reviewed,
    }));
    setReviewErrors([]);
    setPage(0);
    setSelected(undefined);
  };
  useEffect(() => {
    update((previous) => {
      if (previous.interval.locale === locale) return previous;
      const parsed = parseLocaleNumber(
        previous.interval.text,
        previous.interval.locale,
        { min: 0.001, max: 1440, allowScientific: false },
      );
      return parsed.ok
        ? {
            ...previous,
            interval: {
              text: formatEditableNumber(parsed.canonical, locale),
              locale,
            },
          }
        : previous;
    });
  }, [locale]);
  useEffect(() => {
    const ticket = ++operation.current;
    if (measurementDrafts.get(projectId)?.dirty)
      return () => {
        operation.current++;
      };
    setError("");
    setMessage("");
    setBusy(true);
    readMeasurements(projectId)
      .then((data) => {
        if (
          ticket !== operation.current ||
          owner.current !== projectId ||
          measurementDrafts.get(projectId)?.dirty
        )
          return;
        if (data) {
          loadPayload(data.saved, data.parsed);
          setSavedRevision(data.saved.revision);
          setSavedAt(data.saved.savedAt);
          setDirty(false);
          setMessage("Saved measurements reopened and validated.");
        }
      })
      .catch((cause) => {
        if (ticket === operation.current) setError((cause as Error).message);
      })
      .finally(() => {
        if (ticket === operation.current) setBusy(false);
      });
    return () => {
      operation.current++;
    };
  }, [projectId, reload]);
  const payload = (): MeasurementPayload => {
    if (!parsedInterval.ok) throw new Error(parsedInterval.message);
    return {
      filename,
      rawCSV,
      options: { ...options, intervalMinutes: parsedInterval.value },
    };
  };
  const change = <K extends keyof MeasurementOptions>(
    key: K,
    value: MeasurementOptions[K],
  ) => {
    update((previous) => ({
      ...previous,
      options: { ...previous.options, [key]: value },
      dirty: true,
    }));
    setReviewErrors([]);
    setMessage("Mapping changed. Preview again before saving.");
    setError("");
  };
  function discard() {
    operation.current++;
    update(() => newMeasurementDraft(locale));
    setReviewErrors([]);
    setError("");
    setMessage("");
    setPage(0);
    setSelected(undefined);
    setReload((value) => value + 1);
  }
  async function openFile(file: File | undefined) {
    if (!file) return;
    const backup = file.name.toLowerCase().endsWith(".json");
    if (!backup && !file.name.toLowerCase().endsWith(".csv")) {
      setError(
        "Choose a CSV measurement file or a measurement backup JSON file.",
      );
      return;
    }
    if (file.size > (backup ? 32_000_000 : 5_000_000)) {
      setError(backup ? "Backup limit: 32 MB." : "CSV limit: 5 MB.");
      return;
    }
    const ticket = ++operation.current,
      project = projectId;
    setBusy(true);
    setError("");
    try {
      const text = await file.text();
      if (ticket !== operation.current || owner.current !== project) return;
      if (backup) {
        const data = parseMeasurementBackup(text);
        loadPayload(data.backup, data.parsed);
        setMessage(
          data.backup.sourceProjectId === project
            ? "Backup validated. Save to replace the local measured dataset."
            : "Backup validated for this project. Its original project identifier does not change the current engineering project. Save to keep this copy.",
        );
      } else {
        const labels =
          parseCSV(text.replace(/^\uFEFF/, ""))[0]?.map((value) =>
            value.trim(),
          ) ?? [];
        if (labels.length < 2)
          throw new Error(
            "CSV needs at least a timestamp column and an interval-average power column.",
          );
        loadPayload(
          {
            filename: file.name.slice(0, 240),
            rawCSV: text,
            options: {
              ...initialOptions,
              timestampColumn:
                labels.find((label) => /^timestamp$/i.test(label)) ?? labels[0],
              powerColumn:
                labels.find((label) => /^(power|kw|power_kw)$/i.test(label)) ??
                labels[1],
            },
          },
          null,
        );
        setMessage(
          "File loaded. Confirm columns, unit and interval, then preview.",
        );
      }
      setDirty(true);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      if (ticket === operation.current) setBusy(false);
    }
  }
  function review() {
    setError("");
    try {
      const snapshot = payload(),
        parsed = parseMeasurementCSV(snapshot.rawCSV, snapshot.options);
      setReviewErrors(parsed.errors);
      if (!parsed.errors.length) setResultPayload(snapshot);
      setPage(0);
      setSelected(undefined);
      setMessage(
        parsed.errors.length
          ? "Resolve the shown errors before saving."
          : "Measured intervals validated. Review missing-coverage warnings before saving.",
      );
    } catch (cause) {
      setReviewErrors([(cause as Error).message]);
      setMessage("Resolve the shown errors before saving.");
    }
  }
  async function save() {
    if (!preview || preview.errors.length || !matchesDraft) return;
    const project = projectId,
      ticket = ++operation.current,
      snapshot = payload();
    setBusy(true);
    setError("");
    try {
      const data = await saveMeasurements(project, snapshot, savedRevision);
      measurementDrafts.update(project, (latest) => {
        if (latest.savedRevision !== savedRevision) return latest;
        const interval = parseLocaleNumber(
          latest.interval.text,
          latest.interval.locale,
          { min: 0.001, max: 1440, allowScientific: false },
        );
        const unchanged =
          interval.ok &&
          latest.rawCSV === snapshot.rawCSV &&
          latest.filename === snapshot.filename &&
          JSON.stringify({
            ...latest.options,
            intervalMinutes: interval.value,
          }) === JSON.stringify(snapshot.options);
        return {
          ...latest,
          savedRevision: data.revision,
          savedAt: data.savedAt,
          dirty: unchanged ? false : latest.dirty,
        };
      });
      if (ticket !== operation.current || owner.current !== project) return;
      setMessage(
        "Measured data saved locally, separately from the engineering project.",
      );
    } catch (cause) {
      if (ticket === operation.current) setError((cause as Error).message);
    } finally {
      if (ticket === operation.current) setBusy(false);
    }
  }
  async function reopen() {
    const ticket = ++operation.current,
      project = projectId;
    setBusy(true);
    setError("");
    try {
      const data = await readMeasurements(project);
      if (ticket !== operation.current || owner.current !== project) return;
      if (!data) {
        setMessage("There is no saved measurement dataset for this project.");
        return;
      }
      loadPayload(data.saved, data.parsed);
      setSavedRevision(data.saved.revision);
      setSavedAt(data.saved.savedAt);
      setDirty(false);
      setMessage("Saved measurements reopened and validated.");
    } catch (cause) {
      if (ticket === operation.current) setError((cause as Error).message);
    } finally {
      if (ticket === operation.current) setBusy(false);
    }
  }
  function backup() {
    try {
      downloadFile(
        `${safeName(resultPayload?.filename || filename || "measurements")}.powerlab-measurements.json`,
        exportMeasurementBackup(projectId, resultPayload ?? payload()),
        "application/json",
      );
    } catch (cause) {
      setError((cause as Error).message);
    }
  }
  const valid =
      !!preview && !preview.errors.length && preview.points.length > 0,
    matchesDraft =
      !!resultPayload &&
      parsedInterval.ok &&
      resultPayload.filename === filename &&
      resultPayload.rawCSV === rawCSV &&
      JSON.stringify(resultPayload.options) ===
        JSON.stringify({ ...options, intervalMinutes: parsedInterval.value }),
    pageCount = valid ? Math.ceil(preview!.points.length / 100) : 0,
    visible = valid ? preview!.points.slice(page * 100, (page + 1) * 100) : [];
  const exportCleaned = () => {
    if (!valid) return;
    downloadFile(
      `${safeName(resultPayload?.filename || filename)}-cleaned.csv`,
      makeCSV([
        [
          "timestamp_start_with_offset",
          "interval_minutes",
          "average_power_kW",
          "signed_energy_kWh",
        ],
        ...preview!.points.map((point) => [
          point.timestamp,
          resultPayload?.options.intervalMinutes ?? options.intervalMinutes,
          point.kw,
          point.kWh,
        ]),
      ]),
      "text/csv;charset=utf-8",
    );
  };
  return (
    <section
      className="measurements-panel panel"
      aria-labelledby="measurement-heading"
    >
      <div className="measurement-heading">
        <div>
          <h2 id="measurement-heading">
            <Activity size={20} />
            {t("Measured intervals")}
          </h2>
          <p>
            {t(
              "Import actual interval-average power readings with explicit timestamp offsets.",
            )}
          </p>
        </div>
        <span className="badge">{t("Measured")}</span>
      </div>
      <Notice>
        {t(
          "Save measured data before exporting a Workspace backup. Saved measurements are included with projects and bills; an unsaved preview is not included.",
        )}
      </Notice>
      <div className="measurement-controls">
        <Field
          label={t("Open measured CSV or backup")}
          hint={t("CSV: up to 5 MB. Measurement backup JSON: up to 32 MB.")}
        >
          <input
            type="file"
            accept=".csv,.json,text/csv,application/json"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              void openFile(file);
            }}
          />
        </Field>
        <button
          className="button secondary"
          type="button"
          disabled={busy}
          onClick={() => void reopen()}
        >
          <RefreshCw size={16} />
          {t("Reopen saved measurements")}
        </button>
        <button
          className="button secondary"
          type="button"
          disabled={busy || !dirty}
          onClick={discard}
        >
          {discardDraftLabel[locale]}
        </button>
      </div>
      {busy && <p role="status">{t("Processing measured data…")}</p>}
      {error && <Notice tone="error">{t(error)}</Notice>}
      {message && (
        <p className="measurement-message" role="status">
          {t(message)}
        </p>
      )}
      {!rawCSV && !busy && (
        <div className="measurement-empty">
          <FolderOpen size={28} />
          <p>
            {t(
              "No measured dataset is open. Choose your CSV or a measurement backup.",
            )}
          </p>
        </div>
      )}
      {rawCSV && (
        <>
          <p>
            <strong>{filename}</strong> ·{" "}
            {dirty ? t("Unsaved changes") : t("Saved locally")}
            {savedAt && (
              <>
                {" "}
                · {t("Revision")} {savedRevision} ·{" "}
                <time dateTime={savedAt}>
                  {new Date(savedAt).toLocaleString()}
                </time>
              </>
            )}
          </p>
          <div className="measurement-mapping">
            <Field label={t("Timestamp column")}>
              <select
                disabled={busy}
                value={options.timestampColumn}
                onChange={(event) =>
                  change("timestampColumn", event.target.value)
                }
              >
                {headers.map((header, index) => (
                  <option key={index} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("Interval-average power column")}>
              <select
                disabled={busy}
                value={options.powerColumn}
                onChange={(event) => change("powerColumn", event.target.value)}
              >
                {headers.map((header, index) => (
                  <option key={index} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("Power unit")}>
              <select
                disabled={busy}
                value={options.powerUnit}
                onChange={(event) =>
                  change("powerUnit", event.target.value as "W" | "kW")
                }
              >
                <option value="W">W</option>
                <option value="kW">kW</option>
              </select>
            </Field>
            <Field label={t("Declared elapsed interval")} unit="min">
              <input
                disabled={busy}
                type="text"
                inputMode="decimal"
                value={draft.interval.text}
                aria-invalid={!parsedInterval.ok || undefined}
                onChange={(event) => {
                  update((previous) => ({
                    ...previous,
                    interval: { text: event.target.value, locale },
                    dirty: true,
                  }));
                  setReviewErrors([]);
                  setMessage("Mapping changed. Preview again before saving.");
                  setError("");
                }}
              />
              {!parsedInterval.ok && (
                <small className="error-text" role="alert">
                  {t(parsedInterval.message)}
                </small>
              )}
            </Field>
          </div>
          <p className="measurement-caption">
            {t(
              "Each timestamp marks the start of one interval. Use ISO timestamps with Z or an explicit offset, for example 2026-11-05T09:00:00+01:00. Positive power is import; negative power is export. Missing readings are never treated as zero.",
            )}
          </p>
          <div className="button-row">
            <button
              type="button"
              className="button primary"
              disabled={busy}
              onClick={review}
            >
              <Activity size={16} />
              {t("Preview measured data")}
            </button>
            <button
              type="button"
              className="button"
              disabled={busy || !valid || !matchesDraft}
              onClick={() => void save()}
            >
              <Save size={16} />
              {t("Save measured data")}
            </button>
            <button
              type="button"
              className="button secondary"
              disabled={!valid}
              onClick={backup}
            >
              <Download size={16} />
              {t("Export measurement backup")}
            </button>
            <button
              type="button"
              className="button secondary"
              disabled={!valid}
              onClick={exportCleaned}
            >
              <Download size={16} />
              {t("Export cleaned CSV")}
            </button>
          </div>
          {reviewErrors.length ? (
            <Notice tone="error">
              <strong>{t("Import blocked")}</strong>
              <ul>
                {reviewErrors.map((item, index) => (
                  <li key={index}>{t(item)}</li>
                ))}
              </ul>
            </Notice>
          ) : null}
          {!!preview?.warnings.length && (
            <details
              className="measurement-warnings"
              open={preview.warnings.some((warning) =>
                warning.includes("missing coverage"),
              )}
            >
              <summary>
                {t("Measurement assumptions and coverage warnings")} (
                {preview.warnings.length})
              </summary>
              <ul>
                {preview.warnings.map((item, index) => (
                  <li key={index}>{t(item)}</li>
                ))}
              </ul>
            </details>
          )}
          {valid && (
            <>
              {!matchesDraft && (
                <Notice tone="warning">
                  {t(
                    "Previous validated measurements remain visible. The new draft has not replaced them.",
                  )}
                </Notice>
              )}
              <p className="measurement-caption">
                {t("Validated dataset")}: {resultPayload?.filename}
              </p>
              <div className="measurement-metrics">
                {[
                  [t("Observed import energy"), preview!.importKWh],
                  [t("Observed export energy"), preview!.exportKWh],
                  [t("Observed net energy"), preview!.totalKWh],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <span>{label}</span>
                    <strong>
                      {numberFormat(Number(value), 3, locale)}{" "}
                      <small>kWh</small>
                    </strong>
                  </div>
                ))}
              </div>
              <p className="measurement-caption">
                {t(
                  "Cyan shows import magnitude; violet shows export magnitude. The horizontal axis is recorded interval order. Gaps are not filled. The chart shows this table page only.",
                )}
              </p>
              <LineChart
                points={visible.map((point, index) => ({
                  x: page * 100 + index + 1,
                  y: Math.max(0, point.kw),
                }))}
                secondary={visible.map((point, index) => ({
                  x: page * 100 + index + 1,
                  y: Math.max(0, -point.kw),
                }))}
                label="kW"
                selected={selected}
                onSelect={setSelected}
              />
              {selected !== undefined && visible[selected] && (
                <p role="status">
                  {visible[selected].timestamp}:{" "}
                  {numberFormat(visible[selected].kw, 4, locale)} kW ·{" "}
                  {numberFormat(visible[selected].kWh, 4, locale)} kWh
                </p>
              )}
              <div className="measurement-table">
                <table>
                  <thead>
                    <tr>
                      <th>{t("Record")}</th>
                      <th>{t("Timestamp with offset")}</th>
                      <th>{t("Interval-average power")} (kW)</th>
                      <th>{t("Interval energy")} (kWh)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((point, index) => (
                      <tr
                        key={point.epochMs}
                        className={selected === index ? "selected" : ""}
                      >
                        <td>
                          <button
                            className="text-button"
                            type="button"
                            onClick={() => setSelected(index)}
                            aria-label={`${t("Inspect")} ${point.timestamp}`}
                          >
                            {page * 100 + index + 1}
                          </button>
                        </td>
                        <td>
                          <time>{point.timestamp}</time>
                        </td>
                        <td>{numberFormat(point.kw, 4, locale)}</td>
                        <td>{numberFormat(point.kWh, 4, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="measurement-pagination">
                <button
                  className="button secondary"
                  type="button"
                  disabled={page === 0}
                  onClick={() => {
                    setPage(page - 1);
                    setSelected(undefined);
                  }}
                >
                  {t("Previous")}
                </button>
                <span>
                  {page + 1} / {pageCount} · {preview!.points.length}{" "}
                  {t("recorded intervals")}
                </span>
                <button
                  className="button secondary"
                  type="button"
                  disabled={page + 1 >= pageCount}
                  onClick={() => {
                    setPage(page + 1);
                    setSelected(undefined);
                  }}
                >
                  {t("Next")}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
export default Measurements;
