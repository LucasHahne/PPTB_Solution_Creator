import type { EntityDraft } from '../types/entity';
import type { FieldDraft } from '../types/field';
import type { ManyToManyRelationshipDraft } from '../types/relationship';
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

/** Synthesize a project-style entity draft for an M:N bridge table (deploy only). */
export function synthesizeBridgeEntity(mn: ManyToManyRelationshipDraft): EntityDraft {
  const primary: FieldDraft = {
    id: `${mn.id}-primary`,
    type: 'autonumber',
    displayName: mn.primaryDisplayName,
    schemaName: mn.primarySchemaName,
    requiredLevel: 'ApplicationRequired',
    isPrimaryName: true,
    maxLength: 100,
    autoNumberFormat: mn.autoNumberFormat,
  };

  return {
    id: mn.id,
    displayName: mn.bridgeDisplayName,
    pluralName: mn.bridgeDisplayName,
    schemaName: mn.bridgeSchemaName,
    ownershipType: 'OrganizationOwned',
    hasActivities: false,
    hasNotes: false,
    fields: [primary],
  };
}
