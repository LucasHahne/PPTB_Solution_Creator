import type { ReactNode } from 'react';
import { cn } from './cn';

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'error';

const tones: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200',
  brand: 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-200',
  success: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200',
  error: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
