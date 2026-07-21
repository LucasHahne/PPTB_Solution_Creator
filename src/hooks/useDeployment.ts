import { useCallback, useState } from 'react';
import type { DeploymentLogEntry, DeploymentStatus, LogLevel, SolutionProject } from '../types/project';
import { deployProject } from '../services/deploymentOrchestrator';
import { clearDraft } from '../services/settingsService';
import { newId } from '../utils/ids';

export function useDeployment() {
  const [status, setStatus] = useState<DeploymentStatus>('idle');
  const [logs, setLogs] = useState<DeploymentLogEntry[]>([]);

  const appendLog = useCallback((level: LogLevel, message: string) => {
    setLogs((prev) => [
      ...prev,
      { id: newId(), timestamp: new Date(), level, message },
    ]);
  }, []);

  const run = useCallback(
    async (project: SolutionProject) => {
      setStatus('running');
      setLogs([]);
      appendLog('info', 'Starting deployment…');

      const result = await deployProject(project, appendLog);
      setStatus(result.status);

      if (result.status === 'success') {
        appendLog(
          'success',
          `Done. Created ${result.createdTables} table(s), ${result.createdColumns} column(s), ${result.createdRelationships} lookup(s), ${result.createdGlobalChoices} global choice(s).`,
        );
        await clearDraft();
        await notify('success', 'Deployment complete', 'Your solution schema is ready.');
      } else if (result.status === 'partial') {
        await notify('warning', 'Deployment incomplete', 'Some items were created before an error occurred. Review the log.');
      } else {
        await notify('error', 'Deployment failed', 'No changes could be applied. Review the log.');
      }

      return result;
    },
    [appendLog],
  );

  return { status, logs, run };
}

async function notify(
  type: 'success' | 'warning' | 'error',
  title: string,
  body: string,
) {
  try {
    await window.toolboxAPI.utils.showNotification({ title, body, type, duration: 5000 });
  } catch {
    // Notifications are best-effort.
  }
}
