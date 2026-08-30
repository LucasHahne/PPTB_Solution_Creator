import type { OptionDraft } from './field';

/**
 * A project-level global option set (global choice). It is created once during
 * deployment and can be referenced by any number of "Choice (global)" columns.
 */
export interface GlobalChoiceDraft {
  id: string;
  displayName: string;
  /** Schema name without the publisher prefix (prefix is applied at build time). */
  schemaName: string;
  description?: string;
  options: OptionDraft[];
  /**
   * True when this choice was auto-created as a placeholder while importing a
   * column schema that referenced a global choice the project didn't define yet.
   * It carries default options that the user should review; the flag clears once
   * the options are edited in the Global choices manager.
   */
  isPlaceholder?: boolean;
}
