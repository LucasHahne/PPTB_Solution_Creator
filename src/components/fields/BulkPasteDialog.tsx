import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { parsePastedFields } from '../../utils/clipboard';
import { FIELD_TYPE_ALIASES } from '../../constants/fieldTypes';
import { makeField } from '../../store/projectStore';
import { toPascalToken } from '../../services/namingService';
import type { FieldDraft, FieldType } from '../../types/field';

export function BulkPasteDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (fields: FieldDraft[]) => void;
}) {
  const [text, setText] = useState('');
  const parsed = parsePastedFields(text);

  function resolveType(raw?: string): FieldType {
    if (!raw) return 'text';
    return FIELD_TYPE_ALIASES[raw.trim().toLowerCase()] ?? 'text';
  }

  function handleAdd() {
    const fields = parsed.map((row) => {
      const field = makeField(resolveType(row.type), row.displayName);
      field.schemaName = toPascalToken(row.displayName);
      if (row.required) field.requiredLevel = 'ApplicationRequired';
      return field;
    });
    onAdd(fields);
    setText('');
    onClose();
  }

  return (
    <Modal
      open={open}
      title="Paste columns"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={parsed.length === 0}>
            Add {parsed.length} column{parsed.length === 1 ? '' : 's'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          One column per line. Use tabs or commas to separate{' '}
          <span className="font-medium">Display Name, Type, Required</span>. Type and required
          are optional and default to single line text and not required.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={'Order Number\tText\tyes\nAmount\tCurrency\nStatus\tChoice'}
          className="w-full rounded-md border border-slate-300 bg-white p-2 font-mono text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        {parsed.length > 0 && (
          <Alert tone="info">
            Will add {parsed.length} column{parsed.length === 1 ? '' : 's'}:{' '}
            {parsed.map((p) => p.displayName).join(', ')}
          </Alert>
        )}
      </div>
    </Modal>
  );
}
