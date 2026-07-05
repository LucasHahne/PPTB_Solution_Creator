import type { EntityDraft } from '../types/entity';
import { buildSchemaName } from '../services/namingService';
import { buildPrimaryNameAttribute } from './fieldBuilder';
import { makeLabel } from './labels';

/** The primary name field for a table (the field flagged isPrimaryName, or a fallback). */
export function getPrimaryNameField(entity: EntityDraft) {
  return entity.fields.find((f) => f.isPrimaryName);
}

/**
 * Build the entity metadata payload. The primary name column is embedded;
 * all other (non-lookup) columns are created separately via createAttribute.
 */
export function buildEntityDefinition(
  prefix: string,
  entity: EntityDraft,
): Record<string, unknown> {
  const primary = getPrimaryNameField(entity);
  if (!primary) {
    throw new Error(`Table "${entity.displayName}" has no primary name column.`);
  }

  return {
    '@odata.type': 'Microsoft.Dynamics.CRM.EntityMetadata',
    SchemaName: buildSchemaName(prefix, entity.schemaName),
    DisplayName: makeLabel(entity.displayName),
    DisplayCollectionName: makeLabel(entity.pluralName || `${entity.displayName}s`),
    ...(entity.description ? { Description: makeLabel(entity.description) } : {}),
    OwnershipType: entity.ownershipType,
    IsActivity: false,
    HasActivities: entity.hasActivities,
    HasNotes: entity.hasNotes,
    Attributes: [buildPrimaryNameAttribute(prefix, primary)],
  };
}
