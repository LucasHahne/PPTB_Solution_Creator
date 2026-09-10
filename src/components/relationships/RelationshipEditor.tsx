import { useEffect, useMemo, useState } from 'react';
import type {
  LookupRelationshipDraft,
  ParentTableRef,
} from '../../types/relationship';
import { useProjectStore } from '../../store/projectStore';
import { useEntitiesCatalog } from '../../hooks/useEntitiesCatalog';
import { COMMON_LOOKUP_TARGETS } from '../../constants/defaults';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Combobox, type ComboboxOption } from '../ui/Combobox';
import { Checkbox } from '../ui/Checkbox';
import { Button } from '../ui/Button';
import { sanitizeSchemaToken } from '../../services/namingService';
import { defaultLookupSchemaName } from '../../utils/manyToManyDefaults';
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
  const { entities, isLoading, error } = useEntitiesCatalog(open);

  const [draft, setDraft] = useState<LookupRelationshipDraft>(() =>
    blankDraft(tables[0]?.id, tables[0]?.displayName),
  );
  const [displayTouched, setDisplayTouched] = useState(false);
  const [schemaTouched, setSchemaTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setDraft(editing);
      setDisplayTouched(true);
      setSchemaTouched(true);
    } else {
      const first = tables[0];
      setDraft(blankDraft(first?.id, first?.displayName));
      setDisplayTouched(false);
      setSchemaTouched(false);
    }
  }, [open, editing, tables]);

  const parentOptions = useMemo<ComboboxOption[]>(() => {
    const projectOpts: ComboboxOption[] = tables.map((t) => ({
      key: `proj:${t.id}`,
      label: `${t.displayName || 'Untitled'} (new)`,
      group: 'Project tables',
    }));
    const commonLogicalNames = new Set(
      COMMON_LOOKUP_TARGETS.map((t) => t.logicalName),
    );
    const commonOpts: ComboboxOption[] = COMMON_LOOKUP_TARGETS.map((t) => ({
      key: `${STANDARD_PREFIX}${t.logicalName}`,
      label: t.label,
      sublabel: t.logicalName,
      group: 'Common tables',
    }));
    const catalogOpts: ComboboxOption[] = entities
      .filter((e) => !commonLogicalNames.has(e.logicalName))
      .map((e) => ({
        key: `${STANDARD_PREFIX}${e.logicalName}`,
        label: e.displayName,
        sublabel: e.logicalName,
        group: 'Environment tables',
      }));
    return [...projectOpts, ...commonOpts, ...catalogOpts];
  }, [tables, entities]);

  function parentLabel(ref: ParentTableRef): string {
    if (ref.kind === 'project') {
      return tables.find((t) => t.id === ref.tableId)?.displayName?.trim() || 'Parent';
    }
    const known = COMMON_LOOKUP_TARGETS.find((t) => t.logicalName === ref.logicalName);
    if (known) return known.label;
    const fromCatalog = entities.find((e) => e.logicalName === ref.logicalName);
    return fromCatalog?.displayName?.trim() || ref.logicalName || 'Parent';
  }

  function parentKey(ref: ParentTableRef): string {
    return ref.kind === 'project'
      ? `proj:${ref.tableId}`
      : `${STANDARD_PREFIX}${ref.logicalName}`;
  }

  function applyParentDefaults(next: LookupRelationshipDraft, label: string): LookupRelationshipDraft {
    return {
      ...next,
      lookupDisplayName: displayTouched ? next.lookupDisplayName : label,
      lookupSchemaName: schemaTouched
        ? next.lookupSchemaName
        : defaultLookupSchemaName(label),
    };
  }

  function setParentFromKey(key: string) {
    let parent: ParentTableRef;
    if (key.startsWith('proj:')) {
      parent = { kind: 'project', tableId: key.slice(5) };
    } else if (key.startsWith(STANDARD_PREFIX)) {
      parent = {
        kind: 'standard',
        logicalName: key.slice(STANDARD_PREFIX.length),
      };
    } else {
      return;
    }
    setDraft((d) => applyParentDefaults({ ...d, parent }, parentLabel(parent)));
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

  const resolvedParentLabel = parentLabel(draft.parent);
  const schemaPlaceholder = defaultLookupSchemaName(resolvedParentLabel);

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
        <Field label='Parent table (the "one" side)'>
          <Combobox
            value={parentKey(draft.parent)}
            options={parentOptions}
            onChange={setParentFromKey}
            placeholder="Select a table…"
          />
          {isLoading && (
            <p className="mt-1 text-xs text-slate-400">Loading environment tables…</p>
          )}
          {error && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Could not load environment tables; project and common tables are still available.
            </p>
          )}
        </Field>

        <Field label='Child table (the "many" side — gets the lookup column)'>
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
            placeholder={resolvedParentLabel}
            onChange={(e) => {
              setDisplayTouched(true);
              const lookupDisplayName = e.target.value;
              setDraft((d) => ({
                ...d,
                lookupDisplayName,
                lookupSchemaName: schemaTouched
                  ? d.lookupSchemaName
                  : defaultLookupSchemaName(lookupDisplayName || resolvedParentLabel),
              }));
            }}
          />
        </Field>

        <Field label="Lookup schema name">
          <Input
            value={draft.lookupSchemaName}
            placeholder={schemaPlaceholder}
            onChange={(e) => {
              setSchemaTouched(true);
              setDraft((d) => ({
                ...d,
                lookupSchemaName: sanitizeSchemaToken(e.target.value),
              }));
            }}
          />
          <p className="mt-1 text-xs text-slate-400">
            Default: <code className="text-xs">Lookup{'{Parent}'}</code> (same as M:N bridge lookups)
          </p>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="On parent delete">
            <Select
              value={draft.cascadeDelete}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  cascadeDelete: e.target.value as LookupRelationshipDraft['cascadeDelete'],
                }))
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

function blankDraft(firstTableId?: string, firstDisplayName?: string): LookupRelationshipDraft {
  const parent: ParentTableRef = firstTableId
    ? { kind: 'project', tableId: firstTableId }
    : { kind: 'standard', logicalName: 'account' };
  const label = firstDisplayName?.trim() || (firstTableId ? 'Parent' : 'Account');
  return {
    id: newId(),
    childTableId: firstTableId ?? '',
    parent,
    lookupDisplayName: label,
    lookupSchemaName: defaultLookupSchemaName(label),
    cascadeDelete: 'RemoveLink',
    required: false,
  };
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
        {label}
      </label>
      {children}
    </div>
  );
}
