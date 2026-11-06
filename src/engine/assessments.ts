import { type Assessment, type Project } from "../domain/types";
import {
  addComplex,
  magnitude,
  normalizeLoad,
  validateTopology,
  zeroPhases,
  PHASES,
} from "./electrical";

export interface EngineeringCheck {
  id: string;
  label: string;
  assessment: Assessment;
  value?: number;
  limit?: number;
  unit?: string;
  detail: string;
  formula?: string;
  source?: string;
}
export interface CircuitAssessment {
  circuitId: string;
  designCurrentA: number | null;
  checks: EngineeringCheck[];
  complete: boolean;
  revision: number;
}
const positive = (value: number | undefined) =>
  typeof value === "number" && Number.isFinite(value) && value > 0;
const nonnegative = (value: number | undefined) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

/** Manual-data circuit worksheets. Every check is independent; no aggregate certification is produced. */
export function assessCircuit(
  project: Project,
  circuitId: string,
): CircuitAssessment {
  const circuit = project.circuits.find((item) => item.id === circuitId);
  if (!circuit) throw new Error("Circuit does not exist.");
  const loads = project.loads.filter((load) => load.circuitId === circuitId);
  const normalized = loads.map(normalizeLoad);
  const checks: EngineeringCheck[] = [];
  const currents = zeroPhases();
  for (const load of normalized.filter((item) => item.valid))
    for (const phase of PHASES)
      currents[phase] = addComplex(currents[phase], load.phaseCurrents[phase]);
  const dc = loads[0]?.connection === "dc";
  const compatible = loads.every(
    (load) =>
      (load.connection === "dc") === dc &&
      (!dc || load.voltage === loads[0]?.voltage),
  );
  const relatedIds = new Set([
    circuit.id,
    circuit.boardId,
    ...loads.map((load) => load.id),
  ]);
  const topologyIncomplete = validateTopology(project).some(
    (issue) => issue.entityId && relatedIds.has(issue.entityId),
  );
  const completeLoads =
    normalized.every((load) => load.valid && load.reactiveKvar !== null) &&
    loads.length > 0 &&
    !topologyIncomplete &&
    compatible;
  // Duty/diversity do not derate running current. DC has no AC phase phasor.
  const runningCurrentA = dc
    ? normalized.reduce((sum, load) => sum + load.currentA, 0)
    : Math.max(0, ...PHASES.map((phase) => magnitude(currents[phase])));
  const designCurrentA =
    completeLoads && Number.isFinite(runningCurrentA) ? runningCurrentA : null;
  const neutralA = magnitude(
    addComplex(addComplex(currents.L1, currents.L2), currents.L3),
  );
  // The entered cable ampacity is common to all current-carrying conductors.
  const conductorCurrentA =
    designCurrentA === null
      ? null
      : Math.max(designCurrentA, dc ? 0 : neutralA);
  if (!completeLoads)
    checks.push({
      id: "load-data",
      label: "Load inputs",
      assessment: compatible ? "incomplete" : "unsupported",
      detail: !compatible
        ? "A circuit requires one compatible AC or DC supply; separate mixed supplies or incompatible DC voltages."
        : loads.length
          ? "Correct invalid loads or supply displacement-PF/complex-power data before circuit assessment."
          : "Assign at least one load to the circuit.",
    });
  const cable = circuit.cable;
  let correctedAmpacity: number | undefined;
  if (
    !cable ||
    !positive(cable.baseAmpacityA) ||
    !cable.source?.trim() ||
    !cable.correctionFactors?.length ||
    !cable.correctionFactors.every(
      (factor) => Number.isFinite(factor) && factor > 0,
    )
  ) {
    checks.push({
      id: "ampacity",
      label: "Corrected conductor capacity",
      assessment: "incomplete",
      detail:
        "Enter a sourced base ampacity and every applicable correction factor. Use an explicit factor of 1 when no derating applies.",
    });
  } else {
    correctedAmpacity =
      cable.baseAmpacityA! *
      cable.correctionFactors.reduce((product, factor) => product * factor, 1);
    checks.push({
      id: "ampacity",
      label: "Running current versus conductor capacity",
      assessment: !compatible
        ? "unsupported"
        : conductorCurrentA === null
          ? "incomplete"
          : conductorCurrentA <= correctedAmpacity
            ? "passed"
            : "failed",
      value: conductorCurrentA ?? undefined,
      limit: correctedAmpacity,
      unit: "A",
      detail:
        "Checks the highest phase or neutral current against the entered common conductor capacity under its stated installation conditions.",
      formula: "Iz = Ibase × ∏ correction factors; max(Iphase, Ineutral) ≤ Iz",
      source: cable.source,
    });
  }
  if (
    designCurrentA === null ||
    !positive(circuit.protectiveA) ||
    correctedAmpacity === undefined
  )
    checks.push({
      id: "protection-rating",
      label: "Device rating coordination",
      assessment: compatible ? "incomplete" : "unsupported",
      detail:
        "A valid load current, protective-device current and sourced corrected cable ampacity are required.",
    });
  else
    checks.push({
      id: "protection-rating",
      label: "Device rating coordination",
      assessment:
        designCurrentA <= circuit.protectiveA! &&
        circuit.protectiveA! <= correctedAmpacity
          ? "passed"
          : "failed",
      value: circuit.protectiveA,
      unit: "A",
      detail: `Entered-current relationship only: ${designCurrentA.toFixed(2)} ≤ ${circuit.protectiveA} ≤ ${correctedAmpacity.toFixed(2)} A. Operating characteristics still require separate verification.`,
      formula: "Ib ≤ In ≤ Iz",
      source: cable?.source,
    });
  checks.push({
    id: "device-characteristic",
    label: "Operating characteristic / disconnection",
    assessment: "incomplete",
    detail:
      "Record the applicable device curve, conventional operating current, earthing arrangement and disconnection criterion. A current rating alone cannot establish this check.",
  });
  const connection = loads[0]?.connection;
  const sameConnection = loads.every(
    (load) =>
      load.connection === connection &&
      load.voltage === loads[0]?.voltage &&
      (connection !== "single" || load.phase === loads[0]?.phase) &&
      (connection !== "line-line" ||
        [...(load.phasePair ?? [])].sort().join() ===
          [...(loads[0].phasePair ?? [])].sort().join()),
  );
  if (
    designCurrentA === null ||
    !cable ||
    !nonnegative(cable.lengthM) ||
    !nonnegative(cable.resistanceOhmPerKm) ||
    !sameConnection ||
    connection === "dc"
  ) {
    checks.push({
      id: "voltage-drop",
      label: "Circuit voltage drop",
      assessment: connection === "dc" ? "unsupported" : "incomplete",
      detail:
        "Enter route length and per-conductor resistance, and use compatible AC load connections. The standalone DC loop worksheet accepts complete loop resistance.",
    });
  } else {
    const realKW = normalized.reduce((sum, load) => sum + load.operatingKW, 0);
    const q = normalized.reduce(
      (sum, load) => sum + (load.reactiveKvar ?? 0),
      0,
    );
    const s = Math.hypot(realKW, q);
    const cos = s === 0 ? 1 : realKW / s;
    const sin = s === 0 ? 0 : q / s;
    if (Math.abs(q) > 1e-9 && !nonnegative(cable.reactanceOhmPerKm))
      checks.push({
        id: "voltage-drop",
        label: "Circuit voltage drop",
        assessment: "incomplete",
        detail:
          "Reactive load requires entered conductor reactance for this AC voltage-drop model.",
      });
    else {
      const factor = connection === "three" ? Math.sqrt(3) : 2;
      const volts =
        ((factor * designCurrentA * cable.lengthM) / 1000) *
        (cable.resistanceOhmPerKm! * cos +
          (cable.reactanceOhmPerKm ?? 0) * sin);
      const percent = (volts / loads[0].voltage) * 100;
      checks.push({
        id: "voltage-drop",
        label: "Circuit voltage drop",
        assessment:
          !positive(cable.voltageDropLimitPercent) || !cable.source?.trim()
            ? "incomplete"
            : Math.abs(percent) <= cable.voltageDropLimitPercent!
              ? "passed"
              : "failed",
        value: percent,
        limit: cable.voltageDropLimitPercent,
        unit: "%",
        detail: `${volts.toFixed(3)} V on this branch under the entered impedance model. ${positive(cable.voltageDropLimitPercent) ? "Checks the entered design limit." : "Enter a sourced or user-selected limit."} ${cable.source?.trim() ? "" : "Record impedance/model provenance."} Upstream route contributions require separate assessment.`,
        formula: `${connection === "three" ? "√3" : "2"} × I × Lkm × (R·cosφ + X·sinφ)`,
        source: cable.source,
      });
    }
  }
  if (
    !positive(circuit.breakingCapacityKA) ||
    !positive(circuit.prospectiveFaultKA)
  )
    checks.push({
      id: "breaking-capacity",
      label: "Breaking capacity",
      assessment: "incomplete",
      detail:
        "Enter verified prospective fault current and the device breaking capacity at the applicable voltage.",
    });
  else
    checks.push({
      id: "breaking-capacity",
      label: "Breaking capacity",
      assessment:
        circuit.breakingCapacityKA! >= circuit.prospectiveFaultKA!
          ? "passed"
          : "failed",
      value: circuit.prospectiveFaultKA,
      limit: circuit.breakingCapacityKA,
      unit: "kA",
      detail:
        "Numerical comparison of entered ratings only; manufacturer applicability and coordination remain required.",
      formula: "Device breaking capacity ≥ prospective fault current",
    });
  return {
    circuitId,
    designCurrentA,
    checks,
    complete: checks.every(
      (check) => !["incomplete", "unsupported"].includes(check.assessment),
    ),
    revision: project.revision,
  };
}

