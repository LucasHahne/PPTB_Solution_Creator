import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  listGlobalOptionSets,
  type GlobalOptionSetSummary,
} from '../services/metadataService';
import { toErrorMessage } from '../utils/errors';

/**
 * Load the global option sets that already exist in the environment so the tool
 * can reuse them instead of trying to create a second one with the same name.
 * Falls back gracefully when metadata cannot be read.
 */
export function useGlobalChoicesCatalog(enabled: boolean) {
  const [optionSets, setOptionSets] = useState<GlobalOptionSetSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setOptionSets(await listGlobalOptionSets());
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  /** Lowercased prefixed names, for collision checks against project drafts. */
  const names = useMemo(
    () => new Set(optionSets.map((o) => o.name)),
    [optionSets],
  );

  return { optionSets, names, isLoading, error, refresh };
}
