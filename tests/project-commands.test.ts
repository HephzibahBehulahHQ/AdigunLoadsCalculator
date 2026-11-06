import { describe, expect, it } from "vitest";
import { createBoard, createCircuit, createLoad, createProject } from "../src/domain/project";
import { applyProjectCommand, copyLoadRows, duplicateLoadsCommand, LOAD_ROW_HEADERS, parseLoadRows, previewProjectCommand } from "../src/commands/projectCommands";
import { autoLayoutPositions, buildDiagramSnapshot, diagramSVG, getDiagramSettings } from "../src/commands/diagram";

function fixture() {
  const project = createProject("Command fixture");
  project.boards[0].id = "board-a";
  project.boards.push(createBoard({ id: "board-b", name: "Child board", parentId: "board-a" }));
  project.circuits = [createCircuit("board-a", { id: "circuit-a", phase: "L1" }), createCircuit("board-b", { id: "circuit-b", phase: "L2" })];
  project.loads = [createLoad({ id: "load-a", name: "A", rating: 2.3, voltage: 230, pf: 1, boardId: "board-a", circuitId: "circuit-a", phase: "L1" }), createLoad({ id: "load-b", name: "B", rating: 1.15, voltage: 230, pf: 1, boardId: "board-a", circuitId: "circuit-a", phase: "L1" }), createLoad({ id: "load-c", name: "C", rating: .46, voltage: 230, pf: 1, boardId: "board-b", circuitId: "circuit-b", phase: "L2" })];
  return project;
}

