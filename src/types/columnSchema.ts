import type { FieldType, OptionDraft, RequiredLevel } from './field';

export const COLUMN_SCHEMA_VERSION = '1.0' as const;

export const COLUMN_SCHEMA_KIND = 'solution-creator-column-schema' as const;

/** Serializable choice option — same as OptionDraft without the runtime id. */
export type ColumnSchemaOption = Omit<OptionDraft, 'id'>;

export interface ColumnSchemaDocument {
  schemaVersion: typeof COLUMN_SCHEMA_VERSION;
  kind: typeof COLUMN_SCHEMA_KIND;
  exportedAt: string;
  tableDisplayName?: string;
  columns: ColumnSchemaEntry[];
  supportedTypes: ColumnTypeReference[];
}

export interface ColumnSchemaEntry {
  type: FieldType;
  displayName: string;
  schemaName?: string;
  description?: string;
  requiredLevel?: RequiredLevel;
  isPrimaryName?: boolean;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  precision?: number;
  defaultBoolean?: boolean;
  options?: ColumnSchemaOption[];
}

export interface ColumnTypeReference {
  type: FieldType;
  label: string;
  attributes: string[];
}

export interface SchemaMergePreview {
  total: number;
  updates: number;
  additions: number;
}
