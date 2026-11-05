import { useContext, useMemo, useRef, useState, useEffect } from "react";
import {
  Zap,
  Plus,
  ArrowUpRight,
  ArrowRight,
  AlertTriangle,
  Check,
  Activity,
  Search,
  Pencil,
  Copy,
  Trash2,
  Download,
  Upload,
  Network,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Maximize,
  RefreshCw,
  FileText,
  Clock3,
} from "lucide-react";
import type {
  Project,
  Load,
  CalculationResult,
  Phase,
  Circuit,
} from "../domain/types";
import { createBoard, createCircuit } from "../domain/project";
import { previewPhaseBalance, applyPhaseBalance } from "../engine/planning";
import { assessCircuit } from "../engine/assessments";
import type { CalendarResult } from "../engine/simulation";
import { downloadFile, makeCSV, safeName } from "../import-export/files";
import { Field, Notice, Modal, Empty, LineChart } from "./ui";
import { LanguageContext, useT, numberFormat, money } from "../i18n";
type Change = (mutator: (draft: Project) => void) => void;
export function Overview({
  project,
  result,
  onAdd,
  onReference,
  onRoute,
}: {
  project: Project;
  result: CalculationResult;
  onAdd: () => void;
  onReference: () => void;
  onRoute: (r: string) => void;
}) {
  const t = useT();
  const locale = useContext(LanguageContext);
  const f = (v: number, n = 2) => numberFormat(v, n, locale);
  const peak = Math.max(...Object.values(result.phaseCurrents), 0);
  return (
    <>
      <div className="overview-banner">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> {t("Local workspace")} /{" "}
            {project.loads.length} {t("Load Schedule")}
          </div>
          <h2>{project.name}</h2>
          <p>{t("All results use entered assumptions.")}</p>
        </div>
        <div className="banner-supply">
          <div className="supply-orbit">
            <Zap size={24} />
          </div>
          <div>
            <strong>
              {project.supply.voltageLN} / {project.supply.voltageLL}{" "}
              <span>V</span>
            </strong>
            <small>
              {project.supply.frequency} Hz · {project.supply.limitA} A ·{" "}
              {project.timezone}
            </small>
          </div>
        </div>
      </div>
      <div className="kpi-grid">
        {[
          {
            label: "Installed load",
            value: f(result.installedKW),
            unit: "kW",
            note: project.loads.length + " " + t("Load Schedule"),
            icon: Zap,
            color: "cyan",
          },
          {
            label: "Design demand",
            value: f(result.designKW),
            unit: "kW",
            note: f(result.apparentKVA) + " kVA",
            icon: Activity,
            color: "violet",
          },
          {
            label: "Daily energy",
            value: f(result.dailyKWh),
            unit: "kWh",
            note: t("24-hour estimate"),
            icon: Clock3,
            color: "blue",
          },
          {
            label: "Daily cost",
            value: money(result.dailyCost, project.currency, locale),
            unit: "",
            note: t("All results use entered assumptions."),
            icon: ArrowUpRight,
            color: "gold",
          },
        ].map((k) => (
          <button
            key={k.label}
            className={"kpi-card " + k.color}
            onClick={() =>
              onRoute(
                k.label === "Daily cost"
                  ? "costs"
                  : k.label === "Daily energy"
                    ? "simulation"
                    : "loads",
              )
            }
          >
            <div className="kpi-top">
              <span>{t(k.label)}</span>
              <k.icon size={17} />
            </div>
            <div className="kpi-value">
              {k.value}
              <small>{k.unit}</small>
            </div>
            <div className="kpi-note">
              {k.note}
              <ArrowUpRight size={13} />
            </div>
          </button>
        ))}
      </div>
      {project.loads.length === 0 ? (
        <div className="panel empty-project">
          <Empty
            icon={<Zap size={32} />}
            heading={t("Build your first power study")}
            actions={
              <>
                <button className="button primary" onClick={onAdd}>
                  <Plus size={17} />
                  {t("Add load")}
                </button>
                <button className="button" onClick={onReference}>
                  {t("Open reference case")}
                  <ArrowRight size={15} />
                </button>
              </>
            }
          >
            {t("Add equipment to calculate real demand, energy and cost.")}
          </Empty>
          <div className="empty-grid-diagram" aria-hidden="true">
            <div className="empty-source">
              <Zap size={19} />
            </div>
            <div className="empty-line" />
            <div className="empty-board">
              <span />
              <span />
              <span />
            </div>
            <div className="empty-line" />
            <div className="empty-loads">
              <i />
              <i />
              <i />
            </div>
          </div>
        </div>
      ) : (
        <div className="overview-grid">
          <section className="panel">
            <div className="panel-head">
              <div>
                <span className="eyebrow">{t("Schedules & Simulation")}</span>
                <h3>{t("Demand profile")}</h3>
              </div>
              <span className="tag cyan">{t("24-hour estimate")}</span>
            </div>
            <div className="chart-stats">
              <strong>
                {f(result.peakKW)} <small>kW</small>
              </strong>
              <span>{t("Peak demand")}</span>
            </div>
            <LineChart
              points={result.profile.map((p) => ({ x: p.hour, y: p.kw }))}
            />
            <div className="chart-footer">
              <span>
                <i className="legend-dot" />
                {t("Calculated")} · kW
              </span>
              <button
                className="text-button"
                onClick={() => onRoute("simulation")}
              >
                {t("Run simulation")}
                <ArrowRight size={14} />
              </button>
            </div>
          </section>
          <section className="panel">
            <div className="panel-head">
              <div>
                <span className="eyebrow">{t("Boards & Circuits")}</span>
                <h3>{t("Phase loading")}</h3>
              </div>
              <Network size={19} className="muted" />
            </div>
            <div className="phase-gauge">
              <svg viewBox="0 0 160 105" aria-hidden="true">
                <path
                  d="M20 85 A60 60 0 0 1 140 85"
                  fill="none"
                  stroke="var(--surface3)"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  d="M20 85 A60 60 0 0 1 140 85"
                  fill="none"
                  stroke={
                    peak > project.supply.limitA ? "var(--red)" : "var(--cyan)"
                  }
                  strokeWidth="12"
                  strokeLinecap="round"
                  pathLength="100"
                  strokeDasharray={`${Math.min(100, (peak / project.supply.limitA) * 100)} 100`}
                />
                <text
                  x="80"
                  y="75"
                  textAnchor="middle"
                  fill="var(--text)"
                  fontSize="24"
                  fontWeight="600"
                >
                  {f(peak, 1)}
                </text>
                <text
                  x="80"
                  y="98"
                  textAnchor="middle"
                  fill="var(--muted)"
                  fontSize="10"
                >
                  A / {project.supply.limitA} A
                </text>
              </svg>
            </div>
            <div className="phase-bars">
              {(["L1", "L2", "L3"] as Phase[]).map((phase, i) => (
                <div key={phase}>
                  <span className={"phase-label p" + i}>{phase}</span>
                  <div className="bar-track">
                    <div
                      className={"bar-fill p" + i}
                      style={{
                        width:
                          Math.min(
                            100,
                            (result.phaseCurrents[phase] /
                              project.supply.limitA) *
                              100,
                          ) + "%",
                      }}
                    />
                  </div>
                  <strong>
                    {f(result.phaseCurrents[phase], 1)} <small>A</small>
                  </strong>
                </div>
              ))}
            </div>
            <div className="chart-footer">
              <span>
                {t("Neutral current")}:{" "}
                {result.neutralA === null ? "—" : f(result.neutralA, 1) + " A"}
              </span>
              <button className="text-button" onClick={() => onRoute("boards")}>
                {t("Phase balance")}
                <ArrowRight size={14} />
              </button>
            </div>
          </section>
        </div>
      )}
      <div className="overview-bottom">
        <section className="panel panel-pad">
          <div className="panel-title">
            <h3>{t("Project health")}</h3>
            <span
              className={
                "tag " +
                (result.issues.some((i) => i.severity === "error")
                  ? "red"
                  : "amber")
              }
            >
              {result.issues.length} {t("Issues")}
            </span>
          </div>
          {result.issues.length ? (
            result.issues.slice(0, 3).map((issue) => (
              <button
                key={issue.id}
                className="issue-row"
                onClick={() => onRoute("history")}
              >
                <AlertTriangle size={16} />
                <span>{issue.message}</span>
                <ArrowUpRight size={14} />
              </button>
            ))
          ) : (
            <div className="issue-row">
              <Check size={16} />
              {t("No unresolved issues")}
            </div>
          )}
          <p className="small muted">
            {t("Engineering estimate, not installation approval.")}
          </p>
        </section>
        <section className="panel quick-actions">
          <span className="eyebrow">{t("Workspace")}</span>
          <h3>{t("Continue")}</h3>
          {[
            ["diagram", "Single-Line Studio", Network],
            ["tools", "Engineering Toolbox", Zap],
            ["reports", "Reports & Estimates", FileText],
          ].map(([r, label, Icon]) => {
            const I = Icon as typeof Zap;
            return (
              <button key={r as string} onClick={() => onRoute(r as string)}>
                <I size={17} />
                {t(label as string)}
                <ArrowUpRight size={15} />
              </button>
            );
          })}
        </section>
      </div>
    </>
  );
}
export function Loads({
  project,
  result,
  onAdd,
  onEdit,
  onDuplicate,
  onDelete,
  onSelect,
  onImport,
  onExport,
  onLibrary,
  selected,
}: {
  project: Project;
  result: CalculationResult;
  onAdd: () => void;
  onEdit: (l: Load) => void;
  onDuplicate: (l: Load) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  onImport: () => void;
  onExport: () => void;
  onLibrary: () => void;
  selected?: string;
}) {
  const t = useT();
  const locale = useContext(LanguageContext);
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState("");
  const [page, setPage] = useState(0);
  const filtered = project.loads.filter(
    (l) =>
      (!phase || l.phase === phase) &&
      (!query ||
        [l.name, l.category, l.source.reference]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase())),
  );
  const visible = filtered.slice(page * 75, (page + 1) * 75);
  return (
    <>
      <div className="page-actions">
        <div className="search-field">
          <Search size={17} />
          <input
            aria-label={t("Search")}
            placeholder={t("Search")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <select
          aria-label={t("Phase")}
          value={phase}
          onChange={(e) => {
            setPhase(e.target.value);
            setPage(0);
          }}
        >
          <option value="">{t("All phases")}</option>
          {["L1", "L2", "L3"].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <span className="spacer" />
        <button className="button" onClick={onImport}>
          <Upload size={16} />
          {t("Import")}
        </button>
        <button
          className="button"
          onClick={onExport}
          disabled={!project.loads.length}
        >
          <Download size={16} />
          {t("Export")}
        </button>
        <button className="button primary" onClick={onAdd}>
          <Plus size={16} />
          {t("Add load")}
        </button>
      </div>
      <div className="panel">
        <div className="panel-head">
          <h3>
            {t("Load Schedule")}{" "}
            <span className="count">{project.loads.length}</span>
          </h3>
          <button className="text-button" onClick={onLibrary}>
            {t("Add from library")}
            <ArrowRight size={15} />
          </button>
        </div>
        {project.loads.length ? (
          <div className="table-wrap">
            <table className="load-table">
              <thead>
                <tr>
                  <th>{t("Name")}</th>
                  <th>{t("Quantity")}</th>
                  <th>{t("Rating")}</th>
                  <th>{t("Connection")}</th>
                  <th>{t("Phase")}</th>
                  <th>{t("Current")}</th>
                  <th>{t("Daily energy")}</th>
                  <th>{t("Provenance")}</th>
                  <th>{t("Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((load) => {
                  const n = result.loads.find((x) => x.id === load.id);
                  return (
                    <tr
                      key={load.id}
                      className={selected === load.id ? "selected-row" : ""}
                    >
                      <td>
                        <button
                          className="load-name"
                          onClick={() => onSelect(load.id)}
                        >
                          <span className="load-icon">
                            <Zap size={15} />
                          </span>
                          <span>
                            <strong>{load.name}</strong>
                            <small>
                              {load.category}
                              {load.critical ? " · " + t("Critical load") : ""}
                            </small>
                          </span>
                        </button>
                      </td>
                      <td>{load.quantity}</td>
                      <td className="numeric">
                        {load.rating}{" "}
                        <span className="muted">
                          {load.entryMode === "amps"
                            ? "A"
                            : load.entryMode === "kva"
                              ? "kVA"
                              : "kW"}
                        </span>
                      </td>
                      <td>
                        <span className="tag">
                          {load.connection === "three"
                            ? "3Φ"
                            : load.connection === "dc"
                              ? "DC"
                              : load.connection === "line-line"
                                ? "L–L"
                                : "1Φ"}{" "}
                          · {load.voltage} V
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            "phase-pill p" +
                            ["L1", "L2", "L3"].indexOf(load.phase)
                          }
                        >
                          {load.connection === "three" ? "L1–L3" : load.phase}
                        </span>
                      </td>
                      <td className="numeric">
                        {n?.valid ? numberFormat(n.currentA, 2, locale) : "—"} A
                      </td>
                      <td className="numeric">
                        {n?.valid ? numberFormat(n.energyKWh, 2, locale) : "—"}{" "}
                        kWh
                      </td>
                      <td>
                        <span className="source-badge">{load.source.kind}</span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-button"
                            aria-label={t("Edit") + " " + load.name}
                            onClick={() => onEdit(load)}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="icon-button"
                            aria-label={t("Duplicate") + " " + load.name}
                            onClick={() => onDuplicate(load)}
                          >
                            <Copy size={15} />
                          </button>
                          <button
                            className="icon-button danger"
                            aria-label={t("Delete") + " " + load.name}
                            onClick={() => onDelete(load.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5}>
                    {t("Installed load")}:{" "}
                    {numberFormat(result.installedKW, 3, locale)} kW
                  </td>
                  <td colSpan={4}>
                    {t("Daily energy")}:{" "}
                    {numberFormat(result.dailyKWh, 3, locale)} kWh
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <Empty
            icon={<Zap size={28} />}
            heading={t("No loads yet")}
            actions={
              <button className="button primary" onClick={onAdd}>
                <Plus size={16} />
                {t("Add load")}
              </button>
            }
          >
            {t("Add equipment to calculate real demand, energy and cost.")}
          </Empty>
        )}
        {filtered.length > 75 && (
          <div className="pagination">
            <button
              className="button"
              disabled={!page}
              onClick={() => setPage((p) => p - 1)}
            >
              ← {t("Back")}
            </button>
            <span>
              {page + 1} / {Math.ceil(filtered.length / 75)}
            </span>
            <button
              className="button"
              disabled={(page + 1) * 75 >= filtered.length}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("Continue")} →
            </button>
          </div>
        )}
      </div>
      <Notice>
        {t("Energy duty")} → kWh. {t("Current")} → {t("Rating")} ×{" "}
        {t("Utilization")}.{" "}
        {t("Engineering estimate, not installation approval.")}
      </Notice>
    </>
  );
}
export function Boards({
  project,
  result,
  change,
  onSelect,
}: {
  project: Project;
  result: CalculationResult;
  change: Change;
  onSelect: (id: string) => void;
}) {
  const t = useT();
  const [newBoard, setNewBoard] = useState("");
  const [newCircuit, setNewCircuit] = useState("");
  const [boardId, setBoardId] = useState(project.boards[0]?.id || "");
  const [balance, setBalance] = useState<ReturnType<
    typeof previewPhaseBalance
  > | null>(null);
  const [cableId, setCableId] = useState<string>();
  const circuit = project.circuits.find((c) => c.id === cableId);
  const [cableDraft, setCableDraft] = useState({
    lengthM: 0,
    resistanceOhmPerKm: 0,
    reactanceOhmPerKm: 0,
    baseAmpacityA: 0,
    voltageDropLimitPercent: 0,
    source: "",
    protectiveA: 0,
    correctionFactors: "",
  });
  const [cableError, setCableError] = useState("");
  return (
    <>
      <div className="page-actions">
        <span className="muted">
          {project.boards.length} {t("Board")} · {project.circuits.length}{" "}
          {t("Circuit")}
        </span>
        <span className="spacer" />
        <button
          className="button"
          onClick={() => setBalance(previewPhaseBalance(project))}
          disabled={!project.loads.length}
        >
          <RefreshCw size={16} />
          {t("Preview balance")}
        </button>
      </div>
      <div className="board-grid">
        {project.boards.map((board) => (
          <section className="panel board-card" key={board.id}>
            <div className="panel-head">
              <div>
                <span className="eyebrow">{t("Board")}</span>
                <h3>{board.name}</h3>
              </div>
              <span className="tag cyan">{board.ratedA} A</span>
            </div>
            <div className="board-ways">
              {Array.from({ length: Math.min(board.ways, 24) }, (_, i) => (
                <i
                  key={i}
                  className={
                    i <
                    project.circuits.filter((c) => c.boardId === board.id)
                      .length
                      ? "occupied"
                      : ""
                  }
                />
              ))}
            </div>
            <div className="panel-pad">
              <div className="form-grid">
                <Field label={t("Supply limit")} unit="A">
                  <input
                    type="number"
                    min="1"
                    value={board.ratedA}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (v > 0)
                        change((p) => {
                          p.boards.find((b) => b.id === board.id)!.ratedA = v;
                        });
                    }}
                  />
                </Field>
                <Field label={t("Ways")}>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={board.ways}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (Number.isInteger(v) && v > 0 && v <= 200)
                        change((p) => {
                          p.boards.find((b) => b.id === board.id)!.ways = v;
                        });
                    }}
                  />
                </Field>
              </div>
              <small className="muted">
                {project.circuits.filter((c) => c.boardId === board.id).length}{" "}
                / {board.ways}
              </small>
            </div>
          </section>
        ))}
      </div>
      <form
        className="inline-form panel panel-pad"
        onSubmit={(e) => {
          e.preventDefault();
          if (newBoard.trim()) {
            change((p) =>
              p.boards.push(createBoard({ name: newBoard.trim() })),
            );
            setNewBoard("");
          }
        }}
      >
        <Field label={t("Add board")}>
          <input
            required
            value={newBoard}
            onChange={(e) => setNewBoard(e.target.value)}
          />
        </Field>
        <button className="button" type="submit">
          <Plus size={16} />
          {t("Add board")}
        </button>
      </form>
      <section className="panel">
        <div className="panel-head">
          <h3>{t("Boards & Circuits")}</h3>
          <Network size={19} />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("Circuit")}</th>
                <th>{t("Board")}</th>
                <th>{t("Phase")}</th>
                <th>{t("Load Schedule")}</th>
                <th>{t("Current")}</th>
                <th>{t("Cables & Protection")}</th>
                <th>{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {project.circuits.map((c) => {
                const loads = project.loads.filter((l) => l.circuitId === c.id);
                const amps = loads.reduce(
                  (sum, l) =>
                    sum +
                    (result.loads.find((n) => n.id === l.id)?.currentA || 0),
                  0,
                );
                return (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.name}</strong>
                    </td>
                    <td>
                      {project.boards.find((b) => b.id === c.boardId)?.name}
                    </td>
                    <td>
                      <select
                        aria-label={c.name + " " + t("Phase")}
                        value={c.phase}
                        disabled={
                          c.locked ||
                          loads.some(
                            (l) => l.locked && l.connection === "single",
                          )
                        }
                        title={
                          loads.some(
                            (l) => l.locked && l.connection === "single",
                          )
                            ? "Unlock the assigned single-phase loads before changing this circuit phase."
                            : undefined
                        }
                        onChange={(e) =>
                          change((p) => {
                            const phase = e.target.value as Phase;
                            if (
                              p.loads.some(
                                (l) =>
                                  l.circuitId === c.id &&
                                  l.locked &&
                                  l.connection === "single" &&
                                  l.phase !== phase,
                              )
                            )
                              throw new Error(
                                "An assigned load has a locked phase.",
                              );
                            p.circuits.find((v) => v.id === c.id)!.phase =
                              phase;
                            p.loads
                              .filter(
                                (l) =>
                                  l.circuitId === c.id &&
                                  l.connection === "single",
                              )
                              .forEach((l) => {
                                l.phase = phase;
                              });
                          })
                        }
                      >
                        {["L1", "L2", "L3"].map((p) => (
                          <option key={p}>{p}</option>
                        ))}
                      </select>
                    </td>
                    <td>{loads.length}</td>
                    <td className="numeric">{amps.toFixed(2)} A</td>
                    <td>
                      <button
                        className="text-button"
                        onClick={() => {
                          setCableId(c.id);
                          setCableDraft({
                            lengthM: c.cable?.lengthM || 0,
                            resistanceOhmPerKm:
                              c.cable?.resistanceOhmPerKm || 0,
                            reactanceOhmPerKm: c.cable?.reactanceOhmPerKm || 0,
                            baseAmpacityA: c.cable?.baseAmpacityA || 0,
                            voltageDropLimitPercent:
                              c.cable?.voltageDropLimitPercent || 0,
                            source: c.cable?.source || "",
                            protectiveA: c.protectiveA || 0,
                            correctionFactors:
                              c.cable?.correctionFactors?.join(", ") || "",
                          });
                          setCableError("");
                        }}
                      >
                        {t("Configure source and evidence")}
                      </button>
                    </td>
                    <td>
                      <div className="row-actions">
                        <label className="small">
                          <input
                            type="checkbox"
                            checked={c.locked}
                            onChange={(e) =>
                              change((p) => {
                                p.circuits.find((v) => v.id === c.id)!.locked =
                                  e.target.checked;
                              })
                            }
                          />
                          {t("Lock phase")}
                        </label>
                        <button
                          className="icon-button danger"
                          aria-label={t("Delete") + " " + c.name}
                          onClick={() => {
                            if (
                              confirm(
                                `${t("Delete")} ${c.name}? ${loads.length} ${t("Load Schedule")} → ${t("Unassigned")}`,
                              )
                            )
                              change((p) => {
                                p.circuits = p.circuits.filter(
                                  (v) => v.id !== c.id,
                                );
                                p.loads
                                  .filter((l) => l.circuitId === c.id)
                                  .forEach((l) => {
                                    delete l.circuitId;
                                    delete l.boardId;
                                  });
                              });
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <form
          className="inline-form panel-pad"
          onSubmit={(e) => {
            e.preventDefault();
            if (newCircuit.trim() && boardId) {
              change((p) =>
                p.circuits.push(
                  createCircuit(boardId, { name: newCircuit.trim() }),
                ),
              );
              setNewCircuit("");
            }
          }}
        >
          <Field label={t("Add circuit")}>
            <input
              required
              value={newCircuit}
              onChange={(e) => setNewCircuit(e.target.value)}
            />
          </Field>
          <Field label={t("Board")}>
            <select
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
            >
              {project.boards.map((b) => (
                <option value={b.id} key={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
          <button className="button primary">
            <Plus size={16} />
            {t("Add circuit")}
          </button>
        </form>
      </section>
      <section className="panel panel-pad">
        <h3>{t("Unassigned")}</h3>
        <div className="assignment-list">
          {project.loads
            .filter((l) => !l.circuitId)
            .map((l) => (
              <div key={l.id}>
                <button className="text-button" onClick={() => onSelect(l.id)}>
                  {l.name}
                </button>
                <select
                  aria-label={l.name + " " + t("Circuit")}
                  value=""
                  onChange={(e) => {
                    const c = project.circuits.find(
                      (c) => c.id === e.target.value,
                    );
                    if (c)
                      change((p) => {
                        const load = p.loads.find((x) => x.id === l.id)!;
                        if (
                          load.locked &&
                          load.connection === "single" &&
                          load.phase !== c.phase
                        )
                          throw new Error(
                            "Unlock this load before assigning a differently phased circuit.",
                          );
                        load.circuitId = c.id;
                        load.boardId = c.boardId;
                        if (load.connection === "single") load.phase = c.phase;
                      });
                  }}
                >
                  <option value="">{t("Circuit")}…</option>
                  {project.circuits.map((c) => (
                    <option
                      value={c.id}
                      key={c.id}
                      disabled={
                        l.locked &&
                        l.connection === "single" &&
                        l.phase !== c.phase
                      }
                    >
                      {c.name}
                      {l.locked &&
                      l.connection === "single" &&
                      l.phase !== c.phase
                        ? " · locked phase"
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
            ))}
        </div>
      </section>
      {balance && (
        <Modal title={t("Preview balance")} onClose={() => setBalance(null)}>
          <div className="modal-body">
            <Notice>{balance.method}</Notice>
            <div className="comparison">
              <div>
                {t("Before")}
                <strong>{balance.beforeImbalance.toFixed(2)}%</strong>
              </div>
              <ArrowRight />
              <div>
                {t("After")}
                <strong>{balance.afterImbalance.toFixed(2)}%</strong>
              </div>
            </div>
            {balance.moves.map((m) => (
              <p key={m.loadId}>
                {project.loads.find((l) => l.id === m.loadId)?.name}: {m.from} →{" "}
                {m.to}
              </p>
            ))}
            {!balance.moves.length && <p>{t("No phase moves required")}</p>}
            {balance.issues.map((i) => (
              <Notice key={i.id} tone="warning">
                {i.message}
              </Notice>
            ))}
          </div>
          <div className="modal-footer">
            <button className="button" onClick={() => setBalance(null)}>
              {t("Cancel")}
            </button>
            <button
              className="button primary"
              disabled={
                !balance.moves.length || balance.revision !== project.revision
              }
              onClick={() => {
                change((p) => {
                  const updated = applyPhaseBalance(p, balance.moves);
                  Object.assign(p, updated);
                });
                setBalance(null);
              }}
            >
              {t("Apply changes")}
            </button>
          </div>
        </Modal>
      )}
      {circuit && (
        <Modal
          title={circuit.name + " · " + t("Cables & Protection")}
          onClose={() => setCableId(undefined)}
          wide
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const factors = cableDraft.correctionFactors.trim()
                ? cableDraft.correctionFactors
                    .trim()
                    .split(/[,;\s]+/)
                    .map(Number)
                : undefined;
              if (
                (cableDraft.baseAmpacityA > 0 && !factors) ||
                factors?.some((v) => !Number.isFinite(v) || v <= 0)
              ) {
                setCableError(
                  "Enter positive correction factors; explicitly enter 1 only when no derating applies.",
                );
                return;
              }
              if (
                Object.entries(cableDraft).some(
                  ([, value]) =>
                    typeof value === "number" &&
                    (!Number.isFinite(value) || value < 0),
                )
              ) {
                setCableError(
                  "Cable and protective-device numbers must be finite and nonnegative.",
                );
                return;
              }
              change((p) => {
                const c = p.circuits.find((c) => c.id === circuit.id)!;
                c.cable = {
                  lengthM: cableDraft.lengthM,
                  resistanceOhmPerKm: cableDraft.resistanceOhmPerKm,
                  reactanceOhmPerKm: cableDraft.reactanceOhmPerKm,
                  baseAmpacityA: cableDraft.baseAmpacityA,
                  voltageDropLimitPercent: cableDraft.voltageDropLimitPercent,
                  source: cableDraft.source,
                  correctionFactors: factors,
                };
                c.protectiveA =
                  cableDraft.protectiveA > 0
                    ? cableDraft.protectiveA
                    : undefined;
              });
              setCableId(undefined);
            }}
          >
            <div className="modal-body">
              <Notice>
                {t("Engineering estimate, not installation approval.")}
              </Notice>
              <div className="form-grid">
                {[
                  ["lengthM", "One-way cable length", "m"],
                  ["resistanceOhmPerKm", "Resistance per conductor", "Ω/km"],
                  ["reactanceOhmPerKm", "Reactance per conductor", "Ω/km"],
                  ["baseAmpacityA", "Sourced ampacity", "A"],
                  [
                    "voltageDropLimitPercent",
                    "Entered voltage-drop criterion",
                    "%",
                  ],
                  ["protectiveA", "Protective device rating", "A"],
                ].map(([k, label, unit]) => (
                  <Field key={k} label={label} unit={unit}>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={cableDraft[k as keyof typeof cableDraft]}
                      onChange={(e) =>
                        setCableDraft((d) => ({
                          ...d,
                          [k]: Number(e.target.value),
                        }))
                      }
                    />
                  </Field>
                ))}
              </div>
              <Field
                label="Correction factors"
                hint="Separate positive factors with commas. Enter 1 explicitly only when no correction applies."
              >
                <input
                  value={cableDraft.correctionFactors}
                  onChange={(e) =>
                    setCableDraft((d) => ({
                      ...d,
                      correctionFactors: e.target.value,
                    }))
                  }
                />
              </Field>
              {cableError && (
                <p className="error-text" role="alert">
                  {cableError}
                </p>
              )}
              <Field label={t("Source reference")}>
                <input
                  value={cableDraft.source}
                  onChange={(e) =>
                    setCableDraft((d) => ({ ...d, source: e.target.value }))
                  }
                />
              </Field>
              <details>
                <summary>{t("Issues")}</summary>
                <pre className="trace-pre">
                  {JSON.stringify(assessCircuit(project, circuit.id), null, 2)}
                </pre>
              </details>
            </div>
            <div className="modal-footer">
              <button
                className="button"
                type="button"
                onClick={() => setCableId(undefined)}
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
export function Diagram({
  project,
  result,
  onSelect,
}: {
  project: Project;
  result: CalculationResult;
  onSelect: (id: string) => void;
}) {
  const t = useT();
  const svg = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [flow, setFlow] = useState(true);
  const branches = project.circuits.length
    ? project.circuits
    : project.boards.map((b) => ({
        id: b.id,
        name: b.name,
        boardId: b.id,
        phase: "L1" as Phase,
      }));
  const height = Math.max(380, branches.length * 140 + 90);
  return (
    <>
      <div className="page-actions">
        <span className="tag cyan">{t("Calculated")} · radial topology</span>
        <span className="spacer" />
        <button
          className="icon-button"
          aria-label={t("Zoom out")}
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
        >
          <ZoomOut size={18} />
        </button>
        <button
          className="icon-button"
          aria-label={t("Zoom in")}
          onClick={() => setZoom((z) => Math.min(2, z + 0.2))}
        >
          <ZoomIn size={18} />
        </button>
        <button className="button" onClick={() => setZoom(1)}>
          <Maximize size={16} />
          {t("Fit view")}
        </button>
        <button
          className={"button " + (flow ? "selected" : "")}
          onClick={() => setFlow((f) => !f)}
        >
          <Activity size={16} />
          {t("Flow animation")}
        </button>
        <button
          className="button"
          onClick={() => {
            if (svg.current)
              downloadFile(
                safeName(project.name) + "-single-line.svg",
                new XMLSerializer().serializeToString(svg.current),
                "image/svg+xml",
              );
          }}
        >
          <Download size={16} />
          {t("Export SVG")}
        </button>
      </div>
      <div className="panel schematic">
        <svg
          ref={svg}
          xmlns="http://www.w3.org/2000/svg"
          width={900 * zoom}
          height={height * zoom}
          viewBox={`0 0 900 ${height}`}
          role="img"
          aria-label={t("Single-Line Studio")}
        >
          <defs>
            <pattern
              id="circuit-grid"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r=".6" fill="#435069" />
            </pattern>
          </defs>
          <rect width="900" height={height} fill="#0b1220" />
          <rect width="900" height={height} fill="url(#circuit-grid)" />
          <g fill="#aab7cc" fontFamily="system-ui" fontSize="11">
            <text x="38" y="28">
              ADIGUNPOWERLAB / {t("Single-Line Studio")}
            </text>
            <text x="38" y={height - 22}>
              {t("Revision")} {project.revision} ·{" "}
              {t("Engineering estimate, not installation approval.")}
            </text>
          </g>
          <g transform={`translate(100 ${height / 2})`}>
            <circle r="33" fill="#12273b" stroke="#22d3ee" strokeWidth="2" />
            <path
              d="M-16 0Q-8 -20 0 0T16 0"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2"
            />
            <text y="55" textAnchor="middle" fill="#e5eaf3" fontSize="12">
              {t("Grid / supply")}
            </text>
            <text y="74" textAnchor="middle" fill="#93a3b9" fontSize="11">
              {project.supply.voltageLN}/{project.supply.voltageLL} V
            </text>
          </g>
          {branches.map((branch, i) => {
            const y =
              80 + (i * (height - 160)) / Math.max(1, branches.length - 1);
            const loads = project.loads.filter(
              (l) =>
                l.circuitId === branch.id ||
                (!l.circuitId && l.boardId === branch.boardId),
            );
            const kw = loads.reduce(
              (s, l) =>
                s + (result.loads.find((n) => n.id === l.id)?.operatingKW || 0),
              0,
            );
            return (
              <g key={branch.id}>
                <path
                  d={`M133 ${height / 2}H220V${y}H365`}
                  fill="none"
                  stroke="#29465b"
                  strokeWidth="2"
                />
                {flow && kw > 0 && (
                  <path
                    className="energy-flow"
                    d={`M133 ${height / 2}H220V${y}H365`}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="2"
                    strokeDasharray="6 12"
                  />
                )}
                <rect
                  x="365"
                  y={y - 30}
                  width="155"
                  height="60"
                  rx="5"
                  fill="#15243a"
                  stroke="#3c6176"
                />
                <path
                  d={`M379 ${y + 10}v-20m0 0 14 9m0 0v11`}
                  stroke="#22d3ee"
                  fill="none"
                  strokeWidth="2"
                />
                <text x="408" y={y - 4} fill="#e5eaf3" fontSize="12">
                  {branch.name.slice(0, 15)}
                </text>
                <text x="408" y={y + 14} fill="#93a3b9" fontSize="10">
                  {branch.phase} · {kw.toFixed(2)} kW
                </text>
                <path d={`M520 ${y}H590`} stroke="#3c6176" strokeWidth="2" />
                {loads.slice(0, 3).map((l, j) => (
                  <g
                    key={l.id}
                    role="button"
                    tabIndex={0}
                    aria-label={l.name}
                    onClick={() => onSelect(l.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") onSelect(l.id);
                    }}
                    className="diagram-node"
                  >
                    <path
                      d={`M590 ${y}V${y + (j - 1) * 34}H630`}
                      stroke="#3c6176"
                      fill="none"
                    />
                    <rect
                      x="630"
                      y={y + (j - 1) * 34 - 14}
                      width="210"
                      height="28"
                      rx="4"
                      fill="#111e31"
                      stroke="#2a4058"
                    />
                    <circle
                      cx="645"
                      cy={y + (j - 1) * 34}
                      r="4"
                      fill="#a78bfa"
                    />
                    <text
                      x="658"
                      y={y + (j - 1) * 34 + 4}
                      fill="#c7d4e4"
                      fontSize="10"
                    >
                      {l.name.slice(0, 25)} · {l.rating}{" "}
                      {l.entryMode === "kva"
                        ? "kVA"
                        : l.entryMode === "amps"
                          ? "A"
                          : "kW"}
                    </text>
                  </g>
                ))}
                {loads.length > 3 && (
                  <text x="630" y={y + 61} fill="#93a3b9" fontSize="10">
                    +{loads.length - 3} {t("Load Schedule")}
                  </text>
                )}
                {!loads.length && (
                  <text x="610" y={y + 4} fill="#93a3b9" fontSize="11">
                    {t("No loads yet")}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <Notice>
        {t("Boards & Circuits")} → {t("Circuit")} → {t("Load Schedule")}.{" "}
        {t("Engineering estimate, not installation approval.")}
      </Notice>
      <div className="panel panel-pad">
        <h3>{t("Unassigned")}</h3>
        <div className="chips">
          {project.loads
            .filter((l) => !l.circuitId && !l.boardId)
            .map((l) => (
              <button
                key={l.id}
                className="chip"
                onClick={() => onSelect(l.id)}
              >
                {l.name}
                <ArrowUpRight size={13} />
              </button>
            ))}
        </div>
      </div>
    </>
  );
}
function midnight(date: string, timezone: string) {
  const target = new Date(date + "T00:00:00Z").getTime();
  let candidate = target;
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      })
        .formatToParts(candidate)
        .map((p) => [p.type, p.value]),
    );
    const shown = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    candidate += target - shown;
  }
  return new Date(candidate).toISOString();
}
export function Simulation({
  project,
  result,
}: {
  project: Project;
  result: CalculationResult;
}) {
  const t = useT();
  const locale = useContext(LanguageContext);
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10));
  const [end, setEnd] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  );
  const [interval, setIntervalValue] = useState<15 | 60>(15);
  const [calendar, setCalendar] = useState<CalendarResult>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cursor, setCursor] = useState(0);
  const [play, setPlay] = useState(false);
  const worker = useRef<Worker | null>(null);
  const requestId = useRef(0);
  const currentRange = useRef({ start, end, interval });
  currentRange.current = { start, end, interval };
  const currentProject = useRef({ id: project.id, revision: project.revision });
  currentProject.current = { id: project.id, revision: project.revision };
  useEffect(
    () => () => {
      requestId.current++;
      worker.current?.terminate();
      worker.current = null;
    },
    [],
  );
  useEffect(() => {
    requestId.current++;
    worker.current?.terminate();
    worker.current = null;
    setBusy(false);
    setCalendar(undefined);
    setPlay(false);
  }, [project.revision, project.id, start, end, interval]);
  useEffect(() => {
    if (!play) return;
    const handle = setInterval(() => setCursor((c) => (c + 1) % 24), 500);
    return () => clearInterval(handle);
  }, [play]);
  function run() {
    setBusy(true);
    setError("");
    worker.current?.terminate();
    const token = ++requestId.current;
    const context = { id: project.id, revision: project.revision };
    const w = new Worker(new URL("../workers/simulation.ts", import.meta.url), {
      type: "module",
    });
    worker.current = w;
    const active = () =>
      requestId.current === token &&
      worker.current === w &&
      currentProject.current.id === context.id &&
      currentProject.current.revision === context.revision &&
      currentRange.current.start === start &&
      currentRange.current.end === end &&
      currentRange.current.interval === interval;
    w.onmessage = (e) => {
      if (!active()) {
        w.terminate();
        return;
      }
      setBusy(false);
      if (e.data.error) setError(e.data.error);
      else if (e.data.result.revision === context.revision)
        setCalendar(e.data.result);
      worker.current = null;
      w.terminate();
    };
    w.onerror = (e) => {
      if (active()) {
        setBusy(false);
        setError(e.message);
        worker.current = null;
      }
      w.terminate();
    };
    try {
      w.postMessage({
        project,
        options: {
          start: midnight(start, project.timezone),
          end: midnight(end, project.timezone),
          intervalMinutes: interval,
        },
      });
    } catch (e) {
      if (active()) {
        setBusy(false);
        setError((e as Error).message);
        worker.current = null;
      }
      w.terminate();
    }
  }
  return (
    <>
      <section className="panel panel-pad">
        <div className="form-grid four">
          <Field label={t("Start date")}>
            <input
              type="date"
              value={start}
              onChange={(e) => {
                setStart(e.target.value);
                setCalendar(undefined);
              }}
            />
          </Field>
          <Field label={t("End date")}>
            <input
              type="date"
              value={end}
              min={start}
              onChange={(e) => {
                setEnd(e.target.value);
                setCalendar(undefined);
              }}
            />
          </Field>
          <Field label={t("Interval")}>
            <select
              value={interval}
              onChange={(e) => {
                setIntervalValue(Number(e.target.value) as 15 | 60);
                setCalendar(undefined);
              }}
            >
              <option value="15">15 min</option>
              <option value="60">60 min</option>
            </select>
          </Field>
          <Field label={t("Timezone")}>
            <input value={project.timezone} readOnly />
          </Field>
        </div>
        <div className="button-row">
          <button
            className="button primary"
            onClick={run}
            disabled={busy || !project.loads.length}
          >
            <Play size={16} />
            {t("Run simulation")}
          </button>
          {busy && (
            <button
              className="button"
              onClick={() => {
                requestId.current++;
                worker.current?.terminate();
                worker.current = null;
                setBusy(false);
              }}
            >
              {t("Cancel")}
            </button>
          )}
          {calendar && calendar.revision === project.revision && (
            <button
              className="button"
              onClick={() =>
                downloadFile(
                  safeName(project.name) + "-simulation.csv",
                  makeCSV([
                    [
                      "timestamp_utc",
                      "local_time",
                      "kW",
                      "kWh",
                      "elapsed_hours",
                      "import_rate",
                    ],
                    ...calendar.points.map((p) => [
                      p.timestamp,
                      p.localTime,
                      p.kw,
                      p.kWh,
                      p.elapsedHours,
                      p.importRate,
                    ]),
                  ]),
                  "text/csv",
                )
              }
            >
              <Download size={16} />
              {t("Export series")}
            </button>
          )}
        </div>
        {busy && (
          <p className="status-message" role="status">
            {t("Run simulation")}…
          </p>
        )}
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
      </section>
      {calendar && calendar.revision === project.revision && (
        <section className="panel">
          <div className="panel-head">
            <h3>
              {t("Calculated")} · {calendar.elapsedHours} h
            </h3>
            <span className="tag cyan">
              {t("Revision")} {calendar.revision}
            </span>
          </div>
          <div className="metric-strip">
            <div>
              <span>{t("Energy")}</span>
              <strong>{numberFormat(calendar.totalKWh, 3, locale)} kWh</strong>
            </div>
            <div>
              <span>{t("Peak demand")}</span>
              <strong>{numberFormat(calendar.peakKW, 3, locale)} kW</strong>
            </div>
            <div>
              <span>{t("Cost")}</span>
              <strong>
                {money(calendar.energyCost, project.currency, locale)}
              </strong>
            </div>
          </div>
          <LineChart
            points={calendar.points
              .filter(
                (_, i) =>
                  i % Math.max(1, Math.floor(calendar.points.length / 192)) ===
                  0,
              )
              .map((p, i) => ({ x: i, y: p.kw }))}
          />
          {calendar.issues.map((i) => (
            <Notice key={i.id} tone="warning">
              {i.message}
            </Notice>
          ))}
        </section>
      )}
      <section className="panel">
        <div className="panel-head">
          <h3>{t("24-hour estimate")}</h3>
          <button
            className="button"
            onClick={() => setPlay((p) => !p)}
            disabled={!project.loads.length}
          >
            {play ? <Pause size={15} /> : <Play size={15} />}{" "}
            {t(play ? "Pause" : "Play")}
          </button>
        </div>
        <LineChart
          points={result.profile.map((p) => ({ x: p.hour, y: p.kw }))}
          selected={cursor}
          onSelect={setCursor}
        />
        <div className="timeline">
          <input
            aria-label={t("Timeline hour")}
            type="range"
            min="0"
            max="23"
            step="1"
            value={cursor}
            onChange={(e) => setCursor(Number(e.target.value))}
          />
          <strong>
            {String(cursor).padStart(2, "0")}:00 ·{" "}
            {numberFormat(result.profile[cursor]?.kw || 0, 3, locale)} kW
          </strong>
        </div>
        <details className="panel-pad">
          <summary>{t("Show details")}</summary>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("Hour")}</th>
                  <th>kW</th>
                  <th>kWh</th>
                </tr>
              </thead>
              <tbody>
                {result.profile.map((p) => (
                  <tr key={p.hour}>
                    <td>{p.hour}:00</td>
                    <td>{numberFormat(p.kw, 3, locale)}</td>
                    <td>{numberFormat(p.kWh, 3, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>
    </>
  );
}
