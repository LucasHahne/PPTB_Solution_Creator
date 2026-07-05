import type { FieldDraft } from '../types/field';
import {
  ATTRIBUTE_ODATA_TYPE,
  FIELD_TYPE_CONFIGS,
  type AttributeMetadataTypeName,
} from '../constants/fieldTypes';
import { buildSchemaName } from '../services/namingService';
import { makeLabel } from './labels';

/** Resolve the @odata.type string for an attribute as a plain literal string. */
function odataType(attributeType: AttributeMetadataTypeName): string {
  return ATTRIBUTE_ODATA_TYPE[attributeType];
}

function requiredLevel(field: FieldDraft) {
  return { Value: field.requiredLevel };
}

/**
 * Build the Dataverse attribute metadata payload for a field.
 * Lookups are intentionally NOT built here — they are created as 1:N
 * relationships by the relationshipBuilder.
 */
export function buildAttributeDefinition(
  prefix: string,
  field: FieldDraft,
): Record<string, unknown> {
  const config = FIELD_TYPE_CONFIGS[field.type];
  const schemaName = buildSchemaName(prefix, field.schemaName);

  const base: Record<string, unknown> = {
    '@odata.type': odataType(config.attributeType),
    SchemaName: schemaName,
    DisplayName: makeLabel(field.displayName),
    RequiredLevel: requiredLevel(field),
  };

  if (field.description) {
    base.Description = makeLabel(field.description);
  }

  switch (field.type) {
    case 'text':
    case 'email':
    case 'url':
    case 'phone':
      base.MaxLength = field.maxLength ?? config.defaultMaxLength ?? 100;
      base.FormatName = { Value: config.formatName };
      break;

    case 'multiline':
      base.MaxLength = field.maxLength ?? config.defaultMaxLength ?? 2000;
      break;

    case 'wholeNumber':
      base.MinValue = field.minValue ?? -2147483648;
      base.MaxValue = field.maxValue ?? 2147483647;
      base.Format = 'None';
      break;

    case 'decimal':
      base.MinValue = field.minValue ?? 0;
      base.MaxValue = field.maxValue ?? 1000000000;
      base.Precision = field.precision ?? 2;
      break;

    case 'currency':
      base.MinValue = field.minValue ?? 0;
      base.MaxValue = field.maxValue ?? 1000000000;
      base.Precision = field.precision ?? 2;
      break;

    case 'dateOnly':
    case 'dateTime':
      base.Format = config.dateFormat;
      base.DateTimeBehavior = { Value: 'UserLocal' };
      break;

    case 'boolean':
      base.DefaultValue = field.defaultBoolean ?? false;
      base.OptionSet = {
        '@odata.type': 'Microsoft.Dynamics.CRM.BooleanOptionSetMetadata',
        TrueOption: { Value: 1, Label: makeLabel('Yes') },
        FalseOption: { Value: 0, Label: makeLabel('No') },
      };
      break;

    case 'choice':
      base.OptionSet = {
        '@odata.type': 'Microsoft.Dynamics.CRM.OptionSetMetadata',
        IsGlobal: false,
        OptionSetType: 'Picklist',
        Options: (field.options ?? []).map((opt) => ({
          Value: opt.value,
          Label: makeLabel(opt.label),
        })),
      };
      break;
  }

  return base;
}

/** Build the primary-name string attribute embedded in a new table definition. */
export function buildPrimaryNameAttribute(
  prefix: string,
  field: FieldDraft,
): Record<string, unknown> {
  return {
    '@odata.type': odataType('String'),
    SchemaName: buildSchemaName(prefix, field.schemaName),
    DisplayName: makeLabel(field.displayName),
    RequiredLevel: { Value: 'ApplicationRequired' },
    MaxLength: field.maxLength ?? 100,
    FormatName: { Value: 'Text' },
    IsPrimaryName: true,
  };
}