export function voltageDrop(input: {
  currentA: number;
  lengthM: number;
  resistanceOhmPerKm: number;
  reactanceOhmPerKm?: number;
  pf: number;
  voltage: number;
  connection: "single" | "three" | "dc";
  leading?: boolean;
}): {
  volts: number;
  percent: number;
  receivingVoltage: number;
  lossW: number;
} {
  for (const [key, value] of Object.entries(input))
    if (typeof value === "number" && !Number.isFinite(value))
      throw new Error(`${key} must be finite.`);
  if (
    input.currentA < 0 ||
    input.lengthM < 0 ||
    input.resistanceOhmPerKm < 0 ||
    input.voltage <= 0 ||
    input.pf <= 0 ||
    input.pf > 1 ||
    (input.reactanceOhmPerKm ?? 0) < 0
  )
    throw new Error("Invalid voltage-drop input.");
  const r = (input.lengthM / 1000) * input.resistanceOhmPerKm;
  const x = (input.lengthM / 1000) * (input.reactanceOhmPerKm ?? 0);
  const factor = input.connection === "three" ? Math.sqrt(3) : 2;
  const cos = input.connection === "dc" ? 1 : input.pf;
  const sin =
    input.connection === "dc"
      ? 0
      : Math.sqrt(1 - input.pf ** 2) * (input.leading ? -1 : 1);
  const volts = factor * input.currentA * (r * cos + x * sin);
  return {
    volts,
    percent: (volts / input.voltage) * 100,
    receivingVoltage: input.voltage - volts,
    lossW: (input.connection === "three" ? 3 : 2) * input.currentA ** 2 * r,
  };
}
