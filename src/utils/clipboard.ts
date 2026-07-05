export interface ParsedPasteRow {
  displayName: string;
  type?: string;
  required?: boolean;
}

/**
 * Parse pasted spreadsheet-style text into field rows.
 * Accepts tab- or comma-separated columns: DisplayName, Type, Required.
 */
export function parsePastedFields(raw: string): ParsedPasteRow[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const cells = line.split(/\t|,/).map((c) => c.trim());
      const [displayName, type, required] = cells;
      return {
        displayName,
        type: type || undefined,
        required: required ? /^(y|yes|true|1|required)$/i.test(required) : undefined,
      };
    })
    .filter((row) => row.displayName.length > 0);
}
