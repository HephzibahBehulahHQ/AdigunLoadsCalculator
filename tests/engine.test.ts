import { describe, expect, it } from "vitest";
import {
  createCircuit,
  createLoad,
  createProject,
  validateProjectImport,
} from "../src/domain/project";
import {
  calculateProject,
  dailyProfile,
  normalizeLoad,
  validateTopology,
} from "../src/engine/electrical";
import {
  applyPhaseBalance,
  powerFactorCorrection,
  previewPhaseBalance,
  scheduleEV,
} from "../src/engine/planning";
import { assessCircuit, voltageDrop } from "../src/engine/assessments";
import {
  batteryStep,
  energyCharge,
  pvDailyEstimate,
  simulateEnergy,
  simulateRange,
  validateTariff,
} from "../src/engine/simulation";
import {
  createReferenceProject,
  REFERENCE_CASES,
} from "../src/data/reference-projects";
import type { BatterySettings, EVSession, Phase } from "../src/domain/types";

describe("independent electrical acceptance fixtures", () => {
  it("F01/F02: 2.3 kW / 230 V = 10 A; eight hours = 18.4 kWh and €5.52", () => {
    const project = createProject();
    project.loads = [
      createLoad({ name: "Entered heater", rating: 2.3, hoursPerDay: 8 }),
    ];
    const result = calculateProject(project);
    expect(result.phaseCurrents.L1).toBeCloseTo(10, 10);
    expect(result.dailyKWh).toBeCloseTo(18.4, 10);
    expect(result.dailyCost).toBeCloseTo(5.52, 10);
  });
  it("F03: energy duty never reduces on-state current", () => {
    const load = normalizeLoad(
      createLoad({ rating: 2.3, hoursPerDay: 8, duty: 0.5 }),
    );
    expect(load.energyKWh).toBeCloseTo(9.2, 10);
    expect(load.currentA).toBeCloseTo(10, 10);
  });
  it("F04: motor shaft rating converts once", () => {
    const motor = normalizeLoad(
      createLoad({
        entryMode: "motor",
        rating: 7.5,
        connection: "three",
        voltage: 400,
        efficiency: 0.9,
        pf: 0.85,
      }),
    );
    expect(motor.installedKW).toBeCloseTo(8.333333333333, 9);
    expect(motor.currentA).toBeCloseTo(14.1507418919, 9);
    const electrical = normalizeLoad(
      createLoad({
        rating: 7.5,
        connection: "three",
        voltage: 400,
        efficiency: 0.9,
        pf: 0.85,
      }),
    );
    expect(electrical.installedKW).toBe(7.5);
  });
  it("F05: leading/lagging cancellation preserves branch current", () => {
    const project = createProject();
    project.loads = [3, -3].map((q) =>
      createLoad({ entryMode: "complex", rating: 4, reactiveKvar: q }),
    );
    const result = calculateProject(project);
    expect(result.designKW).toBe(8);
    expect(result.reactiveKvar).toBe(0);
    expect(result.apparentKVA).toBe(8);
    expect(result.loads[0].currentA).toBeCloseTo(5000 / 230, 10);
  });
  it("F06: quarter-hour integration preserves average power", () => {
    const loads = [createLoad({ rating: 1, startHour: 0, hoursPerDay: 0.25 })];
    const quarter = dailyProfile(loads, 15);
    const hour = dailyProfile(loads, 60);
    expect(quarter[0].kw).toBe(1);
    expect(quarter[0].kWh).toBe(0.25);
    expect(hour[0].kw).toBe(0.25);
  });
  it("F07: balanced currents cancel neutral; one phase returns 10 A", () => {
    const project = createProject();
    project.loads = (["L1", "L2", "L3"] as Phase[]).map((phase) =>
      createLoad({ rating: 2.3, phase }),
    );
    expect(calculateProject(project).neutralA).toBeCloseTo(0, 10);
    project.loads = [project.loads[0]];
    expect(calculateProject(project).neutralA).toBeCloseTo(10, 10);
  });
  it("F08: two 0.4 Ω conductors at 10 A drop 8 V", () => {
    const result = voltageDrop({
      currentA: 10,
      lengthM: 100,
      resistanceOhmPerKm: 4,
      pf: 1,
      voltage: 230,
      connection: "dc",
    });
    expect(result.volts).toBe(8);
    expect(result.lossW).toBe(80);
  });
  it("F09: 10 kW PF correction 0.80 → 0.95 needs 4.213158948 kvar", () => {
    expect(powerFactorCorrection(10, 0.8, 0.95).compensationKvar).toBeCloseTo(
      4.2131589482,
      9,
    );
  });
  it("kVA and nameplate current entries never apply efficiency again", () => {
    const kva = normalizeLoad(
      createLoad({ entryMode: "kva", rating: 5, pf: 0.8, efficiency: 0.5 }),
    );
    const amps = normalizeLoad(
      createLoad({ entryMode: "amps", rating: 10, pf: 1, efficiency: 0.5 }),
    );
    expect(kva.installedKW).toBe(4);
    expect(kva.apparentKVA).toBeCloseTo(5, 12);
    expect(amps.installedKW).toBe(2.3);
  });
  it("L–L branch puts equal opposite currents on both lines, with no neutral", () => {
    const project = createProject();
    project.loads = [
      createLoad({
        connection: "line-line",
        phasePair: ["L1", "L2"],
        voltage: 400,
        rating: 4,
      }),
    ];
    const result = calculateProject(project);
    expect(result.phaseCurrents.L1).toBeCloseTo(10, 10);
    expect(result.phaseCurrents.L2).toBeCloseTo(10, 10);
    expect(result.phaseCurrents.L3).toBe(0);
    expect(result.neutralA).toBeCloseTo(0, 10);
  });
  it("reactive-only entry is supported without division by PF zero", () => {
    const result = normalizeLoad(
      createLoad({ entryMode: "complex", rating: 0, reactiveKvar: 2, pf: 0 }),
    );
    expect(result.valid).toBe(true);
    expect(result.apparentKVA).toBe(2);
    expect(result.currentA).toBeCloseTo(2000 / 230, 10);
  });
  it("true PF never invents displacement angle or Q", () => {
    const result = normalizeLoad(
      createLoad({ rating: 2, pf: 0.8, pfKind: "true" }),
    );
    expect(result.reactiveKvar).toBeNull();
    expect(result.apparentKVA).toBe(2.5);
    expect(
      result.issues.some((issue) => issue.assessment === "unsupported"),
    ).toBe(true);
  });
  it.each([NaN, Infinity, -1])(
    "invalid rating %s is incomplete and never a silent zero",
    (rating) => {
      const result = normalizeLoad(createLoad({ rating }));
      expect(result.valid).toBe(false);
      expect(Number.isNaN(result.currentA)).toBe(true);
    },
  );
  it("zero power yields no defined PF for the whole empty load", () => {
    const project = createProject();
    project.loads = [createLoad({ rating: 0 })];
    const result = calculateProject(project);
    expect(result.apparentKVA).toBe(0);
    expect(result.powerFactor).toBeNull();
    expect(result.imbalancePercent).toBe(0);
  });
});

