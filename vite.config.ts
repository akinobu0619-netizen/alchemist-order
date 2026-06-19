import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// 本番ビルド時のみ GitHub Pages のサブパスを base に。dev/preview は root のまま。
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/alchemist-order/' : '/',
  plugins: [react()],
}))
