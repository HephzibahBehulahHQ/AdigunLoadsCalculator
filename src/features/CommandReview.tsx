import { useState } from "react";
import type { Project } from "../domain/types";
import {
  applyProjectCommand,
  type CommandPreview,
  type ProjectChange,
} from "../commands/projectCommands";
import { downloadFile } from "../import-export/files";
import { Modal, Notice } from "./ui";
import { useT } from "../i18n";

export function CommandReview({
  project,
  preview,
  change,
  onClose,
  onApplied,
}: {
  project: Project;
  preview: CommandPreview;
  change: ProjectChange;
  onClose: () => void;
  onApplied?: () => void;
}) {
  const t = useT();
  const [error, setError] = useState("");
  const stale =
    project.id !== preview.projectId || project.revision !== preview.revision;
  return (
    <Modal title={t("Review project changes")} onClose={onClose} wide>
      <div className="modal-body">
        <p>
          <strong>{preview.summary}</strong> · {t("Revision")}{" "}
          {preview.revision}
        </p>
        {stale && (
          <Notice tone="warning">
            {t(
              "The project changed after this preview. Close it and review again.",
            )}
          </Notice>
        )}
        {preview.errors.map((message, i) => (
          <p className="error-text" role="alert" key={i}>
            {t(message)}
          </p>
        ))}
        {preview.warnings.map((message, i) => (
          <Notice key={i} tone="warning">
            {t(message)}
          </Notice>
        ))}
        {preview.changes.length > 0 && (
          <div className="table-wrap command-review-table">
            <table>
              <thead>
                <tr>
                  <th>{t("Object")}</th>
                  <th>{t("Field")}</th>
                  <th>{t("Before")}</th>
                  <th>{t("After")}</th>
                </tr>
              </thead>
              <tbody>
                {preview.changes.slice(0, 250).map((item, i) => (
                  <tr key={i}>
                    <td>{item.name}</td>
                    <td>{item.field}</td>
                    <td>
                      {item.before.length > 300 ? <details><summary>{t("Read complete value")} · {item.before.length} {t("characters")}</summary><p style={{ whiteSpace: "pre-wrap" }}>{item.before}</p></details> : <span>{item.before}</span>}
                    </td>
                    <td>
                      {item.after.length > 300 ? <details><summary>{t("Read complete value")} · {item.after.length} {t("characters")}</summary><p style={{ whiteSpace: "pre-wrap" }}>{item.after}</p></details> : <span>{item.after}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {preview.changes.length > 250 && (
          <p>
            {t(
              "Showing the first 250 changes. Export the complete preview to inspect every field.",
            )}
          </p>
        )}
        {!preview.changes.length && !preview.errors.length && (
          <p>{t("No fields would change.")}</p>
        )}
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="modal-footer">
        <button
          className="button"
          onClick={() =>
            downloadFile(
              "project-change-preview.json",
              JSON.stringify(preview, null, 2),
              "application/json",
            )
          }
        >
          {t("Export preview")}
        </button>
        <button className="button" onClick={onClose}>
          {t("Cancel")}
        </button>
        <button
          className="button primary"
          disabled={stale || !!preview.errors.length || !preview.changes.length}
          onClick={() => {
            try {
              const accepted = change((draft) =>
                Object.assign(draft, applyProjectCommand(draft, preview)),
              );
              if (accepted === false) {
                setError(
                  t(
                    "The change was not accepted. Review the workspace error and try again.",
                  ),
                );
                return;
              }
              onApplied?.();
              onClose();
            } catch (cause) {
              setError((cause as Error).message);
            }
          }}
        >
          {t("Apply reviewed changes")}
        </button>
      </div>
    </Modal>
  );
}
