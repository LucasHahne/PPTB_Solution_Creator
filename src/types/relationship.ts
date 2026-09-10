export type CascadeDelete = 'RemoveLink' | 'Cascade' | 'Restrict';

/** Reference to the parent ("one" side) table of a lookup. */
export type ParentTableRef =
  | { kind: 'project'; tableId: string }
  | { kind: 'standard'; logicalName: string };

/**
 * A 1:N lookup relationship. The lookup column is created on the child
 * (referencing) table and points at the parent (referenced) table.
 *
 * The child must be one of the project's own tables (we add a column to it).
 * The parent may be a project table or a standard table (account, contact, ...).
 */
export interface LookupRelationshipDraft {
  id: string;
  /** Project table id for the child — the "many" side. */
  childTableId: string;
  /** The parent — the "one" side. */
  parent: ParentTableRef;
  /** Display name of the lookup column created on the child table. */
  lookupDisplayName: string;
  /** Schema name without the publisher prefix. */
  lookupSchemaName: string;
  cascadeDelete: CascadeDelete;
  required: boolean;
}

/**
 * An M:N relationship modeled as an explicit bridge table with an autonumber
 * primary column and two lookups (bridge → left, bridge → right).
 * Both sides are project tables in v1.
 */
export interface ManyToManyRelationshipDraft {
  id: string;
  leftTableId: string;
  rightTableId: string;
  bridgeDisplayName: string;
  /** Schema name without the publisher prefix. */
  bridgeSchemaName: string;
  primaryDisplayName: string;
  primarySchemaName: string;
  autoNumberFormat: string;
  leftLookupDisplayName: string;
  leftLookupSchemaName: string;
  rightLookupDisplayName: string;
  rightLookupSchemaName: string;
}
