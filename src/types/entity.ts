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
  /**
   * When present, this table is an auto-managed bridge (intersect) table for a
   * many-to-many relationship. Its two side lookups are owned by that
   * relationship draft (referenced by id), not by the Fields step.
   */
  bridge?: { relationshipId: string };
}
