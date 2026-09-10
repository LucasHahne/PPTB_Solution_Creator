import type { ManyToManyRelationshipDraft } from '../types/relationship';
import { newId } from '../utils/ids';
import { sanitizeSchemaToken, toPascalToken } from '../services/namingService';

export const BRIDGE_PRIMARY_DISPLAY = 'Bridge Number';
export const BRIDGE_PRIMARY_SCHEMA = 'BridgeNumber';
export const BRIDGE_AUTONUMBER_FORMAT = 'BRG-{SEQNUM:5}';

/** Default bridge display name: `Bridge {Left} {Right}`. */
export function defaultBridgeDisplayName(leftLabel: string, rightLabel: string): string {
  const L = leftLabel.trim() || 'Left';
  const R = rightLabel.trim() || 'Right';
  return `Bridge ${L} ${R}`;
}

/** Default bridge schema: `Bridge{Left}{Right}`. */
export function defaultBridgeSchemaName(leftLabel: string, rightLabel: string): string {
  return sanitizeSchemaToken(`Bridge${toPascalToken(leftLabel)}${toPascalToken(rightLabel)}`);
}

/** Default lookup schema: `Lookup{Side}`. */
export function defaultLookupSchemaName(sideLabel: string): string {
  return sanitizeSchemaToken(`Lookup${toPascalToken(sideLabel)}`);
}

/** Build a fresh M:N draft with defaults from the two table display names. */
export function makeManyToManyDraft(
  leftTableId: string,
  rightTableId: string,
  leftLabel: string,
  rightLabel: string,
): ManyToManyRelationshipDraft {
  const L = leftLabel.trim() || 'Left';
  const R = rightLabel.trim() || 'Right';
  return {
    id: newId(),
    leftTableId,
    rightTableId,
    bridgeDisplayName: defaultBridgeDisplayName(L, R),
    bridgeSchemaName: defaultBridgeSchemaName(L, R),
    primaryDisplayName: BRIDGE_PRIMARY_DISPLAY,
    primarySchemaName: BRIDGE_PRIMARY_SCHEMA,
    autoNumberFormat: BRIDGE_AUTONUMBER_FORMAT,
    leftLookupDisplayName: L,
    leftLookupSchemaName: defaultLookupSchemaName(L),
    rightLookupDisplayName: R,
    rightLookupSchemaName: defaultLookupSchemaName(R),
  };
}

/** Re-apply defaults for fields the user has not customized (touched flags). */
export function applyManyToManySideDefaults(
  draft: ManyToManyRelationshipDraft,
  leftLabel: string,
  rightLabel: string,
  touched: {
    bridgeDisplay?: boolean;
    bridgeSchema?: boolean;
    leftLookupDisplay?: boolean;
    leftLookupSchema?: boolean;
    rightLookupDisplay?: boolean;
    rightLookupSchema?: boolean;
  },
): ManyToManyRelationshipDraft {
  const L = leftLabel.trim() || 'Left';
  const R = rightLabel.trim() || 'Right';
  return {
    ...draft,
    bridgeDisplayName: touched.bridgeDisplay ? draft.bridgeDisplayName : defaultBridgeDisplayName(L, R),
    bridgeSchemaName: touched.bridgeSchema ? draft.bridgeSchemaName : defaultBridgeSchemaName(L, R),
    leftLookupDisplayName: touched.leftLookupDisplay ? draft.leftLookupDisplayName : L,
    leftLookupSchemaName: touched.leftLookupSchema
      ? draft.leftLookupSchemaName
      : defaultLookupSchemaName(L),
    rightLookupDisplayName: touched.rightLookupDisplay ? draft.rightLookupDisplayName : R,
    rightLookupSchemaName: touched.rightLookupSchema
      ? draft.rightLookupSchemaName
      : defaultLookupSchemaName(R),
  };
}
