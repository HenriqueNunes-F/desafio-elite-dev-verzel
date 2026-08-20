import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Permite acesso via túnel cloudflared temporário (estudo/demo fora da
    // máquina local) — restrito a subdomínios *.trycloudflare.com, não a
    // qualquer host.
    allowedHosts: ['.trycloudflare.com'],
  },
})
