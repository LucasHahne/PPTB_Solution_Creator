import type { SolutionProject, WizardStep } from '../types/project';
import type { EntityDraft } from '../types/entity';
import { FIELD_TYPE_CONFIGS } from '../constants/fieldTypes';
import { RESERVED_FIELD_NAMES } from '../constants/defaults';
import {
  buildTableLogicalName,
  isValidPrefix,
  isValidUniqueName,
  MAX_TABLE_LOGICAL_NAME,
  SAFE_TABLE_LOGICAL_NAME,
  sanitizeSchemaToken,
  sanitizeTableSchemaToken,
} from './namingService';
import { validateFieldConstraints } from '../utils/fieldConstraints';

export type IssueSeverity = 'error' | 'warning';

export interface ValidationIssue {
  step: WizardStep;
  severity: IssueSeverity;
  message: string;
}

/** Resolve the effective publisher prefix for the project, if known. */
export function getProjectPrefix(project: SolutionProject): string | null {
  const { solution } = project;
  if (solution.mode === 'existing') return solution.existing?.prefix ?? null;
  const draft = solution.draft;
  if (!draft) return null;
  return draft.newPublisher?.prefix ?? draft.existingPublisherPrefix ?? null;
}

function validateSolution(project: SolutionProject, issues: ValidationIssue[]) {
  const { solution } = project;

  if (solution.mode === 'existing') {
    if (!solution.existing) {
      issues.push({ step: 'solution', severity: 'error', message: 'Select an existing solution.' });
    } else if (solution.existing.ismanaged) {
      issues.push({
        step: 'solution',
        severity: 'error',
        message: 'The selected solution is managed and cannot be edited.',
      });
    } else if (!solution.existing.prefix) {
      issues.push({
        step: 'solution',
        severity: 'warning',
        message: 'Could not resolve the publisher prefix for the selected solution.',
      });
    }
    return;
  }

  const draft = solution.draft;
  if (!draft) {
    issues.push({ step: 'solution', severity: 'error', message: 'Configure the new solution.' });
    return;
  }

  if (!draft.friendlyName.trim()) {
    issues.push({ step: 'solution', severity: 'error', message: 'Solution display name is required.' });
  }
  if (!isValidUniqueName(draft.uniqueName)) {
    issues.push({
      step: 'solution',
      severity: 'error',
      message: 'Solution unique name must start with a letter and contain only letters, numbers, and underscores.',
    });
  }
  if (!draft.existingPublisherId && !draft.newPublisher) {
    issues.push({ step: 'solution', severity: 'error', message: 'Choose or create a publisher.' });
  }
  if (draft.newPublisher) {
    if (!draft.newPublisher.friendlyName.trim()) {
      issues.push({ step: 'solution', severity: 'error', message: 'Publisher display name is required.' });
    }
    if (!isValidUniqueName(draft.newPublisher.uniqueName)) {
      issues.push({ step: 'solution', severity: 'error', message: 'Publisher unique name is invalid.' });
    }
    if (!isValidPrefix(draft.newPublisher.prefix)) {
      issues.push({
        step: 'solution',
        severity: 'error',
        message: 'Publisher prefix must be 2-8 lowercase letters/digits and start with a letter.',
      });
    }
  }
}

function validateGlobalChoices(project: SolutionProject, issues: ValidationIssue[]) {
  const seen = new Set<string>();
  for (const choice of project.globalChoices ?? []) {
    const label = choice.displayName || '(unnamed global choice)';
    if (!choice.displayName.trim()) {
      issues.push({ step: 'fields', severity: 'error', message: 'A global choice is missing a display name.' });
    }
    const token = sanitizeSchemaToken(choice.schemaName).toLowerCase();
    if (!token) {
      issues.push({ step: 'fields', severity: 'error', message: `Global choice "${label}" has an invalid schema name.` });
    } else if (seen.has(token)) {
      issues.push({ step: 'fields', severity: 'error', message: `Duplicate global choice schema name "${token}".` });
    }
    seen.add(token);

    if ((choice.options ?? []).length === 0) {
      issues.push({ step: 'fields', severity: 'error', message: `Global choice "${label}" needs at least one option.` });
    }
    const values = new Set<number>();
    for (const opt of choice.options ?? []) {
      if (!opt.label.trim()) {
        issues.push({ step: 'fields', severity: 'error', message: `An option in global choice "${label}" has no label.` });
      }
      if (values.has(opt.value)) {
        issues.push({ step: 'fields', severity: 'error', message: `Duplicate option value ${opt.value} in global choice "${label}".` });
      }
      values.add(opt.value);
    }
  }
}

