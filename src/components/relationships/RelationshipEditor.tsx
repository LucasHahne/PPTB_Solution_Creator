import { useEffect, useMemo, useState } from 'react';
import type { LookupRelationshipDraft, ParentTableRef } from '../../types/relationship';
import { useProjectStore } from '../../store/projectStore';
import { useEntitiesCatalog } from '../../hooks/useEntitiesCatalog';
import { COMMON_LOOKUP_TARGETS } from '../../constants/defaults';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { Button } from '../ui/Button';
import { sanitizeSchemaToken, toPascalToken } from '../../services/namingService';
import { newId } from '../../utils/ids';

const STANDARD_PREFIX = 'std:';

export function RelationshipEditor({
  open,
  editing,
  onClose,
}: {
  open: boolean;
  editing: LookupRelationshipDraft | null;
  onClose: () => void;
}) {
  const tables = useProjectStore((s) => s.project.tables);
  const addRelationship = useProjectStore((s) => s.addRelationship);
  const updateRelationship = useProjectStore((s) => s.updateRelationship);
  const { entities } = useEntitiesCatalog(open);

  const [draft, setDraft] = useState<LookupRelationshipDraft>(() => blankDraft(tables[0]?.id));
  const [schemaTouched, setSchemaTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(editing ?? blankDraft(tables[0]?.id));
      setSchemaTouched(Boolean(editing));
    }
  }, [open, editing, tables]);

  // Parent options: project tables + common standard tables + any catalog match.
  const parentOptions = useMemo(() => {
    const projectOpts = tables.map((t) => ({
      key: `proj:${t.id}`,
      label: `${t.displayName || 'Untitled'} (new)`,
    }));
    const standardOpts = COMMON_LOOKUP_TARGETS.map((t) => ({
      key: `${STANDARD_PREFIX}${t.logicalName}`,
      label: `${t.label} (${t.logicalName})`,
    }));
    return [...projectOpts, ...standardOpts];
  }, [tables]);

  function parentKey(ref: ParentTableRef): string {
    return ref.kind === 'project' ? `proj:${ref.tableId}` : `${STANDARD_PREFIX}${ref.logicalName}`;
  }

  function setParentFromKey(key: string) {
    if (key.startsWith('proj:')) {
      setDraft((d) => ({ ...d, parent: { kind: 'project', tableId: key.slice(5) } }));
    } else if (key.startsWith(STANDARD_PREFIX)) {
      setDraft((d) => ({ ...d, parent: { kind: 'standard', logicalName: key.slice(STANDARD_PREFIX.length) } }));
    }
  }

  function save() {
    if (editing) {
      updateRelationship(editing.id, draft);
    } else {
      addRelationship({ ...draft, id: newId() });
    }
    onClose();
  }

  const valid =
    draft.lookupDisplayName.trim() !== '' &&
    sanitizeSchemaToken(draft.lookupSchemaName) !== '' &&
    Boolean(draft.childTableId);

  // Surface catalog count subtly so users know standard targets beyond the common list exist.
  const extraTargets = entities.length;

  return (
    <Modal
      open={open}
      title={editing ? 'Edit lookup' : 'Add lookup (1:N)'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!valid}>
            {editing ? 'Save' : 'Add lookup'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Parent table (the &quot;one&quot; side)">
          <Select value={parentKey(draft.parent)} onChange={(e) => setParentFromKey(e.target.value)}>
            {parentOptions.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </Select>
          {extraTargets > 0 && (
            <p className="mt-1 text-xs text-slate-400">
              {extraTargets} tables available in this environment as lookup targets.
            </p>
          )}
        </Field>

        <Field label="Child table (the &quot;many&quot; side — gets the lookup column)">
          <Select
            value={draft.childTableId}
            onChange={(e) => setDraft((d) => ({ ...d, childTableId: e.target.value }))}
          >
            <option value="">Select a table…</option>
            {tables.map((t) => (
              <option key={t.id} value={t.id}>
                {t.displayName || 'Untitled table'}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Lookup column display name">
          <Input
            value={draft.lookupDisplayName}
            placeholder="Parent"
            onChange={(e) => {
              const lookupDisplayName = e.target.value;
              setDraft((d) => ({
                ...d,
                lookupDisplayName,
                lookupSchemaName: schemaTouched ? d.lookupSchemaName : toPascalToken(lookupDisplayName),
              }));
            }}
          />
        </Field>

        <Field label="Lookup schema name">
          <Input
            value={draft.lookupSchemaName}
            placeholder="Parent"
            onChange={(e) => {
              setSchemaTouched(true);
              setDraft((d) => ({ ...d, lookupSchemaName: sanitizeSchemaToken(e.target.value) }));
            }}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="On parent delete">
            <Select
              value={draft.cascadeDelete}
              onChange={(e) =>
                setDraft((d) => ({ ...d, cascadeDelete: e.target.value as LookupRelationshipDraft['cascadeDelete'] }))
              }
            >
              <option value="RemoveLink">Remove link</option>
              <option value="Restrict">Restrict</option>
              <option value="Cascade">Cascade delete</option>
            </Select>
          </Field>
          <div className="flex items-end pb-1">
            <Checkbox
              label="Required"
              checked={draft.required}
              onChange={(e) => setDraft((d) => ({ ...d, required: e.target.checked }))}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

function blankDraft(firstTableId?: string): LookupRelationshipDraft {
  return {
    id: newId(),
    childTableId: firstTableId ?? '',
    parent: firstTableId
      ? { kind: 'project', tableId: firstTableId }
      : { kind: 'standard', logicalName: 'account' },
    lookupDisplayName: '',
    lookupSchemaName: '',
    cascadeDelete: 'RemoveLink',
    required: false,
  };
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
