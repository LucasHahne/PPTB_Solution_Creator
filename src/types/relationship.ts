export type CascadeDelete = 'RemoveLink' | 'Cascade' | 'Restrict';

/**
 * Reference to a table — either one of the project's own tables (by draft id)
 * or a standard/existing table (by logical name).
 */
export type TableRef =
  | { kind: 'project'; tableId: string }
  | { kind: 'standard'; logicalName: string };

/** Reference to the parent ("one" side) table of a lookup. */
export type ParentTableRef = TableRef;

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
 * Configuration for one of the two lookup columns created on a bridge table,
 * pointing at one side of a many-to-many relationship.
 */
export interface BridgeLookupConfig {
  /** Display name of the lookup column created on the bridge table. */
  displayName: string;
  /** Schema name without the publisher prefix. */
  schemaName: string;
  required: boolean;
  cascadeDelete: CascadeDelete;
}

/**
 * A many-to-many relationship modelled as a bridge (intersect) table plus two
 * 1:N lookups. The bridge is a real project table (flagged via EntityDraft.bridge)
 * so it flows through the normal table/column/relationship deploy pipeline and
 * can hold extra user-defined columns.
 */
export interface ManyToManyRelationshipDraft {
  id: string;
  /** One side of the relationship (project or standard table). */
  side1: TableRef;
  /** The other side of the relationship (project or standard table). */
  side2: TableRef;
  /** Project table id of the auto-created bridge table. */
  bridgeTableId: string;
  /** The lookup on the bridge pointing at side1. */
  side1Lookup: BridgeLookupConfig;
  /** The lookup on the bridge pointing at side2. */
  side2Lookup: BridgeLookupConfig;
  /** True once the user has manually edited the bridge display/schema name. */
  nameTouched?: boolean;
}
