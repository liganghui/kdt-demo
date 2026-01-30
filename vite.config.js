import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import svgLoader from 'vite-svg-loader'
import VueDevTools from 'vite-plugin-vue-devtools'
import { qrcode } from 'vite-plugin-qrcode'
import fs from 'fs';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd())
  const isDeployBuild = mode === 'deploy'
  
  return {
    base: env.VITE_APP_BASE_URL || '/', 
    publicDir: 'public',
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: ''
        }
      }
    },
    optimizeDeps: {
      force: true,
      exclude: isDeployBuild ? [
        '@guolao/vue-monaco-editor',
        'monaco-editor',
      ] : ['node_modules/.cache'],
    },
    plugins: [
      vue(),
      svgLoader({
        defaultImport: 'component',
        svgoConfig: {
          multipass: true
        }
      }),
      vueJsx(),
      VueDevTools(),
      qrcode(),
      Components({
        resolvers: [
          AntDesignVueResolver({
            importStyle: false
          })
        ]
      }),
      {
        name: 'update-config-after-build',
        closeBundle() {
          const configFilePath = path.resolve(__dirname, 'dist/config.js');
          
          try {
            if (fs.existsSync(configFilePath)) {
              console.log('构建完成，正在更新配置文件...');
              console.log(`当前构建环境: ${mode}`);
              
              let configContent = fs.readFileSync(configFilePath, 'utf8');
              // 替换环境变量标记
              configContent = configContent.replace('__VITE_MODE__', `'${mode}'`);
              // 写回文件
              fs.writeFileSync(configFilePath, configContent, 'utf8');
              
              console.log(` 配置文件已更新，使用环境: ${mode}`);
            } else {
              console.warn('配置文件不存在: ', configFilePath);
            }
          } catch (error) {
            console.error('更新配置文件失败: ', error);
            console.error(error);
          }
        }
      }
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
         vue: 'vue/dist/vue.esm-bundler.js'
      }
    },
    server: {
      host: true,
      //port: 3000, // 端口号
      proxy: {
        '/v1/upload': {
          target: 'https://www.imghippo.com',
          changeOrigin: true,
          secure: false,
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              let targetUrl = options.target
              if (typeof targetUrl === 'string') {
                targetUrl = new URL(targetUrl)
              }
              res.setHeader('x-req-proxyUrl', targetUrl.href)
            })
          }
        },
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              let targetUrl = options.target
              if (typeof targetUrl === 'string') {
                targetUrl = new URL(targetUrl)
              }
              res.setHeader('x-req-proxyUrl', targetUrl.href)
            })
          }
        },
        '/test': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              let targetUrl = options.target
              if (typeof targetUrl === 'string') {
                targetUrl = new URL(targetUrl)
              }
              res.setHeader('x-req-proxyUrl', targetUrl.href)
            })
          }
        },
        '/uploads': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      outDir: isDeployBuild ? 'deploy-dist' : 'dist',
      // 代码分割优化
      rollupOptions: {
        output: {
          manualChunks(id) {
            // 分离到独立chunk
            if (id.includes('node_modules')) {
              if (id.includes('monaco-editor')) {
                return 'monaco'
              }
              if (id.includes('three')) {
                return 'three'
              }
              if (id.includes('element-plus')) {
                return 'element-plus'
              }
              if (id.includes('vue')) {
                return 'vue'
              }
              if (id.includes('konva')) {
                return 'konva'
              }
              if (id.includes('lodash')) {
                return 'lodash'
              }
              // 其他的
              return 'vendor'
            }
          },
          entryFileNames: isDeployBuild ? 'assets/[name].js' : 'assets/[name]-[hash].js',
          chunkFileNames: isDeployBuild ? 'assets/[name].js' : 'assets/[name]-[hash].js',
          assetFileNames: isDeployBuild ? 'assets/[name].[ext]' : 'assets/[name]-[hash].[ext]'
        }
      },
      // 提高大小警告阈值
      chunkSizeWarningLimit: 1000,
      worker: false,
    }
  }
})