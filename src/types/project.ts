import type { EntityDraft } from './entity';
import type { LookupRelationshipDraft } from './relationship';
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
