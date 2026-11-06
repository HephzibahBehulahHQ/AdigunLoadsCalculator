import type {
  CalculationResult,
  DiagramSettings,
  Project,
} from "../domain/types";

export interface DiagramNode {
  id: string;
  objectId: string;
  kind: "source" | "board" | "circuit" | "load";
  name: string;
  detail: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface DiagramSnapshot {
  projectName: string;
  revision: number;
  pageSize: "a4" | "a3";
  orientation: "landscape" | "portrait";
  width: number;
  height: number;
  nodes: DiagramNode[];
  edges: Array<{ from: string; to: string; label: string }>;
  notes: Array<{ text: string; x: number; y: number }>;
  offsetX: number;
  offsetY: number;
  showLabels: boolean;
  showRatings: boolean;
}

export function getDiagramSettings(project: Project): DiagramSettings {
  return project.diagram
    ? structuredClone(project.diagram)
    : {
        version: 1,
        pageSize: "a4",
        orientation: "landscape",
        showLabels: true,
        showRatings: true,
        positions: {},
        notes: [],
      };
}

function graph(project: Project, result?: CalculationResult) {
  const nodes: Omit<DiagramNode, "x" | "y">[] = [];
  const edges: DiagramSnapshot["edges"] = [];
  const sourceId = `source:${project.id}`;
  const add = (
    kind: DiagramNode["kind"],
    objectId: string,
    name: string,
    detail: string,
    from?: string,
    label = "",
  ) => {
    const id = `${kind}:${objectId}`;
    nodes.push({ id, objectId, kind, name, detail, width: 240, height: 76 });
    if (from) edges.push({ from, to: id, label });
  };
  add(
    "source",
    project.id,
    "Grid / supply",
    `${project.supply.voltageLN}/${project.supply.voltageLL} V · ${project.supply.frequency} Hz · ${project.supply.limitA} A`,
  );
  for (const board of project.boards)
    add(
      "board",
      board.id,
      board.name,
      `${board.ratedA} A · ${project.circuits.filter((c) => c.boardId === board.id).length}/${board.ways} ways`,
      board.parentId ? `board:${board.parentId}` : sourceId,
      board.feeder ? `${board.feeder.lengthM} m feeder` : "Upstream feed",
    );
  for (const circuit of project.circuits)
    add(
      "circuit",
      circuit.id,
      circuit.name,
      `${circuit.phase}${circuit.locked ? " · locked" : ""}${circuit.protectiveA !== undefined ? ` · ${circuit.protectiveA} A device` : " · device unspecified"}`,
      `board:${circuit.boardId}`,
      circuit.cable
        ? `${circuit.cable.lengthM} m${circuit.cable.areaMm2 ? ` · ${circuit.cable.areaMm2} mm²` : ""}`
        : "Cable unspecified",
    );
  for (const load of project.loads) {
    const value = result?.loads.find((item) => item.id === load.id);
    const connection =
      load.connection === "three"
        ? "3φ"
        : load.connection === "line-line"
          ? (load.phasePair?.join("–") ?? "L–L")
          : load.connection === "dc"
            ? "DC"
            : load.phase;
    const from = load.circuitId
      ? `circuit:${load.circuitId}`
      : load.boardId
        ? `board:${load.boardId}`
        : undefined;
    add(
      "load",
      load.id,
      load.name,
      `${connection} · ${load.quantity} × ${load.rating} ${load.entryMode === "amps" ? "A" : load.entryMode === "kva" ? "kVA" : "kW"}${value?.valid ? ` · ${value.currentA.toFixed(2)} A` : ""}${from ? "" : " · unassigned"}`,
      from,
      load.critical
        ? "Critical load"
        : load.circuitId
          ? "Connected load"
          : "Board-only assignment",
    );
  }
  return { nodes, edges, sourceId };
}

/** Each real graph object is emitted once; board-only loads never repeat under circuits. */
export function autoLayoutPositions(
  project: Project,
): Record<string, { x: number; y: number }> {
  const { nodes, edges, sourceId } = graph(project);
  const children = new Map<string, string[]>();
  for (const edge of edges)
    children.set(edge.from, [...(children.get(edge.from) ?? []), edge.to]);
  const positions: Record<string, { x: number; y: number }> = {};
  const visiting = new Set<string>();
  let row = 0;
  function walk(id: string, depth: number): number {
    if (positions[id]) return positions[id].y;
    if (visiting.has(id)) return row++ * 116 + 72;
    visiting.add(id);
    const childYs = (children.get(id) ?? []).map((child) =>
      walk(child, depth + 1),
    );
    const y = childYs.length
      ? (Math.min(...childYs) + Math.max(...childYs)) / 2
      : row++ * 116 + 72;
    positions[id] = { x: 36 + depth * 310, y };
    visiting.delete(id);
    return y;
  }
  walk(sourceId, 0);
  for (const node of nodes) if (!positions[node.id]) walk(node.id, 1);
  return positions;
}

export function buildDiagramSnapshot(
  project: Project,
  result?: CalculationResult,
  options: {
    isolateBoardId?: string;
    positions?: Record<string, { x: number; y: number }>;
  } = {},
): DiagramSnapshot {
  const settings = getDiagramSettings(project);
  const { nodes, edges, sourceId } = graph(project, result);
  const positions = {
    ...autoLayoutPositions(project),
    ...settings.positions,
    ...options.positions,
  };
  let included = new Set(nodes.map((node) => node.id));
  if (options.isolateBoardId) {
    const id = `board:${options.isolateBoardId}`;
    included = new Set([sourceId, id]);
    for (let changed = true; changed;) {
      changed = false;
      for (const edge of edges)
        if (
          included.has(edge.from) &&
          edge.from !== sourceId &&
          !included.has(edge.to)
        ) {
          included.add(edge.to);
          changed = true;
        }
    }
    let upstream = project.boards.find(
      (board) => board.id === options.isolateBoardId,
    )?.parentId;
    const seen = new Set<string>();
    while (upstream && !seen.has(upstream)) {
      seen.add(upstream);
      included.add(`board:${upstream}`);
      upstream = project.boards.find(
        (board) => board.id === upstream,
      )?.parentId;
    }
  }
  const visible = nodes.filter((node) => included.has(node.id));
  const offsetX =
    40 -
    Math.min(
      0,
      ...visible.map((node) => positions[node.id].x),
      ...settings.notes.map((note) => note.x),
    );
  const offsetY =
    60 -
    Math.min(
      0,
      ...visible.map((node) => positions[node.id].y),
      ...settings.notes.map((note) => note.y),
    );
  const located = visible.map((node) => ({
    ...node,
    x: positions[node.id].x + offsetX,
    y: positions[node.id].y + offsetY,
  }));
  const notes = settings.notes.map((note) => ({
    text: note.text,
    x: note.x + offsetX,
    y: note.y + offsetY,
  }));
  return {
    projectName: project.name,
    revision: project.revision,
    pageSize: settings.pageSize,
    orientation: settings.orientation,
    width: Math.max(
      900,
      ...located.map((node) => node.x + node.width + 40),
      ...notes.map((note) => note.x + 280),
    ),
    height: Math.max(
      450,
      ...located.map((node) => node.y + node.height + 90),
      ...notes.map((note) => note.y + 120),
    ),
    nodes: located,
    edges: edges.filter(
      (edge) => included.has(edge.from) && included.has(edge.to),
    ),
    notes,
    offsetX,
    offsetY,
    showLabels: settings.showLabels,
    showRatings: settings.showRatings,
  };
}

export function diagramEdgePath(
  snapshot: DiagramSnapshot,
  edge: DiagramSnapshot["edges"][number],
): string {
  const from = snapshot.nodes.find((node) => node.id === edge.from),
    to = snapshot.nodes.find((node) => node.id === edge.to);
  if (!from || !to) return "";
  const x1 = from.x + from.width,
    y1 = from.y + from.height / 2,
    x2 = to.x,
    y2 = to.y + to.height / 2;
  return `M${x1} ${y1}H${(x1 + x2) / 2}V${y2}H${x2}`;
}

const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[character]!,
  );
