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
        api: 'modern',
        loadPaths: [fileURLToPath(new URL('.', import.meta.url))],
      },
    },
  },
  server: {
    host: 'localhost',
    port: 3000
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/@vue-flow') || id.includes('node_modules/@dagrejs')) {
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
