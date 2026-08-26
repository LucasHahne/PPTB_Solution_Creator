import type { BridgeLookupConfig, LookupRelationshipDraft } from '../types/relationship';
import type { ResolvedBridgeSide } from '../services/projectResolver';
import { buildSchemaName } from '../services/namingService';
import { makeLabel } from './labels';
import { ATTRIBUTE_ODATA_TYPE } from '../constants/fieldTypes';

export interface ResolvedRelationship {
  /** Logical name (lowercase, prefixed where applicable) of the parent table. */
  parentLogicalName: string;
  /** Primary key attribute of the parent table. */
  parentPrimaryKey: string;
  /** Logical name of the child table. */
  childLogicalName: string;
}

/**
 * Build a 1:N relationship payload. This creates the lookup column on the child
 * (referencing) table and points it at the parent (referenced) table in one call.
 */
export function buildOneToManyRelationship(
  prefix: string,
  rel: LookupRelationshipDraft,
  resolved: ResolvedRelationship,
): Record<string, unknown> {
  const lookupSchema = buildSchemaName(prefix, rel.lookupSchemaName);
  const relationshipSchema = buildSchemaName(
    prefix,
    `${resolved.parentLogicalName}_${resolved.childLogicalName}_${rel.lookupSchemaName}`.replace(
      /[^a-zA-Z0-9]/g,
      '',
    ),
  );

  return {
    '@odata.type': 'Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata',
    SchemaName: relationshipSchema,
    ReferencedEntity: resolved.parentLogicalName,
    ReferencedAttribute: resolved.parentPrimaryKey,
    ReferencingEntity: resolved.childLogicalName,
    CascadeConfiguration: {
      Assign: 'NoCascade',
      Delete: rel.cascadeDelete,
      Merge: 'NoCascade',
      Reparent: 'NoCascade',
      Share: 'NoCascade',
      Unshare: 'NoCascade',
    },
    Lookup: {
      '@odata.type': ATTRIBUTE_ODATA_TYPE.Lookup,
      SchemaName: lookupSchema,
      DisplayName: makeLabel(rel.lookupDisplayName),
      RequiredLevel: { Value: rel.required ? 'ApplicationRequired' : 'None' },
    },
  };
}

/**
 * Build one of the two 1:N relationships that back a many-to-many bridge. The
 * lookup column lives on the bridge (referencing) table and points at one side
 * (referenced) table. An overridden CascadeConfiguration can be supplied to
 * fall back from Cascade to RemoveLink when the platform rejects it.
 */
export function buildBridgeLookupRelationship(
  prefix: string,
  lookup: BridgeLookupConfig,
  side: ResolvedBridgeSide,
  cascadeDeleteOverride?: BridgeLookupConfig['cascadeDelete'],
): Record<string, unknown> {
  const lookupSchema = buildSchemaName(prefix, lookup.schemaName);
  const relationshipSchema = buildSchemaName(
    prefix,
    `${side.referenced.logicalName}_${side.bridgeLogicalName}_${lookup.schemaName}`.replace(
      /[^a-zA-Z0-9]/g,
      '',
    ),
  );

  return {
    '@odata.type': 'Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata',
    SchemaName: relationshipSchema,
    ReferencedEntity: side.referenced.logicalName,
    ReferencedAttribute: side.referenced.primaryKey,
    ReferencingEntity: side.bridgeLogicalName,
    CascadeConfiguration: {
      Assign: 'NoCascade',
      Delete: cascadeDeleteOverride ?? lookup.cascadeDelete,
      Merge: 'NoCascade',
      Reparent: 'NoCascade',
      Share: 'NoCascade',
      Unshare: 'NoCascade',
    },
    Lookup: {
      '@odata.type': ATTRIBUTE_ODATA_TYPE.Lookup,
      SchemaName: lookupSchema,
      DisplayName: makeLabel(lookup.displayName),
      RequiredLevel: { Value: lookup.required ? 'ApplicationRequired' : 'None' },
    },
  };
}
