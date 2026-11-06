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
export type OptionalLocaleNumberInputProps = Omit<
  LocaleNumberInputProps,
  "value" | "onValueChange"
> & {
  value: number | undefined;
  onValueChange: (value: number | undefined) => void;
};
export function LocaleNumberInput(props: LocaleNumberInputProps) {
  return (
    <NumberInput
      {...props}
      optional={false}
      onValueChange={(value) => {
        if (value !== undefined) props.onValueChange(value);
      }}
    />
  );
}
export function OptionalLocaleNumberInput(
  props: OptionalLocaleNumberInputProps,
) {
  return <NumberInput {...props} optional={!props.required} />;
}
/** Commits valid numbers on blur/Enter; invalid text remains visible and never mutates project state. */
function NumberInput({
  value,
  onValueChange,
  min,
  max,
  integer,
  onValidityChange,
  onBlur,
  onKeyDown,
  optional,
  ...props
}: OptionalLocaleNumberInputProps & { optional: boolean }) {
  const locale = useContext(LanguageContext),
    t = useT(),
    id = useId(),
    input = useRef<HTMLInputElement>(null),
    previous = useRef({ value, locale }),
    draftLocale = useRef(locale),
    [text, setText] = useState(() => formatEditableNumber(value ?? "", locale)),
    [error, setError] = useState("");
  useEffect(() => {
    if (!Object.is(value, previous.current.value)) {
      setText(formatEditableNumber(value ?? "", locale));
      draftLocale.current = locale;
      setError("");
      input.current?.setCustomValidity("");
      onValidityChange?.(true);
    } else if (locale !== previous.current.locale) {
      const staged = parseLocaleNumber(text, draftLocale.current, {
        min,
        max,
        integer,
      });
      if (staged.ok) {
        setText(formatEditableNumber(staged.canonical, locale));
        draftLocale.current = locale;
      }
      input.current?.setCustomValidity(error ? t(error) : "");
    }
    previous.current = { value, locale };
  }, [value, locale]);
  function commit() {
    if (optional && !text.trim()) {
      setText("");
      setError("");
      input.current?.setCustomValidity("");
      onValidityChange?.(true);
      if (value !== undefined) onValueChange(undefined);
      return;
    }
    const result = parseLocaleNumber(text, draftLocale.current, {
      min,
      max,
      integer,
    });
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
    draftLocale.current = locale;
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
          draftLocale.current = locale;
          setError("");
          event.target.setCustomValidity("");
          onValidityChange?.(
            (optional && !event.target.value.trim()) ||
              parseLocaleNumber(event.target.value, locale, {
                min,
                max,
                integer,
              }).ok,
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
