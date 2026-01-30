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
              let configContent = fs.readFileSync(configFilePath, 'utf8');
              configContent = configContent.replace('__VITE_MODE__', `'${mode}'`);
              fs.writeFileSync(configFilePath, configContent, 'utf8');
              
            } else {
            }
          } catch (error) {
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
      //port: 3000, 
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
      rollupOptions: {
        output: {
          manualChunks(id) {
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
              return 'vendor'
            }
          },
          entryFileNames: isDeployBuild ? 'assets/[name].js' : 'assets/[name]-[hash].js',
          chunkFileNames: isDeployBuild ? 'assets/[name].js' : 'assets/[name]-[hash].js',
          assetFileNames: isDeployBuild ? 'assets/[name].[ext]' : 'assets/[name]-[hash].[ext]'
        }
      },
      chunkSizeWarningLimit: 1000,
      worker: false,
    }
  }
})