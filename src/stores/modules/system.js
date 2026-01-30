// 定义 Vuex 的 state
const state = () => ({
  activeLeftPanels: [], // 当前激活的左侧面板列表
  isPanelShow: true, // 面板是否显示的标志
  activeNodes: [], // 当前激活的节点列表
  activeNode: null, // 当前激活的单个节点
  theme: 'light', // 当前主题
  componentsData: {}, // 用于存储加载的组件数据
  editBackupData: null, // 用于保存编辑状态下的备份数据
  unsavedChanges: false, // 是否存在未保存的数据
  lastSavedTime: null, // 上次保存的时间
})

const actions = {
  /**
   * 设置组件数据
   * @param {Object} context - Vuex 上下文对象
   * @param {Object} componentsData - 组件数据
   */
  setComponentsData({ state }, componentsData) {
    state.componentsData = componentsData
  },

  /**
   * 获取组件数据
   * @param {Object} context - Vuex 上下文对象
   * @returns {Object} 组件数据
   */
  getComponentsData({ state }) {
    return state.componentsData
  },

  /**
   * 设置当前激活的节点列表，并将第一个节点设为当前激活节点
   * @param {Object} context - Vuex 上下文对象
   * @param {Array} nodes - 新的节点列表
   */
  setActiveNodes({ state }, nodes) {
    state.activeNodes = nodes
    state.activeNode = nodes.length > 0 ? nodes[0] : null
  },

  /**
   * 设置当前激活的左侧面板列表
   * @param {Object} context - Vuex 上下文对象
   * @param {Array} nodes - 新的左侧面板列表
   */
  setActiveLeftPanels({ state }, nodes) {
    state.activeLeftPanels = nodes
  },

  /**
   * 设置面板的显示状态
   * @param {Object} context - Vuex 上下文对象
   * @param {Boolean} value - 面板显示状态
   */
  setPanelShow({ state }, value) {
    state.isPanelShow = value
  },

  /**
   * 设置主题类型
   * @param {Object} context - Vuex 上下文对象
   * @param {String} value - 主题值 light or dark
   */
  setTheme({ state }, value) {
    state.theme = value
  },

  /**
   * 设置编辑备份数据
   * @param {Object} state - Vuex 状态对象
   * @param {Object} data - 要设置的编辑备份数据
   */
  setEditBackupData({ state }, data) {
    state.editBackupData = JSON.stringify(data)
  },

 
  /**
   * 设置未保存更改的状态标识
   * @param {Object} context - Vuex 上下文对象
   * @param {Boolean} value - 指示是否存在未保存更改的布尔值
   */
  setUnsavedChanges({ state }, value) {
    state.unsavedChanges = value
  },

  /**
   * 设置上次保存的时间戳
   * @param {Object} context - Vuex 上下文对象
   * @param {Number} timestamp - 上次保存的时间戳
   */
  setLastSavedTime({ state }, timestamp) {
    state.lastSavedTime = timestamp
  },
}

export default {
  namespaced: false,
  state,
  actions
}