import type { OptionDraft } from '../../types/field';
import { newId } from '../../utils/ids';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export function OptionSetEditor({
  options,
  onChange,
}: {
  options: OptionDraft[];
  onChange: (options: OptionDraft[]) => void;
}) {
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

  return (
    <div className="space-y-2">
      {options.map((option) => (
        <div key={option.id} className="flex items-center gap-2">
          <Input
            className="w-20"
            type="number"
            value={option.value}
            onChange={(e) => update(option.id, { value: Number(e.target.value) })}
          />
          <Input
            value={option.label}
            placeholder="Label"
            onChange={(e) => update(option.id, { label: e.target.value })}
          />
          <Button variant="danger" size="sm" onClick={() => remove(option.id)}>
            ✕
          </Button>
        </div>
      ))}
      <Button variant="secondary" size="sm" onClick={add}>
        + Add option
      </Button>
    </div>
  );
}
