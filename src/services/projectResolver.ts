import type { SolutionProject } from '../types/project';
import type { EntityDraft } from '../types/entity';
import type { LookupRelationshipDraft } from '../types/relationship';
import { buildLogicalName } from './namingService';
import type { ResolvedRelationship } from '../builders/relationshipBuilder';

/** The logical name a project table will have once deployed with the prefix. */
export function tableLogicalName(prefix: string, entity: EntityDraft): string {
  return buildLogicalName(prefix, entity.schemaName);
}

/** The primary key attribute for a project table's logical name. */
function primaryKeyFor(logicalName: string): string {
  return `${logicalName}id`;
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

  let parentLogicalName: string;
  if (rel.parent.kind === 'standard') {
    parentLogicalName = rel.parent.logicalName;
  } else {
    const parentTableId = rel.parent.tableId;
    const parent = project.tables.find((t) => t.id === parentTableId);
    if (!parent) return null;
    parentLogicalName = tableLogicalName(prefix, parent);
  }

  return {
    parentLogicalName,
    parentPrimaryKey: primaryKeyFor(parentLogicalName),
    childLogicalName,
  };
}
