import { useEffect, useRef } from 'react';

/** Subscribe to ToolBox platform events for the lifetime of the component. */
export function useToolboxEvents(onEvent: (event: string, data: unknown) => void) {
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  useEffect(() => {
    const handler = (_event: unknown, payload: ToolBoxAPI.ToolBoxEventPayload) => {
      callbackRef.current(payload.event, payload.data);
    };
    window.toolboxAPI.events.on(handler);
    return () => {
      window.toolboxAPI.events.off(handler);
    };
  }, []);
}
