import { useCallback, useEffect, useState } from 'react';
import type { SolutionSummary } from '../types/solution';
import { listSolutions } from '../services/solutionService';
import { toErrorMessage } from '../utils/errors';

export function useSolutions(enabled: boolean) {
  const [solutions, setSolutions] = useState<SolutionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setSolutions(await listSolutions());
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  return { solutions, isLoading, error, refresh };
}
