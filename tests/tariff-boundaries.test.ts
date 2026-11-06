import { describe, expect, it } from "vitest";
import type { Tariff, TariffBand } from "../src/domain/types";
import { calculateIntervalBill } from "../src/engine/tariffs";

const tariff = (overrides: Partial<Tariff> = {}): Tariff => ({
  importRate: 0,
  exportRate: 0,
  standingPerDay: 0,
  demandPerKW: 0,
  taxPercent: 0,
  source: "Independent analytical tariff boundary fixture",
  bands: [],
  ...overrides,
});
const band = (overrides: Partial<TariffBand> = {}): TariffBand => ({
  id: "entered-rate",
  name: "Entered interval rate",
  startHour: 30 / 3600,
  endHour: 1,
  importRate: 1,
  ...overrides,
});
const interval = (
  timestamp = "2026-01-01T00:00:00Z",
  durationMinutes = 1,
  importKWh = 1,
  exportKWh = 0,
) => ({ timestamp, durationMinutes, importKWh, exportKWh });

describe("exact tariff and demand boundaries", () => {
  it("allocates the 30-second price change to separate import and export lines", () => {
    const result = calculateIntervalBill(
      tariff({ bands: [band({ exportRate: 0.2 })] }),
      [interval(undefined, 1, 1, 1)],
      { timezone: "UTC" },
    );
    // Each physical channel has 0.5 kWh on each side of the price change.
    expect(result.importKWh).toBe(1);
    expect(result.exportKWh).toBe(1);
    expect(result.energyCharge).toBe(0.5);
    expect(result.exportCredit).toBe(0.1);
    expect(result.total).toBe(0.4);
    expect(
      result.issues.some((issue) => issue.id === "bill-rate-resolution"),
    ).toBe(true);
  });

  it("finds a subsecond band wholly inside one input minute", () => {
    const result = calculateIntervalBill(
      tariff({
        bands: [band({ startHour: 0.25 / 3600, endHour: 0.75 / 3600 })],
      }),
      [interval(undefined, 1 / 60)],
      { timezone: "UTC" },
    );
    // The supplied one-second interval contains exactly half a second at 1/kWh.
    expect(result.energyCharge).toBe(0.5);
  });

  it.each([
    ["2026-01-01T00:00:00Z", 0],
    ["2026-01-01T00:00:30Z", 1],
  ])("keeps half-open row boundaries at %s", (timestamp, expectedCharge) => {
    const result = calculateIntervalBill(
      tariff({ bands: [band()] }),
      [interval(timestamp, 0.5)],
      { timezone: "UTC" },
    );
    expect(result.energyCharge).toBe(expectedCharge);
    expect(result.issues).toEqual([]);
  });

  it("rejects a coverage gap that starts and ends within one sampled minute", () => {
    expect(() =>
      calculateIntervalBill(
        tariff({
          coverage: "complete-bands",
          bands: [
            band({ id: "before", startHour: 0, endHour: 0.25 / 3600 }),
            band({ id: "after", startHour: 0.75 / 3600, endHour: 24 }),
          ],
        }),
        [interval(undefined, 1 / 60)],
        { timezone: "UTC" },
      ),
    ).toThrow(/coverage gap/);
  });

  it("changes effective dates and weekdays at local midnight", () => {
    const result = calculateIntervalBill(
      tariff({
        standingPerDay: 1,
        standingBasis: "local-calendar-days",
        bands: [
          band({
            startHour: 0,
            endHour: 24,
            weekdays: [1],
            effectiveFrom: "2026-01-05",
            effectiveTo: "2026-01-05",
          }),
        ],
      }),
      [interval("2026-01-04T23:59:30+01:00")],
      { timezone: "Europe/Berlin" },
    );
    expect(result.energyCharge).toBe(0.5);
    expect(result.standingDays).toBe(2);
    expect(result.standingCharge).toBe(2);
  });

  it.each(["2026-01-05T22:00:15Z", "2026-01-06T02:00:15Z"])(
    "splits both edges of an overnight tariff at %s",
    (timestamp) => {
      const result = calculateIntervalBill(
        tariff({
          bands: [band({ startHour: 22 + 30 / 3600, endHour: 2 + 30 / 3600 })],
        }),
        [interval(timestamp, 0.5)],
        { timezone: "UTC" },
      );
      expect(result.energyCharge).toBe(0.5);
    },
  );

  it("does not bill skipped local time during the spring clock change", () => {
    const result = calculateIntervalBill(
      tariff({
        bands: [band({ startHour: 3 + 15 / 3600, endHour: 4 })],
      }),
      [interval("2026-03-29T01:59:30+01:00")],
      { timezone: "Europe/Berlin" },
    );
    // 30 elapsed seconds precede the jump, then 15 precede the entered band.
    expect(result.energyCharge).toBe(0.25);
    expect(result.standingDays).toBeCloseTo(1 / 1440);
  });

  it("bills each real occurrence of a repeated autumn tariff band", () => {
    const result = calculateIntervalBill(
      tariff({
        bands: [band({ startHour: 2 + 30 / 3600, endHour: 2 + 45 / 3600 })],
      }),
      [interval("2026-10-25T02:00:00+02:00", 61, 61)],
      { timezone: "Europe/Berlin" },
    );
    // Uniform 1 kWh/minute passes through both 15-second occurrences.
    expect(result.energyCharge).toBe(0.5);
  });

  it("rejects a demand window whose latter 30 seconds are ineligible", () => {
    const result = calculateIntervalBill(
      tariff({
        demandPerKW: 10,
        demandRule: {
          method: "rolling",
          windowMinutes: 1,
          stepMinutes: 1,
          period: "range",
          startHour: 0,
          endHour: 30 / 3600,
        },
      }),
      [interval()],
      { timezone: "UTC" },
    );
    expect(result.complete).toBe(false);
    expect(result.demandPeaks).toEqual([]);
    expect(result.demandCharge).toBe(0);
    expect(result.issues.map((issue) => issue.id)).toContain(
      "demand-no-full-window",
    );
  });

  it("accepts an exactly contained demand window with fractional-minute endpoints", () => {
    const result = calculateIntervalBill(
      tariff({
        demandPerKW: 10,
        demandRule: {
          method: "rolling",
          windowMinutes: 1,
          stepMinutes: 1,
          period: "range",
          startHour: 30 / 3600,
          endHour: 90 / 3600,
        },
      }),
      [interval("2026-01-01T00:00:30Z")],
      { timezone: "UTC" },
    );
    expect(result.complete).toBe(true);
    expect(result.demandPeaks[0].kw).toBe(60);
    expect(result.demandCharge).toBe(600);
  });
});
