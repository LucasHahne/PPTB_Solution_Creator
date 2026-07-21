import { create } from 'zustand';
import type { SolutionProject, WizardStep } from '../types/project';
import type { EntityDraft } from '../types/entity';
import type { FieldDraft, FieldType } from '../types/field';
import type { GlobalChoiceDraft } from '../types/globalChoice';
import type { LookupRelationshipDraft } from '../types/relationship';
import type { NewSolutionDraft, SolutionSummary } from '../types/solution';
import type { ColumnSchemaEntry } from '../types/columnSchema';
import {
  applySchemaEntryToField,
  normalizeFieldSchemaKey,
  normalizeSchemaKey,
  schemaEntryToFieldDraft,
} from '../utils/columnSchema';
import { newId } from '../utils/ids';
import { FIELD_TYPE_CONFIGS } from '../constants/fieldTypes';
import { toPascalToken } from '../services/namingService';

function emptyProject(): SolutionProject {
  return {
    solution: {
      mode: 'new',
      draft: {
        friendlyName: '',
        uniqueName: '',
        version: '1.0.0.0',
      },
    },
    tables: [],
    relationships: [],
    globalChoices: [],
  };
}

/** Normalize a loaded draft so newer optional collections are always present. */
function normalizeProject(project: SolutionProject): SolutionProject {
  return {
    ...project,
    relationships: project.relationships ?? [],
    globalChoices: project.globalChoices ?? [],
  };
}

/** A fresh primary-name field for a new table. */
function defaultPrimaryField(): FieldDraft {
  return {
    id: newId(),
    type: 'text',
    displayName: 'Name',
    schemaName: 'Name',
    requiredLevel: 'ApplicationRequired',
    isPrimaryName: true,
    maxLength: 100,
  };
}

/** Build a new field with sensible per-type defaults. */
export function makeField(type: FieldType, displayName = ''): FieldDraft {
  const config = FIELD_TYPE_CONFIGS[type];
  const field: FieldDraft = {
    id: newId(),
    type,
    displayName,
    schemaName: displayName ? toPascalToken(displayName) : '',
    requiredLevel: 'None',
  };
  if (config.supportsMaxLength) field.maxLength = config.defaultMaxLength;
  if (config.supportsPrecision) field.precision = 2;
  if (config.supportsOptions) {
    field.options = [
      { id: newId(), value: 1, label: 'Option 1' },
      { id: newId(), value: 2, label: 'Option 2' },
    ];
  }
  if (config.supportsMaxSize) field.maxSizeInKB = config.defaultMaxSizeInKB;
  if (config.supportsAutoNumber) field.autoNumberFormat = config.defaultAutoNumberFormat;
  if (type === 'boolean') field.defaultBoolean = false;
  return field;
}

/** Build a new global choice draft with two starter options. */
export function makeGlobalChoice(displayName = ''): GlobalChoiceDraft {
  return {
    id: newId(),
    displayName,
    schemaName: displayName ? toPascalToken(displayName) : '',
    options: [
      { id: newId(), value: 1, label: 'Option 1' },
      { id: newId(), value: 2, label: 'Option 2' },
    ],
  };
}

function makeTable(displayName = ''): EntityDraft {
  return {
    id: newId(),
    displayName,
    pluralName: displayName ? `${displayName}s` : '',
    schemaName: displayName ? toPascalToken(displayName) : '',
    ownershipType: 'UserOwned',
    hasActivities: false,
    hasNotes: true,
    fields: [defaultPrimaryField()],
  };
}

interface ProjectState {
  project: SolutionProject;
  currentStep: WizardStep;
  selectedTableId: string | null;
  hydrated: boolean;

  setStep: (step: WizardStep) => void;
  hydrate: (project: SolutionProject) => void;
  markHydrated: () => void;
  reset: () => void;

  // Solution
  setSolutionMode: (mode: 'new' | 'existing') => void;
  updateNewSolution: (patch: Partial<NewSolutionDraft>) => void;
  setExistingSolution: (solution: (SolutionSummary & { prefix: string }) | undefined) => void;

  // Tables
  addTable: (displayName?: string) => string;
  updateTable: (id: string, patch: Partial<EntityDraft>) => void;
  removeTable: (id: string) => void;
  duplicateTable: (id: string) => void;
  selectTable: (id: string | null) => void;

  // Fields
  addField: (tableId: string, type?: FieldType) => void;
  addFields: (tableId: string, fields: FieldDraft[]) => void;
  updateField: (tableId: string, fieldId: string, patch: Partial<FieldDraft>) => void;
  removeField: (tableId: string, fieldId: string) => void;
  duplicateField: (tableId: string, fieldId: string) => void;
  setPrimaryName: (tableId: string, fieldId: string) => void;
  mergeFieldsFromSchema: (tableId: string, entries: ColumnSchemaEntry[]) => void;

