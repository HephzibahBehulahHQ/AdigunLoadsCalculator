import { describe, it, expect } from "vitest";
import {
  createProject,
  createLoad,
  createBoard,
  createCircuit,
} from "../src/domain/project";
import {
  mergeProjectObjects,
  replaceProjectContents,
} from "../src/import-export/projectDestination";
import { previewImport } from "../src/import-export/files";
describe("explicit project import destinations", () => {
  it("merges colliding object IDs into independent linked graphs without replacing site assumptions", () => {
    const p = createProject("Site"),
      board = createBoard({ name: "Original" }),
      circuit = createCircuit(board.id, { name: "Branch" });
    p.boards = [board];
    p.circuits = [circuit];
    p.loads = [
      createLoad({ name: "Heater", boardId: board.id, circuitId: circuit.id }),
    ];
    const incoming = structuredClone(p);
    incoming.name = "Imported";
    incoming.supply.limitA = 100;
    const merged = mergeProjectObjects(p, incoming);
    expect(merged.loads).toHaveLength(2);
    expect(merged.boards).toHaveLength(2);
    expect(merged.circuits).toHaveLength(2);
    expect(merged.loads[1].id).not.toBe(p.loads[0].id);
    expect(merged.loads[1].circuitId).toBe(merged.circuits[1].id);
    expect(merged.circuits[1].boardId).toBe(merged.boards[1].id);
    expect(merged.supply.limitA).toBe(p.supply.limitA);
    expect(merged.name).toBe("Site");
    expect(p.loads).toHaveLength(1);
  });
  it("replaces contents while retaining destination identity for undo and history", () => {
    const current = createProject("Current"),
      incoming = createProject("Incoming");
    incoming.loads = [createLoad({ rating: 2.3 })];
    const replaced = replaceProjectContents(current, incoming);
    expect(replaced.id).toBe(current.id);
    expect(replaced.createdAt).toBe(current.createdAt);
    expect(replaced.name).toBe("Incoming");
    expect(replaced.loads[0].id).toBe(incoming.loads[0].id);
    expect(current.loads).toHaveLength(0);
  });
  it("maps user CSV columns and explicit watt ratings without locale-dependent scaling", async () => {
    const file = new File(
      ["Appliance,Power,Supply\nHeater,2300,230"],
      "mapped.csv",
      { type: "text/csv" },
    );
    const result = await previewImport(file, {
      columns: { name: 0, rating: 1, voltage: 2 },
      ratingUnit: "W",
    });
    expect(result.errors).toEqual([]);
    expect(result.loads[0].rating).toBe(2.3);
    expect(result.loads[0].voltage).toBe(230);
    expect(result.loads[0].entryMode).toBe("kw");
    await expect(
      previewImport(file, { columns: { name: 0, rating: 0 } }),
    ).rejects.toThrow(/one supported field/);
  });
});
