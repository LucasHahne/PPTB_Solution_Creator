import { UNSUPPORTED_COLUMN_TYPES } from '../../constants/unsupportedFieldTypes';
import { Alert } from '../ui/Alert';

export function UnsupportedColumnTypesNote() {
  return (
    <Alert tone="info" title="Not yet supported">
      <p className="text-xs">
        Planned for a future update:{' '}
        {UNSUPPORTED_COLUMN_TYPES.map((t) => t.label).join(', ')}.
      </p>
      <p className="mt-1 text-xs">
        Lookup columns are supported via the <strong>Lookups</strong> step. Many-to-many
        relationships are also out of scope.
      </p>
    </Alert>
  );
}
