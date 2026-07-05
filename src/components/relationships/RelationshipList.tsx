import type { LookupRelationshipDraft } from '../../types/relationship';
import { useProjectStore } from '../../store/projectStore';
import { COMMON_LOOKUP_TARGETS } from '../../constants/defaults';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export function RelationshipList({ onEdit }: { onEdit: (rel: LookupRelationshipDraft) => void }) {
  const relationships = useProjectStore((s) => s.project.relationships);
  const tables = useProjectStore((s) => s.project.tables);
  const removeRelationship = useProjectStore((s) => s.removeRelationship);

  function tableName(id: string): string {
    return tables.find((t) => t.id === id)?.displayName || 'Untitled';
  }

  function parentName(rel: LookupRelationshipDraft): string {
    if (rel.parent.kind === 'project') return tableName(rel.parent.tableId);
    const logicalName = rel.parent.logicalName;
    const known = COMMON_LOOKUP_TARGETS.find((t) => t.logicalName === logicalName);
    return known?.label ?? logicalName;
  }

  if (relationships.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-400 dark:border-slate-700">
        No lookups yet. Add a 1:N lookup to relate two tables.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {relationships.map((rel) => (
        <li
          key={rel.id}
          className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700"
        >
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-slate-800 dark:text-slate-100">
              {rel.lookupDisplayName || 'Unnamed lookup'}
            </span>
            <Badge tone="brand">{parentName(rel)}</Badge>
            <span className="text-slate-400">→</span>
            <Badge tone="neutral">{tableName(rel.childTableId)}</Badge>
            {rel.required && <Badge tone="warning">required</Badge>}
          </div>
          <div className="flex gap-1">
            <Button variant="secondary" size="sm" onClick={() => onEdit(rel)}>
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => removeRelationship(rel.id)}>
              Delete
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
