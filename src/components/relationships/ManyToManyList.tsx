import type { ManyToManyRelationshipDraft } from '../../types/relationship';
import { useProjectStore } from '../../store/projectStore';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export function ManyToManyList({
  onEdit,
}: {
  onEdit: (rel: ManyToManyRelationshipDraft) => void;
}) {
  const items = useProjectStore((s) => s.project.manyToManyRelationships);
  const tables = useProjectStore((s) => s.project.tables);
  const removeManyToMany = useProjectStore((s) => s.removeManyToMany);

  function tableName(id: string): string {
    return tables.find((t) => t.id === id)?.displayName || 'Untitled';
  }

  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-400 dark:border-slate-700">
        No M:N relationships yet. Add a bridge between two project tables.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((mn) => (
        <li
          key={mn.id}
          className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700"
        >
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge tone="success">M:N</Badge>
            <span className="font-medium text-slate-800 dark:text-slate-100">
              {mn.bridgeDisplayName || 'Unnamed bridge'}
            </span>
            <Badge tone="brand">{tableName(mn.leftTableId)}</Badge>
            <span className="text-slate-400">↔</span>
            <Badge tone="neutral">{tableName(mn.rightTableId)}</Badge>
            <span className="font-mono text-xs text-slate-400">{mn.bridgeSchemaName}</span>
          </div>
          <div className="flex gap-1">
            <Button variant="secondary" size="sm" onClick={() => onEdit(mn)}>
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => removeManyToMany(mn.id)}>
              Delete
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
