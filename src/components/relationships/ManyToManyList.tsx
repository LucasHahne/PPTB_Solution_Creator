import type { ManyToManyRelationshipDraft, TableRef } from '../../types/relationship';
import { useProjectStore } from '../../store/projectStore';
import { COMMON_LOOKUP_TARGETS } from '../../constants/defaults';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export function ManyToManyList({
  onEdit,
}: {
  onEdit: (m2m: ManyToManyRelationshipDraft) => void;
}) {
  const manyToMany = useProjectStore((s) => s.project.manyToMany);
  const tables = useProjectStore((s) => s.project.tables);
  const removeManyToMany = useProjectStore((s) => s.removeManyToMany);

  function sideName(ref: TableRef): string {
    if (ref.kind === 'project') return tables.find((t) => t.id === ref.tableId)?.displayName || 'Untitled';
    return COMMON_LOOKUP_TARGETS.find((t) => t.logicalName === ref.logicalName)?.label ?? ref.logicalName;
  }

  function bridgeName(m2m: ManyToManyRelationshipDraft): string {
    return tables.find((t) => t.id === m2m.bridgeTableId)?.displayName || 'Bridge table';
  }

  if (manyToMany.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-400 dark:border-slate-700">
        No many-to-many relationships yet. Add one to relate two tables through a bridge table.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {manyToMany.map((m2m) => (
        <li
          key={m2m.id}
          className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700"
        >
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge tone="brand">{sideName(m2m.side1)}</Badge>
            <span className="text-slate-400">↔</span>
            <Badge tone="brand">{sideName(m2m.side2)}</Badge>
            <span className="text-slate-400">via</span>
            <Badge tone="neutral">{bridgeName(m2m)}</Badge>
          </div>
          <div className="flex gap-1">
            <Button variant="secondary" size="sm" onClick={() => onEdit(m2m)}>
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => removeManyToMany(m2m.id)}>
              Delete
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
