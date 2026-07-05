import type { OwnershipType } from '../types/entity';
import type { CascadeDelete } from '../types/relationship';

export const DRAFT_SETTINGS_KEY = 'solution-creator-draft-v1';

export const DEFAULT_LANGUAGE_CODE = 1033;

export const OWNERSHIP_OPTIONS: { value: OwnershipType; label: string }[] = [
  { value: 'UserOwned', label: 'User or team owned' },
  { value: 'OrganizationOwned', label: 'Organization owned' },
];

export const CASCADE_DELETE_OPTIONS: { value: CascadeDelete; label: string }[] = [
  { value: 'RemoveLink', label: 'Remove link' },
  { value: 'Restrict', label: 'Restrict' },
  { value: 'Cascade', label: 'Cascade' },
];

/**
 * Common standard tables offered as lookup targets in addition to the project's
 * own tables. Keeps the picker fast without loading the full entity catalog.
 */
export const COMMON_LOOKUP_TARGETS: { logicalName: string; label: string }[] = [
  { logicalName: 'account', label: 'Account' },
  { logicalName: 'contact', label: 'Contact' },
  { logicalName: 'systemuser', label: 'User' },
  { logicalName: 'team', label: 'Team' },
  { logicalName: 'businessunit', label: 'Business Unit' },
];

/** Reserved attribute names that cannot be used for custom columns. */
export const RESERVED_FIELD_NAMES = new Set([
  'name',
  'ownerid',
  'statecode',
  'statuscode',
  'createdon',
  'createdby',
  'modifiedon',
  'modifiedby',
  'versionnumber',
  'importsequencenumber',
  'overriddencreatedon',
  'timezoneruleversionnumber',
  'utcconversiontimezonecode',
]);
