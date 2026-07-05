import type { FieldDraft } from '../../types/field';
import { FIELD_TYPE_CONFIGS } from '../../constants/fieldTypes';
import { useProjectStore } from '../../store/projectStore';
import { Input } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import { Button } from '../ui/Button';
import { OptionSetEditor } from './OptionSetEditor';

export function FieldConfigPanel({
  tableId,
  field,
  onClose,
}: {
  tableId: string;
  field: FieldDraft;
  onClose: () => void;
}) {
  const updateField = useProjectStore((s) => s.updateField);
  const config = FIELD_TYPE_CONFIGS[field.type];

  function patch(p: Partial<FieldDraft>) {
    updateField(tableId, field.id, p);
  }

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 dark:border-slate-700">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {field.displayName || 'Column'} settings
        </span>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <Field label="Description">
          <Input
            value={field.description ?? ''}
            placeholder="Optional"
            onChange={(e) => patch({ description: e.target.value })}
          />
        </Field>

        {config.supportsMaxLength && (
          <Field label="Maximum length">
            <Input
              type="number"
              value={field.maxLength ?? ''}
              onChange={(e) => patch({ maxLength: Number(e.target.value) })}
            />
          </Field>
        )}

        {config.supportsRange && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Minimum">
              <Input
                type="number"
                value={field.minValue ?? ''}
                onChange={(e) => patch({ minValue: Number(e.target.value) })}
              />
            </Field>
            <Field label="Maximum">
              <Input
                type="number"
                value={field.maxValue ?? ''}
                onChange={(e) => patch({ maxValue: Number(e.target.value) })}
              />
            </Field>
          </div>
        )}

        {config.supportsPrecision && (
          <Field label="Precision (decimal places)">
            <Input
              type="number"
              value={field.precision ?? 2}
              onChange={(e) => patch({ precision: Number(e.target.value) })}
            />
          </Field>
        )}

        {field.type === 'boolean' && (
          <Checkbox
            label="Default to Yes"
            checked={field.defaultBoolean ?? false}
            onChange={(e) => patch({ defaultBoolean: e.target.checked })}
          />
        )}

        {config.supportsOptions && (
          <Field label="Options">
            <OptionSetEditor
              options={field.options ?? []}
              onChange={(options) => patch({ options })}
            />
          </Field>
        )}

        {config.hint && <p className="text-xs text-slate-400">{config.hint}</p>}
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
