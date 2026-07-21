import type { FieldType } from '../types/field';

/**
 * The Dataverse AttributeMetadataType enum is declared ambient in @pptb/types and
 * has no runtime object. Rather than round-trip a cast string through
 * dataverseAPI.getAttributeODataType() (whose return value is not guaranteed to be
 * a structured-clone-safe plain string across host versions), we map directly to
 * the literal Microsoft.Dynamics.CRM.*AttributeMetadata OData type strings.
 */
export type AttributeMetadataTypeName =
  | 'String'
  | 'Memo'
  | 'Integer'
  | 'BigInt'
  | 'Decimal'
  | 'Double'
  | 'Money'
  | 'Boolean'
  | 'DateTime'
  | 'Lookup'
  | 'Picklist'
  | 'MultiSelectPicklist'
  | 'File'
  | 'Image';

/** Literal OData type strings for each attribute metadata type. */
export const ATTRIBUTE_ODATA_TYPE: Record<AttributeMetadataTypeName, string> = {
  String: 'Microsoft.Dynamics.CRM.StringAttributeMetadata',
  Memo: 'Microsoft.Dynamics.CRM.MemoAttributeMetadata',
  Integer: 'Microsoft.Dynamics.CRM.IntegerAttributeMetadata',
  BigInt: 'Microsoft.Dynamics.CRM.BigIntAttributeMetadata',
  Decimal: 'Microsoft.Dynamics.CRM.DecimalAttributeMetadata',
  Double: 'Microsoft.Dynamics.CRM.DoubleAttributeMetadata',
  Money: 'Microsoft.Dynamics.CRM.MoneyAttributeMetadata',
  Boolean: 'Microsoft.Dynamics.CRM.BooleanAttributeMetadata',
  DateTime: 'Microsoft.Dynamics.CRM.DateTimeAttributeMetadata',
  Lookup: 'Microsoft.Dynamics.CRM.LookupAttributeMetadata',
  Picklist: 'Microsoft.Dynamics.CRM.PicklistAttributeMetadata',
  MultiSelectPicklist: 'Microsoft.Dynamics.CRM.MultiSelectPicklistAttributeMetadata',
  File: 'Microsoft.Dynamics.CRM.FileAttributeMetadata',
  Image: 'Microsoft.Dynamics.CRM.ImageAttributeMetadata',
};

export interface FieldTypeConfig {
  type: FieldType;
  label: string;
  /** Underlying Dataverse attribute metadata type. */
  attributeType: AttributeMetadataTypeName;
  /** Whether the type supports a configurable max length. */
  supportsMaxLength?: boolean;
  /** Whether the type supports min/max numeric bounds. */
  supportsRange?: boolean;
  /** Whether the type supports decimal precision. */
  supportsPrecision?: boolean;
  /** Whether the type has a local option set editor (local choice / multi-select). */
  supportsOptions?: boolean;
  /** Whether the type references a project-level global option set. */
  supportsGlobalChoice?: boolean;
  /** Whether the type is stored as multiple selected values. */
  isMultiSelect?: boolean;
  /** Whether the type supports a configurable maximum size (file/image). */
  supportsMaxSize?: boolean;
  /** Whether the type is an autonumber string with a format pattern. */
  supportsAutoNumber?: boolean;
  /** Whether the type references another table. */
  supportsLookup?: boolean;
  /** Default max length applied when adding the field. */
  defaultMaxLength?: number;
  /** Default maximum size in KB applied when adding a file/image field. */
  defaultMaxSizeInKB?: number;
  /** Minimum allowed maximum size in KB. */
  minMaxSizeInKB?: number;
  /** Maximum allowed maximum size in KB. */
  maxMaxSizeInKB?: number;
  /** Default autonumber format applied when adding the field. */
  defaultAutoNumberFormat?: string;
  /** StringFormatName value for String-backed types. */
  formatName?: string;
  /** DateTimeFormat value for DateTime-backed types. */
  dateFormat?: 'DateOnly' | 'DateAndTime';
  /** Short hint shown in the UI. */
  hint?: string;
  /** Minimum allowed max length (string/memo types). */
  minMaxLength?: number;
  /** Maximum allowed max length (string/memo types). */
  maxMaxLength?: number;
  /** Minimum allowed numeric bound. */
  minValueLimit?: number;
  /** Maximum allowed numeric bound. */
  maxValueLimit?: number;
  /** Minimum decimal precision. */
  minPrecision?: number;
  /** Maximum decimal precision. */
  maxPrecision?: number;
}

