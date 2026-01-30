import { updateDocumentTitle } from '@/utils/utils'
const state = () => ({
  systemConfig: null, // 系统配置
  timers: {}, // 存储定时器ID
  instancesArr: {}, // 存储DOM组件的Vue 生成的APP数组
  componentsApps: {}, // 存储组件应用
  queryParams: {} // 路由参数
})
const actions = {
  // 设置系统配置
  setSystemConfig({ state }, config) {
    state.systemConfig = { ...state.systemConfig, ...config }
    // 更新浏览器标题
    updateDocumentTitle(config?.name)
  },
  // 更新实例数组和组件应用
  updateInstancesArr({ state }, { id, data, app }) {
    state.instancesArr = { ...state.instancesArr, [id]: data }
    state.componentsApps = { ...state.componentsApps, [id]: app }
  },
  // 设置定时器
  setTimer({ state }, { id, timerId }) {
    state.timers = { ...state.timers, [id]: timerId }
  },
  // 清除定时器
  clearTimer({ state }, { id }) {
    if (state.timers[id]) {
      clearInterval(state.timers[id])
      state.timers = { ...state.timers, [id]: null }
    }
  },
  // 设置路由参数
  setQueryParams({ state }, value) {
    state.queryParams = value
  },
  // 更新节点数据
  updateNodeData({ state }, { id, data, type }) {
    window.kdt.updateNodeData({ id, data, type })
  },
}

export default {
  // 是否开启命名空间
  namespaced: false,
  state,
  actions
}