describe("shared, atomic project commands", () => {
  it("moves every single-phase member of a circuit, with exact affected rows and no source mutation", () => {
    const project = fixture(), original = structuredClone(project);
    const preview = previewProjectCommand(project, { kind: "loads.phase", ids: ["load-a"], phase: "L3" });
    expect(preview.errors).toEqual([]);
    expect(preview.changes.filter((item) => item.field === "phase").map((item) => item.objectId).sort()).toEqual(["circuit-a", "load-a", "load-b"]);
    const next = applyProjectCommand(project, preview);
    expect(next.loads.map((load) => load.phase)).toEqual(["L3", "L3", "L2"]);
    expect(next.revision).toBe(project.revision);
    expect(project).toEqual(original);
  });
  it("rejects an unselected locked member, and cannot unlock-and-move a circuit in one patch", () => {
    const project = fixture(); project.loads[1].locked = true;
    const preview = previewProjectCommand(project, { kind: "loads.phase", ids: ["load-a"], phase: "L3" });
    expect(preview.errors.join(" ")).toMatch(/B: phase is locked/);
    expect(() => applyProjectCommand(project, preview)).toThrow(/locked/);
    project.circuits[0].locked = true;
    expect(previewProjectCommand(project, { kind: "circuit.patch", id: "circuit-a", patch: { phase: "L3", locked: false } }).errors.join(" ")).toMatch(/unlock/);
  });
  it("assigns board and phase together and rejects incompatible locked assignments", () => {
    const project = fixture(); project.loads[0].locked = true;
    expect(previewProjectCommand(project, { kind: "loads.assign", ids: ["load-a"], circuitId: "circuit-b" }).errors.join(" ")).toMatch(/unlock/);
    project.loads[0].locked = false;
    const next = applyProjectCommand(project, previewProjectCommand(project, { kind: "loads.assign", ids: ["load-a"], circuitId: "circuit-b" }));
    expect(next.loads[0]).toMatchObject({ circuitId: "circuit-b", boardId: "board-b", phase: "L2" });
  });
  it("moves the complete circuit and prevents overfilling a destination board", () => {
    const project = fixture();
    const next = applyProjectCommand(project, previewProjectCommand(project, { kind: "circuit.move", id: "circuit-a", boardId: "board-b" }));
    expect(next.loads.every((load) => load.boardId === "board-b")).toBe(true);
    project.boards[1].ways = 1;
    expect(previewProjectCommand(project, { kind: "circuit.move", id: "circuit-a", boardId: "board-b" }).errors.join(" ")).toMatch(/ways/);
  });
  it("rejects cycles, nonexistent targets and AC/DC misconnections", () => {
    const project = fixture();
    expect(previewProjectCommand(project, { kind: "board.parent", id: "board-a", parentId: "board-b" }).errors.join(" ")).toMatch(/cycle/i);
    expect(previewProjectCommand(project, { kind: "loads.assign", ids: ["load-a"], circuitId: "missing" }).errors.join(" ")).toMatch(/no longer exists/);
    project.loads[0].connection = "dc";
    expect(previewProjectCommand(project, { kind: "loads.assign", ids: ["load-a"], circuitId: "circuit-b" }).errors.join(" ")).toMatch(/DC connection/);
  });
  it("removes a board subtree without deleting or orphaning its loads", () => {
    const project = fixture();
    const preview = previewProjectCommand(project, { kind: "board.remove", id: "board-a", strategy: "detach" });
    expect(preview.errors).toEqual([]);
    const next = applyProjectCommand(project, preview);
    expect(next.boards).toEqual([]); expect(next.circuits).toEqual([]); expect(next.loads).toHaveLength(3);
    expect(next.loads.every((load) => !load.boardId && !load.circuitId)).toBe(true);
  });
  it("moves board dependants explicitly and refuses a descendant destination", () => {
    const project = fixture(); project.boards.push(createBoard({ id: "board-c" }));
    expect(previewProjectCommand(project, { kind: "board.remove", id: "board-a", strategy: "move", targetBoardId: "board-b" }).errors.join(" ")).toMatch(/descendant/);
    const next = applyProjectCommand(project, previewProjectCommand(project, { kind: "board.remove", id: "board-a", strategy: "move", targetBoardId: "board-c" }));
    expect(next.boards.find((board) => board.id === "board-b")?.parentId).toBe("board-c");
    expect(next.circuits[0].boardId).toBe("board-c"); expect(next.loads[0].boardId).toBe("board-c");
  });
  it("deletes load-dependent start events and duplicates into independent objects", () => {
    const project = fixture(); project.startEvents = [{ id: "event-a", loadId: "load-a", start: "2026-11-06T09:00:00+01:00", durationSeconds: 3, multiplier: 4, pf: .3, method: "user", source: "Fixture input" }];
    const next = applyProjectCommand(project, previewProjectCommand(project, { kind: "loads.delete", ids: ["load-a"] }));
    expect(next.loads).toHaveLength(2); expect(next.startEvents).toEqual([]);
    const duplicated = applyProjectCommand(project, previewProjectCommand(project, duplicateLoadsCommand(project, ["load-b"])));
    expect(duplicated.loads).toHaveLength(4); expect(duplicated.loads[3].id).not.toBe("load-b");
    duplicated.loads[3].source.reference = "Changed"; expect(project.loads[1].source.reference).not.toBe("Changed");
  });
  it("revalidates mutated previews and rejects stale revisions and foreign projects", () => {
    const project = fixture(), preview = previewProjectCommand(project, { kind: "loads.patch", ids: ["load-a"], patch: { rating: 4 } });
    expect(() => applyProjectCommand({ ...project, revision: project.revision + 1 }, preview)).toThrow(/stale/);
    expect(() => applyProjectCommand({ ...project, id: "other" }, preview)).toThrow(/stale/);
    if (preview.command.kind === "loads.patch") preview.command.patch.rating = Infinity;
    expect(() => applyProjectCommand(project, preview)).toThrow(/finite/);
  });
  it("rejects hidden identifier patches and partially valid batches atomically", () => {
    const project = fixture();
    expect(previewProjectCommand(project, { kind: "loads.patch", ids: ["load-a"], patch: { id: "replacement" } as never }).errors.join(" ")).toMatch(/cannot be changed/);
    const preview = previewProjectCommand(project, { kind: "batch", commands: [{ kind: "loads.patch", ids: ["load-a"], patch: { rating: 5 } }, { kind: "loads.patch", ids: ["missing"], patch: { rating: 3 } }] });
    expect(preview.errors).toHaveLength(1); expect(project.loads[0].rating).toBe(2.3);
  });
});

