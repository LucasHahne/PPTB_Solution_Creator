import type { SolutionMode } from '../../types/solution';
import { cn } from '../ui/cn';

const MODES: { value: SolutionMode; label: string; hint: string }[] = [
  { value: 'new', label: 'Create new solution', hint: 'Set up a new publisher and solution.' },
  { value: 'existing', label: 'Use existing solution', hint: 'Add tables to a solution you already have.' },
];

export function SolutionModeToggle({
  mode,
  onChange,
}: {
  mode: SolutionMode;
  onChange: (mode: SolutionMode) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {MODES.map((m) => {
        const active = m.value === mode;
        return (
          <button
            key={m.value}
            onClick={() => onChange(m.value)}
            className={cn(
              'rounded-lg border p-4 text-left transition-colors',
              active
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
            )}
          >
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{m.label}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{m.hint}</p>
          </button>
        );
      })}
    </div>
  );
}
