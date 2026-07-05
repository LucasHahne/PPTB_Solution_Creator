import type { EntityDraft } from '../types/entity';
import type { FieldDraft, FieldType, RequiredLevel } from '../types/field';
import type {
  ColumnSchemaDocument,
  ColumnSchemaEntry,
  ColumnTypeReference,
  SchemaMergePreview,
} from '../types/columnSchema';
import {
  COLUMN_SCHEMA_KIND,
  COLUMN_SCHEMA_VERSION,
} from '../types/columnSchema';
import { FIELD_TYPE_CONFIGS, FIELD_TYPE_ORDER } from '../constants/fieldTypes';
import { RESERVED_FIELD_NAMES } from '../constants/defaults';
import { sanitizeSchemaToken, toPascalToken } from '../services/namingService';
import { validateFieldConstraints } from './fieldConstraints';
import { newId } from './ids';

const REQUIRED_LEVELS = new Set<RequiredLevel>(['None', 'ApplicationRequired', 'Recommended']);

const BASE_ATTRIBUTES = [
  'type',
  'displayName',
  'schemaName',
  'description',
  'requiredLevel',
  'isPrimaryName',
] as const;

const TYPE_ATTRIBUTE_MAP: Record<FieldType, readonly string[]> = {
  text: [...BASE_ATTRIBUTES, 'maxLength'],
  multiline: [...BASE_ATTRIBUTES, 'maxLength'],
  email: [...BASE_ATTRIBUTES, 'maxLength'],
  url: [...BASE_ATTRIBUTES, 'maxLength'],
  phone: [...BASE_ATTRIBUTES, 'maxLength'],
  wholeNumber: [...BASE_ATTRIBUTES, 'minValue', 'maxValue'],
  decimal: [...BASE_ATTRIBUTES, 'minValue', 'maxValue', 'precision'],
  currency: [...BASE_ATTRIBUTES, 'minValue', 'maxValue', 'precision'],
  dateOnly: [...BASE_ATTRIBUTES],
  dateTime: [...BASE_ATTRIBUTES],
  boolean: [...BASE_ATTRIBUTES, 'defaultBoolean'],
  choice: [...BASE_ATTRIBUTES, 'options'],
  lookup: [...BASE_ATTRIBUTES],
};

export function buildSupportedTypeReference(): ColumnTypeReference[] {
  return FIELD_TYPE_ORDER.map((type) => {
    const config = FIELD_TYPE_CONFIGS[type];
    const attributes = [...TYPE_ATTRIBUTE_MAP[type]].filter((a) => a !== 'type');
    return { type, label: config.label, attributes };
  });
}

function fieldToSchemaEntry(field: FieldDraft): ColumnSchemaEntry | null {
  if (field.type === 'lookup') return null;

  const entry: ColumnSchemaEntry = {
    type: field.type,
    displayName: field.displayName,
    schemaName: field.schemaName || undefined,
    description: field.description,
    requiredLevel: field.requiredLevel,
    isPrimaryName: field.isPrimaryName || undefined,
  };

  const config = FIELD_TYPE_CONFIGS[field.type];
  if (config.supportsMaxLength && field.maxLength !== undefined) {
    entry.maxLength = field.maxLength;
  }
  if (config.supportsRange) {
    if (field.minValue !== undefined) entry.minValue = field.minValue;
    if (field.maxValue !== undefined) entry.maxValue = field.maxValue;
  }
  if (config.supportsPrecision && field.precision !== undefined) {
    entry.precision = field.precision;
  }
  if (field.type === 'boolean' && field.defaultBoolean !== undefined) {
    entry.defaultBoolean = field.defaultBoolean;
  }
  if (config.supportsOptions && field.options?.length) {
    entry.options = field.options.map((o) => ({ label: o.label, value: o.value }));
  }

  return entry;
}

export function exportColumnSchema(table: EntityDraft): ColumnSchemaDocument {
  const columns = table.fields
    .map(fieldToSchemaEntry)
    .filter((entry): entry is ColumnSchemaEntry => entry !== null);

  return {
    schemaVersion: COLUMN_SCHEMA_VERSION,
    kind: COLUMN_SCHEMA_KIND,
    exportedAt: new Date().toISOString(),
    tableDisplayName: table.displayName || undefined,
    columns,
    supportedTypes: buildSupportedTypeReference(),
  };
}

