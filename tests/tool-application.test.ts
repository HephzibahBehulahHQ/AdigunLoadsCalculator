import { describe, expect, it } from "vitest";
import {
  createCircuit,
  createLoad,
  createProject,
} from "../src/domain/project";
import { applyProjectCommand } from "../src/commands/projectCommands";
import {
  previewToolApplication,
  toolApplicationInfo,
  type ToolTarget,
} from "../src/tools/apply";
import { tools } from "../src/tools";
import { simulateEnergy } from "../src/engine/simulation";

function fixture() {
  const project = createProject("Tool application fixture");
  project.loads = [
    createLoad({
      id: "load",
      name: "Entered load",
      rating: 2.3,
      voltage: 230,
      pf: 1,
      quantity: 1,
    }),
  ];
  project.circuits = [
    createCircuit(project.boards[0].id, {
      id: "circuit",
      cable: {
        lengthM: 30,
        resistanceOhmPerKm: 5,
        reactanceOhmPerKm: 0,
        source: "Independent entered cable example",
      },
    }),
  ];
  project.evSessions = [
    {
      id: "ev",
      name: "Entered EV session",
      arrivalHour: 18,
      departureHour: 7,
      requiredKWh: 5,
      chargerKW: 7.4,
      vehicleKW: 7.4,
      efficiency: 0.9,
      siteLimitKW: 10,
      phase: "L1",
    },
  ];
  return project;
}

