import type { OptionDraft } from '../types/field';
import { newId } from './ids';

export interface ParseOptionSetResult {
  options: OptionDraft[];
  errors: string[];
}

/**
 * Parse bulk choice input into option drafts.
 * Supports one option per line or comma-separated: "Active:1, Inactive:2".
 * Labels without a value are auto-numbered starting after startValue.
 */
export function parseOptionSetInput(
  input: string,
  startValue = 0,
): ParseOptionSetResult {
  const errors: string[] = [];
  const tokens: { label: string; value?: number }[] = [];

  const lines = input.split(/\r?\n/);
  for (const line of lines) {
    for (const part of line.split(',')) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) {
        tokens.push({ label: trimmed });
        continue;
      }

      const label = trimmed.slice(0, colonIdx).trim();
      const valueStr = trimmed.slice(colonIdx + 1).trim();

      if (!label) {
        errors.push(`Missing label in "${trimmed}".`);
        continue;
      }

      if (!valueStr) {
        tokens.push({ label });
        continue;
      }

      const value = Number(valueStr);
      if (Number.isNaN(value) || !Number.isInteger(value)) {
        errors.push(`Invalid value "${valueStr}" for "${label}".`);
        continue;
      }

      tokens.push({ label, value });
    }
  }

  if (tokens.length === 0) {
    errors.push('No options found. Use one per line or comma-separated, e.g. Active:1, Inactive:2.');
    return { options: [], errors };
  }

  let nextAuto = startValue;
  const seenValues = new Set<number>();
  const options: OptionDraft[] = [];

  for (const token of tokens) {
    let value = token.value;
    if (value === undefined) {
      nextAuto += 1;
      value = nextAuto;
    } else {
      nextAuto = Math.max(nextAuto, value);
    }

    if (seenValues.has(value)) {
      errors.push(`Duplicate choice value ${value}.`);
      continue;
    }
    seenValues.add(value);

    options.push({ id: newId(), label: token.label, value });
  }

  return { options, errors };
}

/** Serialize options back to bulk-paste text format. */
export function formatOptionSetInput(options: OptionDraft[]): string {
  return options.map((o) => `${o.label}:${o.value}`).join('\n');
}
