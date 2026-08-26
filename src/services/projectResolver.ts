import type { SolutionProject } from '../types/project';
import type { EntityDraft } from '../types/entity';
import type {
  LookupRelationshipDraft,
  ManyToManyRelationshipDraft,
  TableRef,
} from '../types/relationship';
import { buildTableLogicalName } from './namingService';
import type { ResolvedRelationship } from '../builders/relationshipBuilder';

/** The logical name a project table will have once deployed with the prefix. */
export function tableLogicalName(prefix: string, entity: EntityDraft): string {
  return buildTableLogicalName(prefix, entity.schemaName);
}

/** The primary key attribute for a project table's logical name. */
function primaryKeyFor(logicalName: string): string {
  return `${logicalName}id`;
}

/** A resolved table reference: its logical name and primary key attribute. */
export interface ResolvedTableRef {
  logicalName: string;
  primaryKey: string;
}

/**
 * Resolve a table reference (project or standard) to its deployed logical name
 * and primary key. Returns null when a project table reference can't be found.
 */
export function resolveTableRef(
  prefix: string,
  project: SolutionProject,
  ref: TableRef,
): ResolvedTableRef | null {
  if (ref.kind === 'standard') {
    return { logicalName: ref.logicalName, primaryKey: primaryKeyFor(ref.logicalName) };
  }
  const table = project.tables.find((t) => t.id === ref.tableId);
  if (!table) return null;
  const logicalName = tableLogicalName(prefix, table);
  return { logicalName, primaryKey: primaryKeyFor(logicalName) };
}

/** Find the child (project) table for a relationship. */
export function findChildTable(
  project: SolutionProject,
  rel: LookupRelationshipDraft,
): EntityDraft | undefined {
  return project.tables.find((t) => t.id === rel.childTableId);
}

/**
 * Resolve the parent/child logical names for a relationship so it can be built.
 * Returns null when the child project table cannot be found.
 */
export function resolveRelationship(
  prefix: string,
  project: SolutionProject,
  rel: LookupRelationshipDraft,
): ResolvedRelationship | null {
  const child = findChildTable(project, rel);
  if (!child) return null;

  const childLogicalName = tableLogicalName(prefix, child);

  const parent = resolveTableRef(prefix, project, rel.parent);
  if (!parent) return null;

  return {
    parentLogicalName: parent.logicalName,
    parentPrimaryKey: parent.primaryKey,
    childLogicalName,
  };
}

/** One resolved side of a many-to-many relationship. */
export interface ResolvedBridgeSide {
  /** The related table this side points at (referenced entity). */
  referenced: ResolvedTableRef;
  /** The bridge table logical name (referencing entity). */
  bridgeLogicalName: string;
}

/** A fully resolved many-to-many relationship, ready to build both lookups. */
export interface ResolvedManyToMany {
  bridgeLogicalName: string;
  side1: ResolvedBridgeSide;
  side2: ResolvedBridgeSide;
}

/**
 * Resolve the bridge and both side tables for a many-to-many relationship.
 * Returns null when the bridge or either side cannot be resolved.
 */
export function resolveManyToMany(
  prefix: string,
  project: SolutionProject,
  m2m: ManyToManyRelationshipDraft,
): ResolvedManyToMany | null {
  const bridge = project.tables.find((t) => t.id === m2m.bridgeTableId);
  if (!bridge) return null;
  const bridgeLogicalName = tableLogicalName(prefix, bridge);

  const side1 = resolveTableRef(prefix, project, m2m.side1);
  const side2 = resolveTableRef(prefix, project, m2m.side2);
  if (!side1 || !side2) return null;

  return {
    bridgeLogicalName,
    side1: { referenced: side1, bridgeLogicalName },
    side2: { referenced: side2, bridgeLogicalName },
  };
}
