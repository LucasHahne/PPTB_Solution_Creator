/** Supported column types for v1 of the Solution Creator. */
export type FieldType =
  | 'text'
  | 'multiline'
  | 'email'
  | 'url'
  | 'phone'
  | 'wholeNumber'
  | 'decimal'
  | 'currency'
  | 'dateOnly'
  | 'dateTime'
  | 'boolean'
  | 'choice'
  | 'lookup';

export type RequiredLevel = 'None' | 'ApplicationRequired' | 'Recommended';

/** A single option within a local choice column. */
export interface OptionDraft {
  id: string;
  value: number;
  label: string;
}

/** A column the user is designing, before it becomes Dataverse attribute metadata. */
export interface FieldDraft {
  id: string;
  type: FieldType;
  displayName: string;
  /** Schema name without the publisher prefix (prefix is applied at build time). */
  schemaName: string;
  description?: string;
  requiredLevel: RequiredLevel;
  /** Marks the primary name column of the table. Exactly one per table. */
  isPrimaryName?: boolean;

  // Text-like
  maxLength?: number;

  // Numeric
  minValue?: number;
  maxValue?: number;
  precision?: number;

  // Boolean
  defaultBoolean?: boolean;

  // Choice
  options?: OptionDraft[];

  // Lookup (1:N) — the parent table this column references.
  lookupTarget?: string;
}
