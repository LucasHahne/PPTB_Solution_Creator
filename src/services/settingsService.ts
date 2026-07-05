import { DRAFT_SETTINGS_KEY } from '../constants/defaults';
import type { SolutionProject } from '../types/project';

/** Load a previously saved draft project, or null if none exists. */
export async function loadDraft(): Promise<SolutionProject | null> {
  try {
    const value = await window.toolboxAPI.settings.get(DRAFT_SETTINGS_KEY);
    return (value as SolutionProject) ?? null;
  } catch {
    return null;
  }
}

/** Persist the current draft project. Failures are swallowed (best-effort). */
export async function saveDraft(project: SolutionProject): Promise<void> {
  try {
    await window.toolboxAPI.settings.set(DRAFT_SETTINGS_KEY, project);
  } catch {
    // Ignore — drafts are a convenience, not critical state.
  }
}

/** Remove the saved draft (e.g. after a successful deployment). */
export async function clearDraft(): Promise<void> {
  try {
    await window.toolboxAPI.settings.set(DRAFT_SETTINGS_KEY, null);
  } catch {
    // Ignore.
  }
}
