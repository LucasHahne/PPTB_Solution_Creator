import { useCallback, useEffect, useState } from 'react';
import type { PublisherSummary } from '../types/solution';
import { listPublishers } from '../services/publisherService';
import { toErrorMessage } from '../utils/errors';

export function usePublishers(enabled: boolean) {
  const [publishers, setPublishers] = useState<PublisherSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setPublishers(await listPublishers());
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  return { publishers, isLoading, error, refresh };
}