function validateTable(entity: EntityDraft, issues: ValidationIssue[], globalChoiceIds: Set<string>) {
  const label = entity.displayName || '(unnamed table)';

  if (!entity.displayName.trim()) {
    issues.push({ step: 'tables', severity: 'error', message: 'A table is missing a display name.' });
  }
  if (!sanitizeTableSchemaToken(entity.schemaName)) {
    issues.push({ step: 'tables', severity: 'error', message: `Table "${label}" has an invalid schema name.` });
  }

  const primaryFields = entity.fields.filter((f) => f.isPrimaryName);
  if (primaryFields.length === 0) {
    issues.push({ step: 'tables', severity: 'error', message: `Table "${label}" needs a primary name column.` });
  } else if (primaryFields.length > 1) {
    issues.push({ step: 'tables', severity: 'error', message: `Table "${label}" has more than one primary name column.` });
  }

  const seen = new Set<string>();
  for (const field of entity.fields) {
    const fieldLabel = field.displayName || '(unnamed column)';
    const token = sanitizeSchemaToken(field.schemaName).toLowerCase();

    if (!field.displayName.trim()) {
      issues.push({ step: 'fields', severity: 'error', message: `A column in "${label}" is missing a display name.` });
    }
    if (!token) {
      issues.push({ step: 'fields', severity: 'error', message: `Column "${fieldLabel}" in "${label}" has an invalid schema name.` });
      continue;
    }
    if (RESERVED_FIELD_NAMES.has(token) && !field.isPrimaryName) {
      issues.push({ step: 'fields', severity: 'error', message: `Column "${fieldLabel}" uses a reserved name.` });
    }
    if (seen.has(token)) {
      issues.push({ step: 'fields', severity: 'error', message: `Duplicate column schema name "${token}" in "${label}".` });
    }
    seen.add(token);

    const config = FIELD_TYPE_CONFIGS[field.type];
    if (config.supportsOptions) {
      const opts = field.options ?? [];
      if (opts.length === 0) {
        issues.push({ step: 'fields', severity: 'error', message: `Choice column "${fieldLabel}" needs at least one option.` });
      }
      const values = new Set<number>();
      for (const opt of opts) {
        if (!opt.label.trim()) {
          issues.push({ step: 'fields', severity: 'error', message: `An option in "${fieldLabel}" has no label.` });
        }
        if (values.has(opt.value)) {
          issues.push({ step: 'fields', severity: 'error', message: `Duplicate option value ${opt.value} in "${fieldLabel}".` });
        }
        values.add(opt.value);
      }
    }

    if (config.supportsGlobalChoice) {
      if (!field.globalChoiceId || !globalChoiceIds.has(field.globalChoiceId)) {
        issues.push({ step: 'fields', severity: 'error', message: `Global choice column "${fieldLabel}" must reference an existing global choice.` });
      }
    }

    for (const constraint of validateFieldConstraints(field)) {
      if (!constraint.valid && constraint.message) {
        issues.push({ step: 'fields', severity: 'error', message: constraint.message });
      }
    }
  }
}

