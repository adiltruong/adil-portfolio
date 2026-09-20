import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `base` must match the GitHub Pages sub-path (https://<user>.github.io/<repo>/).
// If you later move to a custom domain or a <user>.github.io repo, set this to '/'.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.GITHUB_ACTIONS ? '/adil-portfolio/' : '/',
})
