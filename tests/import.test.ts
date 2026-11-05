import { describe, expect, it } from "vitest";
import { migrateLegacy } from "../src/import-export/legacy";
import {
  parseMeasurementCSV,
  type MeasurementOptions,
} from "../src/import-export/measurements";
import { validateProjectImport } from "../src/domain/project";
import { calculateProject } from "../src/engine/electrical";

// The persisted field inventory matches source loadProfileStorage.js,
// inspected at 2e4f24e0ccb7fc92a78c7632bc54d7cc13fccf12. These are analytical inputs.
function v1() {
  return {
    format: "adigun-electrical-load",
    version: 1,
    devices: [
      {
        name: "Entered 2.3 kW load",
        watts: 2300,
        powerUnit: "W",
        quantity: 1,
        hoursPerDay: 8,
        dutyCycle: 50,
        standbyW: 0,
        seasonalFactor: 1,
        pf: 1,
        type: "resistive",
      },
    ],
    settings: {
      phase: "single",
      voltage: 230,
      measurementInterval: "minute",
      households: 1,
      diversityFactor: 1,
      demandFactor: 1,
      growthMargin: 0,
      tariff: 0.3,
      co2Factor: 0.4,
      renewableOffsetKWh: 0,
      solarKWh: 0,
      windKWh: 0,
      batteryKWh: 0,
      gridLimitKW: null,
      peakThresholdKW: null,
      occupancySchedule: null as null | { startHour: number; endHour: number },
      currency: "EUR",
    },
  };
}
function v2() {
  const base = v1();
  return {
    ...base,
    version: 2,
    devices: base.devices.map((device) => ({
      ...device,
      inrushMultiplier: 6,
      operatingWindow: { startHour: 22, endHour: 6 },
    })),
    extensions: {
      resolutionMinutes: 15,
      breakerRatingA: 32,
      gridCurrentLimitA: 50,
      cableLengthM: 35,
      conductorMM2: 6,
      material: "copper",
      frequencyHz: 50,
      capacitorConnection: "delta",
      pfOld: 0.8,
      pfNew: 0.95,
      pfRealKW: 10,
      penaltyRate: 0,
      touEnabled: true,
      tariffBands: [
        { id: "peak", startHour: 17, endHour: 22, rate: 0.6 },
        { id: "offPeak", startHour: 22, endHour: 7, rate: 0.1 },
        { id: "standard", startHour: 7, endHour: 17, rate: 0.3 },
      ],
      monthlyFactors: Array(12).fill(1),
      selectedMonth: 1,
    },
  };
}

