import type { FieldDraft } from './field';

export type OwnershipType = 'UserOwned' | 'OrganizationOwned';

/** A custom table the user is designing. */
export interface EntityDraft {
  id: string;
  displayName: string;
  pluralName: string;
  /** Schema name without the publisher prefix (prefix is applied at build time). */
  schemaName: string;
  description?: string;
  ownershipType: OwnershipType;
  hasActivities: boolean;
  hasNotes: boolean;
  fields: FieldDraft[];
}