describe("chronology, physical flows and constraints", () => {
  const battery: BatterySettings = {
    capacityKWh: 10,
    initialSoc: 0.5,
    minSoc: 0,
    maxSoc: 1,
    chargeKW: 5,
    dischargeKW: 5,
    chargeEfficiency: 0.9,
    dischargeEfficiency: 0.8,
    islandCapable: true,
  };
  it("F10: noon export and evening import cannot cancel physical flows", () => {
    const project = createProject();
    project.loads = [createLoad({ rating: 1, hoursPerDay: 1, startHour: 18 })];
    const generationKW = Array(24).fill(0);
    generationKW[12] = 1;
    const result = simulateEnergy(project, {
      intervalMinutes: 60,
      generationKW,
    });
    expect(result.importKWh).toBe(1);
    expect(result.exportKWh).toBe(1);
  });
  it("F11: charging 2 kWh AC at 90%, then discharging 2 kWh AC at 80%", () => {
    const charge = batteryStep({
      storedKWh: 5,
      generationKW: 2,
      loadKW: 0,
      hours: 1,
      battery,
    });
    expect(charge.storedKWh).toBeCloseTo(6.8, 10);
    const discharge = batteryStep({
      storedKWh: charge.storedKWh,
      generationKW: 0,
      loadKW: 2,
      hours: 1,
      battery,
    });
    expect(discharge.storedKWh).toBeCloseTo(4.3, 10);
  });
  it("F12: a 10 kWh battery from 80% to 20% at 90% delivers 5.4 kWh AC", () => {
    const result = batteryStep({
      storedKWh: 8,
      generationKW: 0,
      loadKW: 20,
      hours: 1,
      battery: {
        ...battery,
        minSoc: 0.2,
        dischargeKW: 20,
        dischargeEfficiency: 0.9,
      },
    });
    expect(result.dischargeKWh).toBeCloseTo(5.4, 10);
    expect(result.storedKWh).toBeCloseTo(2, 10);
  });
  it("F13: actual 23/25-hour DST days integrate actual elapsed energy", () => {
    const project = createProject();
    project.loads = [createLoad({ rating: 1, startHour: 0, hoursPerDay: 24 })];
    const spring = simulateRange(project, {
      start: "2026-03-29T00:00:00+01:00",
      end: "2026-03-30T00:00:00+02:00",
      intervalMinutes: 60,
    });
    const autumn = simulateRange(project, {
      start: "2026-10-25T00:00:00+02:00",
      end: "2026-10-26T00:00:00+01:00",
      intervalMinutes: 60,
    });
    expect(spring.totalKWh).toBeCloseTo(23, 9);
    expect(autumn.totalKWh).toBeCloseTo(25, 9);
    const repeated = autumn.points.filter((point) =>
      point.localTime.includes("02:00"),
    );
    expect(repeated).toHaveLength(2);
    expect(repeated[0].timestamp).not.toBe(repeated[1].timestamp);
    expect(repeated[0].localTime).not.toBe(repeated[1].localTime);
  });
  it("F13: leap-year February has 696 elapsed hours in Berlin", () => {
    const project = createProject();
    project.loads = [createLoad({ rating: 1, startHour: 0, hoursPerDay: 24 })];
    const result = simulateRange(project, {
      start: "2024-02-01T00:00:00+01:00",
      end: "2024-03-01T00:00:00+01:00",
      intervalMinutes: 60,
    });
    expect(result.totalKWh).toBeCloseTo(696, 8);
  });
  it("weekday overnight windows belong to the start day", () => {
    const load = createLoad({
      rating: 1,
      startHour: 22,
      hoursPerDay: 4,
      weekdays: [1],
    });
    const monday = dailyProfile([load], 60, 1);
    const tuesday = dailyProfile([load], 60, 2);
    expect(monday[0].kw).toBe(0);
    expect(monday[22].kw).toBe(1);
    expect(tuesday[0].kw).toBe(1);
    expect(tuesday[22].kw).toBe(0);
  });
  it("F16: grid-following PV and battery cannot serve an island without capability", () => {
    const result = batteryStep({
      storedKWh: 5,
      generationKW: 5,
      loadKW: 2,
      hours: 1,
      gridAvailable: false,
      battery: { ...battery, islandCapable: false },
    });
    expect(result.unservedKWh).toBe(2);
    expect(result.storedKWh).toBe(5);
    expect(result.curtailedKWh).toBe(5);
  });
  it("F17: an infeasible EV deadline reports unmet energy and respects site/phase caps", () => {
    const session: EVSession = {
      id: "test",
      name: "Test",
      arrivalHour: 18,
      departureHour: 19,
      requiredKWh: 10,
      chargerKW: 7,
      vehicleKW: 7,
      efficiency: 0.9,
      siteLimitKW: 5,
    };
    const plan = scheduleEV(session, Array(24).fill(3), Array(24).fill(0.3), {
      phaseHeadroomKW: Array(24).fill(1),
    });
    expect(plan.feasible).toBe(false);
    expect(plan.deliveredKWh).toBeCloseTo(0.9, 10);
    expect(plan.unmetKWh).toBeCloseTo(9.1, 10);
    expect(plan.points[18].acKW).toBe(1);
  });
  it("tariff-aware EV schedule chooses cheaper permitted hours", () => {
    const rates = Array(24).fill(0.3);
    rates[20] = -0.1;
    const plan = scheduleEV(
      {
        id: "test",
        name: "Test",
        arrivalHour: 18,
        departureHour: 22,
        requiredKWh: 2,
        chargerKW: 2,
        vehicleKW: 2,
        efficiency: 1,
        siteLimitKW: 10,
      },
      Array(24).fill(0),
      rates,
      "cheapest",
    );
    expect(plan.points[20].acKWh).toBe(2);
    expect(plan.cost).toBeCloseTo(-0.2, 10);
  });
  it("F19: interval energy closes at all SOC and power boundaries", () => {
    for (const storedKWh of [0, 1, 5, 9, 10])
      for (const generationKW of [0, 2, 20])
        for (const loadKW of [0, 2, 20])
          for (const gridAvailable of [true, false]) {
            const result = batteryStep({
              storedKWh,
              generationKW,
              loadKW,
              hours: 0.25,
              gridAvailable,
              battery,
            });
            expect(result.storedKWh).toBeGreaterThanOrEqual(-1e-10);
            expect(result.storedKWh).toBeLessThanOrEqual(10 + 1e-10);
            expect(Math.abs(result.balanceErrorKWh)).toBeLessThan(1e-10);
            expect(result.chargeKWh === 0 || result.dischargeKWh === 0).toBe(
              true,
            );
            expect(result.chargeKWh).toBeLessThanOrEqual(1.25 + 1e-10);
            expect(result.dischargeKWh).toBeLessThanOrEqual(1.25 + 1e-10);
          }
  });
  it("money products use decimal arithmetic, including negative prices", () => {
    expect(energyCharge([{ kWh: 18.4, rate: 0.3 }])).toBe(5.52);
    expect(
      energyCharge(
        Array.from({ length: 100 }, () => ({ kWh: 0.1, rate: 0.1 })),
      ),
    ).toBe(1);
    expect(energyCharge([{ kWh: 2, rate: -0.125 }])).toBe(-0.25);
  });
  it("missing PV chronology remains incomplete instead of inventing a profile", () => {
    const project = createProject();
    project.energy.pvKW = 4;
    expect(pvDailyEstimate(project)).toBeCloseTo(12.8, 10);
    expect(simulateEnergy(project).complete).toBe(false);
  });
  it("rejects overlapping tariff bands; negative rates remain valid", () => {
    const project = createProject();
    project.tariff.bands = [
      {
        id: "a",
        name: "Evening",
        startHour: 18,
        endHour: 22,
        importRate: -0.1,
      },
      { id: "b", name: "Night", startHour: 21, endHour: 5, importRate: 0.2 },
    ];
    expect(
      validateTariff(project.tariff).some((issue) =>
        issue.id.startsWith("tariff-overlap"),
      ),
    ).toBe(true);
    project.tariff.bands[1].startHour = 22;
    expect(validateTariff(project.tariff)).toEqual([]);
  });
});

