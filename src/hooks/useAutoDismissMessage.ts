import { useEffect } from 'react';

/** Clears a transient message after a delay; resets the timer when the message changes. */
export function useAutoDismissMessage(
  message: string | null,
  onDismiss: () => void,
  delayMs = 10_000,
): void {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, delayMs);
    return () => clearTimeout(timer);
  }, [message, onDismiss, delayMs]);
}
