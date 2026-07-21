import type { GlobalChoiceDraft } from '../types/globalChoice';
import { buildSchemaName } from '../services/namingService';
import { makeLabel } from './labels';

/**
 * The global option set Name (lowercase, prefixed) that Dataverse assigns. This
 * is the identity used to look up an existing global choice for idempotency.
 */
export function globalChoiceName(prefix: string, choice: GlobalChoiceDraft): string {
  return buildSchemaName(prefix, choice.schemaName).toLowerCase();
}

/** Build the global option set metadata payload for createGlobalOptionSet. */
export function buildGlobalOptionSet(
  prefix: string,
  choice: GlobalChoiceDraft,
): Record<string, unknown> {
  return {
    '@odata.type': 'Microsoft.Dynamics.CRM.OptionSetMetadata',
    Name: globalChoiceName(prefix, choice),
    DisplayName: makeLabel(choice.displayName),
    ...(choice.description ? { Description: makeLabel(choice.description) } : {}),
    OptionSetType: 'Picklist',
    IsGlobal: true,
    Options: choice.options.map((opt) => ({
      Value: opt.value,
      Label: makeLabel(opt.label),
    })),
  };
}
