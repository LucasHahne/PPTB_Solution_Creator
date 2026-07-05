import { useMemo } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useConnection } from '../../hooks/useConnection';
import { useToolboxEvents } from '../../hooks/useToolboxEvents';
import { useDraftPersistence } from '../../hooks/useDraftPersistence';
import { ConnectionBanner } from './ConnectionBanner';
import { WizardNav } from './WizardNav';
import { SolutionStep } from '../solution/SolutionStep';
import { TablesStep } from '../tables/TablesStep';
import { FieldsStep } from '../fields/FieldsStep';
import { RelationshipsStep } from '../relationships/RelationshipsStep';
import { ReviewStep } from '../deploy/ReviewStep';
import { validateProject } from '../../services/validationService';
import type { WizardStep } from '../../types/project';

export function AppShell() {
  const { connection, isLoading, refreshConnection } = useConnection();
  const currentStep = useProjectStore((s) => s.currentStep);
  const setStep = useProjectStore((s) => s.setStep);
  const project = useProjectStore((s) => s.project);
  const hydrated = useProjectStore((s) => s.hydrated);

  useDraftPersistence();
  useToolboxEvents((event) => {
    if (event === 'connection:created' || event === 'connection:updated' || event === 'connection:deleted') {
      void refreshConnection();
    }
  });

  const errorSteps = useMemo(() => {
    const set = new Set<WizardStep>();
    for (const issue of validateProject(project)) {
      if (issue.severity === 'error') set.add(issue.step);
    }
    return set;
  }, [project]);

  function goNext(next: WizardStep) {
    setStep(next);
  }

  if (!hydrated) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <ConnectionBanner connection={connection} isLoading={isLoading} />
      <WizardNav current={currentStep} onSelect={setStep} errorSteps={errorSteps} />

      <div className="min-h-0 flex-1">
        {currentStep === 'solution' && <SolutionStep onNext={() => goNext('tables')} />}
        {currentStep === 'tables' && (
          <TablesStep onBack={() => goNext('solution')} onNext={() => goNext('fields')} />
        )}
        {currentStep === 'fields' && (
          <FieldsStep onBack={() => goNext('tables')} onNext={() => goNext('relationships')} />
        )}
        {currentStep === 'relationships' && (
          <RelationshipsStep onBack={() => goNext('fields')} onNext={() => goNext('review')} />
        )}
        {currentStep === 'review' && (
          <ReviewStep onBack={() => goNext('relationships')} hasConnection={!!connection} />
        )}
      </div>
    </div>
  );
}
