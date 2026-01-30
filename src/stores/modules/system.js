// Define Vuex of state
const state = () => ({
  activeLeftPanels: [], // List of currently active left panels
  isPanelShow: true, // Flag indicating whether the panel is visible
  activeNodes: [], // List of currently active nodes
  activeNode: null, // Currently active single node
  theme: 'light', // Current theme
  componentsData: {}, // Used to store loaded component data
  editBackupData: null, // Used to save backup data in edit state
  unsavedChanges: false, // Whether there are unsaved data
  lastSavedTime: null, // Last saved time
})

const actions = {
  /**
   * Set component data
   * @param {Object} context - Vuex Context object
   * @param {Object} componentsData - Component data
   */
  setComponentsData({ state }, componentsData) {
    state.componentsData = componentsData
  },

  /**
   * Get component data
   * @param {Object} context - Vuex Context object
   * @returns {Object} Component data
   */
  getComponentsData({ state }) {
    return state.componentsData
  },

  /**
   * Set the list of currently active nodes，And set the first node as the currently active node
   * @param {Object} context - Vuex Context object
   * @param {Array} nodes - New node list
   */
  setActiveNodes({ state }, nodes) {
    state.activeNodes = nodes
    state.activeNode = nodes.length > 0 ? nodes[0] : null
  },

  /**
   * Set the list of currently active left panels
   * @param {Object} context - Vuex Context object
   * @param {Array} nodes - New left panel list
   */
  setActiveLeftPanels({ state }, nodes) {
    state.activeLeftPanels = nodes
  },

  /**
   * Set the display state of the panel
   * @param {Object} context - Vuex Context object
   * @param {Boolean} value - Panel display state
   */
  setPanelShow({ state }, value) {
    state.isPanelShow = value
  },

  /**
   * Set the theme type
   * @param {Object} context - Vuex Context object
   * @param {String} value - Theme value light or dark
   */
  setTheme({ state }, value) {
    state.theme = value
  },

  /**
   * Set edit backup data
   * @param {Object} state - Vuex State object
   * @param {Object} data - Edit backup data to be set
   */
  setEditBackupData({ state }, data) {
    state.editBackupData = JSON.stringify(data)
  },

 
  /**
   * Set the status flag for unsaved changes
   * @param {Object} context - Vuex Context object
   * @param {Boolean} value - Boolean value indicating whether there are unsaved changes
   */
  setUnsavedChanges({ state }, value) {
    state.unsavedChanges = value
  },

  /**
   * Set the timestamp of the last save
   * @param {Object} context - Vuex Context object
   * @param {Number} timestamp - Timestamp of the last save
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