import { useEffect, useMemo, useState } from 'react';
import type {
  BridgeLookupConfig,
  ManyToManyRelationshipDraft,
  TableRef,
} from '../../types/relationship';
import { useProjectStore } from '../../store/projectStore';
import { useEntitiesCatalog } from '../../hooks/useEntitiesCatalog';
import { COMMON_LOOKUP_TARGETS } from '../../constants/defaults';
import {
  buildBridgeSchemaToken,
  buildTableLogicalName,
  MAX_TABLE_LOGICAL_NAME,
  sanitizeSchemaToken,
  toPascalToken,
} from '../../services/namingService';
import { getProjectPrefix } from '../../services/validationService';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { Button } from '../ui/Button';

const STANDARD_PREFIX = 'std:';

interface EditorDraft {
  side1: TableRef;
  side2: TableRef;
  bridgeDisplayName: string;
  bridgeSchemaName: string;
  nameTouched: boolean;
  lookupsTouched: boolean;
  side1Lookup: BridgeLookupConfig;
  side2Lookup: BridgeLookupConfig;
}

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
  const project = useProjectStore((s) => s.project);
  const addManyToMany = useProjectStore((s) => s.addManyToMany);
  const updateManyToMany = useProjectStore((s) => s.updateManyToMany);
  const updateTable = useProjectStore((s) => s.updateTable);
  const { entities } = useEntitiesCatalog(open);

  const prefix = getProjectPrefix(project) ?? 'new';

  // Project tables that can be a side (exclude bridge tables themselves).
  const sideTables = useMemo(() => tables.filter((t) => !t.bridge), [tables]);

  const [draft, setDraft] = useState<EditorDraft>(() => blankDraft(sideTables[0]?.id));

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const bridge = tables.find((t) => t.id === editing.bridgeTableId);
      setDraft({
        side1: editing.side1,
        side2: editing.side2,
        bridgeDisplayName: bridge?.displayName ?? '',
        bridgeSchemaName: bridge?.schemaName ?? '',
        nameTouched: editing.nameTouched ?? true,
        lookupsTouched: true,
        side1Lookup: editing.side1Lookup,
        side2Lookup: editing.side2Lookup,
      });
    } else {
      setDraft(withDerived(blankDraft(sideTables[0]?.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const sideOptions = useMemo(() => {
    const projectOpts = sideTables.map((t) => ({
      key: `proj:${t.id}`,
      label: `${t.displayName || 'Untitled'} (new)`,
    }));
    const standardOpts = COMMON_LOOKUP_TARGETS.map((t) => ({
      key: `${STANDARD_PREFIX}${t.logicalName}`,
      label: `${t.label} (${t.logicalName})`,
    }));
    return [...projectOpts, ...standardOpts];
  }, [sideTables]);

  function refKey(ref: TableRef): string {
    return ref.kind === 'project' ? `proj:${ref.tableId}` : `${STANDARD_PREFIX}${ref.logicalName}`;
  }

  function keyToRef(key: string): TableRef {
    if (key.startsWith('proj:')) return { kind: 'project', tableId: key.slice(5) };
    return { kind: 'standard', logicalName: key.slice(STANDARD_PREFIX.length) };
  }

  function refLabel(ref: TableRef): string {
    if (ref.kind === 'project') {
      return tables.find((t) => t.id === ref.tableId)?.displayName || 'Table';
    }
    return COMMON_LOOKUP_TARGETS.find((t) => t.logicalName === ref.logicalName)?.label ?? ref.logicalName;
  }

  function refToken(ref: TableRef): string {
    if (ref.kind === 'project') {
      const t = tables.find((x) => x.id === ref.tableId);
      return t?.schemaName || toPascalToken(t?.displayName ?? 'Table');
    }
    const known = COMMON_LOOKUP_TARGETS.find((t) => t.logicalName === ref.logicalName);
    return toPascalToken(known?.label ?? ref.logicalName);
  }

  // Fill derived bridge names / default lookups from the current sides, unless
  // the user has manually edited them.
  function withDerived(d: EditorDraft): EditorDraft {
    const next: EditorDraft = { ...d };
    const labelA = refLabel(next.side1);
    const labelB = refLabel(next.side2);
    if (!next.nameTouched) {
      next.bridgeDisplayName = `BRIDGE ${labelA} ${labelB}`;
      next.bridgeSchemaName = buildBridgeSchemaToken(prefix, refToken(next.side1), refToken(next.side2));
    }
    if (!next.lookupsTouched) {
      const defaults = deriveLookups(labelA, labelB);
      next.side1Lookup = defaults.side1Lookup;
      next.side2Lookup = defaults.side2Lookup;
    }
    return next;
  }

  // Recompute derived names/lookups when a side changes (respecting manual edits).
  function setSide(which: 'side1' | 'side2', key: string) {
    setDraft((d) => withDerived({ ...d, [which]: keyToRef(key) }));
  }

  function save() {
    if (editing) {
      updateManyToMany(editing.id, {
        side1: draft.side1,
        side2: draft.side2,
        side1Lookup: draft.side1Lookup,
        side2Lookup: draft.side2Lookup,
        nameTouched: draft.nameTouched,
      });
      updateTable(editing.bridgeTableId, {
        displayName: draft.bridgeDisplayName,
        pluralName: `${draft.bridgeDisplayName}s`,
        schemaName: draft.bridgeSchemaName,
      });
    } else {
      const id = addManyToMany(draft.side1, draft.side2);
      const created = useProjectStore.getState().project.manyToMany.find((m) => m.id === id);
      if (created) {
        updateManyToMany(id, {
          side1Lookup: draft.side1Lookup,
          side2Lookup: draft.side2Lookup,
          nameTouched: draft.nameTouched,
        });
        updateTable(created.bridgeTableId, {
          displayName: draft.bridgeDisplayName,
          pluralName: `${draft.bridgeDisplayName}s`,
          schemaName: draft.bridgeSchemaName,
        });
      }
    }
    onClose();
  }

  const logicalName = buildTableLogicalName(prefix, draft.bridgeSchemaName);
  const name1 = sanitizeSchemaToken(draft.side1Lookup.schemaName);
  const name2 = sanitizeSchemaToken(draft.side2Lookup.schemaName);
  const valid =
    draft.bridgeSchemaName.trim() !== '' &&
    draft.bridgeDisplayName.trim() !== '' &&
    name1 !== '' &&
    name2 !== '' &&
    name1.toLowerCase() !== name2.toLowerCase() &&
    logicalName.length <= MAX_TABLE_LOGICAL_NAME;

  const extraTargets = entities.length;

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
            {editing ? 'Save' : 'Add relationship'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
          A many-to-many relationship is created as a bridge table with one lookup to each side. You
          can add extra columns to the bridge table on the Fields step.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Side A">
            <Select value={refKey(draft.side1)} onChange={(e) => setSide('side1', e.target.value)}>
              {sideOptions.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Side B">
            <Select value={refKey(draft.side2)} onChange={(e) => setSide('side2', e.target.value)}>
              {sideOptions.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        {extraTargets > 0 && (
          <p className="-mt-2 text-xs text-slate-400">
            {extraTargets} tables available in this environment as relationship targets.
          </p>
        )}

        <Field label="Bridge table display name">
          <Input
            value={draft.bridgeDisplayName}
            placeholder="BRIDGE Table1 Table2"
            onChange={(e) =>
              setDraft((d) => ({ ...d, bridgeDisplayName: e.target.value, nameTouched: true }))
            }
          />
        </Field>

        <Field label="Bridge table schema name">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{prefix}_</span>
            <Input
              value={draft.bridgeSchemaName}
              placeholder="BRIDGE_Table1_Table2"
              onChange={(e) => {
                const raw = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').replace(/^_+/, '');
                const value = /^[0-9]/.test(raw) ? `N${raw}` : raw;
                setDraft((d) => ({ ...d, bridgeSchemaName: value, nameTouched: true }));
              }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Logical name: {logicalName}{' '}
            <span className={logicalName.length > MAX_TABLE_LOGICAL_NAME ? 'text-red-500' : ''}>
              ({logicalName.length}/{MAX_TABLE_LOGICAL_NAME})
            </span>
          </p>
        </Field>

        <LookupFields
          title={`Lookup to ${refLabel(draft.side1)} (Side A)`}
          config={draft.side1Lookup}
          onChange={(patch) =>
            setDraft((d) => ({ ...d, lookupsTouched: true, side1Lookup: { ...d.side1Lookup, ...patch } }))
          }
        />
        <LookupFields
          title={`Lookup to ${refLabel(draft.side2)} (Side B)`}
          config={draft.side2Lookup}
          onChange={(patch) =>
            setDraft((d) => ({ ...d, lookupsTouched: true, side2Lookup: { ...d.side2Lookup, ...patch } }))
          }
        />

        {name1 && name2 && name1.toLowerCase() === name2.toLowerCase() && (
          <p className="text-xs text-red-500">
            The two lookup schema names must be different (they point at different tables).
          </p>
        )}
      </div>
    </Modal>
  );
}

function LookupFields({
  title,
  config,
  onChange,
}: {
  title: string;
  config: BridgeLookupConfig;
  onChange: (patch: Partial<BridgeLookupConfig>) => void;
}) {
  const [schemaTouched, setSchemaTouched] = useState(false);
  return (
    <div className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
      <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-300">{title}</p>
      <div className="space-y-3">
        <Field label="Lookup column display name">
          <Input
            value={config.displayName}
            onChange={(e) => {
              const displayName = e.target.value;
              onChange({
                displayName,
                schemaName: schemaTouched ? config.schemaName : toPascalToken(displayName),
              });
            }}
          />
        </Field>
        <Field label="Lookup schema name">
          <Input
            value={config.schemaName}
            onChange={(e) => {
              setSchemaTouched(true);
              onChange({ schemaName: sanitizeSchemaToken(e.target.value) });
            }}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="On parent delete">
            <Select
              value={config.cascadeDelete}
              onChange={(e) =>
                onChange({ cascadeDelete: e.target.value as BridgeLookupConfig['cascadeDelete'] })
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
              checked={config.required}
              onChange={(e) => onChange({ required: e.target.checked })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function deriveLookups(labelA: string, labelB: string): {
  side1Lookup: BridgeLookupConfig;
  side2Lookup: BridgeLookupConfig;
} {
  const same = labelA.trim().toLowerCase() === labelB.trim().toLowerCase();
  const nameA = same ? `${labelA} 1` : labelA;
  const nameB = same ? `${labelB} 2` : labelB;
  return {
    side1Lookup: { displayName: nameA, schemaName: toPascalToken(nameA), required: true, cascadeDelete: 'Cascade' },
    side2Lookup: { displayName: nameB, schemaName: toPascalToken(nameB), required: true, cascadeDelete: 'Cascade' },
  };
}

function blankDraft(firstTableId?: string): EditorDraft {
  const side1: TableRef = firstTableId
    ? { kind: 'project', tableId: firstTableId }
    : { kind: 'standard', logicalName: 'account' };
  const side2: TableRef = { kind: 'standard', logicalName: 'contact' };
  const lookups = deriveLookups('Side A', 'Side B');
  return {
    side1,
    side2,
    bridgeDisplayName: '',
    bridgeSchemaName: '',
    nameTouched: false,
    lookupsTouched: false,
    side1Lookup: lookups.side1Lookup,
    side2Lookup: lookups.side2Lookup,
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
