import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig, type Plugin } from 'vite'

const isDev = () => {
  return process.env.NODE_ENV === 'dev';
}

const devPlugins = async (): Promise<Plugin[]> => {
  if (!isDev()) return [];
  const { analyzer } = await import('vite-bundle-analyzer');
  const vueDevTools = (await import('vite-plugin-vue-devtools')).default;
  return [analyzer() as Plugin, vueDevTools() as Plugin];
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    ...await devPlugins(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [fileURLToPath(new URL('.', import.meta.url))],
      },
    },
  },
  server: {
    host: 'localhost',
    port: 3000,
    watch: {
      usePolling: !!process.env.CHOKIDAR_USEPOLLING,
    },
  },
  build: {
    rollupOptions: {
      treeshake: {
        // dagre's package has no `sideEffects` field, so Rollup kept it (and
        // the vue-flow chunk it sits in) on the feed's first load just because
        // the profiler and Sentry entity barrels import the graph helpers. It
        // has no side effects at import time.
        moduleSideEffects: (id: string) => !id.includes('node_modules/@dagrejs'),
      },
      output: {
        manualChunks(id: string) {
          // Only vue-flow's JS: its stylesheet is imported by the profiler
          // graph, and a CSS module in this chunk made the feed preload the
          // whole 198 kB chunk just for 6 kB of styles.
          if (
            (id.includes('node_modules/@vue-flow') || id.includes('node_modules/@dagrejs')) &&
            !id.endsWith('.css')
          ) {
            return '@vue-flow';
          }

          if (id.includes('node_modules/vue/') || id.includes('node_modules/@vue/')) {
            return '@vue';
          }
        },
      },
    },
  },
})