export function diagramSVG(snapshot: DiagramSnapshot): string {
  const lines = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${snapshot.width}" height="${snapshot.height}" viewBox="0 0 ${snapshot.width} ${snapshot.height}">`,
    `<rect width="100%" height="100%" fill="#ffffff"/><g font-family="sans-serif" fill="#172033">`,
    `<text x="28" y="30" font-size="16">${escape(snapshot.projectName)} · revision ${snapshot.revision}</text>`,
  ];
  for (const edge of snapshot.edges) {
    lines.push(
      `<path d="${diagramEdgePath(snapshot, edge)}" fill="none" stroke="#526579" stroke-width="2"/>`,
    );
    if (snapshot.showLabels) {
      const to = snapshot.nodes.find((node) => node.id === edge.to)!;
      lines.push(
        `<text x="${to.x - 6}" y="${to.y - 8}" text-anchor="end" font-size="10">${escape(edge.label)}</text>`,
      );
    }
  }
  for (const node of snapshot.nodes) {
    lines.push(
      `<g><title>${escape(`${node.kind}: ${node.name}; ${node.detail}`)}</title><rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="5" fill="#f3f7fb" stroke="#466379"/><circle cx="${node.x + 22}" cy="${node.y + 24}" r="12" fill="#e0f3f8" stroke="#466379"/><text x="${node.x + 22}" y="${node.y + 28}" text-anchor="middle" font-size="12">${{ source: "~", board: "B", circuit: "S", load: "L" }[node.kind]}</text>`,
    );
    const name = snapshot.showLabels ? node.name : node.kind;
    lines.push(
      `<text x="${node.x + 42}" y="${node.y + 24}" font-size="11">${escape(name.slice(0, 29))}</text>`,
    );
    if (name.length > 29)
      lines.push(
        `<text x="${node.x + 42}" y="${node.y + 39}" font-size="10">${escape(name.slice(29, 62))}</text>`,
      );
    if (snapshot.showRatings)
      lines.push(
        `<text x="${node.x + 10}" y="${node.y + 59}" font-size="10">${escape(node.detail.slice(0, 52))}</text>`,
      );
    lines.push("</g>");
  }
  for (const note of snapshot.notes) {
    const linesOfText = note.text.match(/.{1,58}/gu) ?? [""];
    lines.push(
      `<rect x="${note.x}" y="${note.y}" width="290" height="${20 + linesOfText.length * 15}" fill="#fff8dc" stroke="#b08822"/>`,
    );
    linesOfText.forEach((line, i) =>
      lines.push(
        `<text x="${note.x + 8}" y="${note.y + 18 + i * 15}" font-size="11">${escape(line)}</text>`,
      ),
    );
  }
  lines.push(
    `<text x="28" y="${snapshot.height - 36}" font-size="11">Legend: ~ source · B board · S circuit/protective device · L load. Single-source radial model.</text><text x="28" y="${snapshot.height - 18}" font-size="10">Analytical symbols; no IEC symbol certification. Unassigned loads have no connection line. Engineering estimate, not installation approval.</text></g></svg>`,
  );
  return lines.join("");
}
