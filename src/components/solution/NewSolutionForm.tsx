import { useEffect, useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { usePublishers } from '../../hooks/usePublishers';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Alert } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import {
  isValidPrefix,
  isValidUniqueName,
  sanitizePrefix,
  toSolutionUniqueName,
} from '../../services/namingService';

const NEW_PUBLISHER = '__new__';

export function NewSolutionForm({ enabled }: { enabled: boolean }) {
  const draft = useProjectStore((s) => s.project.solution.draft);
  const updateNewSolution = useProjectStore((s) => s.updateNewSolution);
  const { publishers, isLoading, error } = usePublishers(enabled);

  const [uniqueNameTouched, setUniqueNameTouched] = useState(false);
  const friendlyName = draft?.friendlyName ?? '';
  const uniqueName = draft?.uniqueName ?? '';
  const usingNewPublisher = !draft?.existingPublisherId;

  // Auto-derive the unique name from the friendly name until the user edits it.
  useEffect(() => {
    if (!uniqueNameTouched && friendlyName) {
      updateNewSolution({ uniqueName: toSolutionUniqueName(friendlyName) });
    }
  }, [friendlyName, uniqueNameTouched, updateNewSolution]);

  function selectPublisher(value: string) {
    if (value === NEW_PUBLISHER) {
      updateNewSolution({
        existingPublisherId: undefined,
        existingPublisherPrefix: undefined,
        newPublisher: draft?.newPublisher ?? { friendlyName: '', uniqueName: '', prefix: '' },
      });
    } else {
      const publisher = publishers.find((p) => p.publisherid === value);
      updateNewSolution({
        existingPublisherId: value,
        existingPublisherPrefix: publisher?.customizationprefix,
        newPublisher: undefined,
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Solution display name">
          <Input
            value={friendlyName}
            placeholder="My Solution"
            onChange={(e) => updateNewSolution({ friendlyName: e.target.value })}
          />
        </Field>
        <Field
          label="Unique name"
          error={uniqueName && !isValidUniqueName(uniqueName) ? 'Invalid unique name' : undefined}
        >
          <Input
            value={uniqueName}
            placeholder="MySolution"
            onChange={(e) => {
              setUniqueNameTouched(true);
              updateNewSolution({ uniqueName: e.target.value });
            }}
          />
        </Field>
      </div>

      <Field label="Version">
        <Input
          className="max-w-[12rem]"
          value={draft?.version ?? '1.0.0.0'}
          onChange={(e) => updateNewSolution({ version: e.target.value })}
        />
      </Field>

      <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
        <Field label="Publisher">
          <Select
            value={draft?.existingPublisherId ?? NEW_PUBLISHER}
            disabled={isLoading}
            onChange={(e) => selectPublisher(e.target.value)}
          >
            <option value={NEW_PUBLISHER}>+ Create new publisher</option>
            {publishers.map((p) => (
              <option key={p.publisherid} value={p.publisherid}>
                {p.friendlyname} ({p.customizationprefix}_)
              </option>
            ))}
          </Select>
        </Field>
        {error && (
          <div className="mt-2">
            <Alert tone="warning" title="Could not load publishers">{error}</Alert>
          </div>
        )}
      </div>

      {usingNewPublisher && <NewPublisherFields />}
    </div>
  );
}

function NewPublisherFields() {
  const draft = useProjectStore((s) => s.project.solution.draft);
  const updateNewSolution = useProjectStore((s) => s.updateNewSolution);
  const pub = draft?.newPublisher ?? { friendlyName: '', uniqueName: '', prefix: '' };

  function patch(p: Partial<typeof pub>) {
    updateNewSolution({ newPublisher: { ...pub, ...p } });
  }

  return (
    <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Publisher display name">
          <Input
            value={pub.friendlyName}
            placeholder="Contoso"
            onChange={(e) => {
              const friendlyName = e.target.value;
              patch({
                friendlyName,
                uniqueName: pub.uniqueName || toSolutionUniqueName(friendlyName),
              });
            }}
          />
        </Field>
        <Field
          label="Publisher unique name"
          error={pub.uniqueName && !isValidUniqueName(pub.uniqueName) ? 'Invalid unique name' : undefined}
        >
          <Input
            value={pub.uniqueName}
            placeholder="Contoso"
            onChange={(e) => patch({ uniqueName: e.target.value })}
          />
        </Field>
      </div>
      <Field
        label="Customization prefix"
        error={pub.prefix && !isValidPrefix(pub.prefix) ? '2-8 lowercase letters/digits, starting with a letter' : undefined}
      >
        <div className="flex items-center gap-2">
          <Input
            className="max-w-[10rem]"
            value={pub.prefix}
            placeholder="abc"
            onChange={(e) => patch({ prefix: sanitizePrefix(e.target.value) })}
          />
          {pub.prefix && isValidPrefix(pub.prefix) && <Badge tone="brand">{pub.prefix}_columnname</Badge>}
        </div>
      </Field>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
