import { useCallback, useState } from "react";
import { useProjectStore } from "../../store/projectStore";
import { makeField } from "../../store/projectStore";
import { StepContainer } from "../layout/StepContainer";
import { FieldGrid } from "./FieldGrid";
import { FieldConfigPanel } from "./FieldConfigPanel";
import { ColumnSchemaDialog } from "./ColumnSchemaDialog";
import { UnsupportedColumnTypesNote } from "./UnsupportedColumnTypesNote";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import { Alert } from "../ui/Alert";
import { getProjectPrefix } from "../../services/validationService";
import {
  buildSampleColumnSchema,
  copyColumnSchemaToClipboard,
  downloadJson,
  exportColumnSchema,
  exportFilename,
  SAMPLE_SCHEMA_FILENAME,
} from "../../utils/columnSchema";
import { toErrorMessage } from "../../utils/errors";
import { useAutoDismissMessage } from "../../hooks/useAutoDismissMessage";
import { ClipboardIcon } from "../ui/icons/ClipboardIcon";

export function FieldsStep({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  const project = useProjectStore((s) => s.project);
  const tables = project.tables;
  const selectedTableId = useProjectStore((s) => s.selectedTableId);
  const selectTable = useProjectStore((s) => s.selectTable);
  const addField = useProjectStore((s) => s.addField);
  const addFields = useProjectStore((s) => s.addFields);
  const mergeFieldsFromSchema = useProjectStore((s) => s.mergeFieldsFromSchema);

  const [configuringId, setConfiguringId] = useState<string | null>(null);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const dismissCopyMessage = useCallback(() => setCopyMessage(null), []);
  useAutoDismissMessage(copyMessage, dismissCopyMessage);

  const prefix = getProjectPrefix(project) ?? "...";
  const activeId = selectedTableId ?? tables[0]?.id ?? null;
  const activeTable = tables.find((t) => t.id === activeId);
  const configuringField =
    activeTable?.fields.find((f) => f.id === configuringId) ?? null;

  function handleDownloadSampleSchema() {
    downloadJson(SAMPLE_SCHEMA_FILENAME, buildSampleColumnSchema());
  }

  function handleExportSchema() {
    if (!activeTable) return;
    downloadJson(exportFilename(activeTable), exportColumnSchema(activeTable));
  }

  async function handleCopySampleSchema() {
    try {
      await copyColumnSchemaToClipboard(buildSampleColumnSchema());
      setCopyMessage("Sample schema copied to clipboard.");
    } catch (error) {
      setCopyMessage(toErrorMessage(error));
    }
  }

  if (tables.length === 0) {
    return (
      <StepContainer title="Add columns" onBack={onBack}>
        <Alert tone="warning" title="No tables yet">
          Go back and add at least one table before defining columns.
        </Alert>
      </StepContainer>
    );
  }

  return (
    <StepContainer
      title="Add columns"
      description="Define the columns for each table. Pick the primary name column with the radio button."
      titleActions={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportSchema}
            disabled={!activeTable}
          >
            Export schema
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadSampleSchema}
          >
            Download sample schema file
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void handleCopySampleSchema()}
          >
            Copy sample schema
            <ClipboardIcon />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSchemaOpen(true)}
            disabled={!activeTable}
          >
            Paste columns via template
          </Button>
        </>
      }
      onBack={onBack}
      onNext={onNext}
      actions={
        <Select
          className="w-56"
          value={activeId ?? ""}
          onChange={(e) => {
            selectTable(e.target.value);
            setConfiguringId(null);
          }}
        >
          {tables.map((t) => (
            <option key={t.id} value={t.id}>
              {t.displayName || "Untitled table"} ({t.fields.length})
            </option>
          ))}
        </Select>
      }
    >
      {copyMessage && (
        <div className="mb-4">
          <Alert
            tone={copyMessage.includes("copied") ? "success" : "warning"}
            title={copyMessage}
          />
        </div>
      )}

      {activeTable && (
        <div className="flex h-[26rem] overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-700">
              <Button size="sm" onClick={() => addField(activeTable.id)}>
                + Add column
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  addFields(
                    activeTable.id,
                    Array.from({ length: 5 }, () => makeField("text")),
                  )
                }
              >
                + Add 5
              </Button>
              <span className="ml-auto text-xs text-slate-400">
                {activeTable.fields.length} column(s)
              </span>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2">
              <FieldGrid
                tableId={activeTable.id}
                prefix={prefix}
                configuringId={configuringId}
                onConfigure={(id) =>
                  setConfiguringId((cur) => (cur === id ? null : id))
                }
              />
            </div>
          </div>

          {configuringField && (
            <FieldConfigPanel
              tableId={activeTable.id}
              field={configuringField}
              onClose={() => setConfiguringId(null)}
            />
          )}
        </div>
      )}

      <div className="mt-4">
        <UnsupportedColumnTypesNote />
      </div>

      {activeTable && (
        <ColumnSchemaDialog
          open={schemaOpen}
          onClose={() => setSchemaOpen(false)}
          existingFields={activeTable.fields}
          onApply={(entries) => mergeFieldsFromSchema(activeTable.id, entries)}
        />
      )}
    </StepContainer>
  );
}
