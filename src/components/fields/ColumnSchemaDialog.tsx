import { useCallback, useRef, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import type { ColumnSchemaEntry } from '../../types/columnSchema';
import type { FieldDraft } from '../../types/field';
import {
  buildSampleColumnSchema,
  copyColumnSchemaToClipboard,
  previewSchemaMerge,
  validateColumnSchemaJson,
} from '../../utils/columnSchema';
import { toErrorMessage } from '../../utils/errors';
import { useAutoDismissMessage } from '../../hooks/useAutoDismissMessage';
import { ClipboardIcon } from '../ui/icons/ClipboardIcon';

export function ColumnSchemaDialog({
  open,
  onClose,
  existingFields,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  existingFields: FieldDraft[];
  onApply: (entries: ColumnSchemaEntry[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const dismissCopyMessage = useCallback(() => setCopyMessage(null), []);
  useAutoDismissMessage(copyMessage, dismissCopyMessage);

  const validation = text.trim() ? validateColumnSchemaJson(text) : null;
  const preview =
    validation?.ok === true
      ? previewSchemaMerge(existingFields, validation.entries)
      : null;

  function handleClose() {
    setText('');
    setCopyMessage(null);
    onClose();
  }

  function handleApply() {
    if (!validation?.ok) return;
    onApply(validation.entries);
    setText('');
    onClose();
  }

  async function handleCopySample() {
    try {
      await copyColumnSchemaToClipboard(buildSampleColumnSchema());
      setCopyMessage('Sample schema copied to clipboard.');
    } catch (error) {
      setCopyMessage(toErrorMessage(error));
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setText(reader.result);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  return (
    <Modal
      open={open}
      title="Paste columns via template"
      onClose={handleClose}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!validation?.ok}>
            Apply schema
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Upload or paste a JSON column schema file. Columns are merged by schema name —
          matching columns are updated, new ones are added, and existing columns not in the
          file are kept.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
            Choose JSON file
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void handleCopySample()}>
            Copy sample schema
            <ClipboardIcon />
          </Button>
        </div>

        {copyMessage && (
          <Alert tone={copyMessage.includes('copied') ? 'success' : 'warning'}>{copyMessage}</Alert>
        )}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder={'{\n  "schemaVersion": "1.0",\n  "kind": "solution-creator-column-schema",\n  "columns": []\n}'}
          className="w-full rounded-md border border-slate-300 bg-white p-2 font-mono text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />

        {validation && !validation.ok && (
          <Alert tone="warning" title="Validation errors">
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm">
              {validation.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        {preview && (
          <Alert tone="info">
            Will merge {preview.total} column{preview.total === 1 ? '' : 's'} ({preview.updates}{' '}
            update{preview.updates === 1 ? '' : 's'}, {preview.additions} new).
          </Alert>
        )}
      </div>
    </Modal>
  );
}
