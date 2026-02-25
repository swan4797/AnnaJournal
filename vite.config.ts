import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import viteReact from '@vitejs/plugin-react'
import netlifyPlugin from '@netlify/vite-plugin-tanstack-start'
import path from 'path'

export default defineConfig({
  server: {
    port: 3000,
    watch: {
      ignored: ['**/routeTree.gen.ts'],
    },
  },
  plugins: [
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tanstackStart(),
    viteReact(),
    netlifyPlugin(),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [path.resolve(__dirname, 'src/styles')],
      },
    },
  },
})