  // Relationships
  addRelationship: (rel: LookupRelationshipDraft) => void;
  updateRelationship: (id: string, patch: Partial<LookupRelationshipDraft>) => void;
  removeRelationship: (id: string) => void;

  // Global choices
  addGlobalChoice: (choice?: GlobalChoiceDraft) => string;
  updateGlobalChoice: (id: string, patch: Partial<GlobalChoiceDraft>) => void;
  removeGlobalChoice: (id: string) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  project: emptyProject(),
  currentStep: 'solution',
  selectedTableId: null,
  hydrated: false,

  setStep: (step) => set({ currentStep: step }),

  hydrate: (project) => {
    const normalized = normalizeProject(project);
    set({
      project: normalized,
      hydrated: true,
      selectedTableId: normalized.tables[0]?.id ?? null,
    });
  },

  markHydrated: () => set({ hydrated: true }),

  reset: () =>
    set({
      project: emptyProject(),
      currentStep: 'solution',
      selectedTableId: null,
    }),

  setSolutionMode: (mode) =>
    set((state) => ({
      project: {
        ...state.project,
        solution: {
          mode,
          draft:
            mode === 'new'
              ? state.project.solution.draft ?? {
                  friendlyName: '',
                  uniqueName: '',
                  version: '1.0.0.0',
                }
              : undefined,
          existing: mode === 'existing' ? state.project.solution.existing : undefined,
        },
      },
    })),

  updateNewSolution: (patch) =>
    set((state) => {
      const current = state.project.solution.draft ?? {
        friendlyName: '',
        uniqueName: '',
        version: '1.0.0.0',
      };
      return {
        project: {
          ...state.project,
          solution: {
            ...state.project.solution,
            mode: 'new',
            draft: { ...current, ...patch },
          },
        },
      };
    }),

  setExistingSolution: (solution) =>
    set((state) => ({
      project: {
        ...state.project,
        solution: { ...state.project.solution, mode: 'existing', existing: solution },
      },
    })),

  addTable: (displayName) => {
    const table = makeTable(displayName);
    set((state) => ({
      project: { ...state.project, tables: [...state.project.tables, table] },
      selectedTableId: table.id,
    }));
    return table.id;
  },

  updateTable: (id, patch) =>
    set((state) => ({
      project: {
        ...state.project,
        tables: state.project.tables.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      },
    })),

  removeTable: (id) =>
    set((state) => {
      const tables = state.project.tables.filter((t) => t.id !== id);
      return {
        project: {
          ...state.project,
          tables,
          relationships: state.project.relationships.filter(
            (r) => r.childTableId !== id && !(r.parent.kind === 'project' && r.parent.tableId === id),
          ),
        },
        selectedTableId:
          state.selectedTableId === id ? tables[0]?.id ?? null : state.selectedTableId,
      };
    }),

  duplicateTable: (id) =>
    set((state) => {
      const source = state.project.tables.find((t) => t.id === id);
      if (!source) return state;
      const copy: EntityDraft = {
        ...source,
        id: newId(),
        displayName: `${source.displayName} Copy`,
        schemaName: `${source.schemaName}Copy`,
        pluralName: `${source.displayName} Copies`,
        fields: source.fields.map((f) => ({ ...f, id: newId() })),
      };
      return {
        project: { ...state.project, tables: [...state.project.tables, copy] },
        selectedTableId: copy.id,
      };
    }),

  selectTable: (id) => set({ selectedTableId: id }),

  addField: (tableId, type = 'text') =>
    set((state) => ({
      project: {
        ...state.project,
        tables: state.project.tables.map((t) =>
          t.id === tableId ? { ...t, fields: [...t.fields, makeField(type)] } : t,
        ),
      },
    })),

  addFields: (tableId, fields) =>
    set((state) => ({
      project: {
        ...state.project,
        tables: state.project.tables.map((t) =>
          t.id === tableId ? { ...t, fields: [...t.fields, ...fields] } : t,
        ),
      },
    })),

