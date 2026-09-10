import { useEffect, useState } from 'react';
import type { ManyToManyRelationshipDraft } from '../../types/relationship';
import { useProjectStore } from '../../store/projectStore';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { sanitizeSchemaToken } from '../../services/namingService';
import {
  applyManyToManySideDefaults,
  makeManyToManyDraft,
} from '../../utils/manyToManyDefaults';

type Touched = {
  bridgeDisplay?: boolean;
  bridgeSchema?: boolean;
  leftLookupDisplay?: boolean;
  leftLookupSchema?: boolean;
  rightLookupDisplay?: boolean;
  rightLookupSchema?: boolean;
};

export function ManyToManyEditor({
  open,
  editing,
  onClose,
}: {
  open: boolean;
  editing: ManyToManyRelationshipDraft | null;
  onClose: () => void;
}) {
  const tables = useProjectStore((s) => s.project.tables);
  const addManyToMany = useProjectStore((s) => s.addManyToMany);
  const updateManyToMany = useProjectStore((s) => s.updateManyToMany);

  const [draft, setDraft] = useState<ManyToManyRelationshipDraft>(() => blank(tables));
  const [touched, setTouched] = useState<Touched>({});

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setDraft(editing);
      setTouched({
        bridgeDisplay: true,
        bridgeSchema: true,
        leftLookupDisplay: true,
        leftLookupSchema: true,
        rightLookupDisplay: true,
        rightLookupSchema: true,
      });
    } else {
      setDraft(blank(tables));
      setTouched({});
    }
  }, [open, editing, tables]);

  function labelFor(id: string): string {
    return tables.find((t) => t.id === id)?.displayName || '';
  }

  function setSide(side: 'leftTableId' | 'rightTableId', tableId: string) {
    setDraft((d) => {
      const next = { ...d, [side]: tableId };
      return applyManyToManySideDefaults(
        next,
        labelFor(side === 'leftTableId' ? tableId : next.leftTableId),
        labelFor(side === 'rightTableId' ? tableId : next.rightTableId),
        touched,
      );
    });
  }

  function save() {
    if (editing) {
      updateManyToMany(editing.id, draft);
    } else {
      addManyToMany(draft);
    }
    onClose();
  }

  const valid =
    draft.leftTableId !== '' &&
    draft.rightTableId !== '' &&
    draft.leftTableId !== draft.rightTableId &&
    draft.bridgeDisplayName.trim() !== '' &&
    sanitizeSchemaToken(draft.bridgeSchemaName) !== '' &&
    sanitizeSchemaToken(draft.leftLookupSchemaName) !== '' &&
    sanitizeSchemaToken(draft.rightLookupSchemaName) !== '';

  const leftLabel = labelFor(draft.leftTableId) || 'Left';
  const rightLabel = labelFor(draft.rightTableId) || 'Right';

  return (
    <Modal
      open={open}
      title={editing ? 'Edit M:N relationship' : 'Add M:N relationship'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!valid}>
            {editing ? 'Save' : 'Add M:N'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Left table">
            <Select value={draft.leftTableId} onChange={(e) => setSide('leftTableId', e.target.value)}>
              <option value="">Select…</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.displayName || 'Untitled'}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Right table">
            <Select value={draft.rightTableId} onChange={(e) => setSide('rightTableId', e.target.value)}>
              <option value="">Select…</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.displayName || 'Untitled'}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Bridge display name">
            <Input
              value={draft.bridgeDisplayName}
              onChange={(e) => {
                setTouched((t) => ({ ...t, bridgeDisplay: true }));
                setDraft((d) => ({ ...d, bridgeDisplayName: e.target.value }));
              }}
            />
          </Field>
          <Field label="Bridge schema name">
            <Input
              value={draft.bridgeSchemaName}
              onChange={(e) => {
                setTouched((t) => ({ ...t, bridgeSchema: true }));
                setDraft((d) => ({
                  ...d,
                  bridgeSchemaName: sanitizeSchemaToken(e.target.value),
                }));
              }}
            />
            <p className="mt-1 text-xs text-slate-400">Without publisher prefix</p>
          </Field>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-900/60">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Bridge schema preview
          </p>
          <PreviewRow kind="Table" display={draft.bridgeDisplayName} schema={draft.bridgeSchemaName} />
          <PreviewRow
            kind="Primary"
            display={`${draft.primaryDisplayName} (autonumber)`}
            schema={`${draft.primarySchemaName} · ${draft.autoNumberFormat}`}
          />
          <PreviewRow
            kind="Lookup"
            display={draft.leftLookupDisplayName || leftLabel}
            schema={`${draft.leftLookupSchemaName} → ${leftLabel}`}
          />
          <PreviewRow
            kind="Lookup"
            display={draft.rightLookupDisplayName || rightLabel}
            schema={`${draft.rightLookupSchemaName} → ${rightLabel}`}
          />
          <p className="mt-3 rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            Defaults: display <strong>Bridge {'{Left}'} {'{Right}'}</strong>, schema{' '}
            <strong>Bridge{'{Left}'}{'{Right}'}</strong>, lookups <strong>Lookup{'{Side}'}</strong>.
            Primary is always autonumber.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={`Left lookup display (${leftLabel})`}>
            <Input
              value={draft.leftLookupDisplayName}
              onChange={(e) => {
                setTouched((t) => ({ ...t, leftLookupDisplay: true }));
                setDraft((d) => ({ ...d, leftLookupDisplayName: e.target.value }));
              }}
            />
          </Field>
          <Field label="Left lookup schema">
            <Input
              value={draft.leftLookupSchemaName}
              onChange={(e) => {
                setTouched((t) => ({ ...t, leftLookupSchema: true }));
                setDraft((d) => ({
                  ...d,
                  leftLookupSchemaName: sanitizeSchemaToken(e.target.value),
                }));
              }}
            />
          </Field>
          <Field label={`Right lookup display (${rightLabel})`}>
            <Input
              value={draft.rightLookupDisplayName}
              onChange={(e) => {
                setTouched((t) => ({ ...t, rightLookupDisplay: true }));
                setDraft((d) => ({ ...d, rightLookupDisplayName: e.target.value }));
              }}
            />
          </Field>
          <Field label="Right lookup schema">
            <Input
              value={draft.rightLookupSchemaName}
              onChange={(e) => {
                setTouched((t) => ({ ...t, rightLookupSchema: true }));
                setDraft((d) => ({
                  ...d,
                  rightLookupSchemaName: sanitizeSchemaToken(e.target.value),
                }));
              }}
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

function blank(tables: { id: string; displayName: string }[]): ManyToManyRelationshipDraft {
  const left = tables[0];
  const right = tables[1] ?? tables[0];
  return makeManyToManyDraft(
    left?.id ?? '',
    right?.id ?? '',
    left?.displayName ?? 'Left',
    right?.displayName ?? 'Right',
  );
}

function PreviewRow({
  kind,
  display,
  schema,
}: {
  kind: string;
  display: string;
  schema: string;
}) {
  return (
    <div className="grid grid-cols-[72px_1fr_1fr] gap-2 border-b border-dashed border-slate-200 py-1.5 text-xs last:border-b-0 dark:border-slate-700">
      <span className="uppercase text-slate-400">{kind}</span>
      <span className="text-slate-700 dark:text-slate-200">{display}</span>
      <span className="font-mono text-slate-500">{schema}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
        {label}
      </label>
      {children}
    </div>
  );
}
