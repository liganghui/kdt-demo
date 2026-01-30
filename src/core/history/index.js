/**
 * @module historyManage
 * @name  History Management
 * @description  Used to manage the history of the stage，To support undo and redo operations。
 */
export default class historyManage {
  constructor(state, stateManage, config = {}) {
    this.config = config
    this.stateManage = stateManage
    this.state = state
    this.historyIndex = -1 // Initially set to -1，Indicates there are no history records
    this.maxHistoryLength = config.maxHistoryLength || 30
     this.cacheRestoreDebounce = null
  }
  /**
   * Get the current complete state（Including canvas data and system configuration）
   * @returns {Object} Complete state including canvas data and system configuration
   */
  getCurrentState() {
    const canvasData = this.state.stage.toJSON()
    
    // Get system configuration
    let systemConfig = null
    // From global store Get
    if (!systemConfig && window.store && window.store._state ) {
      systemConfig =   window.store._state.data.stage.systemConfig
    }else{
        console.error('KDTfailed to get system configuration')
    }
    return {
      canvasData,
      systemConfig: systemConfig ? JSON.parse(JSON.stringify(systemConfig)) : null
    }
  }

  /**
   * Add the current state to the history
   * @param {Object} [extraParams={}] - Additional parameters，Used to add custom history information
   */
  addHistory(extraParams = {}) {
    const currentTime = new Date().toISOString()
    const fullState = this.getCurrentState()

    // Before inserting a new record at the current index position，Delete all records after
    this.state.history = this.state.history.slice(0, this.historyIndex + 1)
    // Add the complete state to the history
    this.state.history.push({
      time: currentTime,
      canvasData: fullState.canvasData,
      systemConfig: fullState.systemConfig, // Save system configuration
      invalid: false, // New records are valid by default
      ...extraParams
    })

    // Update the history index pointer to the latest
    this.historyIndex = this.state.history.length - 1

    // Keep the length of history records within a reasonable range
    if (this.state.history.length > this.maxHistoryLength) {
      this.state.history.shift()
      if (this.historyIndex > 0) {
        this.historyIndex--
      }
    }
    this.stateManage.class.event.trigger('historyChange', this.state.history)
  }

  /**
   * Restore the complete state（Including canvas and system configuration）
   * @param {Object} historyEntry - History entry
   */
  restoreFullState(historyEntry) {
    // Restore canvas state
    this.stateManage.class.stage.resetStageByJSON(historyEntry.canvasData)
    // Restore system configuration
    if (historyEntry.systemConfig) {
      // Notify system configuration update through the event system
      this.stateManage.class.event.trigger('systemConfigUpdated', historyEntry.systemConfig)
      //Trigger a dedicated history restoration event
      this.stateManage.class.event.trigger('historyRestore', {
        systemConfig: historyEntry.systemConfig,
        canvasData: historyEntry.canvasData
      })
    }
  }

  /**
   * Undo to the previous state
   * @returns {number} Return the current history index，If undo is not possible, return 0
   */
  undo() {
    while (this.historyIndex > 0) {
      this.historyIndex--
      const currentEntry = this.state.history[this.historyIndex]
      if (!currentEntry?.invalid) {
        this.restoreFullState(currentEntry)
        this.stateManage.class.event.trigger('historyChange', this.state.history)
        return this.historyIndex
      }
    }
    console.warn('cannot undo：already in the earliest state')
    return 0
  }

  /**
   * Redo to the next state
   * @returns {number} Return the current history index，If redo is not possible, return the maximum index value
   */
  redo() {
    while (this.historyIndex < this.state.history.length - 1) {
      this.historyIndex++
      const currentEntry = this.state.history[this.historyIndex]
      if (!currentEntry?.invalid) {
        this.restoreFullState(currentEntry)
        this.stateManage.class.event.trigger('historyChange', this.state.history)
        return this.historyIndex
      }
    }
    console.warn('cannot redo：already in the latest state')
    return 0
  }

  /**
   * Get history records
   * @returns {Array} Return the history records array
   */
  getHistory() {
    return this.state.history
  }

  /**
   * Restore to a specific step in the history
   * @param {number} index - The history index to restore to
   */
  restoreToHistory(index) {
    if (index >= 0 && index < this.state.history.length) {
      this.historyIndex = index
      const historyEntry = this.state.history[index]
      this.restoreFullState(historyEntry)
      // Mark subsequent history records as invalid
      for (let i = index + 1; i < this.state.history.length; i++) {
        this.state.history[i].invalid = true
      }
      // Mark index Previous history records as valid
      for (let i = 0; i <= index; i++) {
        this.state.history[i].invalid = false
      }
      this.stateManage.class.event.trigger('historyChange', this.state.history)
    } else {
      console.warn('invalid history index')
    }
  }
}