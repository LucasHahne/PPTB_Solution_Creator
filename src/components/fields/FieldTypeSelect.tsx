import type { FieldType } from '../../types/field';
import { FIELD_TYPE_CONFIGS, FIELD_TYPE_ORDER } from '../../constants/fieldTypes';
import { Select } from '../ui/Select';

export function FieldTypeSelect({
  value,
  disabled,
  onChange,
}: {
  value: FieldType;
  disabled?: boolean;
  onChange: (type: FieldType) => void;
}) {
  return (
    <Select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as FieldType)}
    >
      {FIELD_TYPE_ORDER.map((type) => (
        <option key={type} value={type}>
          {FIELD_TYPE_CONFIGS[type].label}
        </option>
      ))}
    </Select>
  );
}