describe("calculator-to-project application", () => {
  it("supports a labelled trace attachment for every tool without changing physical inputs", () => {
    for (const tool of tools) {
      const project = fixture();
      const preview = previewToolApplication(project, {
        toolId: tool.id,
        values: tool.exampleInputs,
        mode: "note",
        target: { kind: "load", id: "load" },
      });
      expect(preview.errors, tool.id).toEqual([]);
      const next = applyProjectCommand(project, preview);
      expect(next.loads[0].rating, tool.id).toBe(2.3);
      expect(next.loads[0].notes, tool.id).toContain(`[${tool.id} calculation`);
      expect(next.loads[0].notes, tool.id).toContain("Inputs:");
      expect(next.loads[0].notes, tool.id).toContain("Method:");
      expect(project.loads[0].notes, tool.id).toBe("");
    }
  });
  it("validates each declared direct mapping against a real project target", () => {
    for (const tool of tools.filter((item) => toolApplicationInfo(item.id))) {
      const project = fixture();
      const info = toolApplicationInfo(tool.id)!;
      const values = {
        ...tool.exampleInputs,
        source: "Explicit numerical fixture; not manufacturer evidence",
        installation: "Entered test method and conductor count",
        ruleSource: "Entered test rule",
        deviceSource: "Entered test device data",
        cableSource: "Entered test cable data",
        geography: "Analytical test area",
        period: "2026 test period",
      };
      if (tool.id === "T46")
        Object.assign(values, {
          connected: 2.3,
          individualMaxima: 2.3,
          coincidentMaximum: 1.15,
          operating: 1.15,
        });
      const target: ToolTarget = {
        kind: info.targetKind,
        id:
          info.targetKind === "load"
            ? "load"
            : info.targetKind === "circuit"
              ? "circuit"
              : info.targetKind === "ev"
                ? "ev"
                : project.id,
      };
      const preview = previewToolApplication(project, {
        toolId: tool.id,
        values,
        mode: "fields",
        target,
      });
      expect(preview.errors, tool.id).toEqual([]);
      const next = applyProjectCommand(project, preview);
      expect(next.id).toBe(project.id);
      expect(next.revision).toBe(project.revision);
      expect(preview.changes.length, tool.id).toBeGreaterThan(0);
    }
  });
  it("keeps electrical input and shaft power semantics distinct", () => {
    const project = fixture();
    const motor = applyProjectCommand(
      project,
      previewToolApplication(project, {
        toolId: "T10",
        values: {
          shaft: 7.5,
          efficiency: 0.9,
          pf: 0.85,
          voltage: 400,
          connection: "three",
        },
        mode: "fields",
        target: { kind: "load", id: "load" },
      }),
    );
    expect(motor.loads[0]).toMatchObject({
      entryMode: "motor",
      rating: 7.5,
      efficiency: 0.9,
      connection: "three",
    });
    const electrical = applyProjectCommand(
      project,
      previewToolApplication(project, {
        toolId: "T09",
        values: { output: 7.5, ratio: 0.9, mode: "mechanical" },
        mode: "fields",
        target: { kind: "load", id: "load" },
      }),
    );
    expect(electrical.loads[0].rating).toBeCloseTo(8.333333333333334, 12);
    expect(electrical.loads[0]).toMatchObject({
      entryMode: "kw",
      efficiency: 1,
    });
  });
  it("copies per-unit DC quantities and refuses to pretend a multi-day period is one daily schedule", () => {
    const project = fixture();
    const next = applyProjectCommand(
      project,
      previewToolApplication(project, {
        toolId: "T02",
        values: { voltage: 24, current: 5, quantity: 3, hours: 4 },
        target: { kind: "load", id: "load" },
        mode: "fields",
      }),
    );
    expect(next.loads[0]).toMatchObject({
      rating: 0.12,
      quantity: 3,
      connection: "dc",
      hoursPerDay: 4,
    });
    expect(() =>
      previewToolApplication(project, {
        toolId: "T02",
        values: { voltage: 24, current: 5, quantity: 3, hours: 25 },
        target: { kind: "load", id: "load" },
        mode: "fields",
      }),
    ).toThrow(/daily schedule/);
    project.loads[0].boardId = project.boards[0].id;
    project.loads[0].circuitId = "circuit";
    expect(
      previewToolApplication(project, {
        toolId: "T02",
        values: { voltage: 24, current: 5, quantity: 3, hours: 4 },
        target: { kind: "load", id: "load" },
        mode: "fields",
      }).errors.join(" "),
    ).toMatch(/DC loads/);
  });
  it("applies sourced capacity factors without applying the correction twice", () => {
    const project = fixture();
    const next = applyProjectCommand(
      project,
      previewToolApplication(project, {
        toolId: "T20",
        values: {
          base: 30,
          temperatureFactor: 0.9,
          groupingFactor: 0.8,
          otherFactor: 1,
          designCurrent: 20,
          source: "Test rating evidence",
          installation: "Test installation evidence",
        },
        target: { kind: "circuit", id: "circuit" },
        mode: "fields",
      }),
    );
    expect(next.circuits[0].cable).toMatchObject({
      lengthM: 30,
      baseAmpacityA: 30,
      correctionFactors: [0.9, 0.8, 1],
    });
    expect(
      30 *
        next.circuits[0].cable!.correctionFactors!.reduce((a, b) => a * b, 1),
    ).toBeCloseTo(21.6, 12);
  });
  it("preserves missing evidence in notes but refuses direct engineering-field application", () => {
    const project = fixture(),
      tool = tools.find((item) => item.id === "T20")!;
    expect(() =>
      previewToolApplication(project, {
        toolId: tool.id,
        values: tool.exampleInputs,
        target: { kind: "circuit", id: "circuit" },
        mode: "fields",
      }),
    ).toThrow(/missing or unsupported evidence/);
    const next = applyProjectCommand(
      project,
      previewToolApplication(project, {
        toolId: tool.id,
        values: tool.exampleInputs,
        target: { kind: "circuit", id: "circuit" },
        mode: "note",
      }),
    );
    expect(next.circuits[0].notes).toContain("incomplete");
    expect(next.circuits[0].cable!.baseAmpacityA).toBeUndefined();
  });
  it("conserves the supplied clipped PV profile in the project time-step model", () => {
    const project = fixture();
    const profile = Array.from({ length: 24 }, (_, hour) =>
      hour >= 8 && hour < 16 ? 1 : 0,
    );
    const values = {
      mode: "profile",
      capacity: 4,
      loss: 0.1,
      efficiency: 0.9,
      profile: profile.join(","),
      interval: 1,
      inverterLimit: 2,
      source: "Independent eight-hour rectangular fixture",
    };
    const next = applyProjectCommand(
      project,
      previewToolApplication(project, {
        toolId: "T39",
        values,
        target: { kind: "energy" },
        mode: "fields",
      }),
    );
    expect(next.energy.pvPerformanceRatio).toBe(1);
    expect(
      next.energy.pvHourlyProfile!.reduce((a, b) => a + b, 0) *
        next.energy.pvKW,
    ).toBeCloseTo(16, 12);
    expect(simulateEnergy(next).generationKWh).toBeCloseTo(16, 12);
    expect(() =>
      previewToolApplication(project, {
        toolId: "T39",
        values: { ...values, interval: 0.5 },
        target: { kind: "energy" },
        mode: "fields",
      }),
    ).toThrow(/24 one-hour/);
  });
  it("does not treat a daily PV estimate as a chronological profile", () => {
    const project = fixture();
    project.energy.pvHourlyProfile = Array(24).fill(0.2);
    const next = applyProjectCommand(
      project,
      previewToolApplication(project, {
        toolId: "T39",
        values: {
          mode: "daily",
          capacity: 5,
          loss: 0.1,
          efficiency: 0.96,
          sunHours: 4,
        },
        target: { kind: "energy" },
        mode: "fields",
      }),
    );
    expect(next.energy.pvHourlyProfile).toBeUndefined();
    expect(next.energy.pvPerformanceRatio).toBeCloseTo(0.864, 12);
  });
  it("requires coincidence input totals to match the current project boundary", () => {
    const project = fixture();
    expect(() =>
      previewToolApplication(project, {
        toolId: "T46",
        values: {
          connected: 20,
          individualMaxima: 16,
          coincidentMaximum: 12,
          operating: 10,
        },
        target: { kind: "project" },
        mode: "fields",
      }),
    ).toThrow(/do not match/);
  });
  it("rejects foreign targets and preserves evidence when attaching to a board", () => {
    const project = fixture();
    expect(() =>
      previewToolApplication(project, {
        toolId: "T03",
        values: { power: 2.3, voltage: 230, pf: 1, reactive: "lagging" },
        target: { kind: "load", id: "missing" },
        mode: "fields",
      }),
    ).toThrow(/existing load/);
    const next = applyProjectCommand(
      project,
      previewToolApplication(project, {
        toolId: "T01",
        values: { voltage: 230, resistance: 23 },
        target: { kind: "board", id: project.boards[0].id },
        mode: "note",
      }),
    );
    expect(next.boards[0].notes).toContain("Current: 10 A");
    expect(next.boards[0].ratedA).toBe(project.boards[0].ratedA);
  });
});