export const FIELD_TYPE_CONFIGS: Record<FieldType, FieldTypeConfig> = {
  text: {
    type: 'text',
    label: 'Single line of text',
    attributeType: 'String',
    supportsMaxLength: true,
    defaultMaxLength: 100,
    minMaxLength: 1,
    maxMaxLength: 4000,
    formatName: 'Text',
  },
  multiline: {
    type: 'multiline',
    label: 'Multiple lines of text',
    attributeType: 'Memo',
    supportsMaxLength: true,
    defaultMaxLength: 2000,
    minMaxLength: 1,
    maxMaxLength: 1_048_576,
    hint: 'Memo field rendered as a text area.',
  },
  email: {
    type: 'email',
    label: 'Email',
    attributeType: 'String',
    supportsMaxLength: true,
    defaultMaxLength: 100,
    minMaxLength: 1,
    maxMaxLength: 4000,
    formatName: 'Email',
  },
  url: {
    type: 'url',
    label: 'URL',
    attributeType: 'String',
    supportsMaxLength: true,
    defaultMaxLength: 200,
    minMaxLength: 1,
    maxMaxLength: 4000,
    formatName: 'Url',
  },
  phone: {
    type: 'phone',
    label: 'Phone',
    attributeType: 'String',
    supportsMaxLength: true,
    defaultMaxLength: 50,
    minMaxLength: 1,
    maxMaxLength: 4000,
    formatName: 'Phone',
  },
  wholeNumber: {
    type: 'wholeNumber',
    label: 'Whole number',
    attributeType: 'Integer',
    supportsRange: true,
    minValueLimit: -2_147_483_648,
    maxValueLimit: 2_147_483_647,
  },
  bigint: {
    type: 'bigint',
    label: 'Whole number (big)',
    attributeType: 'BigInt',
    hint: 'Large whole number for values beyond the standard whole number range.',
  },
  decimal: {
    type: 'decimal',
    label: 'Decimal number',
    attributeType: 'Decimal',
    supportsRange: true,
    supportsPrecision: true,
    minValueLimit: 0,
    maxValueLimit: 1_000_000_000,
    minPrecision: 0,
    maxPrecision: 10,
  },
  double: {
    type: 'double',
    label: 'Floating point number',
    attributeType: 'Double',
    supportsRange: true,
    supportsPrecision: true,
    minValueLimit: -100_000_000_000,
    maxValueLimit: 100_000_000_000,
    minPrecision: 0,
    maxPrecision: 5,
    hint: 'Approximate numeric value; use decimal when exact precision matters.',
  },
  currency: {
    type: 'currency',
    label: 'Currency',
    attributeType: 'Money',
    supportsRange: true,
    supportsPrecision: true,
    minValueLimit: 0,
    maxValueLimit: 1_000_000_000,
    minPrecision: 0,
    maxPrecision: 10,
  },
  dateOnly: {
    type: 'dateOnly',
    label: 'Date only',
    attributeType: 'DateTime',
    dateFormat: 'DateOnly',
  },
  dateTime: {
    type: 'dateTime',
    label: 'Date and time',
    attributeType: 'DateTime',
    dateFormat: 'DateAndTime',
  },
  boolean: {
    type: 'boolean',
    label: 'Yes / No',
    attributeType: 'Boolean',
  },
  choice: {
    type: 'choice',
    label: 'Choice (local)',
    attributeType: 'Picklist',
    supportsOptions: true,
  },
  multiselect: {
    type: 'multiselect',
    label: 'Choice (multi-select)',
    attributeType: 'MultiSelectPicklist',
    supportsOptions: true,
    isMultiSelect: true,
    hint: 'Lets users select more than one value from a local option set.',
  },
  globalChoice: {
    type: 'globalChoice',
    label: 'Choice (global)',
    attributeType: 'Picklist',
    supportsGlobalChoice: true,
    hint: 'References a shared global choice defined in the Global choices manager.',
  },
  autonumber: {
    type: 'autonumber',
    label: 'Autonumber',
    attributeType: 'String',
    supportsMaxLength: true,
    supportsAutoNumber: true,
    defaultMaxLength: 100,
    minMaxLength: 1,
    maxMaxLength: 4000,
    formatName: 'Text',
    defaultAutoNumberFormat: '{SEQNUM:5}',
    hint: 'A text column that auto-populates using a format like INV-{SEQNUM:5}.',
  },
  file: {
    type: 'file',
    label: 'File',
    attributeType: 'File',
    supportsMaxSize: true,
    defaultMaxSizeInKB: 32_768,
    minMaxSizeInKB: 1,
    maxMaxSizeInKB: 10_485_760,
    hint: 'Stores an uploaded file. Maximum size is capped by the environment.',
  },
  image: {
    type: 'image',
    label: 'Image',
    attributeType: 'Image',
    supportsMaxSize: true,
    defaultMaxSizeInKB: 10_240,
    minMaxSizeInKB: 1,
    maxMaxSizeInKB: 30_720,
    hint: 'Stores an image. Maximum size is capped by the environment.',
  },
  lookup: {
    type: 'lookup',
    label: 'Lookup',
    attributeType: 'Lookup',
    supportsLookup: true,
    hint: 'References a single record on another table.',
  },
};

