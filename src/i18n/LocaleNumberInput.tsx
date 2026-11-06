import { useContext, useEffect, useId, useRef, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { LanguageContext, useT } from "./index";
import { formatEditableNumber, parseLocaleNumber } from "./numbers";

export type LocaleNumberInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type" | "min" | "max"
> & {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  integer?: boolean;
  onValidityChange?: (valid: boolean) => void;
};
/** Commits valid numbers on blur/Enter; invalid text remains visible and never mutates project state. */
export function LocaleNumberInput({
  value,
  onValueChange,
  min,
  max,
  integer,
  onValidityChange,
  onBlur,
  onKeyDown,
  ...props
}: LocaleNumberInputProps) {
  const locale = useContext(LanguageContext),
    t = useT(),
    id = useId(),
    input = useRef<HTMLInputElement>(null),
    previous = useRef({ value, locale }),
    [text, setText] = useState(() => formatEditableNumber(value, locale)),
    [error, setError] = useState("");
  useEffect(() => {
    if (!Object.is(value, previous.current.value)) {
      setText(formatEditableNumber(value, locale));
      setError("");
      input.current?.setCustomValidity("");
      onValidityChange?.(true);
    } else if (locale !== previous.current.locale) {
      const staged = parseLocaleNumber(text, previous.current.locale, {
        min,
        max,
        integer,
      });
      if (staged.ok) setText(formatEditableNumber(staged.canonical, locale));
      input.current?.setCustomValidity(error ? t(error) : "");
    }
    previous.current = { value, locale };
  }, [value, locale]);
  function commit() {
    const result = parseLocaleNumber(text, locale, { min, max, integer });
    if (!result.ok) {
      setError(result.message);
      input.current?.setCustomValidity(t(result.message));
      onValidityChange?.(false);
      return;
    }
    setError("");
    input.current?.setCustomValidity("");
    onValidityChange?.(true);
    setText(formatEditableNumber(result.value, locale));
    if (!Object.is(value, result.value)) onValueChange(result.value);
  }
  return (
    <>
      <input
        {...props}
        ref={input}
        type="text"
        inputMode={integer ? "numeric" : "decimal"}
        value={text}
        aria-invalid={error ? true : props["aria-invalid"]}
        aria-describedby={
          [props["aria-describedby"], error ? id : null]
            .filter(Boolean)
            .join(" ") || undefined
        }
        onChange={(event) => {
          setText(event.target.value);
          setError("");
          event.target.setCustomValidity("");
          onValidityChange?.(
            parseLocaleNumber(event.target.value, locale, { min, max, integer })
              .ok,
          );
        }}
        onBlur={(event) => {
          commit();
          onBlur?.(event);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
          onKeyDown?.(event);
        }}
      />
      {error && (
        <span id={id} className="error-text" role="alert">
          {t(error)}
        </span>
      )}
    </>
  );
}
