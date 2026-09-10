import type { SolutionProject } from '../types/project';
import type { EntityDraft } from '../types/entity';
import type { LookupRelationshipDraft, ManyToManyRelationshipDraft } from '../types/relationship';
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

/** Resolve a project table id to its deployed logical name. */
export function resolveProjectTableLogicalName(
  prefix: string,
  project: SolutionProject,
  tableId: string,
): string | null {
  const table = project.tables.find((t) => t.id === tableId);
  if (!table) return null;
  return tableLogicalName(prefix, table);
}

/**
 * Resolve the two bridge→side lookups for an M:N draft.
 * Child is always the bridge table (logical name from bridge schema).
 */
export function resolveManyToManyLookups(
  prefix: string,
  project: SolutionProject,
  mn: ManyToManyRelationshipDraft,
): {
  bridgeLogicalName: string;
  left: { rel: LookupRelationshipDraft; resolved: ResolvedRelationship };
  right: { rel: LookupRelationshipDraft; resolved: ResolvedRelationship };
} | null {
  const leftLogical = resolveProjectTableLogicalName(prefix, project, mn.leftTableId);
  const rightLogical = resolveProjectTableLogicalName(prefix, project, mn.rightTableId);
  if (!leftLogical || !rightLogical) return null;

  const bridgeLogicalName = buildLogicalName(prefix, mn.bridgeSchemaName);

  const leftRel: LookupRelationshipDraft = {
    id: `${mn.id}-left`,
    childTableId: mn.id,
    parent: { kind: 'project', tableId: mn.leftTableId },
    lookupDisplayName: mn.leftLookupDisplayName,
    lookupSchemaName: mn.leftLookupSchemaName,
    cascadeDelete: 'RemoveLink',
    required: true,
  };
  const rightRel: LookupRelationshipDraft = {
    id: `${mn.id}-right`,
    childTableId: mn.id,
    parent: { kind: 'project', tableId: mn.rightTableId },
    lookupDisplayName: mn.rightLookupDisplayName,
    lookupSchemaName: mn.rightLookupSchemaName,
    cascadeDelete: 'RemoveLink',
    required: true,
  };

  return {
    bridgeLogicalName,
    left: {
      rel: leftRel,
      resolved: {
        parentLogicalName: leftLogical,
        parentPrimaryKey: primaryKeyFor(leftLogical),
        childLogicalName: bridgeLogicalName,
      },
    },
    right: {
      rel: rightRel,
      resolved: {
        parentLogicalName: rightLogical,
        parentPrimaryKey: primaryKeyFor(rightLogical),
        childLogicalName: bridgeLogicalName,
      },
    },
  };
}
