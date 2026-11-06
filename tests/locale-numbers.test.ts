import { describe, expect, it } from "vitest";
import { formatEditableNumber, parseLocaleNumber } from "../src/i18n/numbers";
describe("localized input keeps machine values unambiguous", () => {
  it("accepts German decimal commas and dot decimals in the other three languages", () => {
    expect(parseLocaleNumber("1,25", "de")).toEqual({
      ok: true,
      value: 1.25,
      canonical: "1.25",
    });
    for (const locale of ["en", "yo", "pcm"] as const)
      expect(parseLocaleNumber("1.25", locale)).toMatchObject({
        ok: true,
        value: 1.25,
      });
  });
  it("rejects ambiguous grouping instead of changing a magnitude", () => {
    for (const text of ["1,234", "1 234", "1_234", "1,234.5"])
      expect(parseLocaleNumber(text, "en")).toMatchObject({
        ok: false,
        code: "ambiguous",
      });
    expect(parseLocaleNumber("1.234", "de")).toMatchObject({
      ok: false,
      code: "ambiguous",
    });
  });
  it("preserves precise editable values and validates scientific, integer and range inputs", () => {
    expect(formatEditableNumber(0.123456789012345, "de")).toBe(
      "0,123456789012345",
    );
    expect(parseLocaleNumber("−1,2e-3", "de")).toMatchObject({
      ok: true,
      value: -0.0012,
    });
    expect(parseLocaleNumber("2.5", "en", { integer: true }).ok).toBe(false);
    expect(parseLocaleNumber("1e999", "en").ok).toBe(false);
    expect(parseLocaleNumber("-1", "en", { min: 0 }).ok).toBe(false);
  });
  it("does not silently treat missing, mixed or malformed input as zero", () => {
    for (const value of ["", "  ", "1..2", "NaN", "0x10", "Infinity", "1+2"])
      expect(parseLocaleNumber(value, "en").ok).toBe(false);
    expect(parseLocaleNumber(".5", "en")).toMatchObject({ canonical: "0.5" });
    expect(parseLocaleNumber("1.005", "en", { decimalPlaces: 2 }).ok).toBe(
      false,
    );
  });
});
