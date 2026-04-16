import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import pkg from './package.json'

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: ['vue', 'vue-router', 'pinia'],
      dts: true
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: true
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3001
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 将 node_modules 中的包分离到 vendor chunk
          if (id.includes('node_modules')) {
            // element-plus 单独分包
            if (id.includes('element-plus')) {
              return 'element-plus'
            }
            // @element-plus/icons-vue 单独分包
            if (id.includes('@element-plus/icons-vue')) {
              return 'element-icons'
            }
            // vue 全家桶
            if (id.includes('vue') || id.includes('pinia') || id.includes('@vue')) {
              return 'vue-vendor'
            }
            // echarts 单独分包
            if (id.includes('echarts') || id.includes('zrender')) {
              return 'echarts'
            }
            // 其他第三方库
            return 'vendor'
          }
        }
      }
    }
  }
})