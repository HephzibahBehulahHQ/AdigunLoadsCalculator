import { useEffect, useRef, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { translate, type Locale } from "./index";
import { formatEditableNumber, parseLocaleNumber } from "./numbers";

export interface DecimalDraft {
  text: string;
  locale: Locale;
}
export function LocaleDecimalInput({
  value,
  locale,
  decimalPlaces,
  draft,
  onDecimalChange,
  ...props
}: Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
> & {
  value: string;
  locale: Locale;
  decimalPlaces: number;
  draft?: DecimalDraft;
  onDecimalChange: (
    result: { canonical: string } | { draft: DecimalDraft },
  ) => void;
}) {
  const focused = useRef(false),
    input = useRef<HTMLInputElement>(null),
    [text, setText] = useState(
      draft?.text ?? formatEditableNumber(value, locale),
    );
  const invalid = draft
    ? parseLocaleNumber(draft.text, draft.locale, {
        min: 0,
        allowScientific: false,
        decimalPlaces,
      })
    : null;
  const error =
    invalid && !invalid.ok
      ? translate(invalid.message, locale)
      : draft
        ? translate(
            "Review this saved numeric draft before using the amount.",
            locale,
          )
        : "";
  useEffect(() => {
    if (!focused.current)
      setText(draft?.text ?? formatEditableNumber(value, locale));
    input.current?.setCustomValidity(error);
  }, [value, locale, draft?.text, error]);
  function commit(raw: string, language: Locale) {
    const parsed = parseLocaleNumber(raw, language, {
      min: 0,
      allowScientific: false,
      decimalPlaces,
    });
    if (parsed.ok) {
      onDecimalChange({ canonical: parsed.canonical });
      return parsed.canonical;
    }
    onDecimalChange({ draft: { text: raw, locale: language } });
    return null;
  }
  return (
    <>
      <input
        {...props}
        ref={input}
        type="text"
        inputMode="decimal"
        value={text}
        aria-invalid={draft ? true : undefined}
        onFocus={() => {
          focused.current = true;
        }}
        onChange={(event) => {
          setText(event.target.value);
          commit(event.target.value, locale);
        }}
        onBlur={() => {
          focused.current = false;
          const canonical = commit(text, draft?.locale ?? locale);
          if (canonical !== null)
            setText(formatEditableNumber(canonical, locale));
        }}
      />
      {error && (
        <small className="error-text" role="alert">
          {error}
        </small>
      )}
    </>
  );
}
