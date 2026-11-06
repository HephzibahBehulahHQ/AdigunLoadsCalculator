import { describe, expect, it } from "vitest";
import { helpTopics, searchHelp } from "../src/help/content";
import { hasTranslation } from "../src/i18n";
import type { Locale } from "../src/i18n";

const locales: Locale[] = ["en", "de", "yo", "pcm"];

describe("help search used by the guide and command palette", () => {
  it("provides real translations for every displayed guide title, explanation and example", () => {
    const missing: string[] = [];
    for (const topic of helpTopics) {
      for (const text of [
        topic.title,
        topic.summary,
        topic.category,
        ...topic.steps,
        ...(topic.example ? [topic.example] : []),
      ]) {
        for (const locale of ["de", "yo", "pcm"] as const) {
          if (!hasTranslation(text, locale))
            missing.push(`${locale}: ${topic.id}: ${text}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it.each(locales)(
    "finds every numbered engineering worksheet in %s",
    (locale) => {
      for (let number = 1; number <= 51; number++) {
        const id = `T${String(number).padStart(2, "0")}`;
        const [topic] = searchHelp(id, locale);
        expect(topic?.toolId, `${locale}: ${id}`).toBe(id);
        expect(topic?.route).toBe("tools");
      }
    },
  );

  it.each([
    ["en", "Ohm's law"],
    ["de", "Ohmsches Gesetz"],
    ["yo", "Ofin Ohm"],
    ["pcm", "Ohm law"],
  ] as const)("finds the Ohm worksheet from a %s query", (locale, query) => {
    const [topic] = searchHelp(query, locale);
    expect(topic?.toolId).toBe("T01");
    expect(topic?.title).toBe("Ohm’s law");
  });

  it.each([
    ["en", "Save failed"],
    ["de", "Speichern fehlgeschlagen"],
    ["yo", "Ìfipamọ́ kùnà"],
    ["pcm", "Save no work"],
  ] as const)(
    "finds troubleshooting from the actual %s save error",
    (locale, query) => {
      expect(searchHelp(query, locale).map((topic) => topic.id)).toContain(
        "results-and-troubleshooting",
      );
    },
  );

  it("retains English tool names in other locales and tolerates Yoruba diacritics", () => {
    expect(searchHelp("Ohm’s law", "de")[0]?.toolId).toBe("T01");
    expect(searchHelp("Òfin Ohm", "yo")[0]?.toolId).toBe("T01");
    expect(searchHelp("Ofin Ohm", "yo")[0]?.toolId).toBe("T01");
  });

  it("requires every search term and does not turn unknown queries into unrelated advice", () => {
    expect(searchHelp("T01 magneticcaterpillar", "en")).toEqual([]);
    expect(searchHelp("zzzznotarealhelpquestion", "de")).toEqual([]);
    expect(searchHelp("<script>private-customer-4371</script>", "en")).toEqual(
      [],
    );
  });

  it("bounds palette suggestions and makes empty/invalid limits predictable", () => {
    const suggestions = searchHelp("", "en", 6);
    expect(suggestions).toHaveLength(6);
    expect(new Set(suggestions.map((topic) => topic.id)).size).toBe(6);
    expect(searchHelp("", "en", 0)).toEqual([]);
    expect(searchHelp("", "en", -1)).toEqual([]);
    expect(searchHelp("", "en", 2.9)).toHaveLength(2);
  });
});
