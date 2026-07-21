/** Column capabilities not yet supported by Solution Creator. */
export const UNSUPPORTED_COLUMN_TYPES = [
  { label: 'Customer (polymorphic) lookup' },
  { label: 'Calculated column' },
  { label: 'Rollup column' },
  { label: 'Form layouts & views' },
] as const;
