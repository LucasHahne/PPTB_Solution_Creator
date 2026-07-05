import type { WizardStep } from '../../types/project';
import { WIZARD_STEPS } from '../../types/project';
import { cn } from '../ui/cn';

const STEP_LABELS: Record<WizardStep, string> = {
  solution: 'Solution',
  tables: 'Tables',
  fields: 'Fields',
  relationships: 'Lookups',
  review: 'Review & Deploy',
};

export function WizardNav({
  current,
  onSelect,
  errorSteps,
}: {
  current: WizardStep;
  onSelect: (step: WizardStep) => void;
  errorSteps: Set<WizardStep>;
}) {
  return (
    <nav className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60">
      {WIZARD_STEPS.map((step, index) => {
        const active = step === current;
        const hasError = errorSteps.has(step);
        return (
          <button
            key={step}
            onClick={() => onSelect(step)}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-brand-600 text-white'
                : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700',
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-xs',
                active ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700',
              )}
            >
              {index + 1}
            </span>
            {STEP_LABELS[step]}
            {hasError && !active && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
          </button>
        );
      })}
    </nav>
  );
}