export function exportFilename(table: EntityDraft): string {
  const token = table.schemaName || table.displayName || 'columns';
  const safe = token.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return `${safe || 'columns'}-columns.json`;
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const SAMPLE_SCHEMA_FILENAME = 'column-schema-sample.json';

export function serializeColumnSchemaJson(document: ColumnSchemaDocument): string {
  return JSON.stringify(document, null, 2);
}

/** Example schema documenting common column types and attributes. */
export function buildSampleColumnSchema(): ColumnSchemaDocument {
  return {
    schemaVersion: COLUMN_SCHEMA_VERSION,
    kind: COLUMN_SCHEMA_KIND,
    exportedAt: new Date().toISOString(),
    columns: [
      {
        type: 'text',
        displayName: 'Order Number',
        schemaName: 'OrderNumber',
        description: 'Unique order reference',
        requiredLevel: 'ApplicationRequired',
        maxLength: 100,
      },
      {
        type: 'currency',
        displayName: 'Amount',
        schemaName: 'Amount',
        minValue: 0,
        maxValue: 1000000,
        precision: 2,
      },
      {
        type: 'wholeNumber',
        displayName: 'Quantity',
        schemaName: 'Quantity',
        minValue: 1,
        maxValue: 9999,
      },
      {
        type: 'boolean',
        displayName: 'Is Active',
        schemaName: 'IsActive',
        defaultBoolean: true,
      },
      {
        type: 'choice',
        displayName: 'Status',
        schemaName: 'Status',
        options: [
          { label: 'Draft', value: 1 },
          { label: 'Submitted', value: 2 },
          { label: 'Approved', value: 3 },
        ],
      },
      {
        type: 'dateOnly',
        displayName: 'Due Date',
        schemaName: 'DueDate',
      },
    ],
    supportedTypes: buildSupportedTypeReference(),
  };
}

export async function copyColumnSchemaToClipboard(document: ColumnSchemaDocument): Promise<void> {
  await navigator.clipboard.writeText(serializeColumnSchemaJson(document));
}

export function normalizeSchemaKey(entry: ColumnSchemaEntry): string {
  const token = entry.schemaName?.trim()
    ? sanitizeSchemaToken(entry.schemaName)
    : toPascalToken(entry.displayName);
  return token.toLowerCase();
}

export function normalizeFieldSchemaKey(field: FieldDraft): string {
  const token = field.schemaName?.trim()
    ? sanitizeSchemaToken(field.schemaName)
    : toPascalToken(field.displayName);
  return token.toLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseRequiredLevel(value: unknown): RequiredLevel | undefined {
  if (typeof value !== 'string') return undefined;
  return REQUIRED_LEVELS.has(value as RequiredLevel) ? (value as RequiredLevel) : undefined;
}

function validateColumnEntry(
  raw: unknown,
  index: number,
): { ok: true; entry: ColumnSchemaEntry } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const label = `Column ${index + 1}`;

  if (!isRecord(raw)) {
    return { ok: false, errors: [`${label}: must be an object.`] };
  }

  const allowedKeys = new Set<string>();
  const type = raw.type;
  if (typeof type !== 'string' || !FIELD_TYPE_ORDER.includes(type as FieldType)) {
    if (type === 'lookup') {
      errors.push(`${label}: lookup columns cannot be imported via schema JSON.`);
    } else {
      errors.push(`${label}: invalid or missing type.`);
    }
    return { ok: false, errors };
  }

  const fieldType = type as FieldType;
  for (const key of TYPE_ATTRIBUTE_MAP[fieldType]) {
    allowedKeys.add(key);
  }

  for (const key of Object.keys(raw)) {
    if (!allowedKeys.has(key)) {
      errors.push(`${label}: unknown or unsupported property "${key}" for type "${fieldType}".`);
    }
  }

  const displayName = raw.displayName;
  if (typeof displayName !== 'string' || displayName.trim().length === 0) {
    errors.push(`${label}: displayName is required.`);
  }

  if (raw.schemaName !== undefined && typeof raw.schemaName !== 'string') {
    errors.push(`${label}: schemaName must be a string.`);
  }

  if (raw.description !== undefined && typeof raw.description !== 'string') {
    errors.push(`${label}: description must be a string.`);
  }

  if (raw.requiredLevel !== undefined && !parseRequiredLevel(raw.requiredLevel)) {
    errors.push(`${label}: requiredLevel must be None, ApplicationRequired, or Recommended.`);
  }

  if (raw.isPrimaryName !== undefined && typeof raw.isPrimaryName !== 'boolean') {
    errors.push(`${label}: isPrimaryName must be a boolean.`);
  }

  if (raw.maxLength !== undefined && typeof raw.maxLength !== 'number') {
    errors.push(`${label}: maxLength must be a number.`);
  }

  if (raw.minValue !== undefined && typeof raw.minValue !== 'number') {
    errors.push(`${label}: minValue must be a number.`);
  }

  if (raw.maxValue !== undefined && typeof raw.maxValue !== 'number') {
    errors.push(`${label}: maxValue must be a number.`);
  }

  if (raw.precision !== undefined && typeof raw.precision !== 'number') {
    errors.push(`${label}: precision must be a number.`);
  }

  if (raw.defaultBoolean !== undefined && typeof raw.defaultBoolean !== 'boolean') {
    errors.push(`${label}: defaultBoolean must be a boolean.`);
  }

  if (raw.options !== undefined) {
    if (!Array.isArray(raw.options)) {
      errors.push(`${label}: options must be an array.`);
    } else {
      const values = new Set<number>();
      raw.options.forEach((opt, optIndex) => {
        if (!isRecord(opt)) {
          errors.push(`${label}, option ${optIndex + 1}: must be an object.`);
          return;
        }
        if (typeof opt.label !== 'string' || opt.label.trim().length === 0) {
          errors.push(`${label}, option ${optIndex + 1}: label is required.`);
        }
        if (typeof opt.value !== 'number' || opt.value <= 0) {
          errors.push(`${label}, option ${optIndex + 1}: value must be a positive number.`);
        } else if (values.has(opt.value)) {
          errors.push(`${label}, option ${optIndex + 1}: duplicate value ${opt.value}.`);
        } else {
          values.add(opt.value);
        }
      });
      if (raw.options.length === 0) {
        errors.push(`${label}: choice columns require at least one option.`);
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const entry: ColumnSchemaEntry = {
    type: fieldType,
    displayName: (displayName as string).trim(),
  };

  if (typeof raw.schemaName === 'string' && raw.schemaName.trim()) {
    entry.schemaName = sanitizeSchemaToken(raw.schemaName);
  }
  if (typeof raw.description === 'string' && raw.description.trim()) {
    entry.description = raw.description.trim();
  }
  const requiredLevel = parseRequiredLevel(raw.requiredLevel);
  if (requiredLevel) entry.requiredLevel = requiredLevel;
  if (raw.isPrimaryName === true) entry.isPrimaryName = true;
  if (typeof raw.maxLength === 'number') entry.maxLength = raw.maxLength;
  if (typeof raw.minValue === 'number') entry.minValue = raw.minValue;
  if (typeof raw.maxValue === 'number') entry.maxValue = raw.maxValue;
  if (typeof raw.precision === 'number') entry.precision = raw.precision;
  if (typeof raw.defaultBoolean === 'boolean') entry.defaultBoolean = raw.defaultBoolean;
  if (Array.isArray(raw.options)) {
    entry.options = raw.options.map((opt) => ({
      label: (opt as { label: string }).label.trim(),
      value: (opt as { value: number }).value,
    }));
  }

  const schemaToken = entry.schemaName || toPascalToken(entry.displayName);
  if (!schemaToken) {
    errors.push(`${label}: could not derive a schema name.`);
  } else if (!entry.isPrimaryName && RESERVED_FIELD_NAMES.has(schemaToken.toLowerCase())) {
    errors.push(`${label}: schema name "${schemaToken}" is reserved.`);
  }

  const draft = schemaEntryToFieldDraft(entry);
  for (const issue of validateFieldConstraints(draft)) {
    if (!issue.valid && issue.message) errors.push(issue.message);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, entry };
}

export type SchemaValidationResult =
  | { ok: true; document: ColumnSchemaDocument; entries: ColumnSchemaEntry[] }
  | { ok: false; errors: string[] };

export function validateColumnSchemaJson(raw: string): SchemaValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, errors: ['Invalid JSON syntax.'] };
  }

  if (!isRecord(parsed)) {
    return { ok: false, errors: ['Root value must be a JSON object.'] };
  }

  const errors: string[] = [];

  if (parsed.schemaVersion !== COLUMN_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be "${COLUMN_SCHEMA_VERSION}".`);
  }
  if (parsed.kind !== COLUMN_SCHEMA_KIND) {
    errors.push(`kind must be "${COLUMN_SCHEMA_KIND}".`);
  }
  if (!Array.isArray(parsed.columns) || parsed.columns.length === 0) {
    errors.push('columns must be a non-empty array.');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const entries: ColumnSchemaEntry[] = [];
  const seenKeys = new Map<string, number>();
  let primaryCount = 0;

  for (let i = 0; i < (parsed.columns as unknown[]).length; i++) {
    const result = validateColumnEntry((parsed.columns as unknown[])[i], i);
    if (!result.ok) {
      errors.push(...result.errors);
      continue;
    }

    const key = normalizeSchemaKey(result.entry);
    if (seenKeys.has(key)) {
      errors.push(
        `Duplicate schema name "${result.entry.schemaName || toPascalToken(result.entry.displayName)}" (columns ${seenKeys.get(key)! + 1} and ${i + 1}).`,
      );
    } else {
      seenKeys.set(key, i);
    }

    if (result.entry.isPrimaryName) primaryCount++;
    entries.push(result.entry);
  }

  if (primaryCount > 1) {
    errors.push('At most one column may have isPrimaryName set to true.');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const document: ColumnSchemaDocument = {
    schemaVersion: COLUMN_SCHEMA_VERSION,
    kind: COLUMN_SCHEMA_KIND,
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
    tableDisplayName:
      typeof parsed.tableDisplayName === 'string' ? parsed.tableDisplayName : undefined,
    columns: entries,
    supportedTypes:
      Array.isArray(parsed.supportedTypes) && parsed.supportedTypes.length > 0
        ? (parsed.supportedTypes as ColumnTypeReference[])
        : buildSupportedTypeReference(),
  };

  return { ok: true, document, entries };
}

export function schemaEntryToFieldDraft(entry: ColumnSchemaEntry): FieldDraft {
  const config = FIELD_TYPE_CONFIGS[entry.type];
  const field: FieldDraft = {
    id: newId(),
    type: entry.type,
    displayName: entry.displayName,
    schemaName: entry.schemaName?.trim()
      ? sanitizeSchemaToken(entry.schemaName)
      : toPascalToken(entry.displayName),
    requiredLevel: entry.requiredLevel ?? 'None',
    isPrimaryName: entry.isPrimaryName || undefined,
  };

  if (entry.description) field.description = entry.description;

  if (config.supportsMaxLength) {
    field.maxLength = entry.maxLength ?? config.defaultMaxLength;
  }
  if (config.supportsRange) {
    if (entry.minValue !== undefined) field.minValue = entry.minValue;
    if (entry.maxValue !== undefined) field.maxValue = entry.maxValue;
  }
  if (config.supportsPrecision) {
    field.precision = entry.precision ?? 2;
  }
  if (entry.type === 'boolean') {
    field.defaultBoolean = entry.defaultBoolean ?? false;
  }
  if (config.supportsOptions) {
    field.options =
      entry.options?.map((o) => ({ id: newId(), label: o.label, value: o.value })) ?? [
        { id: newId(), value: 1, label: 'Option 1' },
        { id: newId(), value: 2, label: 'Option 2' },
      ];
  }

  return field;
}

export function applySchemaEntryToField(
  existing: FieldDraft,
  entry: ColumnSchemaEntry,
): FieldDraft {
  const base = schemaEntryToFieldDraft(entry);
  return {
    ...base,
    id: existing.id,
    options: base.options?.map((o, i) => ({
      ...o,
      id: existing.options?.[i]?.id ?? o.id,
    })),
  };
}

export function previewSchemaMerge(
  existingFields: FieldDraft[],
  entries: ColumnSchemaEntry[],
): SchemaMergePreview {
  const existingByKey = new Map(
    existingFields.map((f) => [normalizeSchemaKeyFromField(f), f]),
  );

  let updates = 0;
  let additions = 0;

  for (const entry of entries) {
    const key = normalizeSchemaKey(entry);
    if (existingByKey.has(key)) {
      updates++;
    } else {
      additions++;
    }
  }

  return { total: entries.length, updates, additions };
}

function normalizeSchemaKeyFromField(field: FieldDraft): string {
  return normalizeFieldSchemaKey(field);
}
