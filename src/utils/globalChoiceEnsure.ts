import type { FieldDraft, OptionDraft } from '../types/field';
import type { GlobalChoiceDraft } from '../types/globalChoice';
import type { SolutionProject } from '../types/project';
import { sanitizeSchemaToken, toPascalToken } from '../services/namingService';
import { newId } from './ids';

function choiceKey(schemaName: string, displayName: string): string {
  return (sanitizeSchemaToken(schemaName) || toPascalToken(displayName)).toLowerCase();
}

function toOptionDrafts(
  options?: Array<{ label: string; value: number; id?: string }>,
): OptionDraft[] | undefined {
  if (!options?.length) return undefined;
  return options.map((o) => ({
    id: o.id ?? newId(),
    label: o.label,
    value: o.value,
  }));
}

function starterOptions(): OptionDraft[] {
  return [
    { id: newId(), value: 1, label: 'Option 1' },
    { id: newId(), value: 2, label: 'Option 2' },
  ];
}

/**
 * Find or create a project-level global choice draft.
 * New drafts are created in Dataverse during deploy (or reused if the name
 * already exists), then bound onto Choice (global) columns.
 */
export function ensureGlobalChoice(
  choices: GlobalChoiceDraft[],
  params: {
    displayName: string;
    schemaName?: string;
    options?: Array<{ label: string; value: number; id?: string }>;
    /** When true, replace options on an existing match if the caller supplied some. */
    updateOptions?: boolean;
  },
): { choices: GlobalChoiceDraft[]; id: string | undefined } {
  const displayName = params.displayName.trim();
  const schemaName =
    sanitizeSchemaToken(params.schemaName ?? '') || toPascalToken(displayName);
  if (!schemaName) return { choices, id: undefined };

  const key = schemaName.toLowerCase();
  const existing = choices.find((c) => choiceKey(c.schemaName, c.displayName) === key);
  const incomingOptions = toOptionDrafts(params.options);

  if (existing) {
    if (params.updateOptions && incomingOptions) {
      return {
        choices: choices.map((c) =>
          c.id === existing.id ? { ...c, options: incomingOptions } : c,
        ),
        id: existing.id,
      };
    }
    return { choices, id: existing.id };
  }

  const created: GlobalChoiceDraft = {
    id: newId(),
    displayName: displayName || schemaName,
    schemaName,
    options: incomingOptions ?? starterOptions(),
  };
  return { choices: [...choices, created], id: created.id };
}

function fieldHasBoundChoice(field: FieldDraft, choiceIds: Set<string>): boolean {
  return Boolean(field.globalChoiceId && choiceIds.has(field.globalChoiceId));
}

/**
 * Bind every Choice (global) column to a project global choice, creating a
 * draft from the column name when none exists yet. Deploy creates those drafts
 * in Dataverse before it creates the columns.
 */
export function ensureProjectGlobalChoices(project: SolutionProject): SolutionProject {
  let choices = project.globalChoices ?? [];
  let changed = false;
  const choiceIds = () => new Set(choices.map((c) => c.id));

  const tables = project.tables.map((table) => {
    let tableChanged = false;
    const fields = table.fields.map((field) => {
      if (field.type !== 'globalChoice') return field;
      if (fieldHasBoundChoice(field, choiceIds())) return field;

      const result = ensureGlobalChoice(choices, {
        displayName: field.displayName,
        schemaName: field.schemaName,
        options: field.options,
      });
      if (result.choices !== choices) {
        choices = result.choices;
        changed = true;
      }
      if (result.id && result.id !== field.globalChoiceId) {
        tableChanged = true;
        changed = true;
        return { ...field, globalChoiceId: result.id };
      }
      return field;
    });
    return tableChanged ? { ...table, fields } : table;
  });

  if (!changed) return project;
  return { ...project, tables, globalChoices: choices };
}
