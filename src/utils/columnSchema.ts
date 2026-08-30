import type { EntityDraft } from '../types/entity';
import type { FieldDraft, FieldType, RequiredLevel } from '../types/field';
import type { GlobalChoiceDraft } from '../types/globalChoice';
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
  autonumber: [...BASE_ATTRIBUTES, 'maxLength', 'autoNumberFormat'],
  wholeNumber: [...BASE_ATTRIBUTES, 'minValue', 'maxValue'],
  bigint: [...BASE_ATTRIBUTES],
  decimal: [...BASE_ATTRIBUTES, 'minValue', 'maxValue', 'precision'],
  double: [...BASE_ATTRIBUTES, 'minValue', 'maxValue', 'precision'],
  currency: [...BASE_ATTRIBUTES, 'minValue', 'maxValue', 'precision'],
  dateOnly: [...BASE_ATTRIBUTES],
  dateTime: [...BASE_ATTRIBUTES],
  boolean: [...BASE_ATTRIBUTES, 'defaultBoolean'],
  choice: [...BASE_ATTRIBUTES, 'options'],
  multiselect: [...BASE_ATTRIBUTES, 'options'],
  globalChoice: [...BASE_ATTRIBUTES, 'globalChoiceName'],
  file: [...BASE_ATTRIBUTES, 'maxSizeInKB'],
  image: [...BASE_ATTRIBUTES, 'maxSizeInKB'],
  lookup: [...BASE_ATTRIBUTES],
};

export function buildSupportedTypeReference(): ColumnTypeReference[] {
  return FIELD_TYPE_ORDER.map((type) => {
    const config = FIELD_TYPE_CONFIGS[type];
    const attributes = [...TYPE_ATTRIBUTE_MAP[type]].filter((a) => a !== 'type');
    return { type, label: config.label, attributes };
  });
}

function fieldToSchemaEntry(
  field: FieldDraft,
  globalChoiceNameById?: Map<string, string>,
): ColumnSchemaEntry | null {
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
  if (config.supportsMaxSize && field.maxSizeInKB !== undefined) {
    entry.maxSizeInKB = field.maxSizeInKB;
  }
  if (config.supportsAutoNumber && field.autoNumberFormat) {
    entry.autoNumberFormat = field.autoNumberFormat;
  }
  if (config.supportsGlobalChoice && field.globalChoiceId) {
    const name = globalChoiceNameById?.get(field.globalChoiceId);
    if (name) entry.globalChoiceName = name;
  }

  return entry;
}

