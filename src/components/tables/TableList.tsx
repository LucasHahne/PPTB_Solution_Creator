import { useProjectStore } from '../../store/projectStore';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../ui/cn';

export function TableList() {
  const tables = useProjectStore((s) => s.project.tables);
  const selectedId = useProjectStore((s) => s.selectedTableId);
  const selectTable = useProjectStore((s) => s.selectTable);
  const addTable = useProjectStore((s) => s.addTable);

  return (
    <div className="flex h-full w-56 shrink-0 flex-col border-r border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Tables
        </span>
        <Button size="sm" onClick={() => addTable()}>
          + Add
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {tables.length === 0 ? (
          <p className="px-2 py-4 text-xs text-slate-400">No tables yet.</p>
        ) : (
          <ul className="space-y-1">
            {tables.map((table) => (
              <li key={table.id}>
                <button
                  onClick={() => selectTable(table.id)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm',
                    table.id === selectedId
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                  )}
                >
                  <span className="truncate">{table.displayName || 'Untitled table'}</span>
                  <Badge tone="neutral">{table.fields.length}</Badge>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
