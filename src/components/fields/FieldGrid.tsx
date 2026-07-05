import { useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { FieldDraft, FieldType, RequiredLevel } from '../../types/field';
import { useProjectStore } from '../../store/projectStore';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { FieldTypeSelect } from './FieldTypeSelect';
import { sanitizeSchemaToken, toPascalToken } from '../../services/namingService';

const REQUIRED_OPTIONS: { value: RequiredLevel; label: string }[] = [
  { value: 'None', label: 'Optional' },
  { value: 'Recommended', label: 'Recommended' },
  { value: 'ApplicationRequired', label: 'Required' },
];

/**
 * Volatile values are passed through react-table `meta` rather than being baked
 * into the column definitions. This keeps the `columns` reference stable across
 * renders so editable cell inputs do not remount (and lose focus) on each keystroke.
 */
interface GridMeta {
  prefix: string;
  configuringId: string | null;
  onConfigure: (fieldId: string) => void;
}

const columnHelper = createColumnHelper<FieldDraft>();

export function FieldGrid({
  tableId,
  prefix,
  configuringId,
  onConfigure,
}: {
  tableId: string;
  prefix: string;
  configuringId: string | null;
  onConfigure: (fieldId: string) => void;
}) {
  const table = useProjectStore((s) => s.project.tables.find((t) => t.id === tableId));
  // Zustand action references are stable, so closing over them in a memo keyed
  // only by `tableId` is safe and avoids rebuilding columns on every edit.
  const updateField = useProjectStore((s) => s.updateField);
  const removeField = useProjectStore((s) => s.removeField);
  const duplicateField = useProjectStore((s) => s.duplicateField);
  const setPrimaryName = useProjectStore((s) => s.setPrimaryName);

  const fields = table?.fields ?? [];

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'primary',
        header: 'Primary',
        cell: ({ row }) => (
          <input
            type="radio"
            name={`primary-${tableId}`}
            checked={!!row.original.isPrimaryName}
            onChange={() => setPrimaryName(tableId, row.original.id)}
            className="h-4 w-4 text-brand-600 focus:ring-brand-500"
            title="Primary name column"
          />
        ),
      }),
      columnHelper.accessor('displayName', {
        header: 'Display name',
        cell: ({ row }) => (
          <Input
            value={row.original.displayName}
            placeholder="Column name"
            onChange={(e) => {
              const displayName = e.target.value;
              const patch: Partial<FieldDraft> = { displayName };
              // Keep schema name in sync until it diverges from the derived value.
              if (
                row.original.schemaName === '' ||
                row.original.schemaName === toPascalToken(row.original.displayName)
              ) {
                patch.schemaName = toPascalToken(displayName);
              }
              updateField(tableId, row.original.id, patch);
            }}
          />
        ),
      }),
      columnHelper.accessor('type', {
        header: 'Type',
        cell: ({ row }) =>
          row.original.isPrimaryName ? (
            <Badge tone="neutral">Text (primary)</Badge>
          ) : (
            <FieldTypeSelect
              value={row.original.type}
              onChange={(type: FieldType) => updateField(tableId, row.original.id, { type })}
            />
          ),
      }),
      columnHelper.accessor('requiredLevel', {
        header: 'Required',
        cell: ({ row }) => (
          <Select
            value={row.original.requiredLevel}
            disabled={row.original.isPrimaryName}
            onChange={(e) =>
              updateField(tableId, row.original.id, {
                requiredLevel: e.target.value as RequiredLevel,
              })
            }
          >
            {REQUIRED_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        ),
      }),
      columnHelper.accessor('schemaName', {
        header: 'Schema name',
        cell: ({ row, table: t }) => {
          const meta = t.options.meta as GridMeta;
          return (
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400">{meta.prefix}_</span>
              <Input
                value={row.original.schemaName}
                onChange={(e) =>
                  updateField(tableId, row.original.id, {
                    schemaName: sanitizeSchemaToken(e.target.value),
                  })
                }
              />
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row, table: t }) => {
          const meta = t.options.meta as GridMeta;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant={meta.configuringId === row.original.id ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => meta.onConfigure(row.original.id)}
              >
                Configure
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => duplicateField(tableId, row.original.id)}
                title="Duplicate"
              >
                ⧉
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={row.original.isPrimaryName}
                onClick={() => removeField(tableId, row.original.id)}
                title="Delete"
              >
                ✕
              </Button>
            </div>
          );
        },
      }),
    ],
    [tableId, updateField, removeField, duplicateField, setPrimaryName],
  );

  const reactTable = useReactTable({
    data: fields,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    meta: { prefix, configuringId, onConfigure } satisfies GridMeta,
  });

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        {reactTable.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id} className="border-b border-slate-200 dark:border-slate-700">
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400"
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {reactTable.getRowModel().rows.map((row) => (
          <tr
            key={row.id}
            className="border-b border-slate-100 align-top dark:border-slate-800"
          >
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="px-2 py-1.5">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
