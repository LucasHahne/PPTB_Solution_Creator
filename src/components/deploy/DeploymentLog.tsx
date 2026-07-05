import { useEffect, useRef } from 'react';
import type { DeploymentLogEntry } from '../../types/project';
import { cn } from '../ui/cn';

const LEVEL_STYLES: Record<DeploymentLogEntry['level'], string> = {
  info: 'text-slate-500 dark:text-slate-400',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-amber-600 dark:text-amber-400',
  error: 'text-red-600 dark:text-red-400',
};

const LEVEL_GLYPH: Record<DeploymentLogEntry['level'], string> = {
  info: '•',
  success: '✓',
  warning: '!',
  error: '✕',
};

export function DeploymentLog({ logs }: { logs: DeploymentLogEntry[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-64 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-900/60">
      {logs.length === 0 ? (
        <p className="text-slate-400">No activity yet.</p>
      ) : (
        logs.map((entry) => (
          <div key={entry.id} className={cn('flex gap-2 py-0.5', LEVEL_STYLES[entry.level])}>
            <span className="shrink-0">{LEVEL_GLYPH[entry.level]}</span>
            <span className="shrink-0 text-slate-400">
              {entry.timestamp.toLocaleTimeString()}
            </span>
            <span className="break-words">{entry.message}</span>
          </div>
        ))
      )}
      <div ref={endRef} />
    </div>
  );
}
