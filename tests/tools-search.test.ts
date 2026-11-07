import { describe, expect, it } from "vitest";
import { getTool, tools } from "../src/tools";
import { searchTools } from "../src/tools/search";
import type { Locale } from "../src/i18n";

const fundamentals = [
  "T01",
  "T02",
  "T03",
  "T04",
  "T05",
  "T06",
  "T07",
  "T08",
  "T09",
];

describe("localized engineering-tool search", () => {
  it.each<[Locale, string, string[]]>([
    ["en", "Ohm's law", ["T01"]],
    ["de", "  OHMSCHES   GESETZ  ", ["T01"]],
    ["yo", "Òfin Ohm", ["T01"]],
    ["yo", "ofin ohm", ["T01"]],
    ["pcm", "Ohm law", ["T01"]],
    ["de", "Elektrotechnische Grundlagen", fundamentals],
    ["yo", "ipile imo ina", fundamentals],
    ["de", "passiven Gleichstromwiderstand", ["T01"]],
    ["de", "t01 gesetz", ["T01"]],
  ])("finds %s catalogue text: %s", (locale, query, expected) => {
    expect(searchTools(tools, query, locale).map((tool) => tool.id)).toEqual(
      expected,
    );
  });

  it.each<Locale>(["en", "de", "yo", "pcm"])(
    "retains original English searches in %s",
    (locale) => {
      expect(
        searchTools(tools, "DC load power & energy", locale).map(
          (tool) => tool.id,
        ),
      ).toEqual(["T02"]);
    },
  );

  it("returns no unrelated tools and recovers the full catalogue on clear", () => {
    expect(searchTools(tools, "no-such-tool-qzx", "de")).toEqual([]);
    expect(searchTools(tools, " \n\t ", "yo")).toEqual(tools);
  });

  it("respects a supplied workspace subset and preserves its tool references", () => {
    const subset = [getTool("T04"), getTool("T03")];
    expect(searchTools(subset, "Ohm's law", "en")).toEqual([]);
    const found = searchTools(subset, "Elektrotechnische Grundlagen", "de");
    expect(found).toEqual(subset);
    expect(found[0]).toBe(subset[0]);
    expect(found[1]).toBe(subset[1]);
  });
});
