import { describe, expect, it } from "vitest";
import {
  createCircuit,
  createLoad,
  createProject,
} from "../src/domain/project";
import { assessCircuit } from "../src/engine/assessments";

function fixture() {
  const project = createProject();
  const circuit = createCircuit(project.boards[0].id, {
    protectiveA: 15,
    cable: {
      lengthM: 10,
      resistanceOhmPerKm: 1,
      reactanceOhmPerKm: 0,
      baseAmpacityA: 15,
      correctionFactors: [1],
      voltageDropLimitPercent: 5,
      source: "Independent entered conductor test values",
    },
  });
  project.circuits = [circuit];
  const load = createLoad({
    entryMode: "amps",
    rating: 10,
    boardId: circuit.boardId,
    circuitId: circuit.id,
  });
  project.loads = [load];
  return { project, circuit, load };
}

describe("circuit current evidence and conductor capacity", () => {
  it("uses actual DC current instead of zero AC phasors for a DC branch", () => {
    const { project, circuit, load } = fixture();
    Object.assign(load, { connection: "dc", voltage: 24, rating: 24 });
    const result = assessCircuit(project, circuit.id);
    expect(result.designCurrentA).toBe(24);
    expect(
      result.checks.find((check) => check.id === "ampacity"),
    ).toMatchObject({
      value: 24,
      limit: 15,
      assessment: "failed",
    });
    expect(
      result.checks.find((check) => check.id === "protection-rating")
        ?.assessment,
    ).toBe("failed");
    expect(
      result.checks.find((check) => check.id === "voltage-drop")?.assessment,
    ).toBe("unsupported");
  });

  it("does not pass current checks across incompatible supplies", () => {
    const { project, circuit, load } = fixture();
    project.loads.push(
      createLoad({ ...load, id: "separate-dc", connection: "dc", voltage: 48 }),
    );
    for (const firstConnection of ["single", "dc"] as const) {
      load.connection = firstConnection;
      const result = assessCircuit(project, circuit.id);
      expect(result.designCurrentA).toBeNull();
      expect(
        result.checks.find((check) => check.id === "load-data")?.assessment,
      ).toBe("unsupported");
      expect(
        result.checks.find((check) => check.id === "ampacity")?.assessment,
      ).toBe("unsupported");
      expect(
        result.checks.find((check) => check.id === "protection-rating")
          ?.assessment,
      ).toBe("unsupported");
    }
  });

  it("checks neutral ampacity independently of the phase-current envelope", () => {
    const { project, circuit, load } = fixture();
    Object.assign(load, { pf: 0.5, phase: "L1", reactive: "lagging" });
    load.rating = 20;
    project.loads.push(
      createLoad({
        ...load,
        id: "capacitive-line-pair",
        connection: "line-line",
        phasePair: ["L1", "L2"],
        voltage: 400,
        entryMode: "complex",
        rating: 0,
        reactiveKvar: -4,
      }),
    );
    const result = assessCircuit(project, circuit.id);
    // L1 load: 20 A at -60 degrees. A 4 kvar line-pair capacitor contributes
    // 10 A at 120 degrees on L1, and 10 A at -60 degrees on L2.
    // Each resultant phase is 10 A; the neutral still carries 20 A.
    expect(result.designCurrentA).toBeCloseTo(10, 10);
    const capacity = result.checks.find((check) => check.id === "ampacity");
    expect(capacity?.value).toBeCloseTo(20, 10);
    expect(capacity?.assessment).toBe("failed");
    // This aggregate two-wire drop formula must not be applied across different phases.
    expect(
      result.checks.find((check) => check.id === "voltage-drop")?.assessment,
    ).toBe("incomplete");
  });

  it("preserves incomplete status when only true PF is supplied", () => {
    const { project, circuit, load } = fixture();
    load.pfKind = "true";
    const result = assessCircuit(project, circuit.id);
    expect(result.designCurrentA).toBeNull();
    expect(
      result.checks.find((check) => check.id === "ampacity"),
    ).toMatchObject({
      assessment: "incomplete",
      value: undefined,
    });
    expect(
      result.checks.find((check) => check.id === "protection-rating")
        ?.assessment,
    ).toBe("incomplete");
  });
});
