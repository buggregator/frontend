import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { analyzer } from 'vite-bundle-analyzer'
import vueDevTools from 'vite-plugin-vue-devtools'

const isDev = () => {
  return process.env.NODE_ENV === 'dev';
}
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    ...(isDev() ? [analyzer(), vueDevTools()] : []),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    }
  },
  server: {
    host: 'localhost',
    port: 3000
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/cytoscape') || id.includes('node_modules/dagre')) {
            return '@cytoscape';
          }

          if (id.includes('vue')) {
            return '@vue';
          }
        },
      },
    },
  },
})
