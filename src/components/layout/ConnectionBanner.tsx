import { Badge } from '../ui/Badge';

export function ConnectionBanner({
  connection,
  isLoading,
}: {
  connection: ToolBoxAPI.DataverseConnection | null;
  isLoading: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Solution Creator
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        {isLoading ? (
          <Badge tone="neutral">Checking connection…</Badge>
        ) : connection ? (
          <>
            <Badge tone="success">Connected</Badge>
            <span className="text-slate-600 dark:text-slate-300">
              {connection.name}
            </span>
            <Badge tone="brand">{connection.environment}</Badge>
          </>
        ) : (
          <Badge tone="error">No active connection</Badge>
        )}
      </div>
    </div>
  );
}
