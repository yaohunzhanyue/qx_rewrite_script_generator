import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages 部署时设置 base：
// - 有自定义域名 → base 为 '/'
// - 无自定义域名 → base 为 '/<repo-name>/'
// 当前已配置自定义域名 zyxcode.com，所以 base 为 '/'
const base = '/'

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