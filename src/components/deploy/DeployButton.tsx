import type { DeploymentStatus } from '../../types/project';
import { Button } from '../ui/Button';

export function DeployButton({
  status,
  disabled,
  onDeploy,
}: {
  status: DeploymentStatus;
  disabled: boolean;
  onDeploy: () => void;
}) {
  const running = status === 'running';
  const label =
    status === 'success'
      ? 'Deployed'
      : status === 'running'
        ? 'Deploying…'
        : status === 'partial' || status === 'error'
          ? 'Retry deployment'
          : 'Deploy to Dataverse';

  return (
    <Button onClick={onDeploy} disabled={disabled || running || status === 'success'}>
      {label}
    </Button>
  );
}