function validateManyToMany(project: SolutionProject, issues: ValidationIssue[]) {
  const prefix = getProjectPrefix(project);
  const tableIds = new Set(project.tables.map((t) => t.id));

  function sideValid(ref: SolutionProject['manyToMany'][number]['side1']): boolean {
    if (ref.kind === 'project') return tableIds.has(ref.tableId);
    return Boolean(ref.logicalName);
  }

  function sideLabel(ref: SolutionProject['manyToMany'][number]['side1']): string {
    if (ref.kind === 'project') {
      return project.tables.find((t) => t.id === ref.tableId)?.displayName || 'a table';
    }
    return ref.logicalName || 'a table';
  }

  for (const m2m of project.manyToMany ?? []) {
    const bridge = project.tables.find((t) => t.id === m2m.bridgeTableId);
    const label = bridge?.displayName || 'a many-to-many relationship';

    if (!sideValid(m2m.side1) || !sideValid(m2m.side2)) {
      issues.push({
        step: 'relationships',
        severity: 'error',
        message: `M:N "${label}" references a table that no longer exists.`,
      });
    }

    if (!bridge || bridge.bridge?.relationshipId !== m2m.id) {
      issues.push({
        step: 'relationships',
        severity: 'error',
        message: `M:N "${label}" is missing its bridge table.`,
      });
      continue;
    }

    const name1 = sanitizeSchemaToken(m2m.side1Lookup.schemaName);
    const name2 = sanitizeSchemaToken(m2m.side2Lookup.schemaName);
    if (!m2m.side1Lookup.displayName.trim() || !m2m.side2Lookup.displayName.trim()) {
      issues.push({ step: 'relationships', severity: 'error', message: `M:N "${label}" has a lookup without a display name.` });
    }
    if (!name1 || !name2) {
      issues.push({ step: 'relationships', severity: 'error', message: `M:N "${label}" has a lookup with an invalid schema name.` });
    } else if (name1.toLowerCase() === name2.toLowerCase()) {
      issues.push({
        step: 'relationships',
        severity: 'error',
        message: `M:N "${label}" needs two distinct lookup schema names (they point at ${sideLabel(m2m.side1)} and ${sideLabel(m2m.side2)}).`,
      });
    }

    if (prefix) {
      const logicalName = buildTableLogicalName(prefix, bridge.schemaName);
      if (logicalName.length > MAX_TABLE_LOGICAL_NAME) {
        issues.push({
          step: 'relationships',
          severity: 'error',
          message: `Bridge table "${label}" logical name (${logicalName}) exceeds ${MAX_TABLE_LOGICAL_NAME} characters.`,
        });
      } else if (logicalName.length > SAFE_TABLE_LOGICAL_NAME) {
        issues.push({
          step: 'relationships',
          severity: 'warning',
          message: `Bridge table "${label}" logical name is very long and may collide with its generated primary key.`,
        });
      }
    }
  }
}

/** Run all validation rules across the project. */
export function validateProject(project: SolutionProject): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  validateSolution(project, issues);

  if (project.tables.length === 0) {
    issues.push({ step: 'tables', severity: 'error', message: 'Add at least one table.' });
  }

  validateGlobalChoices(project, issues);
  const globalChoiceIds = new Set((project.globalChoices ?? []).map((c) => c.id));

  const tableTokens = new Set<string>();
  for (const entity of project.tables) {
    const token = sanitizeTableSchemaToken(entity.schemaName).toLowerCase();
    if (token && tableTokens.has(token)) {
      issues.push({ step: 'tables', severity: 'error', message: `Duplicate table schema name "${token}".` });
    }
    tableTokens.add(token);
    validateTable(entity, issues, globalChoiceIds);
  }

  // Relationships
  const tableIds = new Set(project.tables.map((t) => t.id));
  for (const rel of project.relationships) {
    if (!rel.lookupDisplayName.trim()) {
      issues.push({ step: 'relationships', severity: 'error', message: 'A lookup is missing a display name.' });
    }
    if (!sanitizeSchemaToken(rel.lookupSchemaName)) {
      issues.push({ step: 'relationships', severity: 'error', message: `Lookup "${rel.lookupDisplayName || 'unnamed'}" has an invalid schema name.` });
    }
    // The child (where the lookup column is created) must be a project table.
    if (!rel.childTableId || !tableIds.has(rel.childTableId)) {
      issues.push({ step: 'relationships', severity: 'error', message: 'A lookup is missing a valid child table.' });
    }
    if (rel.parent.kind === 'project' && !tableIds.has(rel.parent.tableId)) {
      issues.push({ step: 'relationships', severity: 'error', message: 'A lookup references a parent table that no longer exists.' });
    }
    if (rel.parent.kind === 'standard' && !rel.parent.logicalName) {
      issues.push({ step: 'relationships', severity: 'error', message: 'A lookup is missing its parent table.' });
    }
  }

  validateManyToMany(project, issues);

  return issues;
}

/** Convenience: are there any blocking (error-level) issues? */
export function hasBlockingIssues(issues: ValidationIssue[]): boolean {
  return issues.some((i) => i.severity === 'error');
}

/** Filter issues for a given wizard step. */
export function issuesForStep(issues: ValidationIssue[], step: WizardStep): ValidationIssue[] {
  return issues.filter((i) => i.step === step);
}
