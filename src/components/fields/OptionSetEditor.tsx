import { useState } from 'react';
import type { OptionDraft } from '../../types/field';
import { newId } from '../../utils/ids';
import { formatOptionSetInput, parseOptionSetInput } from '../../utils/optionSetParser';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export function OptionSetEditor({
  options,
  onChange,
}: {
  options: OptionDraft[];
  onChange: (options: OptionDraft[]) => void;
}) {
  const [bulkText, setBulkText] = useState('');
  const [bulkError, setBulkError] = useState<string>();

  function update(id: string, patch: Partial<OptionDraft>) {
    onChange(options.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }

  function add() {
    const nextValue = options.reduce((max, o) => Math.max(max, o.value), 0) + 1;
    onChange([...options, { id: newId(), value: nextValue, label: `Option ${nextValue}` }]);
  }

  function remove(id: string) {
    onChange(options.filter((o) => o.id !== id));
  }

  function applyBulk() {
    const startValue = options.reduce((max, o) => Math.max(max, o.value), 0);
    const { options: parsed, errors } = parseOptionSetInput(bulkText, startValue);
    if (errors.length > 0) {
      setBulkError(errors.join(' '));
      return;
    }
    setBulkError(undefined);
    onChange(parsed);
    setBulkText(formatOptionSetInput(parsed));
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_5rem_2rem] gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <span>Choice</span>
        <span>Choice value</span>
        <span />
      </div>

      {options.map((option) => (
        <div key={option.id} className="grid grid-cols-[1fr_5rem_2rem] items-center gap-2">
          <Input
            value={option.label}
            placeholder="Label"
            onChange={(e) => update(option.id, { label: e.target.value })}
          />
          <Input
            type="number"
            min={1}
            value={option.value}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isNaN(n)) update(option.id, { value: n });
            }}
          />
          <Button variant="danger" size="sm" onClick={() => remove(option.id)}>
            ✕
          </Button>
        </div>
      ))}

      <Button variant="secondary" size="sm" onClick={add}>
        + Add option
      </Button>

      <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
          Bulk paste options
        </label>
        <textarea
          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          rows={4}
          value={bulkText}
          placeholder={'Active:1\nInactive:2\nPending:3'}
          onChange={(e) => {
            setBulkText(e.target.value);
            setBulkError(undefined);
          }}
        />
        {bulkError && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{bulkError}</p>
        )}
        <p className="mt-1 text-xs text-slate-400">
          One per line or comma-separated. Format: Label:Value
        </p>
        <Button variant="secondary" size="sm" className="mt-2" onClick={applyBulk}>
          Apply
        </Button>
      </div>
    </div>
  );
}
