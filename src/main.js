// Import Vue And necessary plugins
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from '@/stores/index'

// Import ElementPlus And its styles
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// Import custom styles
import './styles/index.scss'
// Import other necessary plugins and components
import { onEvent, emitEvent } from '@/event/index'
import SvgIcon from '@/components/SvgIcon.vue'

// Import Monaco
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import { loader } from '@guolao/vue-monaco-editor'
import { install as VueMonacoEditorPlugin } from '@guolao/vue-monaco-editor'
self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new editorWorker()
  }
}

loader.config({ monaco })
const app = createApp(App)
// Global registration ElementPlus Icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
// Use ElementPlus Plugins
app.use(ElementPlus)
// Register global properties for the event bus
app.config.globalProperties.$onEvent = onEvent
app.config.globalProperties.$emitEvent = emitEvent
// Globally register custom components
app.component('svg-icon', SvgIcon)
// Use Monaco Editor plugins
app.use(VueMonacoEditorPlugin)
// Use routing and state management
app.use(router)
app.use(store)
window.store = store
// Mount the application
app.mount('#app')
