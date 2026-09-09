import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import { Input } from '../ui/Input';
import { cn } from '../ui/cn';
import { OptionSetEditor } from './OptionSetEditor';
import { useProjectStore } from '../../store/projectStore';
import { useGlobalChoicesCatalog } from '../../hooks/useGlobalChoicesCatalog';
import { getProjectPrefix } from '../../services/validationService';
import { globalChoiceName } from '../../builders/globalChoiceBuilder';
import { sanitizeSchemaToken, toPascalToken } from '../../services/namingService';
import type { GlobalChoiceDraft } from '../../types/globalChoice';

export function GlobalChoiceManagerDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const project = useProjectStore((s) => s.project);
  const globalChoices = project.globalChoices;
  const addGlobalChoice = useProjectStore((s) => s.addGlobalChoice);
  const updateGlobalChoice = useProjectStore((s) => s.updateGlobalChoice);
  const removeGlobalChoice = useProjectStore((s) => s.removeGlobalChoice);
  const resolvedPrefix = getProjectPrefix(project);
  const prefix = resolvedPrefix ?? '...';
  const { names: existingNames, isLoading } = useGlobalChoicesCatalog(open);

  // A single global choice stays open; past that the list gets long, so each one
  // collapses to a summary row.
  const collapsible = globalChoices.length > 1;
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addAndExpand() {
    const id = addGlobalChoice();
    setExpandedIds((prev) => new Set(prev).add(id));
  }

  /**
   * The environment already owns a global choice with this name, so the tool
   * cannot create a second one — deploy reuses the existing option set instead.
   */
  function existingName(choice: GlobalChoiceDraft): string | null {
    if (!resolvedPrefix || !sanitizeSchemaToken(choice.schemaName)) return null;
    const name = globalChoiceName(resolvedPrefix, choice);
    return existingNames.has(name) ? name : null;
  }

  function handleDisplayNameChange(choice: GlobalChoiceDraft, displayName: string) {
    const patch: Partial<GlobalChoiceDraft> = { displayName };
    if (
      choice.schemaName === '' ||
      choice.schemaName === toPascalToken(choice.displayName)
    ) {
      patch.schemaName = toPascalToken(displayName);
    }
    updateGlobalChoice(choice.id, patch);
  }

  return (
    <Modal
      open={open}
      title="Manage global choices"
      onClose={onClose}
      footer={
        <Button onClick={onClose}>Done</Button>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Global choices are shared option sets. Create one here, then pick it from any
          &ldquo;Choice (global)&rdquo; column. Names already used by a global choice in
          this environment are reused rather than created again.
        </p>

        {isLoading && (
          <p className="text-xs text-slate-400">
            Checking existing global choices in this environment…
          </p>
        )}

        {globalChoices.length === 0 && (
          <p className="rounded-md border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-400 dark:border-slate-600">
            No global choices yet.
          </p>
        )}

        {globalChoices.map((choice) => {
          const taken = existingName(choice);
          const token = sanitizeSchemaToken(choice.schemaName);
          const expanded = !collapsible || expandedIds.has(choice.id);
          return (
            <div
              key={choice.id}
              className="rounded-lg border border-slate-200 dark:border-slate-700"
            >
              {collapsible && (
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => toggle(choice.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left"
                >
                  <span aria-hidden className="text-xs text-slate-400">
                    {expanded ? '▾' : '▸'}
                  </span>
                  <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                    {choice.displayName || 'Untitled global choice'}
                  </span>
                  <span className="truncate text-xs text-slate-400">
                    {token ? `${prefix}_${token}` : 'no schema name'}
                  </span>
                  <span className="ml-auto shrink-0">
                    {taken ? (
                      <Badge tone="warning">already in environment</Badge>
                    ) : (
                      <Badge tone="neutral">{choice.options.length} option(s)</Badge>
                    )}
                  </span>
                </button>
              )}

              <div
                className={cn(
                  'space-y-3 p-3',
                  !expanded && 'hidden',
                  collapsible && 'border-t border-slate-200 dark:border-slate-700',
                )}
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                      Display name
                    </label>
                    <Input
                      value={choice.displayName}
                      placeholder="Status"
                      onChange={(e) => handleDisplayNameChange(choice, e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                      Schema name
                      {taken && !collapsible && (
                        <Badge tone="warning">already in environment</Badge>
                      )}
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">{prefix}_</span>
                      <Input
                        value={choice.schemaName}
                        onChange={(e) =>
                          updateGlobalChoice(choice.id, {
                            schemaName: sanitizeSchemaToken(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {taken ? (
                  <Alert tone="warning" title={`"${taken}" already exists in this environment`}>
                    It cannot be created again, so deploy binds your columns to the
                    existing global choice and leaves its options untouched. Change
                    the schema name if you want a separate global choice instead.
                  </Alert>
                ) : (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                      Options
                    </label>
                    <OptionSetEditor
                      options={choice.options}
                      onChange={(options) => updateGlobalChoice(choice.id, { options })}
                    />
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => removeGlobalChoice(choice.id)}
                  >
                    Remove global choice
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        <Button variant="secondary" size="sm" onClick={addAndExpand}>
          + Add global choice
        </Button>
      </div>
    </Modal>
  );
}
