/** Normalize unknown errors (including Dataverse OData error shapes) into a message. */
export function toErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;

  if (error && typeof error === 'object') {
    const obj = error as Record<string, unknown>;

    // Dataverse OData error: { error: { code, message } }
    const odata = obj.error as { message?: string } | undefined;
    if (odata?.message) return odata.message;

    if (typeof obj.message === 'string') return obj.message;

    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error';
    }
  }

  return 'Unknown error';
}
