import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages 部署需要设置 base 为仓库名
// 本地开发时改为 '/' 或直接删除 base 配置
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