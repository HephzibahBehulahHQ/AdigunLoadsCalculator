import { useState } from "react";
import { ArrowRight, Check, HelpCircle } from "lucide-react";
import type { Project } from "../domain/types";
import { useT } from "../i18n";
import { LocaleNumberInput } from "../i18n/LocaleNumberInput";
import { useUpdateGuard } from "../pwa/useUpdateGuard";
import { Field, Notice } from "./ui";

export interface InterviewProgress {
  step: 1 | 2 | 3;
  completed: boolean;
}

/** Answers live in the current project; only Save project creates a checkpoint. */
export function ProjectInterview({
  project,
  progress,
  onProgress,
  change,
  onHelp,
}: {
  project: Project;
  progress: InterviewProgress;
  onProgress: (progress: InterviewProgress) => void;
  change: (mutator: (project: Project) => void) => void;
  onHelp: () => void;
}) {
  const t = useT();
  const [editingNumber, setEditingNumber] = useState(false);
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});
  useUpdateGuard(
    editingNumber || Object.values(invalid).some(Boolean),
    t("Project setup interview"),
  );
  if (progress.completed) return null;
  return (
    <section
      className="project-interview panel panel-pad"
      aria-label={t("Project setup interview")}
    >
      <div className="interview-heading">
        <div>
          <span className="eyebrow">{t("Step")} {progress.step} / 3</span>
          <h3>{t("Project setup interview")}</h3>
        </div>
        <button className="button small-button" type="button" onClick={onHelp}>
          <HelpCircle size={16} /> {t("Help & Support")}
        </button>
      </div>
      <p>{t("Answer these questions to set up your project. Save project keeps your answers and your current step.")}</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (Object.values(invalid).some(Boolean)) return;
          onProgress(progress.step === 3
            ? { step: 3, completed: true }
            : { step: (progress.step + 1) as 2 | 3, completed: false });
        }}
      >
        {progress.step === 1 && (
          <div className="form-grid three">
            <Field label={t("Project name")} hint={t("Use a name you will recognize when you resume.")}>
              <input required maxLength={160} value={project.name}
                onChange={(event) => change((draft) => { draft.name = event.target.value; })} />
            </Field>
            <Field label={t("Context")}>
              <select value={project.context}
                onChange={(event) => change((draft) => { draft.context = event.target.value; })}>
                {["Residential", "Commercial", "Workshop", "Industrial", "Agricultural", "Community"].map((context) => (
                  <option value={context} key={context}>{t(context)}</option>
                ))}
              </select>
            </Field>
            <Field label={t("Currency")}>
              <select value={project.currency}
                onChange={(event) => change((draft) => { draft.currency = event.target.value; })}>
                {["EUR", "NGN", "USD", "GBP", "JPY", "KWD"].map((currency) => (
                  <option key={currency}>{currency}</option>
                ))}
              </select>
            </Field>
          </div>
        )}
        {progress.step === 2 && (
          <>
            <Notice>{t("Enter the supply values for your installation. The starting values are editable assumptions.")}</Notice>
            <div className="form-grid two">
              {([
                ["voltageLN", "L–N voltage", "V"],
                ["voltageLL", "L–L voltage", "V"],
                ["frequency", "Frequency", "Hz"],
                ["limitA", "Supply limit", "A"],
              ] as const).map(([key, label, unit]) => (
                <div key={key} onChangeCapture={() => setEditingNumber(true)} onBlur={() => setEditingNumber(false)}>
                  <Field label={t(label)} unit={unit}>
                    <LocaleNumberInput required min={0.01} value={project.supply[key]}
                      onValidityChange={(valid) => setInvalid((current) => current[key] === !valid ? current : { ...current, [key]: !valid })}
                      onValueChange={(value) => change((draft) => { draft.supply[key] = value; })} />
                  </Field>
                </div>
              ))}
            </div>
          </>
        )}
        {progress.step === 3 && (
          <>
            <dl className="interview-review">
              <dt>{t("Project name")}</dt><dd>{project.name}</dd>
              <dt>{t("Context")}</dt><dd>{t(project.context)}</dd>
              <dt>{t("Currency")}</dt><dd>{project.currency}</dd>
              <dt>{t("Supply")}</dt><dd>{project.supply.voltageLN} / {project.supply.voltageLL} V · {project.supply.frequency} Hz · {project.supply.limitA} A</dd>
            </dl>
            <Notice>{t("Finish setup, then use Add load to enter equipment. Save project stores a checkpoint; finishing setup alone does not save.")}</Notice>
          </>
        )}
        <div className="button-row">
          {progress.step > 1 && <button className="button" type="button" onClick={() => onProgress({ step: (progress.step - 1) as 1 | 2, completed: false })}>{t("Back")}</button>}
          <button className="button primary" type="submit">
            {progress.step === 3 ? <Check size={16} /> : <ArrowRight size={16} />}
            {t(progress.step === 3 ? "Finish setup" : "Next step")}
          </button>
        </div>
      </form>
    </section>
  );
}
