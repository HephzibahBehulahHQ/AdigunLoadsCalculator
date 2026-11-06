import {
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type InputHTMLAttributes,
} from "react";
import { LanguageContext, useT } from "../i18n";
import { formatEditableNumber, parseLocaleNumberList } from "../i18n/numbers";

export function validPlanningInputs(element: HTMLElement | null): boolean {
  if (!element) return true;
  for (const input of element.querySelectorAll<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >("input,select,textarea"))
    if (!input.reportValidity()) return false;
  return true;
}
export function PlanningNumberList({
  value,
  onValueChange,
  min,
  max,
  integer,
  ...props
}: Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "min" | "max"
> & {
  value?: number[];
  onValueChange: (value: number[] | undefined) => void;
  min?: number;
  max?: number;
  integer?: boolean;
}) {
  const locale = useContext(LanguageContext),
    t = useT(),
    id = useId();
  const format = (values: number[] | undefined) =>
    values?.map((n) => formatEditableNumber(n, locale)).join("; ") ?? "";
  const [text, setText] = useState(format(value)),
    [error, setError] = useState("");
  const ref = useRef<HTMLInputElement>(null),
    old = useRef({ key: JSON.stringify(value), locale });
  useEffect(() => {
    const key = JSON.stringify(value);
    if (old.current.key !== key) {
      setText(format(value));
      setError("");
      ref.current?.setCustomValidity("");
    } else if (old.current.locale !== locale && text.trim()) {
      const parsed = parseLocaleNumberList(text, old.current.locale, {
        min,
        max,
        integer,
      });
      if (parsed.ok) setText(format(parsed.values));
    }
    old.current = { key, locale };
  }, [JSON.stringify(value), locale]);
  function parse(raw: string) {
    if (!raw.trim()) return { ok: true as const, values: undefined };
    return parseLocaleNumberList(raw, locale, { min, max, integer });
  }
  return (
    <>
      <input
        {...props}
        ref={ref}
        type="text"
        inputMode="decimal"
        value={text}
        aria-invalid={Boolean(error)}
        aria-describedby={
          [props["aria-describedby"], error ? id : undefined]
            .filter(Boolean)
            .join(" ") || undefined
        }
        onChange={(event) => {
          setText(event.target.value);
          const parsed = parse(event.target.value);
          setError(parsed.ok ? "" : parsed.message);
          event.target.setCustomValidity(parsed.ok ? "" : t(parsed.message));
        }}
        onBlur={() => {
          const parsed = parse(text);
          if (parsed.ok) {
            onValueChange(parsed.values);
            setText(format(parsed.values));
          }
        }}
      />
      {error && (
        <span className="error-text" id={id} role="alert">
          {t(error)}
        </span>
      )}
    </>
  );
}
