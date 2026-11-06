import { describe, expect, it } from "vitest";
import {
  createCircuit,
  createLoad,
  createProject,
} from "../src/domain/project";
import type { Cable } from "../src/domain/types";
import { assessEndpointRoute } from "../src/engine/feeders";

function fixture() {
  const project = createProject();
  const cable: Cable = {
    lengthM: 100,
    resistanceOhmPerKm: 1,
    reactanceOhmPerKm: 0,
    baseAmpacityA: 15,
    correctionFactors: [1],
    voltageDropLimitPercent: 5,
    source: "Independent entered conductor test values",
  };
  project.boards[0].feeder = structuredClone(cable);
  const circuit = createCircuit(project.boards[0].id, {
    cable: structuredClone(cable),
  });
  const target = createLoad({
    entryMode: "amps",
    rating: 10,
    pf: 0.5,
    phase: "L1",
    reactive: "lagging",
    boardId: project.boards[0].id,
    circuitId: circuit.id,
  });
  const other = createLoad({
    entryMode: "amps",
    rating: 10,
    pf: 0.5,
    phase: "L2",
    reactive: "leading",
    boardId: project.boards[0].id,
  });
  project.circuits = [circuit];
  project.loads = [target, other];
  return { project, target, other, circuit };
}

describe("feeder conductor capacity and supported evidence", () => {
  it("fails the common cable ampacity when neutral current exceeds each phase current", () => {
    const { project, target } = fixture();
    const route = assessEndpointRoute(project, target.id);
    const feeder = route.segments[0];

    // L1 lags 0° by 60°; L2 leads -120° by 60°.
    // Both 10 A currents point at -60°, so the neutral carries 20 A.
    expect(feeder.phaseCurrents.L1).toBeCloseTo(10, 10);
    expect(feeder.phaseCurrents.L2).toBeCloseTo(10, 10);
    expect(feeder.phaseCurrents.L3).toBe(0);
    expect(feeder.neutralA).toBeCloseTo(20, 10);
    expect(feeder.currentA).toBeCloseTo(20, 10);
    expect(feeder.capacityA).toBe(15);
    expect(feeder.capacityAssessment).toBe("failed");
    expect(route.segments[1].currentA).toBeCloseTo(10, 10);
    expect(route.segments[1].capacityAssessment).toBe("passed");

    // A satisfactory voltage drop does not overwrite a failed ampacity check.
    expect(route.assessment).toBe("passed");
    expect(feeder.capacityAssessment).toBe("failed");
  });

  it("marks a mixed AC/DC feeder unsupported without inventing zero currents or an ampacity pass", () => {
    const { project, target, other } = fixture();
    Object.assign(other, { connection: "dc", voltage: 48, pf: 1 });
    const route = assessEndpointRoute(project, target.id);
    const feeder = route.segments[0];

    expect(route.complete).toBe(false);
    expect(route.assessment).toBe("incomplete");
    expect(feeder.capacityAssessment).toBe("unsupported");
    expect(feeder.currentA).toBeNull();
    expect(feeder.neutralA).toBeNull();
    expect(feeder.phaseCurrents).toEqual({ L1: null, L2: null, L3: null });
    expect(feeder.lossW).toBeNull();
    expect(route.issues).toContainEqual(
      expect.objectContaining({
        id: `${project.boards[0].id}-boundary`,
        assessment: "unsupported",
      }),
    );
    expect(route.segments[1].capacityAssessment).toBe("passed");
  });

  it("keeps ampacity incomplete when current-angle evidence or the sourced rating is absent", () => {
    const { project, target, other } = fixture();
    other.pfKind = "true";
    const missingAngle = assessEndpointRoute(project, target.id).segments[0];
    expect(missingAngle.capacityAssessment).toBe("incomplete");
    expect(missingAngle.currentA).toBeNull();
    expect(missingAngle.neutralA).toBeNull();

    other.pfKind = "displacement";
    project.boards[0].feeder!.source = "";
    const missingSource = assessEndpointRoute(project, target.id).segments[0];
    expect(missingSource.currentA).toBeCloseTo(20, 10);
    expect(missingSource.capacityA).toBeUndefined();
    expect(missingSource.capacityAssessment).toBe("incomplete");
  });
});