describe("state, topology, checks and reference evidence", () => {
  it("F14: removing ampacity evidence invalidates an old pass", () => {
    const project = createProject();
    const circuit = createCircuit(project.boards[0].id, {
      protectiveA: 16,
      cable: {
        lengthM: 10,
        resistanceOhmPerKm: 7.41,
        baseAmpacityA: 20,
        correctionFactors: [1],
        source: "Entered worksheet data",
        voltageDropLimitPercent: 3,
      },
    });
    project.circuits.push(circuit);
    project.loads = [
      createLoad({
        rating: 2.3,
        circuitId: circuit.id,
        boardId: circuit.boardId,
      }),
    ];
    expect(
      assessCircuit(project, circuit.id).checks.find(
        (check) => check.id === "ampacity",
      )?.assessment,
    ).toBe("passed");
    delete circuit.cable!.baseAmpacityA;
    expect(
      assessCircuit(project, circuit.id).checks.find(
        (check) => check.id === "ampacity",
      )?.assessment,
    ).toBe("incomplete");
  });
  it("F15: phase balancing preserves locks and improves actual engine imbalance", () => {
    const project = createProject();
    project.loads = [
      createLoad({ name: "Locked", rating: 2.3, locked: true }),
      createLoad({ rating: 2.3 }),
      createLoad({ rating: 2.3 }),
    ];
    const preview = previewPhaseBalance(project);
    const result = applyPhaseBalance(project, preview.moves, preview.revision);
    expect(result.loads[0].phase).toBe("L1");
    expect(preview.afterImbalance).toBeLessThan(preview.beforeImbalance);
    expect(calculateProject(result).imbalancePercent).toBeCloseTo(
      preview.afterImbalance,
      10,
    );
    expect(() =>
      applyPhaseBalance(
        { ...project, revision: 2 },
        preview.moves,
        preview.revision,
      ),
    ).toThrow(/changed/);
  });
  it("F18: malformed/schema-incompatible imports preserve working project", () => {
    const project = createProject();
    project.loads.push(createLoad({ name: "My data" }));
    const before = JSON.stringify(project);
    expect(validateProjectImport("{invalid").valid).toBe(false);
    expect(validateProjectImport({ ...project, schemaVersion: 99 }).valid).toBe(
      false,
    );
    expect(JSON.stringify(project)).toBe(before);
  });
  it("F18: native JSON round trip preserves IDs, values, source and settings", () => {
    const project = createReferenceProject("workshop");
    const result = validateProjectImport(JSON.stringify(project));
    expect(result.errors).toEqual([]);
    expect(result.project).toEqual(project);
    expect(result.project).not.toBe(project);
  });
  it("rejects invalid nested PV, battery, tariff, EV and billing data", () => {
    const cases = [
      (project: ReturnType<typeof createProject>) => {
        project.energy.battery.chargeEfficiency = 0;
      },
      (project: ReturnType<typeof createProject>) => {
        project.energy.pvHourlyProfile = [1];
      },
      (project: ReturnType<typeof createProject>) => {
        project.tariff.importRate = NaN;
      },
      (project: ReturnType<typeof createProject>) => {
        project.billing.taxPercent = -1;
      },
      (project: ReturnType<typeof createProject>) => {
        project.evSessions = [
          {
            id: "bad",
            name: "Bad",
            arrivalHour: 8,
            departureHour: 10,
            requiredKWh: 2,
            efficiency: 2,
            chargerKW: 1,
            vehicleKW: 1,
            siteLimitKW: 1,
          },
        ];
      },
    ];
    for (const change of cases) {
      const project = createProject();
      change(project);
      expect(validateProjectImport(project).valid).toBe(false);
    }
  });
  it("F20: calculation outputs retain the input revision and are deterministic", () => {
    const project = createReferenceProject("home");
    project.revision = 17;
    const first = calculateProject(project);
    const second = calculateProject(project);
    expect(first).toEqual(second);
    expect(first.revision).toBe(17);
    expect(first.trace.revision).toBe(17);
  });
  it("detects missing circuit references and board cycles", () => {
    const project = createProject();
    project.loads = [createLoad({ circuitId: "missing" })];
    project.boards[0].parentId = project.boards[0].id;
    expect(validateTopology(project)).toHaveLength(2);
  });
  it.each(REFERENCE_CASES)(
    "reference $id agrees with independent expected totals",
    (reference) => {
      const project = createReferenceProject(reference.id);
      const result = calculateProject(project);
      expect(result.installedKW).toBeCloseTo(reference.expected.installedKW, 9);
      expect(result.dailyKWh).toBeCloseTo(reference.expected.dailyKWh, 9);
      expect(project.referenceCase).toBe(reference.id);
    },
  );
});
