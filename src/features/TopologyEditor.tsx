import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { createBoard, createCircuit, newId } from "../domain/project";
import type {
  CalculationResult,
  Cable,
  DiagramSettings,
  Phase,
  Project,
} from "../domain/types";
import {
  applyProjectCommand,
  previewProjectCommand,
  type CommandPreview,
  type ProjectChange,
  type ProjectCommand,
} from "../commands/projectCommands";
import {
  autoLayoutPositions,
  buildDiagramSnapshot,
  diagramEdgePath,
  diagramSVG,
  getDiagramSettings,
  type DiagramNode,
} from "../commands/diagram";
import { downloadFile, safeName } from "../import-export/files";
import { Field, Modal, Notice } from "./ui";
import { CommandReview } from "./CommandReview";
import { useT } from "../i18n";
import "./topology.css";

type EditorProps = {
  project: Project;
  result: CalculationResult;
  onSelect: (id: string) => void;
  change: ProjectChange;
  selectedId?: string;
};
type Point = { x: number; y: number };

export function TopologyEditor({
  project,
  result,
  onSelect,
  change,
  selectedId,
}: EditorProps) {
  const t = useT();
  const [selected, setSelected] = useState(`source:${project.id}`);
  const [isolate, setIsolate] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [flow, setFlow] = useState(false);
  const [panMode, setPanMode] = useState(false);
  const [temporary, setTemporary] = useState<Record<string, Point>>({});
  const [preview, setPreview] = useState<CommandPreview | null>(null);
  const [modal, setModal] = useState<"board" | "circuit" | "note" | null>(null);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{
    kind: "node" | "pan";
    id?: string;
    start: Point;
    original: Point;
    last: Point;
    moved: boolean;
  } | null>(null);
  const settings = getDiagramSettings(project);
  const snapshot = useMemo(
    () =>
      buildDiagramSnapshot(project, result, {
        isolateBoardId: isolate || undefined,
        positions: temporary,
      }),
    [project, result, isolate, temporary],
  );
  const allNodes = useMemo(
    () => buildDiagramSnapshot(project, result).nodes,
    [project, result],
  );
  const node = allNodes.find((item) => item.id === selected);
  useEffect(() => {
    setSelected(`source:${project.id}`);
    setIsolate("");
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setTemporary({});
    setPreview(null);
  }, [project.id]);
  useEffect(() => {
    if (selectedId) {
      const found = allNodes.find((item) => item.objectId === selectedId);
      if (found) setSelected(found.id);
    }
  }, [selectedId, allNodes]);
  function select(id: string) {
    setSelected(id);
    const next = allNodes.find((item) => item.id === id);
    if (next) onSelect(next.objectId);
  }
  function review(command: ProjectCommand) {
    setError("");
    setPreview(previewProjectCommand(project, command));
  }
  function saveView(diagram: DiagramSettings) {
    try {
      const next = previewProjectCommand(project, {
        kind: "diagram.set",
        diagram,
      });
      if (next.errors.length) throw new Error(next.errors.join(" "));
      if (next.changes.length)
        change((draft) =>
          Object.assign(draft, applyProjectCommand(draft, next)),
        );
      setError("");
    } catch (cause) {
      setError((cause as Error).message);
    }
  }
  function point(event: ReactPointerEvent): Point {
    const transform = svg.current?.getScreenCTM();
    if (!transform) return { x: event.clientX, y: event.clientY };
    const transformed = new DOMPoint(
      event.clientX,
      event.clientY,
    ).matrixTransform(transform.inverse());
    return { x: transformed.x, y: transformed.y };
  }
  function down(event: ReactPointerEvent<SVGElement>, item?: DiagramNode) {
    if (event.button !== 0) return;
    event.stopPropagation();
    if (item) select(item.id);
    const original = item
      ? { x: item.x - snapshot.offsetX, y: item.y - snapshot.offsetY }
      : pan;
    const kind = item && !panMode ? "node" : "pan";
    drag.current = {
      kind,
      id: item?.id,
      start:
        kind === "node" ? point(event) : { x: event.clientX, y: event.clientY },
      original,
      last: original,
      moved: false,
    };
    if (kind === "pan") drag.current.original = { ...pan };
    svg.current?.setPointerCapture(event.pointerId);
  }
  function move(event: ReactPointerEvent<SVGSVGElement>) {
    const active = drag.current;
    if (!active) return;
    if (active.kind === "node") {
      const p = point(event),
        x = Math.round(active.original.x + p.x - active.start.x),
        y = Math.round(active.original.y + p.y - active.start.y);
      active.last = {
        x: Math.max(-100000, Math.min(100000, x)),
        y: Math.max(-100000, Math.min(100000, y)),
      };
      active.moved ||=
        Math.abs(p.x - active.start.x) + Math.abs(p.y - active.start.y) > 2;
      setTemporary({ [active.id!]: active.last });
    } else {
      const rect = svg.current!.getBoundingClientRect();
      const scale = Math.max(
        snapshot.width / zoom / rect.width,
        snapshot.height / zoom / rect.height,
      );
      setPan({
        x: active.original.x - (event.clientX - active.start.x) * scale,
        y: active.original.y - (event.clientY - active.start.y) * scale,
      });
    }
  }
  function up() {
    const active = drag.current;
    drag.current = null;
    if (active?.kind === "node" && active.moved && active.id)
      saveView({
        ...getDiagramSettings(project),
        positions: {
          ...getDiagramSettings(project).positions,
          [active.id]: active.last,
        },
      });
    setTemporary({});
  }
  const selectOptions = (
    <>
      {allNodes.map((item) => (
        <option key={item.id} value={item.id}>
          {item.kind} · {item.name}
        </option>
      ))}
    </>
  );
  return (
    <>
      <div className="topology-toolbar">
        <button className="button" onClick={() => setModal("board")}>
          {t("Add board")}
        </button>
        <button
          className="button"
          disabled={!project.boards.length}
          title={!project.boards.length ? t("Add a board first") : undefined}
          onClick={() => setModal("circuit")}
        >
          {t("Add circuit")}
        </button>
        <button className="button" onClick={() => setModal("note")}>
          {t("Add note")}
        </button>
        <button
          className={"button " + (panMode ? "selected" : "")}
          aria-pressed={panMode}
          onClick={() => setPanMode(!panMode)}
        >
          {t("Pan")}
        </button>
        <button
          className="button"
          aria-label={t("Zoom in")}
          onClick={() => setZoom((value) => Math.min(64, value * 1.4))}
        >
          +
        </button>
        <button
          className="button"
          aria-label={t("Zoom out")}
          onClick={() => setZoom((value) => Math.max(0.2, value / 1.4))}
        >
          −
        </button>
        <button
          className="button"
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
        >
          {t("Fit view")}
        </button>
        <button
          className="button"
          onClick={() =>
            saveView({ ...settings, positions: autoLayoutPositions(project) })
          }
        >
          {t("Auto-layout")}
        </button>
        <button
          className={"button " + (flow ? "selected" : "")}
          aria-pressed={flow}
          onClick={() => setFlow(!flow)}
        >
          {t("Flow animation")}
        </button>
        <button
          className="button"
          onClick={() =>
            downloadFile(
              safeName(project.name) + "-single-line.svg",
              diagramSVG(snapshot),
              "image/svg+xml",
            )
          }
        >
          {t("Export SVG")}
        </button>
        <button
          className="button"
          disabled={exporting}
          onClick={async () => {
            setExporting(true);
            setError("");
            const frozen = structuredClone(snapshot);
            try {
              const { createDiagramPdf } =
                await import("../import-export/diagramPdf");
              const blob = await createDiagramPdf(frozen);
              downloadFile(
                safeName(frozen.projectName) + "-single-line.pdf",
                blob,
              );
            } catch (cause) {
              setError((cause as Error).message);
            } finally {
              setExporting(false);
            }
          }}
        >
          {t(exporting ? "Generating PDF…" : "Export diagram PDF")}
        </button>
      </div>
      <div className="form-grid">
        <Field label={t("Select diagram object")}>
          <select
            value={node?.id ?? ""}
            onChange={(e) => select(e.target.value)}
          >
            {selectOptions}
          </select>
        </Field>
        <Field label={t("Isolate board")}>
          <select
            value={isolate}
            onChange={(e) => {
              setIsolate(e.target.value);
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
          >
            <option value="">{t("All boards")}</option>
            {project.boards.map((board) => (
              <option value={board.id} key={board.id}>
                {board.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("Diagram page size")}>
          <select
            value={settings.pageSize}
            onChange={(e) =>
              saveView({
                ...settings,
                pageSize: e.target.value as DiagramSettings["pageSize"],
              })
            }
          >
            <option value="a4">A4</option>
            <option value="a3">A3</option>
          </select>
        </Field>
        <Field label={t("Diagram orientation")}>
          <select
            value={settings.orientation}
            onChange={(e) =>
              saveView({
                ...settings,
                orientation: e.target.value as DiagramSettings["orientation"],
              })
            }
          >
            <option value="landscape">{t("Landscape")}</option>
            <option value="portrait">{t("Portrait")}</option>
          </select>
        </Field>
      </div>
      <div className="check-row">
        <label>
          <input
            type="checkbox"
            checked={settings.showLabels}
            onChange={(e) =>
              saveView({ ...settings, showLabels: e.target.checked })
            }
          />
          {t("Show connection labels")}
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.showRatings}
            onChange={(e) =>
              saveView({ ...settings, showRatings: e.target.checked })
            }
          />
          {t("Show component ratings")}
        </label>
      </div>
      <div className="topology-grid">
        <div>
          <div className="topology-viewport">
            <svg
              ref={svg}
              viewBox={`${pan.x} ${pan.y} ${snapshot.width / zoom} ${snapshot.height / zoom}`}
              role="group"
              aria-label={t("Editable single-line diagram")}
              onPointerDown={(e) => down(e)}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={() => {
                drag.current = null;
                setTemporary({});
              }}
            >
              <rect
                x={pan.x - snapshot.width}
                y={pan.y - snapshot.height}
                width={snapshot.width * 4}
                height={snapshot.height * 4}
                fill="#09111e"
              />
              {snapshot.edges.map((edge) => {
                const to = snapshot.nodes.find((item) => item.id === edge.to)!;
                return (
                  <g key={`${edge.from}-${edge.to}`}>
                    <path
                      d={diagramEdgePath(snapshot, edge)}
                      stroke="#44657b"
                      strokeWidth="2"
                      fill="none"
                    />
                    {flow && (
                      <path
                        className="energy-flow"
                        d={diagramEdgePath(snapshot, edge)}
                        stroke="#22d3ee"
                        strokeWidth="2"
                        strokeDasharray="7 13"
                        fill="none"
                      />
                    )}
                    {settings.showLabels && (
                      <text
                        x={to.x - 8}
                        y={to.y - 9}
                        textAnchor="end"
                        fill="#93a3b9"
                        fontSize="10"
                      >
                        {edge.label}
                      </text>
                    )}
                  </g>
                );
              })}
              {snapshot.nodes.map((item) => (
                <g
                  key={item.id}
                  data-node-id={item.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${item.planning ? "Planning source" : item.kind}: ${item.name}`}
                  aria-pressed={selected === item.id}
                  className={
                    "topology-node " +
                    (selected === item.id ? "is-selected" : "")
                  }
                  transform={`translate(${item.x} ${item.y})`}
                  onPointerDown={(e) => down(e, item)}
                  onClick={() => select(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      select(item.id);
                    }
                    const deltas: Record<string, Point> = {
                      ArrowLeft: { x: -10, y: 0 },
                      ArrowRight: { x: 10, y: 0 },
                      ArrowUp: { x: 0, y: -10 },
                      ArrowDown: { x: 0, y: 10 },
                    };
                    if (deltas[e.key]) {
                      e.preventDefault();
                      const delta = deltas[e.key];
                      saveView({
                        ...settings,
                        positions: {
                          ...settings.positions,
                          [item.id]: {
                            x: item.x - snapshot.offsetX + delta.x,
                            y: item.y - snapshot.offsetY + delta.y,
                          },
                        },
                      });
                    }
                  }}
                >
                  <title>
                    {item.name} · {item.detail}
                  </title>
                  <rect
                    width={item.width}
                    height={item.height}
                    rx="6"
                    fill="#142238"
                    stroke="#3c6176"
                  />
                  <circle
                    cx="23"
                    cy="25"
                    r="13"
                    fill="#102d3c"
                    stroke="#22d3ee"
                  />
                  {item.symbol ? <text x="23" y="29" textAnchor="middle" fill="#67e8f9" fontSize="12">{item.symbol}</text> : item.kind === "source" ? (
                    <path
                      d="M14 25Q18 11 23 25T32 25"
                      fill="none"
                      stroke="#67e8f9"
                      strokeWidth="2"
                    />
                  ) : item.kind === "circuit" ? (
                    <path
                      d="M17 32V18L29 26V32"
                      fill="none"
                      stroke="#67e8f9"
                      strokeWidth="2"
                    />
                  ) : (
                    <text
                      x="23"
                      y="29"
                      textAnchor="middle"
                      fill="#67e8f9"
                      fontSize="12"
                    >
                      {item.kind === "board"
                        ? "B"
                        : /motor|pump/i.test(item.name)
                          ? "M"
                          : /ev|charg/i.test(item.name)
                            ? "EV"
                            : "L"}
                    </text>
                  )}
                  <text x="43" y="24" fill="#e5eaf3" fontSize="11">
                    {(settings.showLabels ? item.name : item.kind).slice(0, 29)}
                  </text>
                  {settings.showLabels && item.name.length > 29 && (
                    <text x="43" y="39" fill="#e5eaf3" fontSize="10">
                      {item.name.slice(29, 62)}
                    </text>
                  )}
                  {settings.showRatings && (
                    <text x="10" y="61" fill="#acbdd1" fontSize="10">
                      {item.detail.slice(0, 52)}
                    </text>
                  )}
                </g>
              ))}
              {snapshot.notes.map((note, i) => (
                <g key={i}>
                  <rect
                    x={note.x}
                    y={note.y}
                    width="290"
                    height="58"
                    rx="4"
                    fill="#332b14"
                    stroke="#c1a24f"
                  />
                  <text
                    x={note.x + 8}
                    y={note.y + 20}
                    fill="#f5dfa4"
                    fontSize="11"
                  >
                    {note.text.slice(0, 44)}
                  </text>
                  <text
                    x={note.x + 8}
                    y={note.y + 38}
                    fill="#f5dfa4"
                    fontSize="11"
                  >
                    {note.text.slice(44, 88)}
                    {note.text.length > 88 ? "…" : ""}
                  </text>
                  <title>{note.text}</title>
                </g>
              ))}
            </svg>
          </div>
          <div
            className="topology-toolbar"
            aria-label={t("Keyboard pan controls")}
          >
            <button
              className="button"
              aria-label={t("Pan left")}
              onClick={() => setPan({ ...pan, x: pan.x - 100 / zoom })}
            >
              ←
            </button>
            <button
              className="button"
              aria-label={t("Pan up")}
              onClick={() => setPan({ ...pan, y: pan.y - 100 / zoom })}
            >
              ↑
            </button>
            <button
              className="button"
              aria-label={t("Pan down")}
              onClick={() => setPan({ ...pan, y: pan.y + 100 / zoom })}
            >
              ↓
            </button>
            <button
              className="button"
              aria-label={t("Pan right")}
              onClick={() => setPan({ ...pan, x: pan.x + 100 / zoom })}
            >
              →
            </button>
            <button
              className="button"
              disabled={
                !node || !snapshot.nodes.some((item) => item.id === node.id)
              }
              onClick={() => {
                const visible = snapshot.nodes.find(
                  (item) => item.id === node?.id,
                );
                if (!visible) return;
                const scale = Math.max(
                  snapshot.width / 600,
                  snapshot.height / 420,
                );
                setZoom(scale);
                setPan({ x: visible.x - 150, y: visible.y - 160 });
              }}
            >
              {t("Inspect selected object")}
            </button>
          </div>
          <div className="topology-legend">
            <span>~ {t("Grid / supply")}</span>
            <span>B {t("Board")}</span>
            <span>⌁ {t("Circuit / protective device")}</span>
            <span>M {t("Motor")}</span>
            <span>EV {t("EV load")}</span>
            <span>L {t("Generic load")}</span>
          </div>
          <Notice>
            {t(
              "Single-source radial topology. Original analytical symbols; no IEC symbol certification. A connection changes the project graph. Unassigned loads have no electrical connection line. Flow animation illustrates connections and is not measured telemetry.",
            )}
          </Notice>
          <p className="muted small">
            {t(
              "Select an object, then use the connection controls. Drag nodes or enter X/Y coordinates; focused nodes move 10 units with arrow keys. Layout survives recalculation and is included in project backups.",
            )}
          </p>
          {!project.boards.length && (
            <Notice>
              {t("Add a board first to create circuits and connect loads.")}
            </Notice>
          )}
        </div>
        {node && (
          <ObjectEditor
            key={`${project.id}:${project.revision}:${node.id}`}
            project={project}
            node={node}
            review={review}
            saveView={saveView}
          />
        )}
      </div>
      {!!settings.notes.length && (
        <section className="panel panel-pad">
          <h3>{t("Diagram notes")}</h3>
          {settings.notes.map((note) => (
            <details key={note.id}>
              <summary>{note.text.slice(0, 80)}</summary>
              <p style={{ whiteSpace: "pre-wrap" }}>{note.text}</p>
              <p>
                X {note.x} · Y {note.y}
              </p>
              <button
                className="button danger"
                onClick={() =>
                  review({
                    kind: "diagram.set",
                    diagram: {
                      ...settings,
                      notes: settings.notes.filter(
                        (item) => item.id !== note.id,
                      ),
                    },
                  })
                }
              >
                {t("Remove note")}
              </button>
            </details>
          ))}
        </section>
      )}
      {error && (
        <p className="error-text" role="alert">
          {t(error)}
        </p>
      )}
      {modal && (
        <AddObjectModal
          mode={modal}
          project={project}
          selectedBoard={node?.kind === "board" ? node.objectId : undefined}
          onClose={() => setModal(null)}
          onReview={(command) => {
            setModal(null);
            review(command);
          }}
        />
      )}
      {preview && (
        <CommandReview
          project={project}
          preview={preview}
          change={change}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
}

function ObjectEditor({
  project,
  node,
  review,
  saveView,
}: {
  project: Project;
  node: DiagramNode;
  review: (command: ProjectCommand) => void;
  saveView: (settings: DiagramSettings) => void;
}) {
  const t = useT();
  const board = project.boards.find((item) => item.id === node.objectId),
    circuit = project.circuits.find((item) => item.id === node.objectId),
    load = project.loads.find((item) => item.id === node.objectId);
  const [name, setName] = useState(node.name);
  const [upstream, setUpstream] = useState(
    board?.parentId ?? circuit?.boardId ?? load?.circuitId ?? "",
  );
  const [phase, setPhase] = useState<Phase>(
    circuit?.phase ?? load?.phase ?? "L1",
  );
  const [locked, setLocked] = useState(
    circuit?.locked ?? load?.locked ?? false,
  );
  const [critical, setCritical] = useState(load?.critical ?? false);
  const [rated, setRated] = useState(
    String(board?.ratedA ?? circuit?.protectiveA ?? ""),
  );
  const [ways, setWays] = useState(String(board?.ways ?? 12));
  const [notes, setNotes] = useState(load?.notes ?? circuit?.notes ?? "");
  const [breaking, setBreaking] = useState(
    String(circuit?.breakingCapacityKA ?? ""),
  );
  const [fault, setFault] = useState(String(circuit?.prospectiveFaultKA ?? ""));
  const [supply, setSupply] = useState({ ...project.supply });
  const [removing, setRemoving] = useState(false);
  const [strategy, setStrategy] = useState<"detach" | "move">("detach");
  const [destination, setDestination] = useState("");
  const settings = getDiagramSettings(project),
    position =
      settings.positions[node.id] ?? autoLayoutPositions(project)[node.id];
  const [x, setX] = useState(String(position.x)),
    [y, setY] = useState(String(position.y));
  const [cable, setCable] = useState<Record<string, string>>({
    lengthM: String(circuit?.cable?.lengthM ?? ""),
    resistanceOhmPerKm: String(circuit?.cable?.resistanceOhmPerKm ?? ""),
    reactanceOhmPerKm: String(circuit?.cable?.reactanceOhmPerKm ?? ""),
    areaMm2: String(circuit?.cable?.areaMm2 ?? ""),
    baseAmpacityA: String(circuit?.cable?.baseAmpacityA ?? ""),
    voltageDropLimitPercent: String(
      circuit?.cable?.voltageDropLimitPercent ?? "",
    ),
    correctionFactors: circuit?.cable?.correctionFactors?.join(", ") ?? "",
    source: circuit?.cable?.source ?? "",
  });
  if (node.planning) {
    const equipment = project.sources?.find((item) => item.id === node.objectId);
    return <aside className="panel panel-pad topology-inspector" aria-label={t("Topology object inspector")}><span className="eyebrow">{t("Planning source equipment")}</span><h3>{node.name}</h3><Notice>{t("This record is an entered planning source, not an active additional feed. Board association does not create an electrical connection or establish safe source paralleling.")}</Notice>{equipment && <dl className="detail-list"><dt>{t("Type")}</dt><dd>{equipment.type}</dd><dt>{t("Entered rating")}</dt><dd>{equipment.continuousKW} kW / {equipment.continuousKVA} kVA</dd><dt>{t("Voltage")}</dt><dd>{equipment.voltageV} V · {equipment.connection}</dd><dt>{t("Associated board")}</dt><dd>{project.boards.find((item) => item.id === equipment.boardId)?.name ?? t("Unassigned")}</dd><dt>{t("Source reference")}</dt><dd>{equipment.source.reference}</dd></dl>}<p>{t("Edit this record in the source equipment register. Core circuit calculations retain the declared single-source radial model.")}</p><details><summary>{t("Manual position")}</summary><form onSubmit={(e) => { e.preventDefault(); saveView({ ...settings, positions: { ...settings.positions, [node.id]: { x: Number(x), y: Number(y) } } }); }}><Field label={t("Diagram X")}><input type="number" required min="-100000" max="100000" value={x} onChange={(e) => setX(e.target.value)} /></Field><Field label={t("Diagram Y")}><input type="number" required min="-100000" max="100000" value={y} onChange={(e) => setY(e.target.value)} /></Field><button className="button">{t("Save position")}</button></form></details></aside>;
  }
  function save() {
    if (node.kind === "source")
      return review({ kind: "supply.patch", patch: supply });
    if (board)
      return review({
        kind: "batch",
        commands: [
          {
            kind: "board.patch",
            id: board.id,
            patch: { name, ratedA: Number(rated), ways: Number(ways) },
          },
          {
            kind: "board.parent",
            id: board.id,
            parentId: upstream || undefined,
          },
        ],
      });
    if (circuit)
      return review({
        kind: "batch",
        commands: [
          {
            kind: "circuit.patch",
            id: circuit.id,
            patch: {
              name,
              phase,
              locked,
              notes,
              protectiveA: rated === "" ? undefined : Number(rated),
              breakingCapacityKA:
                breaking === "" ? undefined : Number(breaking),
              prospectiveFaultKA: fault === "" ? undefined : Number(fault),
            },
          },
          { kind: "circuit.move", id: circuit.id, boardId: upstream },
        ],
      });
    if (load)
      return review({
        kind: "loads.patch",
        ids: [load.id],
        patch: { name, critical, locked, notes },
      });
  }
  return (
    <aside
      className="panel panel-pad topology-inspector"
      aria-label={t("Topology object inspector")}
    >
      <span className="eyebrow">{t(node.kind)}</span>
      <h3>{node.name}</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="form-grid">
          {node.kind !== "source" && (
            <Field label={t("Object name")}>
              <input
                value={name}
                required
                maxLength={240}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
          )}
          {node.kind === "source" &&
            (Object.keys(supply) as Array<keyof typeof supply>).map((key) => (
              <Field
                key={key}
                label={t(
                  {
                    voltageLN: "Line-neutral voltage",
                    voltageLL: "Line-line voltage",
                    frequency: "Supply frequency",
                    limitA: "Supply current limit",
                  }[key],
                )}
                unit={key === "frequency" ? "Hz" : key === "limitA" ? "A" : "V"}
              >
                <input
                  type="number"
                  required
                  min="0.001"
                  step="any"
                  value={supply[key]}
                  onChange={(e) =>
                    setSupply({ ...supply, [key]: Number(e.target.value) })
                  }
                />
              </Field>
            ))}
          {(board || circuit) && (
            <Field label={t(board ? "Upstream board" : "Circuit board")}>
              <select
                value={upstream}
                onChange={(e) => setUpstream(e.target.value)}
              >
                {board && <option value="">{t("Grid / supply")}</option>}
                {project.boards
                  .filter((item) => item.id !== board?.id)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </Field>
          )}
          {(board || circuit) && (
            <Field
              label={t(
                board ? "Board rated limit" : "Protective-device rating",
              )}
              unit="A"
            >
              <input
                type="number"
                min="0.001"
                step="any"
                required={!!board}
                value={rated}
                onChange={(e) => setRated(e.target.value)}
              />
            </Field>
          )}
          {board && (
            <Field label={t("Available ways")}>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={ways}
                onChange={(e) => setWays(e.target.value)}
              />
            </Field>
          )}
          {circuit && (
            <>
              <Field label={t("Circuit phase")}>
                <select
                  value={phase}
                  onChange={(e) => setPhase(e.target.value as Phase)}
                  disabled={circuit.locked}
                >
                  {["L1", "L2", "L3"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field label={t("Entered breaking capacity")} unit="kA">
                <input
                  type="number"
                  min="0.001"
                  step="any"
                  value={breaking}
                  onChange={(e) => setBreaking(e.target.value)}
                />
              </Field>
              <Field label={t("Entered prospective fault current")} unit="kA">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={fault}
                  onChange={(e) => setFault(e.target.value)}
                />
              </Field>
            </>
          )}
          {(load || circuit) && (
            <>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={locked}
                  onChange={(e) => setLocked(e.target.checked)}
                />
                {t("Lock phase")}
              </label>
              <Field label={t("Object notes")}>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={100000}
                />
              </Field>
            </>
          )}
          {load && (
            <label className="check-row">
              <input
                type="checkbox"
                checked={critical}
                onChange={(e) => setCritical(e.target.checked)}
              />
              {t("Critical load")}
            </label>
          )}
        </div>
        <button className="button primary" type="submit">
          {t("Preview object changes")}
        </button>
      </form>
      {load && (
        <>
          <hr />
          <Field label={t("Connect load to circuit")}>
            <select
              value={upstream}
              onChange={(e) => setUpstream(e.target.value)}
            >
              <option value="">{t("Choose a circuit")}</option>
              {project.circuits.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name} · {item.phase}
                </option>
              ))}
            </select>
          </Field>
          <div className="button-row">
            <button
              className="button"
              disabled={!upstream}
              onClick={() =>
                review({
                  kind: "loads.assign",
                  ids: [load.id],
                  circuitId: upstream,
                })
              }
            >
              {t("Connect")}
            </button>
            <button
              className="button"
              disabled={!load.circuitId && !load.boardId}
              onClick={() => review({ kind: "loads.assign", ids: [load.id] })}
            >
              {t("Disconnect")}
            </button>
          </div>
          {!project.circuits.length && (
            <p>{t("Add a board and circuit to connect this load.")}</p>
          )}
          {load.connection === "single" && (
            <>
              <Field label={t("Load destination phase")}>
                <select
                  value={phase}
                  onChange={(e) => setPhase(e.target.value as Phase)}
                >
                  {["L1", "L2", "L3"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <button
                className="button"
                onClick={() =>
                  review({ kind: "loads.phase", ids: [load.id], phase })
                }
              >
                {t("Preview phase assignment")}
              </button>
            </>
          )}
        </>
      )}
      {circuit && (
        <details>
          <summary>{t("Cable data and source")}</summary>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const value: Cable = {
                ...circuit.cable,
                lengthM: Number(cable.lengthM),
              };
              for (const key of [
                "resistanceOhmPerKm",
                "reactanceOhmPerKm",
                "areaMm2",
                "baseAmpacityA",
                "voltageDropLimitPercent",
              ] as const)
                value[key] = cable[key] === "" ? undefined : Number(cable[key]);
              value.correctionFactors = cable.correctionFactors.trim()
                ? cable.correctionFactors
                    .split(/[,;\s]+/)
                    .filter(Boolean)
                    .map(Number)
                : undefined;
              value.source = cable.source;
              review({
                kind: "circuit.patch",
                id: circuit.id,
                patch: { cable: value },
              });
            }}
          >
            <div className="form-grid">
              {[
                ["lengthM", "One-way cable length", "m"],
                ["resistanceOhmPerKm", "Conductor resistance", "Ω/km"],
                ["reactanceOhmPerKm", "Conductor reactance", "Ω/km"],
                ["areaMm2", "Cross-sectional area", "mm²"],
                ["baseAmpacityA", "Sourced base ampacity", "A"],
                [
                  "voltageDropLimitPercent",
                  "Entered voltage-drop criterion",
                  "%",
                ],
              ].map(([key, label, unit]) => (
                <Field key={key} label={t(label)} unit={unit}>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required={key === "lengthM"}
                    value={cable[key]}
                    onChange={(e) =>
                      setCable({ ...cable, [key]: e.target.value })
                    }
                  />
                </Field>
              ))}
              <Field label={t("Correction factors")}>
                <input
                  value={cable.correctionFactors}
                  onChange={(e) =>
                    setCable({ ...cable, correctionFactors: e.target.value })
                  }
                  placeholder="0.8, 0.9"
                />
              </Field>
              <Field label={t("Cable data source")}>
                <input
                  value={cable.source}
                  onChange={(e) =>
                    setCable({ ...cable, source: e.target.value })
                  }
                />
              </Field>
            </div>
            <div className="button-row">
              <button className="button">{t("Preview cable changes")}</button>
              <button
                className="button"
                type="button"
                disabled={!circuit.cable}
                onClick={() =>
                  review({
                    kind: "circuit.patch",
                    id: circuit.id,
                    patch: { cable: undefined },
                  })
                }
              >
                {t("Clear cable data")}
              </button>
            </div>
          </form>
          <Notice>
            {t(
              "Entered data and criteria require their own applicable source. These fields do not establish regulatory or manufacturer approval.",
            )}
          </Notice>
        </details>
      )}
      <details>
        <summary>{t("Manual position")}</summary>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveView({
              ...settings,
              positions: {
                ...settings.positions,
                [node.id]: { x: Number(x), y: Number(y) },
              },
            });
          }}
        >
          <div className="form-grid">
            <Field label={t("Diagram X")}>
              <input
                type="number"
                required
                min="-100000"
                max="100000"
                step="any"
                value={x}
                onChange={(e) => setX(e.target.value)}
              />
            </Field>
            <Field label={t("Diagram Y")}>
              <input
                type="number"
                required
                min="-100000"
                max="100000"
                step="any"
                value={y}
                onChange={(e) => setY(e.target.value)}
              />
            </Field>
          </div>
          <button className="button">{t("Save position")}</button>
        </form>
      </details>
      {(board || circuit) && (
        <>
          <button
            className="button danger"
            onClick={() => setRemoving(!removing)}
          >
            {t(board ? "Remove board" : "Remove circuit")}
          </button>
          {removing && (
            <div>
              <Notice>
                {t(
                  "Review every dependent object before applying. Loads are retained unless a separate load deletion is requested.",
                )}
              </Notice>
              {board && (
                <Field label={t("Dependency handling")}>
                  <select
                    value={strategy}
                    onChange={(e) =>
                      setStrategy(e.target.value as "detach" | "move")
                    }
                  >
                    <option value="detach">
                      {t("Remove subtree; keep loads unassigned")}
                    </option>
                    <option value="move">
                      {t("Move direct dependants to another board")}
                    </option>
                  </select>
                </Field>
              )}
              {(!board || strategy === "move") && (
                <Field label={t("Dependency destination")}>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  >
                    <option value="">
                      {t(
                        circuit
                          ? "Keep loads unassigned"
                          : "Select destination",
                      )}
                    </option>
                    {(board
                      ? project.boards.filter((item) => item.id !== board.id)
                      : project.circuits.filter(
                          (item) => item.id !== circuit!.id,
                        )
                    ).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              <button
                className="button danger"
                onClick={() =>
                  review(
                    board
                      ? {
                          kind: "board.remove",
                          id: board.id,
                          strategy,
                          targetBoardId: destination || undefined,
                        }
                      : {
                          kind: "circuit.remove",
                          id: circuit!.id,
                          targetCircuitId: destination || undefined,
                        },
                  )
                }
              >
                {t("Preview removal")}
              </button>
            </div>
          )}
        </>
      )}
    </aside>
  );
}

function AddObjectModal({
  mode,
  project,
  selectedBoard,
  onClose,
  onReview,
}: {
  mode: "board" | "circuit" | "note";
  project: Project;
  selectedBoard?: string;
  onClose: () => void;
  onReview: (command: ProjectCommand) => void;
}) {
  const t = useT();
  const [name, setName] = useState("");
  const [board, setBoard] = useState(
    selectedBoard ?? project.boards[0]?.id ?? "",
  );
  const [rated, setRated] = useState("63");
  const [ways, setWays] = useState("12");
  const [phase, setPhase] = useState<Phase>("L1");
  const [x, setX] = useState("40");
  const [y, setY] = useState("40");
  return (
    <Modal
      title={t(
        mode === "board"
          ? "Add board"
          : mode === "circuit"
            ? "Add circuit"
            : "Add note",
      )}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (mode === "board")
            onReview({
              kind: "board.add",
              board: createBoard({
                name: name.trim(),
                ratedA: Number(rated),
                ways: Number(ways),
                parentId: board || undefined,
              }),
            });
          else if (mode === "circuit")
            onReview({
              kind: "circuit.add",
              circuit: createCircuit(board, { name: name.trim(), phase }),
            });
          else {
            const settings = getDiagramSettings(project);
            onReview({
              kind: "diagram.set",
              diagram: {
                ...settings,
                notes: [
                  ...settings.notes,
                  {
                    id: newId("note"),
                    text: name.trim(),
                    x: Number(x),
                    y: Number(y),
                  },
                ],
              },
            });
          }
        }}
      >
        <div className="modal-body">
          <div className="form-grid">
            <Field label={t(mode === "note" ? "Note text" : "New object name")}>
              {mode === "note" ? (
                <textarea
                  required
                  rows={5}
                  maxLength={2000}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              ) : (
                <input
                  required
                  maxLength={240}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}
            </Field>
            {mode !== "note" && (
              <Field
                label={t(mode === "board" ? "Upstream board" : "Circuit board")}
              >
                <select
                  required={mode === "circuit"}
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                >
                  {mode === "board" && (
                    <option value="">{t("Grid / supply")}</option>
                  )}
                  {project.boards.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {mode === "board" && (
              <>
                <Field label={t("Board rated limit")} unit="A">
                  <input
                    required
                    type="number"
                    min="0.001"
                    step="any"
                    value={rated}
                    onChange={(e) => setRated(e.target.value)}
                  />
                </Field>
                <Field label={t("Available ways")}>
                  <input
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={ways}
                    onChange={(e) => setWays(e.target.value)}
                  />
                </Field>
              </>
            )}
            {mode === "circuit" && (
              <Field label={t("Circuit phase")}>
                <select
                  value={phase}
                  onChange={(e) => setPhase(e.target.value as Phase)}
                >
                  {["L1", "L2", "L3"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
            )}
            {mode === "note" && (
              <>
                <Field label={t("Diagram X")}>
                  <input
                    type="number"
                    min="-100000"
                    max="100000"
                    required
                    value={x}
                    onChange={(e) => setX(e.target.value)}
                  />
                </Field>
                <Field label={t("Diagram Y")}>
                  <input
                    type="number"
                    min="-100000"
                    max="100000"
                    required
                    value={y}
                    onChange={(e) => setY(e.target.value)}
                  />
                </Field>
              </>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="button" type="button" onClick={onClose}>
            {t("Cancel")}
          </button>
          <button className="button primary">{t("Preview addition")}</button>
        </div>
      </form>
    </Modal>
  );
}
