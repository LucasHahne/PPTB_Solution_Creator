import type { ValidationIssue } from '../../services/validationService';
import { Alert } from '../ui/Alert';

/** Render the validation issues for a step, grouped by severity. */
export function StepIssues({ issues }: { issues: ValidationIssue[] }) {
  if (issues.length === 0) return null;

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  return (
    <div className="space-y-2">
      {errors.length > 0 && (
        <Alert tone="error" title={`${errors.length} issue(s) to fix`}>
          <ul className="list-disc pl-4">
            {errors.map((issue, i) => (
              <li key={i}>{issue.message}</li>
            ))}
          </ul>
        </Alert>
      )}
      {warnings.length > 0 && (
        <Alert tone="warning" title={`${warnings.length} warning(s)`}>
          <ul className="list-disc pl-4">
            {warnings.map((issue, i) => (
              <li key={i}>{issue.message}</li>
            ))}
          </ul>
        </Alert>
      )}
    </div>
  );
}
