import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages 部署时设置 base：
// - 无自定义域名 → base 为 '/<repo-name>/'
// - 有自定义域名 → base 为 '/'
const base = process.env.GITHUB_PAGES ? '/qx_rewrite_script_generator/' : '/'

export default defineConfig({
  base,
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})