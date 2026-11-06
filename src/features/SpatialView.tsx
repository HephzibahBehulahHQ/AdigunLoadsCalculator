import { useContext, useMemo, useRef, useState } from "react";
import type { CalculationResult, Project } from "../domain/types";
import { buildDiagramSnapshot } from "../commands/diagram";
import { dailyProfile } from "../engine/electrical";
import { LanguageContext, numberFormat, useT } from "../i18n";
import { downloadFile, safeName } from "../import-export/files";
import { Field, Notice } from "./ui";

/** Perspective projection of the actual graph; coordinates describe hierarchy, never an installation survey. */
export default function SpatialView({
  project,
  result,
  onSelect,
}: {
  project: Project;
  result: CalculationResult;
  onSelect: (id: string) => void;
}) {
  const t = useT(),
    locale = useContext(LanguageContext),
    svg = useRef<SVGSVGElement>(null);
  const [angle, setAngle] = useState(-25),
    [elevation, setElevation] = useState(35),
    [zoom, setZoom] = useState(1),
    [board, setBoard] = useState(""),
    [hour, setHour] = useState(12),
    [selected, setSelected] = useState("");
  const drag = useRef<
    { x: number; y: number; angle: number; elevation: number } | undefined
  >(undefined);
  const snapshot = useMemo(
    () => buildDiagramSnapshot(project, result),
    [project, result],
  );
  const children = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const edge of snapshot.edges)
      map.set(edge.from, [...(map.get(edge.from) ?? []), edge.to]);
    return map;
  }, [snapshot]);
  const profiles = useMemo(
    () => new Map(project.loads.map((load) => [load.id, dailyProfile([load])])),
    [project],
  );
  const scoped = useMemo(() => {
    if (!board) return new Set(snapshot.nodes.map((node) => node.id));
    const ids = new Set<string>(),
      queue = [`board:${board}`];
    while (queue.length) {
      const id = queue.shift()!;
      if (ids.has(id)) continue;
      ids.add(id);
      queue.push(...(children.get(id) ?? []));
    }
    return ids;
  }, [board, snapshot, children]);
  const quantities = useMemo(() => {
    const values = new Map<string, number>(),
      nodes = new Map(snapshot.nodes.map((node) => [node.id, node]));
    const value = (id: string, path = new Set<string>()): number => {
      if (values.has(id)) return values.get(id)!;
      if (path.has(id)) return 0;
      const node = nodes.get(id);
      if (!node) return 0;
      const nextPath = new Set(path).add(id);
      const kw =
        node.kind === "load"
          ? (profiles.get(node.objectId)?.[hour]?.kw ?? 0)
          : (children.get(id) ?? []).reduce(
              (sum, child) => sum + value(child, nextPath),
              0,
            );
      values.set(id, kw);
      return kw;
    };
    snapshot.nodes.forEach((node) => value(node.id));
    return values;
  }, [snapshot, children, profiles, hour]);
  const nodes = snapshot.nodes.filter((node) => scoped.has(node.id));
  const centre = {
    x: nodes.reduce((sum, node) => sum + node.x, 0) / Math.max(1, nodes.length),
    y: nodes.reduce((sum, node) => sum + node.y, 0) / Math.max(1, nodes.length),
  };
  const extent = Math.max(
    500,
    ...nodes.map((node) => Math.abs(node.x - centre.x)),
    ...nodes.map((node) => Math.abs(node.y - centre.y)),
  );
  const azimuth = (angle * Math.PI) / 180,
    pitch = (elevation * Math.PI) / 180;
  const positions = new Map(
    nodes.map((node) => {
      const x = ((node.x - centre.x) * 380) / extent,
        y = ((node.y - centre.y) * 380) / extent,
        z = { source: 140, board: 90, circuit: 40, load: 0 }[node.kind] - 60;
      const horizontal = x * Math.cos(azimuth) - y * Math.sin(azimuth),
        rotatedY = x * Math.sin(azimuth) + y * Math.cos(azimuth);
      const vertical = rotatedY * Math.cos(pitch) - z * Math.sin(pitch),
        depth = rotatedY * Math.sin(pitch) + z * Math.cos(pitch),
        scale = (900 / (900 + depth)) * zoom;
      return [
        node.id,
        {
          x: 500 + horizontal * scale,
          y: 300 + vertical * scale,
          depth,
          scale,
        },
      ];
    }),
  );
  const selectedNode = snapshot.nodes.find((node) => node.id === selected);
  function select(id: string) {
    setSelected(id);
    const node = snapshot.nodes.find((row) => row.id === id);
    if (node) onSelect(node.objectId);
  }
  return (
    <section className="panel panel-pad spatial-workspace">
      <h3>{t("Analytical spatial view")}</h3>
      <Notice>
        {t(
          "This perspective view uses the same project graph. Height and spacing express hierarchy, not surveyed physical dimensions. Flow values are representative hourly energy averages, not transient currents or measured telemetry.",
        )}
      </Notice>
      <div className="form-grid four">
        <Field label={t("Orbit angle")} unit="°">
          <input
            type="range"
            min="-180"
            max="180"
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
          />
        </Field>
        <Field label={t("Elevation")} unit="°">
          <input
            type="range"
            min="0"
            max="85"
            value={elevation}
            onChange={(e) => setElevation(Number(e.target.value))}
          />
        </Field>
        <Field label={t("Zoom")}>
          <input
            type="range"
            min="0.4"
            max="2.5"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </Field>
        <Field label={t("Isolate board")}>
          <select value={board} onChange={(e) => setBoard(e.target.value)}>
            <option value="">{t("Whole project")}</option>
            {project.boards.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <svg
        ref={svg}
        viewBox="0 0 1000 600"
        className="spatial-scene"
        aria-label={t("Perspective project graph")}
        style={{
          width: "100%",
          height: "min(58vh,600px)",
          touchAction: "none",
          background: "#0b1626",
          borderRadius: 8,
        }}
        onPointerDown={(e) => {
          if ((e.target as Element).closest('[role="button"]')) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, angle, elevation };
        }}
        onPointerMove={(e) => {
          if (drag.current) {
            setAngle(
              Math.max(
                -180,
                Math.min(
                  180,
                  drag.current.angle + (e.clientX - drag.current.x) * 0.4,
                ),
              ),
            );
            setElevation(
              Math.max(
                0,
                Math.min(
                  85,
                  drag.current.elevation - (e.clientY - drag.current.y) * 0.25,
                ),
              ),
            );
          }
        }}
        onPointerUp={(e) => {
          drag.current = undefined;
          if (e.currentTarget.hasPointerCapture(e.pointerId))
            e.currentTarget.releasePointerCapture(e.pointerId);
        }}
        onPointerCancel={() => {
          drag.current = undefined;
        }}
      >
        <rect width="1000" height="600" fill="#0b1626" />
        <defs>
          <marker
            id="spatial-flow-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10Z" fill="#22d3ee" />
          </marker>
        </defs>
        {snapshot.edges
          .filter((edge) => scoped.has(edge.from) && scoped.has(edge.to))
          .map((edge) => {
            const from = positions.get(edge.from)!,
              to = positions.get(edge.to)!,
              kw = quantities.get(edge.to) ?? 0;
            return (
              <g key={edge.from + edge.to}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={kw > 0 ? "#22d3ee" : "#64748b"}
                  strokeWidth={kw > 0 ? Math.min(6, 1 + Math.sqrt(kw)) : 1}
                  markerEnd={kw > 0 ? "url(#spatial-flow-arrow)" : undefined}
                />
                <title>
                  {edge.label} · {numberFormat(kw, 3, locale)} kW
                </title>
              </g>
            );
          })}
        {[...nodes]
          .sort(
            (a, b) => positions.get(b.id)!.depth - positions.get(a.id)!.depth,
          )
          .map((node) => {
            const point = positions.get(node.id)!,
              colour = node.planning
                ? "#fbbf24"
                : node.kind === "load"
                  ? "#a78bfa"
                  : "#22d3ee";
            return (
              <g
                key={node.id}
                transform={`translate(${point.x} ${point.y})`}
                role="button"
                aria-label={`${t(node.planning ? "Planning source" : node.kind)}: ${node.name}`}
                aria-pressed={selected === node.id}
                tabIndex={0}
                onClick={() => select(node.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    select(node.id);
                  }
                }}
              >
                <circle
                  r={Math.max(5, Math.min(16, 11 * point.scale))}
                  fill={selected === node.id ? "#ffffff" : colour}
                  stroke="#0b1626"
                  strokeWidth="2"
                />
                <text
                  x="17"
                  y="4"
                  fill="#e2e8f0"
                  fontFamily="sans-serif"
                  fontSize="12"
                >
                  {node.name}
                </text>
                <text
                  x="17"
                  y="19"
                  fill="#a9bad0"
                  fontFamily="sans-serif"
                  fontSize="10"
                >
                  {node.planning
                    ? t("No active feed")
                    : numberFormat(quantities.get(node.id) ?? 0, 3, locale) +
                      " kW"}
                </text>
                <title>{node.detail}</title>
              </g>
            );
          })}
      </svg>
      <div className="form-grid">
        <Field label={t("Representative hour")}>
          <input
            type="range"
            min="0"
            max="23"
            step="1"
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
          />
        </Field>
        <p>
          {String(hour).padStart(2, "0")}:00 · {t("Revision")}{" "}
          {project.revision} · {nodes.length} {t("objects")}
        </p>
      </div>
      <div className="button-row">
        <button
          className="button"
          onClick={() => {
            setAngle(-25);
            setElevation(35);
            setZoom(1);
            setBoard("");
          }}
        >
          {t("Reset view")}
        </button>
        <button
          className="button"
          onClick={() => {
            if (svg.current)
              downloadFile(
                safeName(project.name) + "-analytical-spatial.svg",
                new XMLSerializer().serializeToString(svg.current),
                "image/svg+xml",
              );
          }}
        >
          {t("Export spatial SVG")}
        </button>
      </div>
      <Field label={t("Inspect spatial object")}>
        <select value={selected} onChange={(e) => select(e.target.value)}>
          <option value="">{t("Select object")}</option>
          {nodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.name}
            </option>
          ))}
        </select>
      </Field>
      {selectedNode && (
        <p>
          {selectedNode.name} · {selectedNode.detail} ·{" "}
          {numberFormat(quantities.get(selectedNode.id) ?? 0, 3, locale)} kW
        </p>
      )}
    </section>
  );
}
