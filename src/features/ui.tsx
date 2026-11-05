import {
  useEffect,
  useRef,
  useContext,
  useId,
  cloneElement,
  isValidElement,
} from "react";
import type { ReactNode, ReactElement } from "react";
import { X, Info } from "lucide-react";
import { LanguageContext, numberFormat, useT } from "../i18n";
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const t = useT();
  useEffect(() => {
    const old = document.activeElement as HTMLElement | null;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab") {
        const els = ref.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]),input,select,textarea,a[href],[tabindex="0"]',
        );
        if (!els?.length) return;
        const a = els[0],
          z = els[els.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === a ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = previous;
      old?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={"modal " + (wide ? "modal-wide" : "")}
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label={t("Close")}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function Field({
  label,
  unit,
  children,
  hint,
}: {
  label: string;
  unit?: string;
  children: ReactNode;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
        {unit && <span className="unit">{unit}</span>}
      </label>
      {isValidElement(children)
        ? cloneElement(children as ReactElement<{ id?: string }>, { id })
        : children}
      {hint && <small>{hint}</small>}
    </div>
  );
}
export function Notice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "warning" | "success" | "error";
}) {
  return (
    <div className={"notice " + tone}>
      <Info size={16} />
      <span>{children}</span>
    </div>
  );
}
export function Empty({
  icon,
  heading,
  children,
  actions,
}: {
  icon: ReactNode;
  heading: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h2>{heading}</h2>
      <p>{children}</p>
      <div className="button-row">{actions}</div>
    </div>
  );
}
export function LineChart({
  points,
  secondary,
  color = "var(--cyan)",
  height = 210,
  label = "kW",
  selected,
  onSelect,
}: {
  points: { x: number; y: number }[];
  secondary?: { x: number; y: number }[];
  color?: string;
  height?: number;
  label?: string;
  selected?: number;
  onSelect?: (index: number) => void;
}) {
  const locale = useContext(LanguageContext);
  const t = useT();
  const max =
    Math.max(
      1,
      ...points.map((p) => p.y),
      ...(secondary?.map((p) => p.y) || []),
    ) * 1.15;
  const width = 800,
    padL = 48,
    padR = 16,
    padT = 18,
    padB = 30;
  const n = Math.max(1, points.length - 1);
  const x = (i: number) => padL + (i / n) * (width - padL - padR);
  const y = (v: number) => height - padB - (v / max) * (height - padT - padB);
  const path = (list: { x: number; y: number }[]) =>
    list.map((p, i) => (i ? "L" : "M") + x(i) + "," + y(p.y)).join(" ");
  const id = useRef("chart-" + Math.random().toString(36).slice(2)).current;
  return (
    <div className="chart-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${t("Demand profile")} (${label})`}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.23" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {Array.from({ length: 5 }, (_, i) => {
          const v = (max * i) / 4;
          return (
            <g key={i}>
              <line
                x1={padL}
                x2={width - padR}
                y1={y(v)}
                y2={y(v)}
                stroke="var(--border)"
                strokeDasharray="3 5"
              />
              <text
                x={padL - 10}
                y={y(v) + 4}
                textAnchor="end"
                className="chart-text"
              >
                {numberFormat(v, 1, locale)}
              </text>
            </g>
          );
        })}
        {points.length > 0 && (
          <>
            <path
              d={`${path(points)} L${x(points.length - 1)},${height - padB} L${padL},${height - padB} Z`}
              fill={`url(#${id})`}
            />
            <path
              d={path(points)}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {secondary && (
              <path
                d={path(secondary)}
                fill="none"
                stroke="var(--violet)"
                strokeWidth="2"
                strokeDasharray="5 3"
              />
            )}
          </>
        )}
        {points
          .filter(
            (_, i) => i % Math.max(1, Math.floor(points.length / 6)) === 0,
          )
          .map((p) => {
            const i = points.indexOf(p);
            return (
              <text
                key={i}
                x={x(i)}
                y={height - 7}
                textAnchor="middle"
                className="chart-text"
              >
                {numberFormat(p.x, 1, locale)}
              </text>
            );
          })}
        {selected !== undefined && points[selected] && (
          <g>
            <line
              x1={x(selected)}
              x2={x(selected)}
              y1={padT}
              y2={height - padB}
              stroke="var(--gold)"
            />
            <circle
              cx={x(selected)}
              cy={y(points[selected].y)}
              r="4"
              fill="var(--gold)"
            />
          </g>
        )}
        {onSelect &&
          points.map((p, i) => (
            <rect
              key={i}
              x={x(i) - (width - padL - padR) / n / 2}
              y={padT}
              width={(width - padL - padR) / n}
              height={height - padB - padT}
              fill="transparent"
              onClick={() => onSelect(i)}
            >
              <title>
                {numberFormat(p.x, 2, locale)}: {numberFormat(p.y, 3, locale)}{" "}
                {label}
              </title>
            </rect>
          ))}
      </svg>
    </div>
  );
}
