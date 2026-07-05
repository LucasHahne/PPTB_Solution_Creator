import type { ReactNode } from 'react';
import { Button } from '../ui/Button';

export function StepContainer({
  title,
  description,
  titleActions,
  actions,
  children,
  onBack,
  onNext,
  nextLabel = 'Next',
  nextDisabled,
}: {
  title: string;
  description?: string;
  titleActions?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4 px-5 pt-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h1>
            {titleActions}
          </div>
          {description && (
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

      {(onBack || onNext) && (
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 dark:border-slate-700">
          <div>
            {onBack && (
              <Button variant="secondary" onClick={onBack}>
                Back
              </Button>
            )}
          </div>
          <div>
            {onNext && (
              <Button onClick={onNext} disabled={nextDisabled}>
                {nextLabel}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
