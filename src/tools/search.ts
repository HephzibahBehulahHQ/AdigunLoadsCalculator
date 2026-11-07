import { translate, type Locale } from "../i18n";
import type { EngineeringTool } from "./types";

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Match displayed catalogue text and its English source without changing tools. */
export function searchTools(
  catalogue: readonly EngineeringTool[],
  query: string,
  locale: Locale,
): EngineeringTool[] {
  const terms = normalize(query).split(" ").filter(Boolean);
  return catalogue.filter((tool) => {
    if (!terms.length) return true;
    const text = normalize(
      [
        tool.id,
        ...[tool.title, tool.category, tool.description].flatMap((value) => [
          value,
          translate(value, locale),
        ]),
      ].join(" "),
    );
    return terms.every((term) => text.includes(term));
  });
}