  updateField: (tableId, fieldId, patch) =>
    set((state) => ({
      project: {
        ...state.project,
        tables: state.project.tables.map((t) =>
          t.id === tableId
            ? {
                ...t,
                fields: t.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)),
              }
            : t,
        ),
      },
    })),

  removeField: (tableId, fieldId) =>
    set((state) => ({
      project: {
        ...state.project,
        tables: state.project.tables.map((t) =>
          t.id === tableId ? { ...t, fields: t.fields.filter((f) => f.id !== fieldId) } : t,
        ),
      },
    })),

  duplicateField: (tableId, fieldId) =>
    set((state) => ({
      project: {
        ...state.project,
        tables: state.project.tables.map((t) => {
          if (t.id !== tableId) return t;
          const source = t.fields.find((f) => f.id === fieldId);
          if (!source) return t;
          const copy: FieldDraft = {
            ...source,
            id: newId(),
            isPrimaryName: false,
            displayName: `${source.displayName} Copy`,
            schemaName: `${source.schemaName}Copy`,
            options: source.options?.map((o) => ({ ...o, id: newId() })),
          };
          const index = t.fields.findIndex((f) => f.id === fieldId);
          const fields = [...t.fields];
          fields.splice(index + 1, 0, copy);
          return { ...t, fields };
        }),
      },
    })),

  setPrimaryName: (tableId, fieldId) =>
    set((state) => ({
      project: {
        ...state.project,
        tables: state.project.tables.map((t) =>
          t.id === tableId
            ? {
                ...t,
                fields: t.fields.map((f) => ({ ...f, isPrimaryName: f.id === fieldId })),
              }
            : t,
        ),
      },
    })),

  mergeFieldsFromSchema: (tableId, entries) =>
    set((state) => ({
      project: {
        ...state.project,
        tables: state.project.tables.map((t) => {
          if (t.id !== tableId) return t;

          // Resolve global choice references (carried by name in schema JSON) to
          // the project's global choice ids.
          const globalChoiceIdByKey = new Map(
            state.project.globalChoices.map(
              (c) =>
                [
                  (c.schemaName || toPascalToken(c.displayName)).toLowerCase(),
                  c.id,
                ] as const,
            ),
          );
          const resolveGlobalChoice = (field: FieldDraft, name?: string): FieldDraft => {
            if (field.type !== 'globalChoice' || !name) return field;
            const id = globalChoiceIdByKey.get(toPascalToken(name).toLowerCase());
            return id ? { ...field, globalChoiceId: id } : field;
          };

          const existingByKey = new Map(
            t.fields.map((f) => [normalizeFieldSchemaKey(f), f] as const),
          );

          let fields = [...t.fields];
          let primaryFieldId: string | null = null;

          for (const entry of entries) {
            const key = normalizeSchemaKey(entry);
            const existing = existingByKey.get(key);
            if (existing) {
              const updated = resolveGlobalChoice(
                applySchemaEntryToField(existing, entry),
                entry.globalChoiceName,
              );
              fields = fields.map((f) => (f.id === existing.id ? updated : f));
              if (entry.isPrimaryName) primaryFieldId = existing.id;
            } else {
              const created = resolveGlobalChoice(
                schemaEntryToFieldDraft(entry),
                entry.globalChoiceName,
              );
              fields.push(created);
              existingByKey.set(key, created);
              if (entry.isPrimaryName) primaryFieldId = created.id;
            }
          }

          if (primaryFieldId) {
            fields = fields.map((f) => ({ ...f, isPrimaryName: f.id === primaryFieldId }));
          }

          return { ...t, fields };
        }),
      },
    })),

  addRelationship: (rel) =>
    set((state) => ({
      project: { ...state.project, relationships: [...state.project.relationships, rel] },
    })),

  updateRelationship: (id, patch) =>
    set((state) => ({
      project: {
        ...state.project,
        relationships: state.project.relationships.map((r) =>
          r.id === id ? { ...r, ...patch } : r,
        ),
      },
    })),

  removeRelationship: (id) =>
    set((state) => ({
      project: {
        ...state.project,
        relationships: state.project.relationships.filter((r) => r.id !== id),
      },
    })),

  addGlobalChoice: (choice) => {
    const created = choice ?? makeGlobalChoice();
    set((state) => ({
      project: {
        ...state.project,
        globalChoices: [...state.project.globalChoices, created],
      },
    }));
    return created.id;
  },

  updateGlobalChoice: (id, patch) =>
    set((state) => ({
      project: {
        ...state.project,
        globalChoices: state.project.globalChoices.map((c) =>
          c.id === id ? { ...c, ...patch } : c,
        ),
      },
    })),

  removeGlobalChoice: (id) =>
    set((state) => ({
      project: {
        ...state.project,
        globalChoices: state.project.globalChoices.filter((c) => c.id !== id),
        // Clear any column references to the removed global choice.
        tables: state.project.tables.map((t) => ({
          ...t,
          fields: t.fields.map((f) =>
            f.globalChoiceId === id ? { ...f, globalChoiceId: undefined } : f,
          ),
        })),
      },
    })),
}));

// Re-export factories used by components.
export { makeTable };
