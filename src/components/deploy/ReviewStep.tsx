import { useEffect } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { StepContainer } from '../layout/StepContainer';
import { ReviewSummary } from './ReviewSummary';
import { DeploymentLog } from './DeploymentLog';
import { DeployButton } from './DeployButton';
import { StepIssues } from '../shared/StepIssues';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { hasBlockingIssues, validateProject } from '../../services/validationService';
import { ensureProjectGlobalChoices } from '../../utils/globalChoiceEnsure';
import { useDeployment } from '../../hooks/useDeployment';
import { useGlobalChoicesCatalog } from '../../hooks/useGlobalChoicesCatalog';

export function ReviewStep({
  onBack,
  hasConnection,
}: {
  onBack: () => void;
  hasConnection: boolean;
}) {
  const project = useProjectStore((s) => s.project);
  const reset = useProjectStore((s) => s.reset);
  const setStep = useProjectStore((s) => s.setStep);
  const { status, logs, run } = useDeployment();
  const { names: existingGlobalChoiceNames } =
    useGlobalChoicesCatalog(hasConnection);

  useEffect(() => {
    const next = ensureProjectGlobalChoices(project);
    if (next !== project) {
      useProjectStore.setState({ project: next });
    }
  }, [project]);

  const issues = validateProject(project, existingGlobalChoiceNames);
  const blocking = hasBlockingIssues(issues);
  const canDeploy = hasConnection && !blocking;

  function startOver() {
    reset();
    setStep('solution');
  }

  return (
    <StepContainer
      title="Review & deploy"
      description="Confirm the schema below, then deploy it to your environment."
      onBack={status === 'running' ? undefined : onBack}
      actions={
        status === 'success' ? (
          <Button variant="secondary" onClick={startOver}>
            Start new solution
          </Button>
        ) : (
          <DeployButton status={status} disabled={!canDeploy} onDeploy={() => void run(project)} />
        )
      }
    >
      <div className="space-y-5">
        {!hasConnection && (
          <StepIssues
            issues={[{ step: 'review', severity: 'error', message: 'No active Dataverse connection.' }]}
          />
        )}
        <StepIssues issues={issues} />

        {status !== 'idle' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Deployment
              </span>
              {status === 'running' && <Badge tone="brand">running</Badge>}
              {status === 'success' && <Badge tone="success">complete</Badge>}
              {status === 'partial' && <Badge tone="warning">partial</Badge>}
              {status === 'error' && <Badge tone="error">failed</Badge>}
            </div>
            <DeploymentLog logs={logs} />
          </div>
        )}

        <ReviewSummary />
      </div>
    </StepContainer>
  );
}
