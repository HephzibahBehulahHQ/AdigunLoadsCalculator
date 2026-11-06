import { useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Load, Phase, Project } from "../domain/types";
import { calculateProject } from "../engine/electrical";
import {
  copyLoadRows,
  duplicateLoadsCommand,
  LOAD_ROW_HEADERS,
  parseLoadRows,
  previewProjectCommand,
  type CommandPreview,
  type LoadPatch,
  type ProjectChange,
  type ProjectCommand,
} from "../commands/projectCommands";
import { downloadFile } from "../import-export/files";
import { CommandReview } from "./CommandReview";
import { Field, Modal, Notice } from "./ui";
import { LanguageContext, useT } from "../i18n";
import { formatEditableNumber, parseLocaleNumber } from "../i18n/numbers";
import "./topology.css";

export function LoadOperations({
  project,
  change,
}: {
  project: Project;
  change: ProjectChange;
}) {
  const t = useT();
  const locale = useContext(LanguageContext);
  const previousLocale = useRef(locale);
  const [ids, setIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [phase, setPhase] = useState("");
  const [board, setBoard] = useState("");
  const [source, setSource] = useState("");
  const [issuesOnly, setIssuesOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [action, setAction] = useState("critical");
  const [field, setField] = useState("rating");
  const [value, setValue] = useState("");
  const [target, setTarget] = useState("");
  const [nextPhase, setNextPhase] = useState<Phase>("L1");
  const [bool, setBool] = useState(true);
  const [sourceKind, setSourceKind] = useState<Load["source"]["kind"]>("user");
  const [startHour, setStartHour] = useState("0");
  const [hours, setHours] = useState("8");
  const [weekdays, setWeekdays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [clearDated, setClearDated] = useState(false);
  const [preview, setPreview] = useState<CommandPreview | null>(null);
  const [transfer, setTransfer] = useState<"copy" | "paste" | null>(null);
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const issues = useMemo(
    () =>
      new Set(
        calculateProject(project)
          .issues.filter(
            (issue) =>
              issue.assessment !== "passed" &&
              issue.assessment !== "not-applicable",
          )
          .flatMap((issue) => (issue.entityId ? [issue.entityId] : [])),
      ),
    [project],
  );
  useEffect(() => {
    setIds([]);
    setPreview(null);
    setTransfer(null);
    setPage(0);
  }, [project.id]);
  useEffect(() => {
    setIds((current) =>
      current.filter((id) => project.loads.some((load) => load.id === id)),
    );
  }, [project.loads]);
  useEffect(() => {
    const oldLocale = previousLocale.current;
    const convert = (input: string) => {
      const parsed = parseLocaleNumber(input, oldLocale);
      return parsed.ok ? formatEditableNumber(parsed.value, locale) : input;
    };
    setStartHour(convert);
    setHours(convert);
    if (action === "field" && !["category", "notes"].includes(field))
      setValue(convert);
    previousLocale.current = locale;
  }, [locale]);
  const filtered = project.loads.filter(
    (load) =>
      (!search ||
        [load.name, load.category, load.source.reference]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())) &&
      (!category || load.category === category) &&
      (!phase ||
        (["three", "line-line", "dc"].includes(phase)
          ? load.connection === phase
          : load.connection === "three" ||
            (load.connection === "line-line"
              ? load.phasePair?.includes(phase as Phase)
              : load.connection === "single" && load.phase === phase))) &&
      (!board ||
        (board === "unassigned"
          ? !load.boardId && !load.circuitId
          : load.boardId === board)) &&
      (!source || load.source.kind === source) &&
      (!issuesOnly ||
        issues.has(load.id) ||
        issues.has(load.circuitId ?? "") ||
        issues.has(load.boardId ?? "")),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / 60));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(currentPage * 60, (currentPage + 1) * 60);
  function review(command: ProjectCommand) {
    setErrors([]);
    setPreview(previewProjectCommand(project, command));
  }
  function bulk() {
    try {
      const number = (
        raw: string,
        options: Parameters<typeof parseLocaleNumber>[2] = {},
      ) => {
        const parsed = parseLocaleNumber(raw, locale, options);
        if (!parsed.ok) throw new Error(parsed.message);
        return parsed.value;
      };
      if (action === "duplicate")
        return review(duplicateLoadsCommand(project, ids));
      if (action === "delete") return review({ kind: "loads.delete", ids });
      if (action === "circuit")
        return review({
          kind: "loads.assign",
          ids,
          circuitId: target || undefined,
        });
      if (action === "phase")
        return review({ kind: "loads.phase", ids, phase: nextPhase });
      const patch: LoadPatch = {};
      if (action === "critical") patch.critical = bool;
      if (action === "lock") patch.locked = bool;
      if (action === "source") {
        if (!value.trim()) throw new Error("Enter a source reference.");
        patch.source = { kind: sourceKind, reference: value.trim() };
      }
      if (action === "schedule") {
        patch.startHour = number(startHour, { min: 0, max: 24 });
        patch.hoursPerDay = number(hours, { min: 0, max: 24 });
        patch.weekdays = weekdays;
        if (clearDated) patch.schedule = undefined;
      }
      if (action === "field") {
        if (!value.trim()) throw new Error("Enter the replacement value.");
        Object.assign(patch, {
          [field]: ["category", "notes"].includes(field)
            ? value
            : number(value, {
                min: 0,
                max: ["pf", "duty", "utilization"].includes(field)
                  ? 1
                  : undefined,
                integer: field === "quantity",
              }),
        });
      }
      review({ kind: "loads.patch", ids, patch });
    } catch (cause) {
      setErrors([(cause as Error).message]);
    }
  }
  return (
    <section className="panel panel-pad load-operations">
      <details>
        <summary>
          <strong>{t("Bulk actions & clipboard")}</strong>{" "}
          <span className="muted">
            {ids.length} {t("selected")}
          </span>
        </summary>
        <div className="form-grid compact-grid">
          <Field label={t("Filter load names")}>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </Field>
          <Field label={t("Category filter")}>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(0);
              }}
            >
              <option value="">{t("All categories")}</option>
              {[...new Set(project.loads.map((load) => load.category))]
                .sort()
                .map((item) => (
                  <option key={item}>{item}</option>
                ))}
            </select>
          </Field>
          <Field label={t("Phase filter")}>
            <select
              value={phase}
              onChange={(e) => {
                setPhase(e.target.value);
                setPage(0);
              }}
            >
              <option value="">{t("All phases")}</option>
              {["L1", "L2", "L3"].map((item) => (
                <option key={item}>{item}</option>
              ))}
              <option value="three">{t("Three-phase")}</option>
              <option value="line-line">{t("Line-line")}</option>
              <option value="dc">DC</option>
            </select>
          </Field>
          <Field label={t("Board filter")}>
            <select
              value={board}
              onChange={(e) => {
                setBoard(e.target.value);
                setPage(0);
              }}
            >
              <option value="">{t("All boards")}</option>
              <option value="unassigned">{t("Unassigned")}</option>
              {project.boards.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("Source status filter")}>
            <select
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setPage(0);
              }}
            >
              <option value="">{t("All sources")}</option>
              {["nameplate", "measured", "datasheet", "estimate", "user"].map(
                (item) => (
                  <option key={item}>{item}</option>
                ),
              )}
            </select>
          </Field>
          <label className="check-row">
            <input
              type="checkbox"
              checked={issuesOnly}
              onChange={(e) => {
                setIssuesOnly(e.target.checked);
                setPage(0);
              }}
            />
            {t("Only loads with unresolved issues")}
          </label>
        </div>
        <div className="button-row">
          <button
            className="button"
            disabled={!filtered.length}
            onClick={() =>
              setIds([...new Set([...ids, ...filtered.map((load) => load.id)])])
            }
          >
            {t("Select filtered loads")} ({filtered.length})
          </button>
          <button
            className="button"
            disabled={!ids.length}
            onClick={() => setIds([])}
          >
            {t("Clear selection")}
          </button>
          <span role="status">
            {ids.length} {t("selected")}
          </span>
        </div>
        <div className="bulk-load-list" aria-label={t("Bulk load selection")}>
          {visible.map((load) => (
            <label key={load.id}>
              <input
                type="checkbox"
                aria-label={`${t("Select load")} ${load.name}`}
                checked={ids.includes(load.id)}
                onChange={(e) =>
                  setIds((current) =>
                    e.target.checked
                      ? [...new Set([...current, load.id])]
                      : current.filter((id) => id !== load.id),
                  )
                }
              />
              <span>
                <strong>{load.name}</strong>
                <small>
                  {load.category} ·{" "}
                  {load.connection === "three" ? "L1–L3" : load.phase} ·{" "}
                  {project.circuits.find(
                    (circuit) => circuit.id === load.circuitId,
                  )?.name ?? t("Unassigned")}
                </small>
              </span>
            </label>
          ))}
        </div>
        {!filtered.length && <p>{t("No loads match these filters.")}</p>}
        {pageCount > 1 && (
          <div className="button-row">
            <button
              className="button"
              disabled={!currentPage}
              onClick={() => setPage(currentPage - 1)}
            >
              {t("Back")}
            </button>
            <span>
              {currentPage + 1} / {pageCount}
            </span>
            <button
              className="button"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage(currentPage + 1)}
            >
              {t("Continue")}
            </button>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            bulk();
          }}
        >
          <div className="form-grid">
            <Field label={t("Bulk action")}>
              <select
                value={action}
                onChange={(e) => {
                  setAction(e.target.value);
                  setErrors([]);
                }}
              >
                <option value="critical">{t("Mark critical")}</option>
                <option value="lock">{t("Lock phase")}</option>
                <option value="field">{t("Set field")}</option>
                <option value="phase">{t("Assign phase")}</option>
                <option value="circuit">{t("Assign circuit")}</option>
                <option value="schedule">{t("Set daily schedule")}</option>
                <option value="source">{t("Attach source")}</option>
                <option value="duplicate">
                  {t("Duplicate selected loads")}
                </option>
                <option value="delete">{t("Delete selected loads")}</option>
              </select>
            </Field>
            {(action === "critical" || action === "lock") && (
              <Field label={t("New state")}>
                <select
                  value={String(bool)}
                  onChange={(e) => setBool(e.target.value === "true")}
                >
                  <option value="true">{t("Yes")}</option>
                  <option value="false">{t("No")}</option>
                </select>
              </Field>
            )}
            {action === "phase" && (
              <Field label={t("Destination phase")}>
                <select
                  value={nextPhase}
                  onChange={(e) => setNextPhase(e.target.value as Phase)}
                >
                  {["L1", "L2", "L3"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
            )}
            {action === "circuit" && (
              <Field label={t("Destination circuit")}>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                >
                  <option value="">{t("Disconnect selected loads")}</option>
                  {project.circuits.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.name} · {item.phase} ·{" "}
                      {project.boards.find((b) => b.id === item.boardId)?.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {action === "field" && (
              <Field label={t("Field to change")}>
                <select
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                >
                  {[
                    ["rating", "Rating in the current entry unit"],
                    ["quantity", "Quantity"],
                    ["pf", "Power factor"],
                    ["duty", "Energy duty"],
                    ["utilization", "Utilization"],
                    ["standbyW", "Standby power (W)"],
                    ["category", "Category"],
                    ["notes", "Notes"],
                  ].map(([key, label]) => (
                    <option key={key} value={key}>
                      {t(label)}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {action === "source" && (
              <Field label={t("Source kind")}>
                <select
                  value={sourceKind}
                  onChange={(e) =>
                    setSourceKind(e.target.value as Load["source"]["kind"])
                  }
                >
                  {[
                    "user",
                    "nameplate",
                    "datasheet",
                    "measured",
                    "estimate",
                  ].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
            )}
            {(action === "field" || action === "source") && (
              <Field
                label={t(
                  action === "source"
                    ? "Source reference"
                    : "Replacement value",
                )}
              >
                <input
                  required
                  inputMode={
                    action === "field" && !["category", "notes"].includes(field)
                      ? "decimal"
                      : undefined
                  }
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  maxLength={10000}
                />
              </Field>
            )}
            {action === "schedule" && (
              <>
                <Field label={t("Daily start hour")} unit="h">
                  <input
                    inputMode="decimal"
                    required
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                  />
                </Field>
                <Field label={t("Daily operating hours")} unit="h">
                  <input
                    inputMode="decimal"
                    required
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                  />
                </Field>
              </>
            )}
          </div>
          {action === "schedule" && (
            <>
              <div className="check-row">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day, index) => (
                    <label key={day}>
                      <input
                        type="checkbox"
                        checked={weekdays.includes(index)}
                        onChange={(e) =>
                          setWeekdays(
                            e.target.checked
                              ? [...weekdays, index].sort()
                              : weekdays.filter((value) => value !== index),
                          )
                        }
                      />
                      {t(day)}
                    </label>
                  ),
                )}
              </div>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={clearDated}
                  onChange={(e) => setClearDated(e.target.checked)}
                />
                {t("Replace advanced dated schedules with this daily schedule")}
              </label>
              <Notice>
                {t(
                  "Without this option, advanced dated rules remain and may take precedence over the daily schedule.",
                )}
              </Notice>
            </>
          )}
          {action === "phase" && (
            <Notice>
              {t(
                "The preview includes every single-phase load on each selected circuit. Locked assignments cannot be moved.",
              )}
            </Notice>
          )}
          {action === "field" && field === "rating" && (
            <Notice>
              {t(
                "Each rating keeps its existing unit and entry mode. Filter compatible loads before applying a shared number.",
              )}
            </Notice>
          )}
          <div className="button-row">
            <button className="button primary" disabled={!ids.length}>
              {t("Preview selected changes")}
            </button>
            <button
              className="button"
              type="button"
              disabled={!ids.length}
              onClick={async () => {
                try {
                  const copied = copyLoadRows(project, ids);
                  setText(copied);
                  setTransfer("copy");
                  setErrors([]);
                  try {
                    await navigator.clipboard.writeText(copied);
                    setMessage(
                      t(
                        "Selected rows copied. A manual copy field is also available.",
                      ),
                    );
                  } catch {
                    setMessage(
                      t(
                        "Clipboard permission is unavailable. Select and copy the text below.",
                      ),
                    );
                  }
                } catch (cause) {
                  setErrors([(cause as Error).message]);
                }
              }}
            >
              {t("Copy selected rows")}
            </button>
            <button
              className="button"
              type="button"
              onClick={() => {
                setTransfer("paste");
                setText("");
                setErrors([]);
                setMessage("");
              }}
            >
              {t("Paste validated rows")}
            </button>
          </div>
        </form>
        {errors.map((error, i) => (
          <p className="error-text" role="alert" key={i}>
            {t(error)}
          </p>
        ))}
      </details>
      {transfer && (
        <Modal
          title={t(transfer === "copy" ? "Copy rows" : "Paste validated rows")}
          onClose={() => setTransfer(null)}
          wide
        >
          <div className="modal-body">
            {message && <Notice>{message}</Notice>}
            <Field label={t("Load row data")}>
              <textarea
                rows={12}
                value={text}
                readOnly={transfer === "copy"}
                onChange={(e) => {
                  setText(e.target.value);
                  setErrors([]);
                }}
                spellCheck={false}
              />
            </Field>
            {transfer === "paste" && (
              <>
                <Notice>
                  {t(
                    "Paste copied AdigunPowerLab JSON or CSV/TSV with the required headers. All rows are validated together; invalid data leaves the working project unchanged. Pasted loads start unassigned.",
                  )}
                </Notice>
                <Field label={t("Load row file")}>
                  <input
                    type="file"
                    accept=".json,.csv,.tsv,.txt"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2_000_000) {
                        setErrors([t("The row file exceeds 2 MB.")]);
                        return;
                      }
                      try {
                        setText(await file.text());
                        setErrors([]);
                      } catch {
                        setErrors([t("The row file could not be read.")]);
                      }
                    }}
                  />
                </Field>
              </>
            )}
            {errors.map((error, i) => (
              <p key={i} className="error-text" role="alert">
                {t(error)}
              </p>
            ))}
          </div>
          <div className="modal-footer">
            <button
              className="button"
              onClick={() =>
                downloadFile(
                  "load-row-headers.tsv",
                  LOAD_ROW_HEADERS.join("\t") + "\n",
                  "text/tab-separated-values",
                )
              }
            >
              {t("Download headers template")}
            </button>
            <button className="button" onClick={() => setTransfer(null)}>
              {t("Close")}
            </button>
            {transfer === "paste" ? (
              <button
                className="button primary"
                onClick={() => {
                  const parsed = parseLoadRows(text);
                  setErrors(parsed.errors);
                  if (parsed.errors.length) return;
                  const next = previewProjectCommand(project, {
                    kind: "loads.insert",
                    loads: parsed.loads,
                  });
                  next.warnings.unshift(...parsed.warnings);
                  setTransfer(null);
                  setPreview(next);
                }}
              >
                {t("Validate pasted rows")}
              </button>
            ) : (
              <button
                className="button"
                onClick={() =>
                  downloadFile(
                    "copied-load-rows.json",
                    text,
                    "application/json",
                  )
                }
              >
                {t("Export copied rows")}
              </button>
            )}
          </div>
        </Modal>
      )}
      {preview && (
        <CommandReview
          project={project}
          preview={preview}
          change={change}
          onClose={() => setPreview(null)}
        />
      )}
    </section>
  );
}
