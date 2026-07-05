import { DEFAULT_LANGUAGE_CODE } from '../constants/defaults';

/**
 * Build a plain, structured-clone-safe Label object for metadata payloads.
 *
 * We intentionally do NOT use `dataverseAPI.buildLabel()` here: its return value
 * is produced by the host and, when embedded in a metadata payload and sent back
 * across the iframe/IPC boundary, can fail structured cloning ("An object could
 * not be cloned"). A plain object literal always clones cleanly.
 */
export function makeLabel(text: string, languageCode: number = DEFAULT_LANGUAGE_CODE) {
  return {
    LocalizedLabels: [{ Label: text, LanguageCode: languageCode }],
  };
}