describe("Actual legacy persisted-format migration", () => {
  it("recognizes only the explicit format and rejects unsupported versions", () => {
    expect(migrateLegacy({ devices: [], version: 1 })).toBeNull();
    expect(migrateLegacy("{broken")).toBeNull();
    const unsupported = migrateLegacy({ ...v1(), version: 3 })!;
    expect(unsupported.supported).toBe(false);
    expect(unsupported.project).toBeUndefined();
    expect(unsupported.errors[0]).toContain("Unsupported");
  });
  it("migrates the V1 10 A / 9.2 kWh duty fixture without reducing on-state current", () => {
    const input = v1(),
      before = JSON.stringify(input),
      migrated = migrateLegacy(input)!;
    expect(migrated.errors).toEqual([]);
    expect(migrated.project).toBeDefined();
    expect(JSON.stringify(input)).toBe(before);
    const calculated = calculateProject(migrated.project!);
    expect(calculated.phaseOnStateCurrents.L1).toBeCloseTo(10, 10);
    expect(calculated.dailyKWh).toBeCloseTo(9.2, 10);
    expect(migrated.warnings.join(" ")).toContain("duty-adjusted");
    expect(migrated.project!.loads[0].efficiency).toBe(1);
  });
  it("preserves the exact original string and recovery metadata through project validation", () => {
    const text = JSON.stringify(v1(), null, 2) + "\n";
    const project = migrateLegacy(text)!.project!;
    expect(project.legacyImport.originalJson).toBe(text);
    const reloaded = validateProjectImport(JSON.stringify(project));
    expect(reloaded.valid).toBe(true);
    expect((reloaded.project as typeof project).legacyImport.originalJson).toBe(
      text,
    );
  });
  it("keeps additional original content inert without promoting stored results or markup", () => {
    const data = {
      ...v1(),
      results: { bogusPass: true },
      script: '<script>throw Error("execute")</script>',
      customer: { name: "Not promoted to billing" },
    };
    const migrated = migrateLegacy(data)!;
    expect(migrated.errors).toEqual([]);
    expect(migrated.project!.billing.customer.name).toBe("");
    expect(migrated.project!.legacyImport.originalJson).toContain("bogusPass");
    expect(Object.hasOwn(migrated.project!, "results")).toBe(false);
  });
  it("requires all source fields and validates canonical stored units without coercion", () => {
    const missing = v1() as Record<string, unknown>;
    delete (missing.settings as Record<string, unknown>).tariff;
    expect(migrateLegacy(missing)!.project).toBeUndefined();
    const kw = v1();
    kw.devices[0].powerUnit = "kW";
    expect(migrateLegacy(kw)!.errors.join(" ")).toContain("canonical W");
    const malformed = v2() as ReturnType<typeof v2> & {
      extensions: Record<string, unknown>;
    };
    (malformed.extensions as Record<string, unknown>).frequencyHz = "50";
    expect(migrateLegacy(malformed)!.project).toBeUndefined();
  });
  it("maps actual V2 schedule, TOU, source voltage, limit and inrush fields", () => {
    const input = v2();
    input.settings.phase = "three";
    input.settings.voltage = 400;
    input.settings.households = 3;
    const migrated = migrateLegacy(input)!;
    expect(migrated.errors).toEqual([]);
    expect(migrated.project!.loads[0].connection).toBe("three");
    expect(migrated.project!.loads[0].quantity).toBe(3);
    expect(migrated.project!.loads[0].startHour).toBe(22);
    expect(migrated.project!.loads[0].startingMultiplier).toBe(6);
    expect(migrated.project!.loads[0].startingPF).toBeUndefined();
    expect(migrated.project!.loads[0].startingSeconds).toBeUndefined();
    expect(migrated.project!.tariff.bands).toHaveLength(3);
    expect(migrated.project!.supply.limitA).toBe(50);
    expect(migrated.project!.circuits).toHaveLength(0);
  });
  it("retains unsupported historical factors without silently compounding or netting", () => {
    const input = v1();
    input.settings.demandFactor = 0.8;
    input.settings.diversityFactor = 0.7;
    input.settings.growthMargin = 10;
    input.settings.solarKWh = 20;
    input.settings.batteryKWh = 5;
    input.devices[0].seasonalFactor = 1.2;
    const migrated = migrateLegacy(input)!;
    expect(migrated.errors).toEqual([]);
    expect(migrated.project!.coincidence).toBe(1);
    expect(migrated.project!.growthPercent).toBe(10);
    expect(migrated.project!.energy.pvKW).toBe(0);
    expect(migrated.project!.energy.battery.capacityKWh).toBe(0);
    expect(calculateProject(migrated.project!).dailyKWh).toBeCloseTo(9.2, 10);
    expect(migrated.warnings.join(" ")).toContain("seasonal factor");
    expect(migrated.warnings.join(" ")).toContain(
      "Neither is silently combined",
    );
  });
  it("warns when a preferred window cannot preserve the old distributed profile", () => {
    const input = v1();
    input.settings.occupancySchedule = { startHour: 18, endHour: 22 };
    const migrated = migrateLegacy(input)!;
    expect(migrated.project!.loads[0].startHour).toBe(18);
    expect(migrated.warnings.join(" ")).toContain("contiguous");
  });
  it("rejects indeterminate positive nameplate PF zero and invalid TOU coverage", () => {
    const invalid = v1();
    invalid.devices[0].pf = 0;
    invalid.devices[0].dutyCycle = 0;
    expect(migrateLegacy(invalid)!.errors.join(" ")).toContain(
      "on-state current",
    );
    const overlap = v2();
    overlap.extensions.touEnabled = false;
    overlap.extensions.tariffBands[0].startHour = 16;
    expect(migrateLegacy(overlap)!.errors.join(" ")).toContain(
      "overlap or gap",
    );
  });
  it("preserves zero-quantity inactive rows in original and does not invent active appliances", () => {
    const input = v1();
    input.devices[0].quantity = 0;
    const migrated = migrateLegacy(input)!;
    expect(migrated.errors).toEqual([]);
    expect(migrated.project!.loads).toHaveLength(0);
    expect(
      JSON.parse(migrated.project!.legacyImport.originalJson).devices[0]
        .quantity,
    ).toBe(0);
  });
});

const options: MeasurementOptions = {
  powerUnit: "kW",
  timestampColumn: "timestamp",
  powerColumn: "power",
  intervalMinutes: 15,
};
const parse = (text: string, changes: Partial<MeasurementOptions> = {}) =>
  parseMeasurementCSV(text, { ...options, ...changes });
