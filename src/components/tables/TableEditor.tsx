import { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import type { EntityDraft } from '../../types/entity';
import { OWNERSHIP_OPTIONS } from '../../constants/defaults';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { sanitizeSchemaToken, toPascalToken } from '../../services/namingService';
import { getProjectPrefix } from '../../services/validationService';

export function TableEditor({ table }: { table: EntityDraft }) {
  const updateTable = useProjectStore((s) => s.updateTable);
  const removeTable = useProjectStore((s) => s.removeTable);
  const duplicateTable = useProjectStore((s) => s.duplicateTable);
  const project = useProjectStore((s) => s.project);
  const prefix = getProjectPrefix(project) ?? '...';

  const [schemaTouched, setSchemaTouched] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Table settings</h2>
        <div className="flex gap-1">
          <Button variant="secondary" size="sm" onClick={() => duplicateTable(table.id)}>
            Duplicate
          </Button>
          <Button variant="danger" size="sm" onClick={() => removeTable(table.id)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid max-w-2xl gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Display name">
            <Input
              value={table.displayName}
              placeholder="Order"
              onChange={(e) => {
                const displayName = e.target.value;
                const patch: Partial<EntityDraft> = { displayName };
                if (!table.pluralName || table.pluralName === `${table.displayName}s`) {
                  patch.pluralName = `${displayName}s`;
                }
                if (!schemaTouched) patch.schemaName = toPascalToken(displayName);
                updateTable(table.id, patch);
              }}
            />
          </Field>
          <Field label="Plural name">
            <Input
              value={table.pluralName}
              placeholder="Orders"
              onChange={(e) => updateTable(table.id, { pluralName: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Schema name">
          <div className="flex items-center gap-2">
            <Badge tone="brand">{prefix}_</Badge>
            <Input
              value={table.schemaName}
              placeholder="Order"
              onChange={(e) => {
                setSchemaTouched(true);
                updateTable(table.id, { schemaName: sanitizeSchemaToken(e.target.value) });
              }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Logical name: {prefix}_{table.schemaName.toLowerCase()}
          </p>
        </Field>

        <Field label="Description">
          <Input
            value={table.description ?? ''}
            placeholder="Optional"
            onChange={(e) => updateTable(table.id, { description: e.target.value })}
          />
        </Field>

        <Field label="Ownership">
          <Select
            className="max-w-xs"
            value={table.ownershipType}
            onChange={(e) =>
              updateTable(table.id, { ownershipType: e.target.value as EntityDraft['ownershipType'] })
            }
          >
            {OWNERSHIP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex gap-6">
          <Checkbox
            label="Has notes"
            checked={table.hasNotes}
            onChange={(e) => updateTable(table.id, { hasNotes: e.target.checked })}
          />
          <Checkbox
            label="Has activities"
            checked={table.hasActivities}
            onChange={(e) => updateTable(table.id, { hasActivities: e.target.checked })}
          />
        </div>
      </div>
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
