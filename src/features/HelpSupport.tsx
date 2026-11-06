import { useContext, useEffect, useId, useMemo, useState } from "react";
import { ArrowUpRight, BookOpen, LifeBuoy, Search, X } from "lucide-react";
import { LanguageContext, useT } from "../i18n";
import { formatEditableNumber } from "../i18n/numbers";
import { helpTopics, searchHelp } from "../help/content";
import { tools } from "../tools";
import type { EngineeringTool, ToolInput } from "../tools";
import "./help-support.css";

type GuideFilter = "all" | "workflow" | "tool";

export function HelpSupport({
  onNavigate,
  initialQuery = "",
}: {
  onNavigate: (route: string, toolId?: string) => void;
  initialQuery?: string;
}) {
  const t = useT();
  const locale = useContext(LanguageContext);
  const searchId = useId();
  const headingId = useId();
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<GuideFilter>("all");
  const [selectedId, setSelectedId] = useState("");
  useEffect(() => {
    setQuery(initialQuery);
    setFilter("all");
    setSelectedId("");
  }, [initialQuery]);
  const matches = useMemo(
    () =>
      searchHelp(query, locale, helpTopics.length).filter(
        (topic) => filter === "all" || topic.kind === filter,
      ),
    [query, locale, filter],
  );
  const active = matches.find((topic) => topic.id === selectedId) ?? matches[0];
  const tool = active?.toolId
    ? tools.find((entry) => entry.id === active.toolId)
    : undefined;

  function exampleValue(entry: EngineeringTool, input: ToolInput): string {
    const value = entry.exampleInputs[input.key];
    if (value === undefined) return t("Not supplied in example");
    const option = input.options?.find((choice) => choice.value === value);
    if (option) return t(option.label);
    return typeof value === "number"
      ? formatEditableNumber(value, locale)
      : value;
  }

  return (
    <div className="modal-body help-support">
      <p className="help-intro">
        {t(
          "Find a workflow or tool. Search in your selected language or English.",
        )}
      </p>
      <label className="help-search-label" htmlFor={searchId}>
        {t("Search help")}
      </label>
      <div className="search-field help-search">
        <Search size={18} aria-hidden="true" />
        <input
          id={searchId}
          type="search"
          value={query}
          placeholder={t("Search help")}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedId("");
          }}
        />
        {query && (
          <button
            type="button"
            className="icon-button"
            aria-label={t("Clear search")}
            onClick={() => {
              setQuery("");
              setSelectedId("");
              document.getElementById(searchId)?.focus();
            }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>
      <div
        className="help-filters"
        role="group"
        aria-label={t("Guide filters")}
      >
        {(
          [
            ["all", "All guides"],
            ["workflow", "Workflow guides"],
            ["tool", "Tool guides"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={"button " + (filter === value ? "active" : "")}
            aria-pressed={filter === value}
            onClick={() => {
              setFilter(value);
              setSelectedId("");
            }}
          >
            {t(label)}
          </button>
        ))}
        <span className="help-count" role="status" aria-live="polite">
          {matches.length} {t("matching guides")}
        </span>
      </div>
      {active ? (
        <div className="help-layout">
          <nav className="help-topic-list" aria-label={t("Help topics")}>
            {matches.map((topic) => (
              <button
                type="button"
                key={topic.id}
                className={
                  "help-topic-button " +
                  (active.id === topic.id ? "active" : "")
                }
                aria-current={active.id === topic.id ? "true" : undefined}
                onClick={() => setSelectedId(topic.id)}
              >
                <span className="help-topic-kind">
                  {topic.toolId ? `${topic.toolId} · ` : ""}
                  {t(topic.category)}
                </span>
                <strong>{t(topic.title)}</strong>
              </button>
            ))}
          </nav>
          <article className="help-article" aria-labelledby={headingId}>
            <div className="help-article-title">
              <BookOpen size={21} aria-hidden="true" />
              <div>
                {active.toolId && (
                  <span className="eyebrow">{active.toolId}</span>
                )}
                <h3 id={headingId}>{t(active.title)}</h3>
              </div>
            </div>
            <p className="help-summary">{t(active.summary)}</p>
            <ol className="help-steps">
              {active.steps.map((step) => (
                <li key={step}>{t(step)}</li>
              ))}
            </ol>
            {active.example && (
              <section className="help-example">
                <h4>{t("Practical example")}</h4>
                <p>{t(active.example)}</p>
              </section>
            )}
            {tool && (
              <section className="help-tool-inputs">
                <h4>{t("Inputs and worked example")}</h4>
                <p>
                  {t(
                    "These values come directly from the tool catalogue. Open the tool and choose Load worked example to try them.",
                  )}
                </p>
                <div
                  className="help-table-scroll"
                  tabIndex={0}
                  role="region"
                  aria-label={t("Inputs and worked example")}
                >
                  <table className="help-input-table">
                    <caption className="help-table-caption">
                      {t(tool.title)} · {t("Inputs and worked example")}
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">{t("Input")}</th>
                        <th scope="col">{t("Conditions")}</th>
                        <th scope="col">{t("Worked example")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tool.inputs.map((input) => (
                        <tr key={input.key}>
                          <th scope="row">
                            {t(input.label)}
                            {input.unit && <small>{input.unit}</small>}
                          </th>
                          <td>
                            <span>
                              {t(
                                input.required === false
                                  ? "Optional"
                                  : "Required",
                              )}
                            </span>
                            {input.min !== undefined && (
                              <small>
                                {t("Minimum")}:{" "}
                                {formatEditableNumber(input.min, locale)}
                              </small>
                            )}
                            {input.max !== undefined && (
                              <small>
                                {t("Maximum")}:{" "}
                                {formatEditableNumber(input.max, locale)}
                              </small>
                            )}
                            {input.options && (
                              <small>
                                {t("Choices")}:{" "}
                                {input.options
                                  .map((option) => t(option.label))
                                  .join(" · ")}
                              </small>
                            )}
                            {input.hint && <p>{t(input.hint)}</p>}
                          </td>
                          <td className="help-example-value">
                            {exampleValue(tool, input)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
            {active.route && (
              <button
                type="button"
                className="button primary help-open"
                onClick={() => onNavigate(active.route!, active.toolId)}
              >
                {t(active.toolId ? "Open tool" : "Open workspace")}
                <ArrowUpRight size={16} aria-hidden="true" />
              </button>
            )}
          </article>
        </div>
      ) : (
        <section className="help-empty" aria-live="polite">
          <Search size={26} aria-hidden="true" />
          <h3>{t("No matching help topics.")}</h3>
          <p>
            {t(
              "Try a tool ID such as T01, a workspace name, or a shorter phrase.",
            )}
          </p>
          <button
            type="button"
            className="button"
            onClick={() => {
              setQuery("");
              setFilter("all");
              document.getElementById(searchId)?.focus();
            }}
          >
            {t("Clear search")}
          </button>
        </section>
      )}
      <footer className="help-support-footer">
        <div>
          <h4>
            <LifeBuoy size={17} aria-hidden="true" />
            {t("Support and feedback")}
          </h4>
          <p>
            {t(
              "Reading help does not change your project. Some technical source text may remain in English.",
            )}
          </p>
        </div>
        <a
          className="button"
          href="https://github.com/HephzibahBehulahHQ/AdigunPowerLab/issues/new"
          target="_blank"
          rel="noopener noreferrer"
          aria-describedby={`${searchId}-support-note`}
        >
          {t("Open a GitHub issue")}
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
        <p id={`${searchId}-support-note`} className="help-support-note">
          {t(
            "Opens GitHub in a new tab. Review what you share; project or customer data is never sent automatically.",
          )}
        </p>
      </footer>
    </div>
  );
}
