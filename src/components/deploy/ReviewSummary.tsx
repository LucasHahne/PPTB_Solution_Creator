import { useProjectStore } from '../../store/projectStore';
import { COMMON_LOOKUP_TARGETS } from '../../constants/defaults';
import { FIELD_TYPE_CONFIGS } from '../../constants/fieldTypes';
import { getProjectPrefix } from '../../services/validationService';
import { Badge } from '../ui/Badge';
import type { LookupRelationshipDraft } from '../../types/relationship';

export function ReviewSummary() {
  const project = useProjectStore((s) => s.project);
  const prefix = getProjectPrefix(project) ?? '...';
  const { solution } = project;

  function tableName(id: string) {
    return project.tables.find((t) => t.id === id)?.displayName || 'Untitled';
  }

  function parentName(rel: LookupRelationshipDraft) {
    if (rel.parent.kind === 'project') return tableName(rel.parent.tableId);
    const logicalName = rel.parent.logicalName;
    return COMMON_LOOKUP_TARGETS.find((t) => t.logicalName === logicalName)?.label ?? logicalName;
  }

  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Solution
        </h3>
        <div className="mt-1 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          {solution.mode === 'new' ? (
            <>
              <Badge tone="brand">New</Badge>
              <span>{solution.draft?.friendlyName || '(unnamed)'}</span>
              <span className="text-slate-400">prefix {prefix}_</span>
            </>
          ) : (
            <>
              <Badge tone="neutral">Existing</Badge>
              <span>{solution.existing?.friendlyname}</span>
              <span className="text-slate-400">prefix {prefix}_</span>
            </>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Tables ({project.tables.length})
        </h3>
        <ul className="mt-2 space-y-3">
          {project.tables.map((table) => (
            <li key={table.id} className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {table.displayName || 'Untitled'}
                </span>
                <span className="text-xs text-slate-400">
                  {prefix}_{table.schemaName.toLowerCase()}
                </span>
                <Badge tone="neutral">{table.fields.length} columns</Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {table.fields.map((field) => (
                  <span
                    key={field.id}
                    className="inline-flex items-center gap-1 rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300"
                  >
                    {field.isPrimaryName && <span className="text-brand-500">★</span>}
                    {field.displayName || '(unnamed)'}
                    <span className="text-slate-400">{FIELD_TYPE_CONFIGS[field.type].label}</span>
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {project.globalChoices.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Global choices ({project.globalChoices.length})
          </h3>
          <ul className="mt-2 space-y-1.5">
            {project.globalChoices.map((choice) => (
              <li key={choice.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <span className="font-medium">{choice.displayName || '(unnamed)'}</span>
                <span className="text-xs text-slate-400">
                  {prefix}_{choice.schemaName.toLowerCase()}
                </span>
                <Badge tone="neutral">{choice.options.length} options</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      {project.relationships.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Lookups ({project.relationships.length})
          </h3>
          <ul className="mt-2 space-y-1.5">
            {project.relationships.map((rel) => (
              <li key={rel.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <span className="font-medium">{rel.lookupDisplayName}</span>
                <Badge tone="brand">{parentName(rel)}</Badge>
                <span className="text-slate-400">→</span>
                <Badge tone="neutral">{tableName(rel.childTableId)}</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
