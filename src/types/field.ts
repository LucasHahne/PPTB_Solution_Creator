/** Supported column types for the Solution Creator. */
export type FieldType =
  | 'text'
  | 'multiline'
  | 'email'
  | 'url'
  | 'phone'
  | 'wholeNumber'
  | 'bigint'
  | 'decimal'
  | 'double'
  | 'currency'
  | 'dateOnly'
  | 'dateTime'
  | 'boolean'
  | 'choice'
  | 'multiselect'
  | 'globalChoice'
  | 'autonumber'
  | 'file'
  | 'image'
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

  // Choice (local) and multi-select choice
  options?: OptionDraft[];

  // Global choice — references a project-level global option set draft by id.
  globalChoiceId?: string;

  // Autonumber — the format string, e.g. "INV-{SEQNUM:5}".
  autoNumberFormat?: string;

  // File / Image — the maximum size in kilobytes.
  maxSizeInKB?: number;

  // Lookup (1:N) — the parent table this column references.
  lookupTarget?: string;
}
