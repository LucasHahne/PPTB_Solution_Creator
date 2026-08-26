import type { EntityDraft } from './entity';
import type { GlobalChoiceDraft } from './globalChoice';
import type { LookupRelationshipDraft, ManyToManyRelationshipDraft } from './relationship';
import type { SolutionTarget } from './solution';

export type WizardStep = 'solution' | 'tables' | 'fields' | 'relationships' | 'review';

export const WIZARD_STEPS: WizardStep[] = [
  'solution',
  'tables',
  'fields',
  'relationships',
  'review',
];

/** The full in-progress design. Persisted to toolboxAPI.settings as a draft. */
export interface SolutionProject {
  solution: SolutionTarget;
  tables: EntityDraft[];
  relationships: LookupRelationshipDraft[];
  /** Many-to-many relationships, each backed by an auto-managed bridge table. */
  manyToMany: ManyToManyRelationshipDraft[];
  /** Project-level global option sets referenced by "Choice (global)" columns. */
  globalChoices: GlobalChoiceDraft[];
}

export type DeploymentStatus =
  | 'idle'
  | 'running'
  | 'success'
  | 'partial'
  | 'error';

export type LogLevel = 'info' | 'success' | 'warning' | 'error';

export interface DeploymentLogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
}