describe("reviewable clipboard rows", () => {
  it("round-trips copied data with new IDs, detached wiring and preserved provenance", () => {
    const project = fixture(); const result = parseLoadRows(copyLoadRows(project, ["load-a", "load-c"]));
    expect(result.errors).toEqual([]); expect(result.loads.map((load) => load.rating)).toEqual([2.3, .46]);
    expect(result.loads.every((load) => !load.boardId && !load.circuitId && !project.loads.some((old) => old.id === load.id))).toBe(true);
    expect(result.loads[0].source).toEqual(project.loads[0].source);
  });
  it("parses exact CSV and quoted TSV numeric data", () => {
    const csv = LOAD_ROW_HEADERS.join(",") + '\n"Heater, measured",2.3,kw,230,single,1,2,8,9,L2,Site meter';
    const result = parseLoadRows(csv);
    expect(result.errors).toEqual([]); expect(result.loads[0]).toMatchObject({ name: "Heater, measured", rating: 2.3, quantity: 2, hoursPerDay: 8, phase: "L2" });
    const tsv = LOAD_ROW_HEADERS.join("\t") + '\n"Quoted\tname"\t2.3\tkw\t230\tsingle\t1\t1\t8\t0\tL1\tEntered';
    expect(parseLoadRows(tsv).loads[0].name).toBe("Quoted\tname");
  });
  it("rejects every row when any value is invalid; no formula execution or coercion", () => {
    const headers = LOAD_ROW_HEADERS.join(",");
    for (const rating of ["=2+2", "NaN", "Infinity", "0x10", ""]) expect(parseLoadRows(headers + `\nBad,${rating},kw,230,single,1,1,8,0,L1,Entered`).errors.length).toBeGreaterThan(0);
    expect(parseLoadRows(headers + '\n"unclosed').errors.join(" ")).toMatch(/Unclosed/);
    expect(parseLoadRows("name,rating\nPartial,2").errors.join(" ")).toMatch(/Required columns/);
    const copied = JSON.parse(copyLoadRows(fixture(), ["load-a", "load-b"])); copied.rows[1].pf = 0;
    expect(parseLoadRows(JSON.stringify(copied)).loads).toEqual([]);
  });
});

describe("data-bound radial graph and export", () => {
  it("renders each board-only load once and honors the upstream hierarchy", () => {
    const project = fixture(); project.circuits.push(createCircuit("board-a", { id: "circuit-extra" })); delete project.loads[0].circuitId;
    const graph = buildDiagramSnapshot(project);
    expect(graph.nodes.filter((node) => node.objectId === "load-a")).toHaveLength(1);
    expect(graph.edges.filter((edge) => edge.to === "load:load-a")).toEqual([{ from: "board:board-a", to: "load:load-a", label: "Board-only assignment" }]);
    expect(graph.edges.some((edge) => edge.from === "board:board-a" && edge.to === "board:board-b")).toBe(true);
  });
  it("preserves manual positions across recalculation and keeps disconnected loads edgeless", () => {
    const project = fixture(); project.diagram = getDiagramSettings(project); project.diagram.positions["load:load-a"] = { x: 917, y: 563 };
    delete project.loads[2].boardId; delete project.loads[2].circuitId;
    const graph = buildDiagramSnapshot(project); expect(graph.nodes.find((node) => node.id === "load:load-a")?.x).toBe(917 + graph.offsetX);
    expect(graph.edges.some((edge) => edge.to === "load:load-c")).toBe(false);
    expect(Object.keys(autoLayoutPositions(project))).toHaveLength(8);
  });
  it("exports real vector topology and escapes all user text", () => {
    const project = fixture(); project.loads[0].name = '<script>alert("x")</script>';
    const svg = diagramSVG(buildDiagramSnapshot(project));
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"'); expect(svg).toContain("&lt;script&gt;"); expect(svg).not.toContain("<script>"); expect(svg).toContain("<path");
    expect(svg).toContain("Single-source radial model");
  });
});
