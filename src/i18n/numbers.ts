import type { Locale } from "./index";

export type NumberParseResult =
  | { ok: true; value: number; canonical: string }
  | {
      ok: false;
      code: "empty" | "ambiguous" | "format" | "range" | "integer";
      message: string;
    };
export function localeDecimalSeparator(locale: Locale): "." | "," {
  return locale === "de" ? "," : ".";
}

/** UI parser: locale-independent JSON/CSV importers must not use this function. */
export function parseLocaleNumber(
  text: string,
  locale: Locale,
  options: {
    min?: number;
    max?: number;
    integer?: boolean;
    allowScientific?: boolean;
    decimalPlaces?: number;
  } = {},
): NumberParseResult {
  const raw = text.trim().replace(/\u2212/g, "-");
  if (!raw) return { ok: false, code: "empty", message: "Enter a number." };
  const decimal = localeDecimalSeparator(locale),
    group = decimal === "," ? "." : ",";
  if (/[\s\u00a0\u202f_'’]/u.test(raw))
    return {
      ok: false,
      code: "ambiguous",
      message: "Enter the number without grouping separators.",
    };
  if (raw.includes(group))
    return {
      ok: false,
      code: "ambiguous",
      message:
        decimal === ","
          ? "Use a comma for decimals and no thousands separator, for example 1234,5."
          : "Use a dot for decimals and no thousands separator, for example 1234.5.",
    };
  const canonical = decimal === "," ? raw.replace(",", ".") : raw;
  const expression =
    options.allowScientific === false
      ? /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/
      : /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
  if (!expression.test(canonical))
    return {
      ok: false,
      code: "format",
      message:
        "Enter one complete number using the selected language's decimal separator.",
    };
  if (
    options.decimalPlaces !== undefined &&
    (canonical.split(/[eE]/)[0].split(".")[1]?.length ?? 0) >
      options.decimalPlaces
  )
    return {
      ok: false,
      code: "format",
      message: `Use at most ${options.decimalPlaces} decimal places.`,
    };
  const value = Number(canonical);
  if (
    !Number.isFinite(value) ||
    (options.min !== undefined && value < options.min) ||
    (options.max !== undefined && value > options.max)
  )
    return {
      ok: false,
      code: "range",
      message: "The number is outside the permitted range.",
    };
  if (options.integer && !Number.isSafeInteger(value))
    return {
      ok: false,
      code: "integer",
      message: "Enter a whole number within the supported range.",
    };
  return {
    ok: true,
    value,
    canonical: canonical
      .replace(/^\+/, "")
      .replace(/^(-?)\./, "$10.")
      .replace(/\.$/, ""),
  };
}
export function formatEditableNumber(
  value: number | string,
  locale: Locale,
): string {
  const text = String(value);
  return locale === "de" ? text.replace(".", ",") : text;
}

export function parseLocaleNumberList(
  text: string,
  locale: Locale,
  options: Parameters<typeof parseLocaleNumber>[2] = {},
):
  | { ok: true; values: number[]; canonical: string[] }
  | { ok: false; message: string; index: number } {
  if (!text.trim())
    return {
      ok: false,
      message: "Enter at least one numeric value.",
      index: 0,
    };
  const parts = text.split(locale === "de" ? /;|\r?\n/ : /[,;]|\r?\n/);
  if (parts.length > 4096)
    return {
      ok: false,
      message: "A numeric list is limited to 4,096 values.",
      index: 4096,
    };
  const values: number[] = [],
    canonical: string[] = [];
  for (const [index, part] of parts.entries()) {
    const parsed = parseLocaleNumber(part, locale, options);
    if (!parsed.ok)
      return {
        ok: false,
        message: `Value ${index + 1}: ${parsed.message}`,
        index,
      };
    values.push(parsed.value);
    canonical.push(parsed.canonical);
  }
  return { ok: true, values, canonical };
}
