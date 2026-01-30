// 导入 Vue 和必要的插件
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from '@/stores/index'

// 导入 ElementPlus 及其样式
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 导入自定义样式
import './styles/index.scss'
// 导入其他必要的插件和组件
import { onEvent, emitEvent } from '@/event/index'
import SvgIcon from '@/components/SvgIcon.vue'

// 导入 Monaco
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
// 全局注册 ElementPlus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
// 使用 ElementPlus 插件
app.use(ElementPlus)
// 注册事件总线的全局属性
app.config.globalProperties.$onEvent = onEvent
app.config.globalProperties.$emitEvent = emitEvent
// 全局注册自定义组件
app.component('svg-icon', SvgIcon)
// 使用 Monaco 编辑器插件
app.use(VueMonacoEditorPlugin)
// 使用路由和状态管理
app.use(router)
app.use(store)
window.store = store
// 挂载应用
app.mount('#app')
