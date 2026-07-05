import type { SolutionProject, WizardStep } from '../types/project';
import type { EntityDraft } from '../types/entity';
import { FIELD_TYPE_CONFIGS } from '../constants/fieldTypes';
import { RESERVED_FIELD_NAMES } from '../constants/defaults';
import {
  isValidPrefix,
  isValidUniqueName,
  sanitizeSchemaToken,
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

function validateTable(entity: EntityDraft, issues: ValidationIssue[]) {
  const label = entity.displayName || '(unnamed table)';

  if (!entity.displayName.trim()) {
    issues.push({ step: 'tables', severity: 'error', message: 'A table is missing a display name.' });
  }
  if (!sanitizeSchemaToken(entity.schemaName)) {
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

    for (const constraint of validateFieldConstraints(field)) {
      if (!constraint.valid && constraint.message) {
        issues.push({ step: 'fields', severity: 'error', message: constraint.message });
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

  const tableTokens = new Set<string>();
  for (const entity of project.tables) {
    const token = sanitizeSchemaToken(entity.schemaName).toLowerCase();
    if (token && tableTokens.has(token)) {
      issues.push({ step: 'tables', severity: 'error', message: `Duplicate table schema name "${token}".` });
    }
    tableTokens.add(token);
    validateTable(entity, issues);
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
