import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ mode }) => {
  const web = mode === 'web'; // `vite build --mode web`

  return {
    root: 'app',              // source lives here; index.html is app/index.html
    base: './',
    plugins: web
      ? [viteSingleFile({ removeViteModuleLoader: true })]
      : [],
    server: {
      port: 3000,
      open: !process.env.CI
    },
    build: {
      // outDir is resolved relative to `root` (app/)
      outDir: web ? '../web' : '../dist',
      assetsDir: web ? '' : 'assets',
      sourcemap: !web,
      emptyOutDir: true
    }
  };
});
