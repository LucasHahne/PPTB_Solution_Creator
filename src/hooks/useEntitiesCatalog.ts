import { useCallback, useEffect, useState } from 'react';
import { toErrorMessage } from '../utils/errors';

export interface CatalogEntity {
  logicalName: string;
  displayName: string;
}

/**
 * Load the environment's tables so they can be offered as lookup parents.
 * Falls back gracefully when metadata cannot be read.
 */
export function useEntitiesCatalog(enabled: boolean) {
  const [entities, setEntities] = useState<CatalogEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await window.dataverseAPI.getAllEntitiesMetadata([
        'LogicalName',
        'DisplayName',
        'IsCustomizable',
      ]);
      const mapped = result.value
        .map((meta) => {
          const display =
            meta.DisplayName?.LocalizedLabels?.[0]?.Label ?? meta.LogicalName;
          return { logicalName: meta.LogicalName, displayName: String(display) };
        })
        .filter((e) => e.displayName && e.logicalName)
        .sort((a, b) => a.displayName.localeCompare(b.displayName));
      setEntities(mapped);
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  return { entities, isLoading, error, refresh };
}
