import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { OptionSetEditor } from './OptionSetEditor';
import { useProjectStore } from '../../store/projectStore';
import { getProjectPrefix } from '../../services/validationService';
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
  const prefix = getProjectPrefix(project) ?? '...';

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
          &ldquo;Choice (global)&rdquo; column.
        </p>

        {globalChoices.length === 0 && (
          <p className="rounded-md border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-400 dark:border-slate-600">
            No global choices yet.
          </p>
        )}

        {globalChoices.map((choice) => (
          <div
            key={choice.id}
            className="space-y-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700"
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
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                  Schema name
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

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                Options
              </label>
              <OptionSetEditor
                options={choice.options}
                onChange={(options) => updateGlobalChoice(choice.id, { options })}
              />
            </div>

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
        ))}

        <Button variant="secondary" size="sm" onClick={() => addGlobalChoice()}>
          + Add global choice
        </Button>
      </div>
    </Modal>
  );
}
