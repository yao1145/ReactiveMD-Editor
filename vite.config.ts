import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const entry = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const external = [/^reactive-md(\/|$)/, 'react', 'react-dom', /^react\//];

/** Entries share one CodeMirror chunk; the engine stays external. */
export default defineConfig({
  // The analysis worker is a standalone browser asset, so the engine is
  // bundled into it. Library entries keep the engine external below.
  worker: {
    format: 'es',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: {
        index: entry('./src/library.ts'),
        commands: entry('./src/commands.ts'),
        'codemirror/index': entry('./src/codemirror/library.ts'),
      },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
      cssFileName: 'styles',
    },
    rolldownOptions: { external },
  },
});
