import { useState } from 'react';
import type { SolutionSummary } from '../../types/solution';
import { useSolutions } from '../../hooks/useSolutions';
import { getSolutionPrefix } from '../../services/publisherService';
import { useProjectStore } from '../../store/projectStore';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import { toErrorMessage } from '../../utils/errors';

export function ExistingSolutionPicker({ enabled }: { enabled: boolean }) {
  const { solutions, isLoading, error, refresh } = useSolutions(enabled);
  const existing = useProjectStore((s) => s.project.solution.existing);
  const setExistingSolution = useProjectStore((s) => s.setExistingSolution);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  async function handleSelect(solution: SolutionSummary | undefined) {
    if (!solution) {
      setExistingSolution(undefined);
      return;
    }
    setResolving(true);
    setResolveError(null);
    try {
      const prefix = (await getSolutionPrefix(solution.uniquename)) ?? '';
      setExistingSolution({ ...solution, prefix });
    } catch (err) {
      setResolveError(toErrorMessage(err));
      setExistingSolution({ ...solution, prefix: '' });
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
            Unmanaged solution
          </label>
          <Select
            value={existing?.solutionid ?? ''}
            disabled={isLoading}
            onChange={(e) =>
              handleSelect(solutions.find((s) => s.solutionid === e.target.value))
            }
          >
            <option value="">{isLoading ? 'Loading…' : 'Select a solution…'}</option>
            {solutions.map((s) => (
              <option key={s.solutionid} value={s.solutionid}>
                {s.friendlyname} ({s.uniquename}) v{s.version}
              </option>
            ))}
          </Select>
        </div>
        <Button variant="secondary" onClick={() => void refresh()} disabled={isLoading}>
          Refresh
        </Button>
      </div>

      {error && <Alert tone="error" title="Could not load solutions">{error}</Alert>}
      {resolveError && (
        <Alert tone="warning" title="Could not resolve publisher prefix">{resolveError}</Alert>
      )}

      {existing && (
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span>Publisher prefix:</span>
          {resolving ? (
            <Badge tone="neutral">resolving…</Badge>
          ) : existing.prefix ? (
            <Badge tone="brand">{existing.prefix}_</Badge>
          ) : (
            <Badge tone="warning">unknown</Badge>
          )}
        </div>
      )}
    </div>
  );
}
