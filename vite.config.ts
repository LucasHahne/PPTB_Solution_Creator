import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import type { Plugin } from 'vite';

/**
 * Fix the generated HTML so it loads correctly inside the PPTB sandboxed iframe.
 * - Removes `type="module"` and `crossorigin` (we emit a single IIFE bundle).
 * - Moves the script tag to the end of <body> so the DOM exists when the IIFE runs.
 */
function fixHtmlForPPTB(): Plugin {
  return {
    name: 'fix-html-for-pptb',
    enforce: 'post',
    transformIndexHtml(html) {
      html = html.replace(/\s*type="module"/g, '');
      html = html.replace(/\s*crossorigin/g, '');
      html = html.replace(/\s+>/g, '>');

      const scriptRegex = /(<script[^>]*src="[^"]*"[^>]*><\/script>)/g;
      const scripts: string[] = [];
      html = html.replace(scriptRegex, (match) => {
        scripts.push(match);
        return '';
      });

      if (scripts.length > 0) {
        const scriptsHtml = '\n    ' + scripts.join('\n    ');
        html = html.replace('</body>', scriptsHtml + '\n  </body>');
      }

      return html;
    },
  };
}

export default defineConfig((configEnv) => ({
  plugins: [react(), fixHtmlForPPTB()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: configEnv.mode === 'development',
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
  },
}));