/**
 * Column types addable in the field grid. Lookups are intentionally excluded —
 * they are managed in the dedicated Relationships step (1:N), which is the
 * single source of truth for lookup columns.
 */
export const FIELD_TYPE_ORDER: FieldType[] = [
  'text',
  'multiline',
  'email',
  'url',
  'phone',
  'autonumber',
  'wholeNumber',
  'bigint',
  'decimal',
  'double',
  'currency',
  'dateOnly',
  'dateTime',
  'boolean',
  'choice',
  'multiselect',
  'globalChoice',
  'file',
  'image',
];

/** Loose alias map for parsing bulk-pasted type names. */
export const FIELD_TYPE_ALIASES: Record<string, FieldType> = {
  text: 'text',
  string: 'text',
  'single line': 'text',
  multiline: 'multiline',
  memo: 'multiline',
  'multiple lines': 'multiline',
  email: 'email',
  url: 'url',
  phone: 'phone',
  telephone: 'phone',
  number: 'wholeNumber',
  int: 'wholeNumber',
  integer: 'wholeNumber',
  'whole number': 'wholeNumber',
  bigint: 'bigint',
  'big integer': 'bigint',
  'whole number (big)': 'bigint',
  decimal: 'decimal',
  double: 'double',
  float: 'double',
  'floating point': 'double',
  'floating point number': 'double',
  currency: 'currency',
  money: 'currency',
  date: 'dateOnly',
  'date only': 'dateOnly',
  datetime: 'dateTime',
  'date and time': 'dateTime',
  bool: 'boolean',
  boolean: 'boolean',
  'yes/no': 'boolean',
  yesno: 'boolean',
  choice: 'choice',
  optionset: 'choice',
  picklist: 'choice',
  multiselect: 'multiselect',
  'multi-select': 'multiselect',
  'multi-select choice': 'multiselect',
  multiselectpicklist: 'multiselect',
  'global choice': 'globalChoice',
  globalchoice: 'globalChoice',
  autonumber: 'autonumber',
  'auto number': 'autonumber',
  file: 'file',
  image: 'image',
};
