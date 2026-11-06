import {
  useEffect,
  useState,
  useRef,
  useContext,
  useId,
  cloneElement,
  isValidElement,
} from "react";
import type { ReactNode, ReactElement } from "react";
import { X, Info } from "lucide-react";
import { LanguageContext, numberFormat, useT } from "../i18n";

const modalStack: HTMLElement[] = [];
const inertOwners = new Map<
  HTMLElement,
  { count: number; previous: boolean }
>();
const focusableSelector =
  'button,input:not([type="hidden"]),select,textarea,a[href],summary,[tabindex]';
function focusableIn(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelector),
  ).filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.matches(":disabled") &&
      element.getClientRects().length > 0 &&
      !element.closest("[inert]"),
  );
}
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
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const modal = ref.current;
    if (!modal) return;
    const old = document.activeElement as HTMLElement | null;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modalStack.push(modal);
    const background: HTMLElement[] = [];
    for (
      let branch: HTMLElement = modal;
      branch.parentElement;
      branch = branch.parentElement
    ) {
      for (const sibling of Array.from(branch.parentElement.children)) {
        if (!(sibling instanceof HTMLElement) || sibling === branch) continue;
        const owner = inertOwners.get(sibling) ?? {
          count: 0,
          previous: sibling.inert,
        };
        owner.count++;
        inertOwners.set(sibling, owner);
        sibling.inert = true;
        background.push(sibling);
      }
      if (branch.parentElement === document.body) break;
    }
    const focusable = focusableIn(modal);
    (
      focusable.find((element) => element.matches("input,select,textarea")) ||
      modal
    ).focus();
    function key(e: KeyboardEvent) {
      if (modalStack.at(-1) !== modal) return;
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        close.current();
      }
      if (e.key === "Tab") {
        const els = focusableIn(modal);
        if (!els.length) {
          e.preventDefault();
          modal.focus();
          return;
        }
        const a = els[0],
          z = els[els.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === a ||
            document.activeElement === modal ||
            !modal.contains(document.activeElement))
        ) {
          e.preventDefault();
          z.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === z ||
            !modal.contains(document.activeElement))
        ) {
          e.preventDefault();
          a.focus();
        }
      }
    }
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("keydown", key, true);
      modalStack.splice(modalStack.indexOf(modal), 1);
      for (const element of background) {
        const owner = inertOwners.get(element)!;
        if (--owner.count === 0) {
          element.inert = owner.previous;
          inertOwners.delete(element);
        }
      }
      document.body.style.overflow = previous;
      if (old?.isConnected && !old.closest("[inert]")) old.focus();
      else modalStack.at(-1)?.focus();
    };
  }, []);
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
  const hintId = `${id}-hint`;
  const control = isValidElement(children)
    ? (children as ReactElement<{ id?: string; "aria-describedby"?: string }>)
    : undefined;
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
        {unit && <span className="unit">{unit}</span>}
      </label>
      {control
        ? cloneElement(control, {
            id,
            "aria-describedby":
              [control.props["aria-describedby"], hint ? hintId : undefined]
                .filter(Boolean)
                .join(" ") || undefined,
          })
        : children}
      {hint && <small id={hintId}>{hint}</small>}
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
    <div
      className={"notice " + tone}
      role={tone === "error" ? "alert" : undefined}
    >
      <Info size={16} aria-hidden="true" />
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
export function ResizeHandle({
  value,
  min,
  max,
  variable,
  label,
  reverse = false,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  variable: string;
  label: string;
  reverse?: boolean;
  onChange: (value: number) => void;
}) {
  const drag = useRef<
    { x: number; value: number; current: number } | undefined
  >(undefined);
  const clamp = (next: number) => Math.max(min, Math.min(max, next));
  return (
    <div
      className={"resize-handle " + (reverse ? "resize-left" : "resize-right")}
      role="separator"
      aria-label={label}
      aria-orientation="vertical"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      tabIndex={0}
      onKeyDown={(event) => {
        if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
          event.preventDefault();
          onChange(
            event.key === "Home"
              ? min
              : event.key === "End"
                ? max
                : clamp(
                    value +
                      (event.key === "ArrowRight" ? 1 : -1) *
                        (reverse ? -1 : 1) *
                        10,
                  ),
          );
        }
      }}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { x: event.clientX, value, current: value };
      }}
      onPointerMove={(event) => {
        if (drag.current) {
          drag.current.current = clamp(
            drag.current.value +
              (event.clientX - drag.current.x) * (reverse ? -1 : 1),
          );
          document.documentElement.style.setProperty(
            variable,
            drag.current.current + "px",
          );
        }
      }}
      onPointerUp={(event) => {
        if (drag.current) {
          onChange(drag.current.current);
          drag.current = undefined;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      onPointerCancel={() => {
        drag.current = undefined;
        document.documentElement.style.setProperty(variable, value + "px");
      }}
    />
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
  const [tablePage, setTablePage] = useState(0);
  const min = Math.min(
    0,
    ...points.map((p) => p.y),
    ...(secondary?.map((p) => p.y) ?? []),
  );
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
  const y = (v: number) =>
    height - padB - ((v - min) / (max - min)) * (height - padT - padB);
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
          const v = min + ((max - min) * i) / 4;
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
      {onSelect && points.length > 0 && (
        <input
          className="chart-keyboard"
          type="range"
          min={0}
          max={points.length - 1}
          step={1}
          value={Math.min(selected ?? 0, points.length - 1)}
          aria-label={t("Chart cursor")}
          onChange={(e) => onSelect(Number(e.target.value))}
        />
      )}
      <details className="chart-data">
        <summary>{t("Chart data table")}</summary>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("Position")}</th>
                <th>{label}</th>
                {secondary && (
                  <th>
                    {t("Comparison")} ({label})
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {points
                .slice(
                  Math.min(
                    tablePage,
                    Math.max(0, Math.ceil(points.length / 50) - 1),
                  ) * 50,
                  Math.min(
                    tablePage,
                    Math.max(0, Math.ceil(points.length / 50) - 1),
                  ) *
                    50 +
                    50,
                )
                .map((point, i) => (
                  <tr key={i}>
                    <td>{numberFormat(point.x, 3, locale)}</td>
                    <td>{numberFormat(point.y, 6, locale)}</td>
                    {secondary && (
                      <td>
                        {secondary[
                          Math.min(
                            tablePage,
                            Math.max(0, Math.ceil(points.length / 50) - 1),
                          ) *
                            50 +
                            i
                        ]
                          ? numberFormat(
                              secondary[
                                Math.min(
                                  tablePage,
                                  Math.max(
                                    0,
                                    Math.ceil(points.length / 50) - 1,
                                  ),
                                ) *
                                  50 +
                                  i
                              ].y,
                              6,
                              locale,
                            )
                          : "—"}
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {points.length > 50 && (
          <div className="button-row">
            <button
              type="button"
              className="button"
              disabled={tablePage === 0}
              onClick={() => setTablePage((p) => Math.max(0, p - 1))}
            >
              {t("Previous")}
            </button>
            <button
              type="button"
              className="button"
              disabled={(tablePage + 1) * 50 >= points.length}
              onClick={() => setTablePage((p) => p + 1)}
            >
              {t("Next")}
            </button>
          </div>
        )}
      </details>
    </div>
  );
}
