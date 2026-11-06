import { describe, it, expect } from "vitest";
import { createProject, createLoad } from "../src/domain/project";
import {
  createScenario,
  compareProjectInputs,
  applyInputDifferences,
  equipmentTemplate,
  instantiateEquipment,
  runSensitivity,
} from "../src/domain/workspace";
describe("workspace input isolation", () => {
  it("freezes scenario assumptions independently and bounds nested snapshots", () => {
    const p = createProject("Baseline");
    p.loads = [createLoad({ rating: 2.3 })];
    const scenario = createScenario(p, "Alternative");
    p.loads[0].rating = 9;
    expect(scenario.scenarioBaseline?.project.loads[0].rating).toBe(2.3);
    const second = createScenario(scenario, "Second");
    expect(second.scenarioBaseline?.project).not.toHaveProperty(
      "scenarioBaseline",
    );
    expect(second.id).not.toBe(scenario.id);
  });
  it("applies only selected input differences and rejects a stale revision", () => {
    const p = createProject();
    p.loads = [createLoad({ rating: 2, hoursPerDay: 8 })];
    const next = structuredClone(p);
    next.loads[0].rating = 4;
    next.loads[0].hoursPerDay = 3;
    const changes = compareProjectInputs(p, next);
    const rating = changes.find((c) => c.field === "rating")!;
    const applied = applyInputDifferences(p, p.revision, changes, [rating.key]);
    expect(applied.loads[0].rating).toBe(4);
    expect(applied.loads[0].hoursPerDay).toBe(8);
    expect(p.loads[0].rating).toBe(2);
    expect(() =>
      applyInputDifferences(
        { ...p, revision: p.revision + 1 },
        p.revision,
        changes,
        [rating.key],
      ),
    ).toThrow(/changed/);
  });
  it("detaches reusable equipment from project assignments and creates unique instances", () => {
    const template = equipmentTemplate(
      createLoad({ boardId: "board", circuitId: "circuit", locked: true }),
    );
    expect(template.boardId).toBeUndefined();
    expect(template.circuitId).toBeUndefined();
    expect(template.locked).toBe(false);
    const a = instantiateEquipment(template),
      b = instantiateEquipment(template);
    expect(a.id).not.toBe(b.id);
    a.rating = 9;
    expect(template.rating).not.toBe(9);
  });
  it("calculates a declared duty sensitivity without changing on-state design or the original project", () => {
    const p = createProject();
    p.loads = [createLoad({ rating: 2.3, hoursPerDay: 8, duty: 1 })];
    const rows = runSensitivity(p, "duty", [0.5, 1], p.loads[0].id);
    expect(rows[0].dailyKWh).toBeCloseTo(9.2);
    expect(rows[1].dailyKWh).toBeCloseTo(18.4);
    expect(rows[0].designKW).toBeCloseTo(rows[1].designKW);
    expect(p.loads[0].duty).toBe(1);
    expect(() => runSensitivity(p, "duty", [1.2], p.loads[0].id)).toThrow(
      /between/,
    );
  });
});
