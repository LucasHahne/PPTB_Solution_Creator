import type { FieldDraft, FieldType } from '../types/field';
import { FIELD_TYPE_CONFIGS } from '../constants/fieldTypes';

export interface FieldLimits {
  minMaxLength?: number;
  maxMaxLength?: number;
  minValueLimit?: number;
  maxValueLimit?: number;
  minPrecision?: number;
  maxPrecision?: number;
  defaultMaxLength?: number;
  minMaxSizeInKB?: number;
  maxMaxSizeInKB?: number;
  defaultMaxSizeInKB?: number;
}

export interface ConstraintIssue {
  valid: boolean;
  message?: string;
}

/** Return applicable Dataverse bounds for a column type. */
export function getFieldLimits(type: FieldType): FieldLimits {
  const config = FIELD_TYPE_CONFIGS[type];
  return {
    minMaxLength: config.minMaxLength,
    maxMaxLength: config.maxMaxLength,
    minValueLimit: config.minValueLimit,
    maxValueLimit: config.maxValueLimit,
    minPrecision: config.minPrecision,
    maxPrecision: config.maxPrecision,
    defaultMaxLength: config.defaultMaxLength,
    minMaxSizeInKB: config.minMaxSizeInKB,
    maxMaxSizeInKB: config.maxMaxSizeInKB,
    defaultMaxSizeInKB: config.defaultMaxSizeInKB,
  };
}

/** Clamp a numeric value to [min, max], ignoring NaN. */
export function clampNumeric(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Clamp max length for a field type, falling back to the type default. */
export function clampMaxLength(value: number | undefined, type: FieldType): number {
  const limits = getFieldLimits(type);
  const min = limits.minMaxLength ?? 1;
  const max = limits.maxMaxLength ?? 4000;
  const fallback = limits.defaultMaxLength ?? min;
  if (value === undefined || Number.isNaN(value)) return fallback;
  return clampNumeric(Math.round(value), min, max);
}

/** Parse a number input; returns undefined for empty/invalid input. */
export function parseOptionalNumber(raw: string): number | undefined {
  if (raw.trim() === '') return undefined;
  const n = Number(raw);
  return Number.isNaN(n) ? undefined : n;
}

/** Validate all configurable bounds on a field draft. */
export function validateFieldConstraints(field: FieldDraft): ConstraintIssue[] {
  const config = FIELD_TYPE_CONFIGS[field.type];
  const label = field.displayName || '(unnamed column)';
  const issues: ConstraintIssue[] = [];

  if (config.supportsMaxLength) {
    const { minMaxLength = 1, maxMaxLength = 4000 } = config;
    const len = field.maxLength;
    if (len !== undefined) {
      if (len < minMaxLength || len > maxMaxLength) {
        issues.push({
          valid: false,
          message: `Column "${label}" maximum length must be between ${minMaxLength} and ${maxMaxLength.toLocaleString()}.`,
        });
      }
    }
  }

  if (config.supportsRange) {
    const { minValueLimit, maxValueLimit } = config;
    const min = field.minValue;
    const max = field.maxValue;

    if (min !== undefined && minValueLimit !== undefined && min < minValueLimit) {
      issues.push({
        valid: false,
        message: `Column "${label}" minimum value cannot be less than ${minValueLimit.toLocaleString()}.`,
      });
    }
    if (max !== undefined && maxValueLimit !== undefined && max > maxValueLimit) {
      issues.push({
        valid: false,
        message: `Column "${label}" maximum value cannot exceed ${maxValueLimit.toLocaleString()}.`,
      });
    }
    if (min !== undefined && max !== undefined && min > max) {
      issues.push({
        valid: false,
        message: `Column "${label}" minimum value cannot exceed its maximum value.`,
      });
    }
  }

  if (config.supportsPrecision) {
    const { minPrecision = 0, maxPrecision = 10 } = config;
    const precision = field.precision;
    if (precision !== undefined && (precision < minPrecision || precision > maxPrecision)) {
      issues.push({
        valid: false,
        message: `Column "${label}" precision must be between ${minPrecision} and ${maxPrecision}.`,
      });
    }
  }

  if (config.supportsOptions) {
    for (const opt of field.options ?? []) {
      if (opt.value <= 0) {
        issues.push({
          valid: false,
          message: `Choice column "${label}" option "${opt.label || '(unnamed)'}" must have a positive value.`,
        });
      }
    }
  }

  if (config.supportsMaxSize) {
    const { minMaxSizeInKB = 1, maxMaxSizeInKB } = config;
    const size = field.maxSizeInKB;
    if (size !== undefined) {
      if (size < minMaxSizeInKB) {
        issues.push({
          valid: false,
          message: `Column "${label}" maximum size must be at least ${minMaxSizeInKB.toLocaleString()} KB.`,
        });
      }
      if (maxMaxSizeInKB !== undefined && size > maxMaxSizeInKB) {
        issues.push({
          valid: false,
          message: `Column "${label}" maximum size cannot exceed ${maxMaxSizeInKB.toLocaleString()} KB.`,
        });
      }
    }
  }

  if (config.supportsAutoNumber) {
    if (!field.autoNumberFormat || !field.autoNumberFormat.trim()) {
      issues.push({
        valid: false,
        message: `Autonumber column "${label}" needs a format, e.g. INV-{SEQNUM:5}.`,
      });
    }
  }

  return issues;
}

/** Format a hint string for max length inputs. */
export function maxLengthHint(type: FieldType): string | undefined {
  const { minMaxLength, maxMaxLength } = getFieldLimits(type);
  if (minMaxLength === undefined || maxMaxLength === undefined) return undefined;
  return `Allowed: ${minMaxLength.toLocaleString()}–${maxMaxLength.toLocaleString()} characters`;
}

/** Format a hint string for numeric range inputs. */
export function rangeHint(type: FieldType): string | undefined {
  const { minValueLimit, maxValueLimit } = getFieldLimits(type);
  if (minValueLimit === undefined || maxValueLimit === undefined) return undefined;
  return `Allowed: ${minValueLimit.toLocaleString()}–${maxValueLimit.toLocaleString()}`;
}

/** Format a hint string for precision inputs. */
export function precisionHint(type: FieldType): string | undefined {
  const { minPrecision, maxPrecision } = getFieldLimits(type);
  if (minPrecision === undefined || maxPrecision === undefined) return undefined;
  return `Allowed: ${minPrecision}–${maxPrecision} decimal places`;
}

/** Format a hint string for maximum size (file/image) inputs. */
export function maxSizeHint(type: FieldType): string | undefined {
  const { minMaxSizeInKB, maxMaxSizeInKB } = getFieldLimits(type);
  if (minMaxSizeInKB === undefined || maxMaxSizeInKB === undefined) return undefined;
  return `Allowed: ${minMaxSizeInKB.toLocaleString()}–${maxMaxSizeInKB.toLocaleString()} KB`;
}