describe("Measured interval CSV, explicit timing and units", () => {
  it("integrates supplied interval averages with explicit unit conversion", () => {
    const data = parse(
      "timestamp,power\n2026-11-05T10:00:00+01:00,1000\n2026-11-05T10:15:00+01:00,2000",
      { powerUnit: "W" },
    );
    expect(data.errors).toEqual([]);
    expect(data.points.map((point) => point.kw)).toEqual([1, 2]);
    expect(data.totalKWh).toBe(0.75);
    expect(data.warnings.join(" ")).toContain(
      "do not establish instantaneous peaks",
    );
    expect(Object.hasOwn(data, "peakKW")).toBe(false);
  });
  it("supports quoted CSV, BOM and explicit mapped columns", () => {
    const data = parse(
      '\uFEFF"date","measured kW","note"\r\n"2026-11-05T09:00:00Z","1.5","a,b"\r\n',
      { timestampColumn: "date", powerColumn: "measured kW" },
    );
    expect(data.errors).toEqual([]);
    expect(data.totalKWh).toBe(0.375);
  });
  it("does not turn empty measurements or spreadsheet formulas into zero", () => {
    for (const cell of ["", "=1+1", "NaN", "Infinity", "2 kW"]) {
      const data = parse(`timestamp,power\n2026-11-05T09:00:00Z,${cell}`);
      expect(data.errors.length).toBeGreaterThan(0);
      expect(data.points).toEqual([]);
      expect(data.totalKWh).toBeNull();
    }
  });
  it("requires explicit offsets and rejects impossible dates / malformed quotes", () => {
    expect(
      parse("timestamp,power\n2026-11-05T10:00:00,1").errors.join(" "),
    ).toContain("explicit");
    expect(
      parse("timestamp,power\n2025-02-29T10:00:00Z,1").errors.join(" "),
    ).toContain("impossible");
    expect(parse("timestamp,power\n2024-02-29T10:00:00Z,1").errors).toEqual([]);
    expect(
      parse('timestamp,power\n"2026-11-05T10:00:00Z"garbage,1').errors.join(
        " ",
      ),
    ).toContain("closing CSV quote");
  });
  it("rejects duplicate instants written using different offsets, overlaps and out-of-order records", () => {
    expect(
      parse(
        "timestamp,power\n2026-11-05T10:00:00+01:00,1\n2026-11-05T09:00:00Z,1",
      ).errors.join(" "),
    ).toContain("duplicate instant");
    expect(
      parse(
        "timestamp,power\n2026-11-05T09:00:00Z,1\n2026-11-05T09:05:00Z,1",
      ).errors.join(" "),
    ).toContain("overlap");
    expect(
      parse(
        "timestamp,power\n2026-11-05T09:15:00Z,1\n2026-11-05T09:00:00Z,1",
      ).errors.join(" "),
    ).toContain("out of chronological");
  });
  it("reports gaps and totals only observed intervals without filling missing energy", () => {
    const data = parse(
      "timestamp,power\n2026-11-05T09:00:00Z,1\n2026-11-05T10:00:00Z,1",
    );
    expect(data.errors).toEqual([]);
    expect(data.totalKWh).toBe(0.5);
    expect(data.warnings.join(" ")).toContain("45 minutes of missing coverage");
    expect(data.warnings.join(" ")).toContain("recorded intervals only");
  });
  it("keeps repeated DST wall-clock times distinct by offset", () => {
    const fall = parse(
      "timestamp,power\n2026-10-25T02:00:00+02:00,1\n2026-10-25T02:00:00+01:00,1",
      { intervalMinutes: 60 },
    );
    expect(fall.errors).toEqual([]);
    expect(fall.totalKWh).toBe(2);
    expect(fall.warnings.join(" ")).not.toContain("gap(s)");
    const spring = parse(
      "timestamp,power\n2026-03-29T01:00:00+01:00,1\n2026-03-29T03:00:00+02:00,1",
      { intervalMinutes: 60 },
    );
    expect(spring.errors).toEqual([]);
    expect(spring.totalKWh).toBe(2);
    expect(spring.warnings.join(" ")).not.toContain("gap(s)");
  });
  it("keeps physical import/export separate even when net energy cancels", () => {
    const data = parse(
      "timestamp,power\n2026-11-05T09:00:00Z,1\n2026-11-05T09:15:00Z,-1",
    );
    expect(data.totalKWh).toBe(0);
    expect(data.importKWh).toBe(0.25);
    expect(data.exportKWh).toBe(0.25);
  });
  it("validates column mappings, row width and declared interval", () => {
    expect(
      parse("timestamp,power,power\n2026-11-05T09:00:00Z,1,1").errors.join(" "),
    ).toContain("unique");
    expect(
      parse("timestamp,power\n2026-11-05T09:00:00Z,1,2").errors.join(" "),
    ).toContain("expected 2 cells");
    expect(
      parse("timestamp,power\n2026-11-05T09:00:00Z,1", { intervalMinutes: 0 })
        .errors.length,
    ).toBeGreaterThan(0);
    expect(
      parse("timestamp,power\n2026-11-05T09:00:00Z,1", {
        timestampColumn: "missing",
      }).errors.length,
    ).toBeGreaterThan(0);
  });
});