export function exportColumnSchema(
  table: EntityDraft,
  globalChoices: GlobalChoiceDraft[] = [],
): ColumnSchemaDocument {
  const globalChoiceNameById = new Map(
    globalChoices.map((c) => [c.id, c.schemaName || toPascalToken(c.displayName)] as const),
  );
  const columns = table.fields
    .map((f) => fieldToSchemaEntry(f, globalChoiceNameById))
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

/**
 * Example schema documenting every importable column type and its attributes.
 *
 * This covers all column types the Solution Creator can create (everything in
 * FIELD_TYPE_ORDER — lookups and relationships are managed on the Relationships
 * step and are intentionally not part of this format). Values stay within the
 * documented Dataverse bounds so the sample round-trips cleanly through import.
 *
 * Note on relationships (v1.2.0): 1:N lookups and M:N (bridge table)
 * relationships are configured on the Relationships step, not here. Bridge
 * tables use an autonumber column as their primary name — see the autonumber
 * example below for the shape of that column.
 */
export function buildSampleColumnSchema(): ColumnSchemaDocument {
  return {
    schemaVersion: COLUMN_SCHEMA_VERSION,
    kind: COLUMN_SCHEMA_KIND,
    exportedAt: new Date().toISOString(),
    tableDisplayName: 'Sample (every column type)',
    columns: [
      {
        type: 'text',
        displayName: 'Name',
        schemaName: 'Name',
        description: 'Primary name column. Exactly one column may set isPrimaryName.',
        requiredLevel: 'ApplicationRequired',
        isPrimaryName: true,
        maxLength: 100,
      },
      {
        type: 'multiline',
        displayName: 'Description',
        schemaName: 'Description',
        description: 'Memo column rendered as a multi-line text area.',
        requiredLevel: 'None',
        maxLength: 2000,
      },
      {
        type: 'email',
        displayName: 'Contact Email',
        schemaName: 'ContactEmail',
        maxLength: 100,
      },
      {
        type: 'url',
        displayName: 'Website',
        schemaName: 'Website',
        maxLength: 200,
      },
      {
        type: 'phone',
        displayName: 'Phone',
        schemaName: 'Phone',
        maxLength: 50,
      },
      {
        type: 'autonumber',
        displayName: 'Order Number',
        schemaName: 'OrderNumber',
        description:
          'Autonumber (v1.1.0). Bridge tables (v1.2.0) use this type as their primary name, e.g. BRIDGE-{SEQNUM:6}.',
        maxLength: 100,
        autoNumberFormat: 'ORD-{SEQNUM:5}',
      },
      {
        type: 'wholeNumber',
        displayName: 'Quantity',
        schemaName: 'Quantity',
        minValue: 0,
        maxValue: 100000,
      },
      {
        type: 'bigint',
        displayName: 'External Reference',
        schemaName: 'ExternalReference',
        description: 'Big whole number (v1.1.0) for values beyond the standard whole number range.',
      },
      {
        type: 'decimal',
        displayName: 'Unit Price',
        schemaName: 'UnitPrice',
        minValue: 0,
        maxValue: 1000000,
        precision: 2,
      },
      {
        type: 'double',
        displayName: 'Latitude',
        schemaName: 'Latitude',
        description: 'Floating point number (v1.1.0).',
        minValue: -90,
        maxValue: 90,
        precision: 5,
      },
      {
        type: 'currency',
        displayName: 'Total Amount',
        schemaName: 'TotalAmount',
        minValue: 0,
        maxValue: 1000000,
        precision: 2,
      },
      {
        type: 'dateOnly',
        displayName: 'Order Date',
        schemaName: 'OrderDate',
      },
      {
        type: 'dateTime',
        displayName: 'Delivery Time',
        schemaName: 'DeliveryTime',
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
        description: 'Local choice with explicit option values.',
        options: [
          { label: 'Draft', value: 1 },
          { label: 'Submitted', value: 2 },
          { label: 'Approved', value: 3 },
        ],
      },
      {
        type: 'multiselect',
        displayName: 'Tags',
        schemaName: 'Tags',
        description: 'Multi-select choice (v1.1.0). Users can pick more than one value.',
        options: [
          { label: 'Urgent', value: 1 },
          { label: 'Follow Up', value: 2 },
          { label: 'Archived', value: 3 },
        ],
      },
      {
        type: 'globalChoice',
        displayName: 'Priority',
        schemaName: 'Priority',
        description:
          'Choice (global) (v1.1.0). References a global choice by its unprefixed schema name. On import, a placeholder global choice is created automatically if the project does not already define one — refine its options in the Global choices manager.',
        globalChoiceName: 'PriorityLevel',
      },
      {
        type: 'file',
        displayName: 'Attachment',
        schemaName: 'Attachment',
        description: 'File column (v1.1.0). maxSizeInKB is validated against documented limits.',
        maxSizeInKB: 32768,
      },
      {
        type: 'image',
        displayName: 'Photo',
        schemaName: 'Photo',
        description: 'Image column (v1.1.0).',
        maxSizeInKB: 10240,
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

  if (raw.maxSizeInKB !== undefined && typeof raw.maxSizeInKB !== 'number') {
    errors.push(`${label}: maxSizeInKB must be a number.`);
  }

  if (raw.autoNumberFormat !== undefined && typeof raw.autoNumberFormat !== 'string') {
    errors.push(`${label}: autoNumberFormat must be a string.`);
  }

  if (raw.globalChoiceName !== undefined && typeof raw.globalChoiceName !== 'string') {
    errors.push(`${label}: globalChoiceName must be a string.`);
  }

  if (fieldType === 'globalChoice') {
    const name = raw.globalChoiceName;
    if (typeof name !== 'string' || name.trim().length === 0) {
      errors.push(
        `${label}: global choice columns require a globalChoiceName that matches a defined global choice.`,
      );
    }
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
  if (typeof raw.maxSizeInKB === 'number') entry.maxSizeInKB = raw.maxSizeInKB;
  if (typeof raw.autoNumberFormat === 'string' && raw.autoNumberFormat.trim()) {
    entry.autoNumberFormat = raw.autoNumberFormat.trim();
  }
  if (typeof raw.globalChoiceName === 'string' && raw.globalChoiceName.trim()) {
    entry.globalChoiceName = sanitizeSchemaToken(raw.globalChoiceName);
  }
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
  if (config.supportsMaxSize) {
    field.maxSizeInKB = entry.maxSizeInKB ?? config.defaultMaxSizeInKB;
  }
  if (config.supportsAutoNumber) {
    field.autoNumberFormat = entry.autoNumberFormat ?? config.defaultAutoNumberFormat;
  }
  // Note: globalChoiceId is resolved from entry.globalChoiceName by the store,
  // which has access to the project's global choices.

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
