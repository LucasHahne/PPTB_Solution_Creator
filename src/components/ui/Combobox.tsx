import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { cn } from './cn';

export interface ComboboxOption {
  /** Stable key used as the value. */
  key: string;
  /** Primary text shown to the user. */
  label: string;
  /** Optional secondary text (e.g. a logical name) shown and searched. */
  sublabel?: string;
  /** Optional group heading; options are rendered grouped in listing order. */
  group?: string;
}

/**
 * A lightweight searchable single-select combobox. Filters options by label and
 * sublabel as the user types, and supports arrow/enter/escape keyboard control.
 */
export function Combobox({
  value,
  options,
  onChange,
  placeholder = 'Select…',
  emptyMessage = 'No matches.',
  disabled,
}: {
  value: string;
  options: ComboboxOption[];
  onChange: (key: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.key === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.sublabel ?? '').toLowerCase().includes(q),
    );
  }, [options, query]);

  // Keep the active option within bounds when the filtered list changes.
  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open]);

  function openMenu() {
    if (disabled) return;
    setOpen(true);
    setQuery('');
    setActiveIndex(Math.max(0, filtered.findIndex((o) => o.key === value)));
    // Focus the search input once it is rendered.
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function commit(option: ComboboxOption | undefined) {
    if (!option) return;
    onChange(option.key);
    setOpen(false);
  }

  function onInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      commit(filtered[activeIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-left text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100',
        )}
      >
        <span className={cn('truncate', !selected && 'text-slate-400')}>
          {selected ? selected.label : placeholder}
        </span>
        <span aria-hidden className="text-slate-400">
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-200 p-2 dark:border-slate-700">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onInputKeyDown}
              placeholder="Search tables…"
              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <ul className="scrollbar-thin max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-slate-400">{emptyMessage}</li>
            ) : (
              filtered.map((o, index) => {
                const prev = filtered[index - 1];
                const showGroup = o.group && o.group !== prev?.group;
                return (
                  <li key={o.key}>
                    {showGroup && (
                      <p className="px-3 pb-0.5 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {o.group}
                      </p>
                    )}
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => commit(o)}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm',
                        index === activeIndex
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-100'
                          : 'text-slate-700 dark:text-slate-200',
                        o.key === value && 'font-semibold',
                      )}
                    >
                      <span className="truncate">{o.label}</span>
                      {o.sublabel && (
                        <span className="shrink-0 text-xs text-slate-400">
                          {o.sublabel}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
