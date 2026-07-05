import { useEffect, useRef } from 'react';
import { useProjectStore } from '../store/projectStore';
import { loadDraft, saveDraft } from '../services/settingsService';

/**
 * Loads a saved draft once on mount, then auto-saves the project (debounced)
 * whenever it changes. Keeps work alive across tool tab reloads.
 */
export function useDraftPersistence() {
  const project = useProjectStore((s) => s.project);
  const hydrated = useProjectStore((s) => s.hydrated);
  const hydrate = useProjectStore((s) => s.hydrate);
  const markHydrated = useProjectStore((s) => s.markHydrated);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const draft = await loadDraft();
      if (cancelled) return;
      if (draft && draft.tables) {
        hydrate(draft);
      } else {
        markHydrated();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrate, markHydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void saveDraft(project);
    }, 600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [project, hydrated]);
}
