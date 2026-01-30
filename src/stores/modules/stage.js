import { updateDocumentTitle } from '@/utils/utils'
const state = () => ({
  systemConfig: null, // System configuration
  timers: {}, // Store timerID
  instancesArr: {}, // StoreDOMComponent'sVue GeneratedAPPArray
  componentsApps: {}, // Store component applications
  queryParams: {} // Route parameters
})
const actions = {
  // Set system configuration
  setSystemConfig({ state }, config) {
    state.systemConfig = { ...state.systemConfig, ...config }
    // Update browser title
    updateDocumentTitle(config?.name)
  },
  // Update instance array and component applications
  updateInstancesArr({ state }, { id, data, app }) {
    state.instancesArr = { ...state.instancesArr, [id]: data }
    state.componentsApps = { ...state.componentsApps, [id]: app }
  },
  // Set timer
  setTimer({ state }, { id, timerId }) {
    state.timers = { ...state.timers, [id]: timerId }
  },
  // Clear timer
  clearTimer({ state }, { id }) {
    if (state.timers[id]) {
      clearInterval(state.timers[id])
      state.timers = { ...state.timers, [id]: null }
    }
  },
  // Set route parameters
  setQueryParams({ state }, value) {
    state.queryParams = value
  },
  // Update node data
  updateNodeData({ state }, { id, data, type }) {
    window.kdt.updateNodeData({ id, data, type })
  },
}

export default {
  // Whether to enable namespace
  namespaced: false,
  state,
  actions
}
