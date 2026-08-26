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

/**
 * Dataverse table logical name limit. The auto-generated primary key attribute
 * is `{logicalName}id`, so keep two characters of headroom below this.
 */
export const MAX_TABLE_LOGICAL_NAME = 50;
export const SAFE_TABLE_LOGICAL_NAME = MAX_TABLE_LOGICAL_NAME - 2;

/**
 * Normalize a table schema token. Unlike column/global-choice tokens, table
 * schema names may contain underscores (beyond the prefix separator), which is
 * what makes the BRIDGE_Table1_Table2 convention possible. Collapses repeated
 * underscores, trims leading/trailing underscores, and ensures a valid start.
 */
export function sanitizeTableSchemaToken(token: string): string {
  const cleaned = token
    .replace(/[^a-zA-Z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return /^[0-9]/.test(cleaned) ? `N${cleaned}` : cleaned;
}

/** Build the full table schema name (may contain underscores) with the prefix. */
export function buildTableSchemaName(prefix: string, token: string): string {
  return `${prefix.toLowerCase()}_${sanitizeTableSchemaToken(token)}`;
}

/** Build the full table logical name (lowercase) with the prefix. */
export function buildTableLogicalName(prefix: string, token: string): string {
  return buildTableSchemaName(prefix, token).toLowerCase();
}

/**
 * Build the bridge table schema token `BRIDGE_{A}_{B}` from two side tokens,
 * truncating each side evenly so the resulting logical name (with prefix and the
 * `id` primary key suffix) stays within Dataverse limits.
 */
export function buildBridgeSchemaToken(
  prefix: string,
  tokenA: string,
  tokenB: string,
): string {
  const a = sanitizeTableSchemaToken(tokenA) || 'A';
  const b = sanitizeTableSchemaToken(tokenB) || 'B';
  const build = (x: string, y: string) => `BRIDGE_${x}_${y}`;

  // Budget for the token itself: safe logical length minus "{prefix}_".
  const budget = SAFE_TABLE_LOGICAL_NAME - (prefix.length + 1);
  let token = build(a, b);
  if (token.length <= budget) return token;

  // Trim both sides evenly until it fits (keep at least one char per side).
  let sideA = a;
  let sideB = b;
  while (build(sideA, sideB).length > budget && (sideA.length > 1 || sideB.length > 1)) {
    if (sideA.length >= sideB.length && sideA.length > 1) {
      sideA = sideA.slice(0, -1);
    } else if (sideB.length > 1) {
      sideB = sideB.slice(0, -1);
    } else {
      break;
    }
  }
  token = build(sideA, sideB);
  return token.slice(0, budget).replace(/_+$/g, '');
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
