import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const buildId = (
  process.env.RENDER_GIT_COMMIT ||
  process.env.GITHUB_SHA ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  'local'
).slice(0, 7)

export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
})
