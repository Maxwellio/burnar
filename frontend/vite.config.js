import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Peer-deps file:-пакета mainComponent резолвим из node_modules хоста
// (иначе Rollup ищет их рядом с table_comp и падает при build).
const fromHost = (pkg) => path.resolve(__dirname, `node_modules/${pkg}`)

// Dev-сервер на 5173; /api уходит на Spring (8095), как same-origin для cookie-сессий.
// mainComponent — локальный file:-пакет с TSX; Vite должен его транспилировать из node_modules.
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Одна копия React/MUI/table у хоста и у локального пакета (иначе ломаются хуки/контекст).
    dedupe: [
      'react',
      'react-dom',
      '@mui/material',
      '@emotion/react',
      '@emotion/styled',
      '@tanstack/react-table',
      'axios',
    ],
    alias: {
      react: fromHost('react'),
      'react-dom': fromHost('react-dom'),
      '@tanstack/react-table': fromHost('@tanstack/react-table'),
      axios: fromHost('axios'),
      '@mui/material': fromHost('@mui/material'),
      '@mui/icons-material': fromHost('@mui/icons-material'),
      '@mui/x-date-pickers': fromHost('@mui/x-date-pickers'),
      'date-fns': fromHost('date-fns'),
      dayjs: fromHost('dayjs'),
      formik: fromHost('formik'),
    },
  },
  optimizeDeps: {
    include: ['mainComponent', '@tanstack/react-table', 'dayjs', 'formik'],
  },
  // Linked file:-пакет лежит вне frontend/; при build резолв peer/deps идёт через alias выше
  build: {
    commonjsOptions: {
      include: [/node_modules/, /table_comp/],
    },
  },
  server: {
    port: 5173,
    fs: {
      // Разрешаем читать исходники пакета по file:-пути вне frontend/.
      allow: [
        __dirname,
        path.resolve(__dirname, '../../table_comp/frontend/src'),
      ],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8095',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
