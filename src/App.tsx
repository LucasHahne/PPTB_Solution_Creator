import { useEffect, useState } from 'react';
import { AppShell } from './components/layout/AppShell';

/** Applies the ToolBox theme to the document root so Tailwind `dark:` works. */
function useToolboxTheme() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function applyTheme() {
      try {
        const theme = await window.toolboxAPI.utils.getCurrentTheme();
        if (!cancelled) {
          document.documentElement.classList.toggle('dark', theme === 'dark');
        }
      } catch {
        // Fall back to the OS preference when the API is unavailable.
        const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', !!prefersDark);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void applyTheme();
    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}

export default function App() {
  useToolboxTheme();
  return <AppShell />;
}
