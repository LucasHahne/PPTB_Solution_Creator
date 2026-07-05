import { useProjectStore } from '../../store/projectStore';
import { StepContainer } from '../layout/StepContainer';
import { SolutionModeToggle } from './SolutionModeToggle';
import { ExistingSolutionPicker } from './ExistingSolutionPicker';
import { NewSolutionForm } from './NewSolutionForm';
import { issuesForStep, validateProject } from '../../services/validationService';
import { StepIssues } from '../shared/StepIssues';

export function SolutionStep({ onNext }: { onNext: () => void }) {
  const project = useProjectStore((s) => s.project);
  const setSolutionMode = useProjectStore((s) => s.setSolutionMode);
  const mode = project.solution.mode;

  const issues = issuesForStep(validateProject(project), 'solution');
  const blocking = issues.some((i) => i.severity === 'error');

  return (
    <StepContainer
      title="Choose a solution"
      description="Create a brand-new solution and publisher, or target one you already have."
      onNext={onNext}
      nextDisabled={blocking}
    >
      <div className="space-y-6">
        <SolutionModeToggle mode={mode} onChange={setSolutionMode} />

        {mode === 'new' ? (
          <NewSolutionForm enabled={mode === 'new'} />
        ) : (
          <ExistingSolutionPicker enabled={mode === 'existing'} />
        )}

        <StepIssues issues={issues} />
      </div>
    </StepContainer>
  );
}
