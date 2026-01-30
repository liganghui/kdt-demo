/**
 * @module historyManage
 * @name  历史记录
 * @description  用于管理舞台的历史记录，以支持撤销和重做操作。
 */
export default class historyManage {
  constructor(state, stateManage, config = {}) {
    this.config = config
    this.stateManage = stateManage
    this.state = state
    this.historyIndex = -1 // 初始为 -1，表示没有任何历史记录
    this.maxHistoryLength = config.maxHistoryLength || 30
     this.cacheRestoreDebounce = null
  }
  /**
   * 获取当前完整状态（包括画布数据和系统配置）
   * @returns {Object} 包含画布数据和系统配置的完整状态
   */
  getCurrentState() {
    const canvasData = this.state.stage.toJSON()
    
    // 获取系统配置
    let systemConfig = null
    // 从全局 store 获取
    if (!systemConfig && window.store && window.store._state ) {
      systemConfig =   window.store._state.data.stage.systemConfig
    }else{
        console.error('KDT获取系统配置异常')
    }
    return {
      canvasData,
      systemConfig: systemConfig ? JSON.parse(JSON.stringify(systemConfig)) : null
    }
  }

  /**
   * 添加当前状态到历史记录中
   * @param {Object} [extraParams={}] - 额外的参数，用于添加自定义的历史记录信息
   */
  addHistory(extraParams = {}) {
    const currentTime = new Date().toISOString()
    const fullState = this.getCurrentState()

    // 在当前索引位置插入新记录之前，删除后面的所有记录
    this.state.history = this.state.history.slice(0, this.historyIndex + 1)
    // 将完整状态加入到历史记录中
    this.state.history.push({
      time: currentTime,
      canvasData: fullState.canvasData,
      systemConfig: fullState.systemConfig, // 保存系统配置
      invalid: false, // 新的记录默认有效
      ...extraParams
    })

    // 更新历史索引指针到最新
    this.historyIndex = this.state.history.length - 1

    // 保持历史记录的长度在合理范围内
    if (this.state.history.length > this.maxHistoryLength) {
      this.state.history.shift()
      if (this.historyIndex > 0) {
        this.historyIndex--
      }
    }
    this.stateManage.class.event.trigger('historyChange', this.state.history)
  }

  /**
   * 恢复完整状态（包括画布和系统配置）
   * @param {Object} historyEntry - 历史记录条目
   */
  restoreFullState(historyEntry) {
    // 恢复画布状态
    this.stateManage.class.stage.resetStageByJSON(historyEntry.canvasData)
    // 恢复系统配置
    if (historyEntry.systemConfig) {
      // 通过事件系统通知系统配置更新
      this.stateManage.class.event.trigger('systemConfigUpdated', historyEntry.systemConfig)
      //触发专门的历史恢复事件
      this.stateManage.class.event.trigger('historyRestore', {
        systemConfig: historyEntry.systemConfig,
        canvasData: historyEntry.canvasData
      })
    }
  }

  /**
   * 撤销到上一个状态
   * @returns {number} 返回当前历史索引，如果无法撤销则返回 0
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
    console.warn('无法撤销：已经是最早的状态')
    return 0
  }

  /**
   * 恢复到下一个状态
   * @returns {number} 返回当前历史索引，如果无法恢复则返回最大索引值
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
    console.warn('无法恢复：已经是最新的状态')
    return 0
  }

  /**
   * 获取历史记录
   * @returns {Array} 返回历史记录数组
   */
  getHistory() {
    return this.state.history
  }

  /**
   * 还原到历史记录的某一步
   * @param {number} index - 要还原到的历史记录索引
   */
  restoreToHistory(index) {
    if (index >= 0 && index < this.state.history.length) {
      this.historyIndex = index
      const historyEntry = this.state.history[index]
      this.restoreFullState(historyEntry)
      // 标记之后的历史记录为无效
      for (let i = index + 1; i < this.state.history.length; i++) {
        this.state.history[i].invalid = true
      }
      // 标记 index 之前的历史记录为有效
      for (let i = 0; i <= index; i++) {
        this.state.history[i].invalid = false
      }
      this.stateManage.class.event.trigger('historyChange', this.state.history)
    } else {
      console.warn('无效的历史记录索引')
    }
  }
}