import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths, so the same build works at the root of
  // englishtype.dvaldivia.com and under the github.io project path while DNS
  // is still propagating. The app has no client-side routing, so nothing else
  // depends on knowing the base.
  base: './',
})
