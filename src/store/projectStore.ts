import { create } from 'zustand';
import type { SolutionProject, WizardStep } from '../types/project';
import type { EntityDraft } from '../types/entity';
import type { FieldDraft, FieldType } from '../types/field';
import type { GlobalChoiceDraft } from '../types/globalChoice';
import type {
  BridgeLookupConfig,
  LookupRelationshipDraft,
  ManyToManyRelationshipDraft,
  TableRef,
} from '../types/relationship';
import type { NewSolutionDraft, SolutionSummary } from '../types/solution';
import type { ColumnSchemaEntry } from '../types/columnSchema';
import {
  applySchemaEntryToField,
  normalizeFieldSchemaKey,
  normalizeSchemaKey,
  schemaEntryToFieldDraft,
} from '../utils/columnSchema';
import { newId } from '../utils/ids';
import { COMMON_LOOKUP_TARGETS } from '../constants/defaults';
import { FIELD_TYPE_CONFIGS } from '../constants/fieldTypes';
import { buildBridgeSchemaToken, toPascalToken } from '../services/namingService';
import { getProjectPrefix } from '../services/validationService';

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
    manyToMany: [],
    globalChoices: [],
  };
}

/** Normalize a loaded draft so newer optional collections are always present. */
function normalizeProject(project: SolutionProject): SolutionProject {
  return {
    ...project,
    relationships: project.relationships ?? [],
    manyToMany: project.manyToMany ?? [],
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

/**
 * A fresh autonumber primary-name field for a bridge table. The column mirrors
 * the bridge table's name (e.g. display "BRIDGE Order Product", schema
 * "BRIDGEOrderProduct") so the primary name reads meaningfully; the schema name
 * is sanitized to alphanumerics like every other column. The value is still an
 * autonumber using the BRIDGE-{SEQNUM:6} format.
 */
function bridgePrimaryField(displayName: string): FieldDraft {
  return {
    id: newId(),
    type: 'autonumber',
    displayName,
    schemaName: toPascalToken(displayName),
    requiredLevel: 'ApplicationRequired',
    isPrimaryName: true,
    maxLength: 100,
    autoNumberFormat: 'BRIDGE-{SEQNUM:6}',
  };
}

/** Human-readable label for a table reference, used to derive bridge names. */
function tableRefLabel(tables: EntityDraft[], ref: TableRef): string {
  if (ref.kind === 'project') {
    return tables.find((t) => t.id === ref.tableId)?.displayName || 'Table';
  }
  const known = COMMON_LOOKUP_TARGETS.find((t) => t.logicalName === ref.logicalName);
  return known?.label ?? ref.logicalName;
}

/** Schema token for a side, used to compose the bridge schema name. */
function tableRefToken(tables: EntityDraft[], ref: TableRef): string {
  if (ref.kind === 'project') {
    const table = tables.find((t) => t.id === ref.tableId);
    return table?.schemaName || toPascalToken(table?.displayName ?? 'Table');
  }
  const known = COMMON_LOOKUP_TARGETS.find((t) => t.logicalName === ref.logicalName);
  return toPascalToken(known?.label ?? ref.logicalName);
}

/** Build the two default bridge lookup configs for a pair of sides. */
function defaultBridgeLookups(
  labelA: string,
  labelB: string,
): { side1Lookup: BridgeLookupConfig; side2Lookup: BridgeLookupConfig } {
  // Disambiguate when both sides resolve to the same label (self-referential M:N).
  const sameLabel = labelA.trim().toLowerCase() === labelB.trim().toLowerCase();
  const nameA = sameLabel ? `${labelA} 1` : labelA;
  const nameB = sameLabel ? `${labelB} 2` : labelB;
  return {
    side1Lookup: {
      displayName: nameA,
      schemaName: toPascalToken(nameA),
      required: true,
      cascadeDelete: 'Cascade',
    },
    side2Lookup: {
      displayName: nameB,
      schemaName: toPascalToken(nameB),
      required: true,
      cascadeDelete: 'Cascade',
    },
  };
}

/** Create a bridge table draft for a many-to-many relationship. */
function makeBridgeTable(
  labelA: string,
  labelB: string,
  schemaToken: string,
  relationshipId: string,
): EntityDraft {
  const displayName = `BRIDGE ${labelA} ${labelB}`;
  return {
    id: newId(),
    displayName,
    pluralName: `${displayName}s`,
    schemaName: schemaToken,
    ownershipType: 'UserOwned',
    hasActivities: false,
    hasNotes: false,
    fields: [bridgePrimaryField(displayName)],
    bridge: { relationshipId },
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

  // Relationships (1:N lookups)
  addRelationship: (rel: LookupRelationshipDraft) => void;
  updateRelationship: (id: string, patch: Partial<LookupRelationshipDraft>) => void;
  removeRelationship: (id: string) => void;

  // Many-to-many relationships (bridge tables)
  addManyToMany: (side1: TableRef, side2: TableRef) => string;
  updateManyToMany: (id: string, patch: Partial<ManyToManyRelationshipDraft>) => void;
  removeManyToMany: (id: string) => void;

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
        tables: state.project.tables.map((t) => {
          if (t.id !== id) return t;
          const updated = { ...t, ...patch };
          // For bridge tables, keep the autonumber primary-name column in sync
          // when the table is renamed (schema sanitized to alphanumerics).
          if (updated.bridge && patch.displayName !== undefined) {
            updated.fields = updated.fields.map((f) =>
              f.isPrimaryName
                ? { ...f, displayName: updated.displayName, schemaName: toPascalToken(updated.displayName) }
                : f,
            );
          }
          return updated;
        }),
      },
    })),

  removeTable: (id) =>
    set((state) => {
      const referencesTable = (ref: TableRef) => ref.kind === 'project' && ref.tableId === id;

      // Many-to-many relationships to drop: those referencing this table as a
      // side, or whose bridge table is the one being removed.
      const removedM2M = state.project.manyToMany.filter(
        (m) => referencesTable(m.side1) || referencesTable(m.side2) || m.bridgeTableId === id,
      );
      const removedM2MIds = new Set(removedM2M.map((m) => m.id));
      // Bridge tables that must disappear along with their relationships.
      const removedBridgeTableIds = new Set(removedM2M.map((m) => m.bridgeTableId));
      removedBridgeTableIds.add(id);

      const tables = state.project.tables.filter((t) => !removedBridgeTableIds.has(t.id));

      return {
        project: {
          ...state.project,
          tables,
          relationships: state.project.relationships.filter(
            (r) => r.childTableId !== id && !(r.parent.kind === 'project' && r.parent.tableId === id),
          ),
          manyToMany: state.project.manyToMany.filter((m) => !removedM2MIds.has(m.id)),
        },
        selectedTableId: removedBridgeTableIds.has(state.selectedTableId ?? '')
          ? tables[0]?.id ?? null
          : state.selectedTableId,
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
        // A duplicated bridge table is a standalone table, not tied to any M:N.
        bridge: undefined,
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
    set((state) => {
      // Global choices created on the fly for referenced-but-undefined names.
      const newGlobalChoices: GlobalChoiceDraft[] = [];

      // Normalized-key -> id map of existing plus newly created global choices.
      const gcKey = (name: string) => toPascalToken(name).toLowerCase();
      const globalChoiceIdByKey = new Map(
        state.project.globalChoices.map(
          (c) => [gcKey(c.schemaName || c.displayName), c.id] as const,
        ),
      );

      // Bind a "Choice (global)" column to a project global choice, creating a
      // placeholder choice (with default options) if the project doesn't define
      // one for that name yet. This keeps pasted global-choice columns bound to a
      // real choice instead of dangling until the user opens the Global choices
      // manager — the placeholder can then be refined there before deploy.
      const ensureGlobalChoiceId = (name: string): string => {
        const key = gcKey(name);
        const existingId = globalChoiceIdByKey.get(key);
        if (existingId) return existingId;
        const created: GlobalChoiceDraft = { ...makeGlobalChoice(name), isPlaceholder: true };
        newGlobalChoices.push(created);
        globalChoiceIdByKey.set(key, created.id);
        return created.id;
      };

      const resolveGlobalChoice = (field: FieldDraft, name?: string): FieldDraft => {
        if (field.type !== 'globalChoice' || !name?.trim()) return field;
        return { ...field, globalChoiceId: ensureGlobalChoiceId(name) };
      };

      const tables = state.project.tables.map((t) => {
        if (t.id !== tableId) return t;

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
      });

      return {
        project: {
          ...state.project,
          tables,
          globalChoices: [...state.project.globalChoices, ...newGlobalChoices],
        },
      };
    }),

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

  addManyToMany: (side1, side2) => {
    const relationshipId = newId();
    let createdId = relationshipId;
    set((state) => {
      const { tables } = state.project;
      const prefix = getProjectPrefix(state.project) ?? 'new';
      const labelA = tableRefLabel(tables, side1);
      const labelB = tableRefLabel(tables, side2);
      const schemaToken = buildBridgeSchemaToken(
        prefix,
        tableRefToken(tables, side1),
        tableRefToken(tables, side2),
      );
      const bridge = makeBridgeTable(labelA, labelB, schemaToken, relationshipId);
      const { side1Lookup, side2Lookup } = defaultBridgeLookups(labelA, labelB);

      const m2m: ManyToManyRelationshipDraft = {
        id: relationshipId,
        side1,
        side2,
        bridgeTableId: bridge.id,
        side1Lookup,
        side2Lookup,
      };
      createdId = relationshipId;

      return {
        project: {
          ...state.project,
          tables: [...state.project.tables, bridge],
          manyToMany: [...state.project.manyToMany, m2m],
        },
      };
    });
    return createdId;
  },

  updateManyToMany: (id, patch) =>
    set((state) => {
      const existing = state.project.manyToMany.find((m) => m.id === id);
      if (!existing) return state;
      const next: ManyToManyRelationshipDraft = { ...existing, ...patch };

      const prefix = getProjectPrefix(state.project) ?? 'new';
      const sidesChanged =
        patch.side1 !== undefined || patch.side2 !== undefined;

      // Re-derive bridge table naming and default lookups when a side changes,
      // unless the user has manually edited the bridge name.
      let tables = state.project.tables;
      if (sidesChanged) {
        const labelA = tableRefLabel(state.project.tables, next.side1);
        const labelB = tableRefLabel(state.project.tables, next.side2);

        if (!next.nameTouched) {
          const schemaToken = buildBridgeSchemaToken(
            prefix,
            tableRefToken(state.project.tables, next.side1),
            tableRefToken(state.project.tables, next.side2),
          );
          const displayName = `BRIDGE ${labelA} ${labelB}`;
          tables = tables.map((t) =>
            t.id === next.bridgeTableId
              ? {
                  ...t,
                  displayName,
                  pluralName: `${displayName}s`,
                  schemaName: schemaToken,
                  // Keep the autonumber primary-name column in sync with the
                  // bridge table name (schema sanitized to alphanumerics).
                  fields: t.fields.map((f) =>
                    f.isPrimaryName
                      ? { ...f, displayName, schemaName: toPascalToken(displayName) }
                      : f,
                  ),
                }
              : t,
          );
        }

        // Only reset the lookup configs the caller did not explicitly provide.
        const defaults = defaultBridgeLookups(labelA, labelB);
        if (patch.side1Lookup === undefined) next.side1Lookup = defaults.side1Lookup;
        if (patch.side2Lookup === undefined) next.side2Lookup = defaults.side2Lookup;
      }

      return {
        project: {
          ...state.project,
          tables,
          manyToMany: state.project.manyToMany.map((m) => (m.id === id ? next : m)),
        },
      };
    }),

  removeManyToMany: (id) =>
    set((state) => {
      const m2m = state.project.manyToMany.find((m) => m.id === id);
      const bridgeId = m2m?.bridgeTableId;
      const tables = bridgeId
        ? state.project.tables.filter((t) => t.id !== bridgeId)
        : state.project.tables;
      return {
        project: {
          ...state.project,
          tables,
          manyToMany: state.project.manyToMany.filter((m) => m.id !== id),
        },
        selectedTableId:
          bridgeId && state.selectedTableId === bridgeId
            ? tables[0]?.id ?? null
            : state.selectedTableId,
      };
    }),

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
