/**
 * Central naming rules for Dataverse schema/logical names.
 *
 * Display names are free text. Schema names are derived as PascalCase tokens and
 * prefixed with the publisher customization prefix at deploy time, e.g. a display
 * name of "Order Line" with prefix "abc" becomes schema name "abc_OrderLine" and
 * logical name "abc_orderline".
 */

/** Strip everything that is not alphanumeric and collapse into PascalCase. */
export function toPascalToken(displayName: string): string {
  const cleaned = displayName
    .replace(/[^a-zA-Z0-9 ]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  // Schema tokens cannot start with a digit.
  return /^[0-9]/.test(cleaned) ? `N${cleaned}` : cleaned;
}

/** Normalize a user-typed schema token: keep alphanumerics, ensure valid start. */
export function sanitizeSchemaToken(token: string): string {
  const cleaned = token.replace(/[^a-zA-Z0-9]/g, '');
  return /^[0-9]/.test(cleaned) ? `N${cleaned}` : cleaned;
}

/** Normalize a publisher prefix: lowercase letters, 2-8 chars. */
export function sanitizePrefix(prefix: string): string {
  return prefix.toLowerCase().replace(/[^a-z]/g, '').slice(0, 8);
}

/** Build the full schema name (PascalCase) including the publisher prefix. */
export function buildSchemaName(prefix: string, token: string): string {
  return `${prefix.toLowerCase()}_${sanitizeSchemaToken(token)}`;
}

/** Build the full logical name (lowercase) including the publisher prefix. */
export function buildLogicalName(prefix: string, token: string): string {
  return buildSchemaName(prefix, token).toLowerCase();
}

/** Default unique name for a solution, derived from its friendly name. */
export function toSolutionUniqueName(friendlyName: string): string {
  return toPascalToken(friendlyName) || 'NewSolution';
}

/** Validate a solution/publisher unique name (alphanumeric + underscore). */
export function isValidUniqueName(value: string): boolean {
  return /^[A-Za-z][A-Za-z0-9_]*$/.test(value);
}

/** Validate a publisher prefix: 2-8 lowercase letters, not starting with "mscrm". */
export function isValidPrefix(value: string): boolean {
  return /^[a-z][a-z0-9]{1,7}$/.test(value) && !value.startsWith('mscrm');
}
