import { useState } from 'react';
import type { FieldDraft } from '../../types/field';
import { FIELD_TYPE_CONFIGS } from '../../constants/fieldTypes';
import { useProjectStore } from '../../store/projectStore';
import {
  clampMaxLength,
  clampNumeric,
  getFieldLimits,
  maxLengthHint,
  parseOptionalNumber,
  precisionHint,
  rangeHint,
} from '../../utils/fieldConstraints';
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
  const limits = getFieldLimits(field.type);

  const [maxLengthError, setMaxLengthError] = useState<string>();
  const [minValueError, setMinValueError] = useState<string>();
  const [maxValueError, setMaxValueError] = useState<string>();
  const [precisionError, setPrecisionError] = useState<string>();

  function patch(p: Partial<FieldDraft>) {
    updateField(tableId, field.id, p);
  }

  function handleMaxLengthChange(raw: string) {
    const parsed = parseOptionalNumber(raw);
    if (parsed === undefined) {
      setMaxLengthError(undefined);
      patch({ maxLength: undefined });
      return;
    }
    const min = limits.minMaxLength ?? 1;
    const max = limits.maxMaxLength ?? 4000;
    if (parsed < min || parsed > max) {
      setMaxLengthError(`Must be between ${min.toLocaleString()} and ${max.toLocaleString()}`);
    } else {
      setMaxLengthError(undefined);
    }
    patch({ maxLength: clampMaxLength(parsed, field.type) });
  }

  function handleRangeChange(
    key: 'minValue' | 'maxValue',
    raw: string,
    setError: (msg?: string) => void,
  ) {
    const parsed = parseOptionalNumber(raw);
    if (parsed === undefined) {
      setError(undefined);
      patch({ [key]: undefined });
      return;
    }
    const minLimit = limits.minValueLimit ?? Number.MIN_SAFE_INTEGER;
    const maxLimit = limits.maxValueLimit ?? Number.MAX_SAFE_INTEGER;
    if (parsed < minLimit || parsed > maxLimit) {
      setError(`Must be between ${minLimit.toLocaleString()} and ${maxLimit.toLocaleString()}`);
    } else {
      setError(undefined);
    }
    patch({ [key]: clampNumeric(parsed, minLimit, maxLimit) });
  }

  function handlePrecisionChange(raw: string) {
    const parsed = parseOptionalNumber(raw);
    const minP = limits.minPrecision ?? 0;
    const maxP = limits.maxPrecision ?? 10;
    if (parsed === undefined) {
      setPrecisionError(undefined);
      patch({ precision: undefined });
      return;
    }
    if (parsed < minP || parsed > maxP) {
      setPrecisionError(`Must be between ${minP} and ${maxP}`);
    } else {
      setPrecisionError(undefined);
    }
    patch({ precision: clampNumeric(Math.round(parsed), minP, maxP) });
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
          <Field
            label="Maximum length"
            hint={maxLengthHint(field.type)}
            error={maxLengthError}
          >
            <Input
              type="number"
              min={limits.minMaxLength}
              max={limits.maxMaxLength}
              value={field.maxLength ?? ''}
              onChange={(e) => handleMaxLengthChange(e.target.value)}
            />
          </Field>
        )}

        {config.supportsRange && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Minimum" hint={rangeHint(field.type)} error={minValueError}>
              <Input
                type="number"
                min={limits.minValueLimit}
                max={limits.maxValueLimit}
                value={field.minValue ?? ''}
                onChange={(e) => handleRangeChange('minValue', e.target.value, setMinValueError)}
              />
            </Field>
            <Field label="Maximum" hint={rangeHint(field.type)} error={maxValueError}>
              <Input
                type="number"
                min={limits.minValueLimit}
                max={limits.maxValueLimit}
                value={field.maxValue ?? ''}
                onChange={(e) => handleRangeChange('maxValue', e.target.value, setMaxValueError)}
              />
            </Field>
          </div>
        )}

        {config.supportsPrecision && (
          <Field label="Precision (decimal places)" hint={precisionHint(field.type)} error={precisionError}>
            <Input
              type="number"
              min={limits.minPrecision}
              max={limits.maxPrecision}
              value={field.precision ?? 2}
              onChange={(e) => handlePrecisionChange(e.target.value)}
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

function Field({
  label,
  children,
  hint,
  error,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="mt-1 text-xs text-slate-400">{hint}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
