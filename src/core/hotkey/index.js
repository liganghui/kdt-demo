/**
 * @module hotKeyManage
 * @name 快捷键
 * @description  用于管理键盘快捷键和鼠标操作，支持复制、剪切、删除、粘贴等功能。
 * 还支持画布的拖动和节点的微移动操作。
 */
import { throttle } from 'lodash'
export default class hotKeyManage {
  constructor(state, stateManage, config) {
    this.config = config
    this.stateManage = stateManage
    this.state = state
    this.isMiddleMousePressed = false // 用于标记鼠标中键是否被按下
    this.isSpacePressed = false // 用于标记空格是否被按下

    this.lastMousePosition = null // 记录上次鼠标的位置
    this.isDragOptimized = false // 标记是否已启用拖拽优化
    this.cachedNodes = new Set() // 缓存的节点集合
    this.disabledNodes = new Set() // 禁用事件的节点集合

    // 预先绑定事件处理函数
    this.boundHandleKeyDown = this.handleKeyDown.bind(this)
    this.boundHandleKeyUp = this.handleKeyUp.bind(this)
    this.boundHandleMouseDown = this.handleMouseDown.bind(this)
    this.boundHandleMouseMove = throttle(this.handleMouseMove.bind(this), 16)
    this.boundHandleMouseUp = this.handleMouseUp.bind(this)
  }

  /**
   * 绑定全局的快捷键事件监听器
   */
  bindHotKeys() {
    // 绑定键盘事件
    window.addEventListener('keydown', this.boundHandleKeyDown)
    window.addEventListener('keyup', this.boundHandleKeyUp)

    // 绑定鼠标事件
    this.state.stage.on('mousedown', this.boundHandleMouseDown)
    this.state.stage.on('mousemove', this.boundHandleMouseMove)
    // 由于鼠标抬起事件可能发生在画布外，绑定到window
    window.addEventListener('mouseup', this.boundHandleMouseUp)
  }

  /**
   * 解绑全局的快捷键事件监听器
   */
  unbindHotKeys() {
    // 移除键盘事件
    window.removeEventListener('keydown', this.boundHandleKeyDown)
    window.removeEventListener('keyup', this.boundHandleKeyUp)

    // 移除鼠标事件
    this.state.stage.off('mousedown', this.boundHandleMouseDown)
    this.state.stage.off('mousemove', this.boundHandleMouseMove)
    window.removeEventListener('mouseup', this.boundHandleMouseUp)
  }

  /**
   * 处理键盘按下事件
   * @param {KeyboardEvent} e - 键盘事件对象
   */
  handleKeyDown(e) {
    const transformer = this.stateManage.state.transformer
    const selectedNodes =
      transformer.nodes().length > 0 ? transformer.nodes() : this.state.selectedNodes
    const activeElement = document.activeElement

    // 判断当前焦点是否在输入类元素上
    const isInputElement =
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.tagName === 'SELECT' ||
      activeElement.isContentEditable

    // 如果焦点不在输入类元素上，则处理快捷键
    if (!isInputElement) {
      this.stateManage.class.stage.stageSetFocus()
      // 全局快捷键（不需要选中节点）
      switch (e.key) {
        case 'a':
        case 'A':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            this.selectAllNodes()
          }
          break
        case 'z':
        case 'Z':
          if (e.ctrlKey || e.metaKey) {
            if (e.shiftKey) {
              e.preventDefault()
              this.redo()
            } else {
              e.preventDefault()
              this.undo()
            }
          }
          break
        case 'y':
        case 'Y':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            this.redo()
          }
          break
        case 'f':
        case 'F':
          if (!e.ctrlKey && !e.metaKey && selectedNodes.length === 1) {
            e.preventDefault()
            this.focusSelectedNode()
          }
          break
        case ' ':
          e.preventDefault()
          if (this.isSpacePressed) return
          this.isSpacePressed = true
          // 清空变换框选择(优化性能)
          this.stateManage.class.transformer.resetTransformer([])
          // 启用画布拖放
          this.enableDragOptimization()
          // 禁用所有节点的拖动
          this.stateManage.class.node.disableDragging()
          // 设置画布拖拽状态
          this.state.isCanvasDragging = true
          this.stateManage.class.stage.enableStageDrag()
          break
      }

      // 需要选中节点的快捷键
      if (selectedNodes.length > 0) {
        switch (e.key) {
          case 'c':
          case 'C':
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault()
              this.stateManage.class.node.copyNodes()
            }
            break
          case 'x':
          case 'X':
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault()
              this.stateManage.class.node.cutNodes()
            }
            break
          case 'v':
          case 'V':
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault()
              this.stateManage.class.node.pasteNodes()
            }
            break
          case 'Delete':
          case 'Backspace':
            e.preventDefault()
            this.stateManage.class.node.deleteNodes()
            break
          case 'g':
          case 'G':
            if (e.ctrlKey || e.metaKey) {
              if (e.shiftKey) {
                e.preventDefault()
                this.ungroupSelectedNodes()
              } else {
                e.preventDefault()
                this.groupSelectedNodes()
              }
            }
            break
          case 'l':
          case 'L':
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault()
              this.toggleLockSelectedNodes()
            }
            break
          case 'h':
          case 'H':
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault()
              this.toggleVisibilitySelectedNodes()
            }
            break
          case ']':
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault()
              this.moveSelectedToTop()
            }
            break
          case '[':
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault()
              this.moveSelectedToBottom()
            }
            break
          case 'ArrowUp':
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault()
              this.moveSelectedUp()
            } else {
              e.preventDefault()
              this.nudgeSelected(e.key)
            }
            break
          case 'ArrowDown':
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault()
              this.moveSelectedDown()
            } else {
              e.preventDefault()
              this.nudgeSelected(e.key)
            }
            break
          case 'ArrowLeft':
          case 'ArrowRight':
            e.preventDefault()
            this.nudgeSelected(e.key)
            break
        }
      } else {
        // 没有选中节点时的粘贴操作
        if ((e.key === 'v' || e.key === 'V') && (e.ctrlKey || e.metaKey)) {
          e.preventDefault()
          this.stateManage.class.node.pasteNodes()
        }
      }
    }
  }
  /**
   * 处理键盘抬起事件
   * @param {KeyboardEvent} e - 键盘事件对象
   */
  handleKeyUp(e) {
    if (e.key === ' ') {
      this.isSpacePressed = false
      // 禁用画布拖放
      this.stateManage.class.stage.disableStageDrag()
      this.disableDragOptimization()
      // 恢复所有节点的拖动
      this.stateManage.class.node.enableDragging()
      //  清除画布拖拽状态
      this.state.isCanvasDragging = false
    }
  }

  /**
   * 微移动选中的节点
   * @param {string} direction - 移动方向
   */
  nudgeSelected(direction) {
    const transformer = this.stateManage.state.transformer
    const selectedNodes = transformer.nodes()
    const nudgeAmount = 1 // 微移量

    if (selectedNodes.length > 0) {
      selectedNodes.forEach((node) => {
        switch (direction) {
          case 'ArrowUp':
            node.y(node.y() - nudgeAmount)
            break
          case 'ArrowDown':
            node.y(node.y() + nudgeAmount)
            break
          case 'ArrowLeft':
            node.x(node.x() - nudgeAmount)
            break
          case 'ArrowRight':
            node.x(node.x() + nudgeAmount)
            break
        }
      })
      // 更新DOM位置
      requestAnimationFrame(() => {
        this.stateManage.class.dom.updateDomPosition()
      })
    }
  }

  /**
   * 处理鼠标按下事件（中键拖动）
   * @param {Object} e - 鼠标事件对象
   */
  handleMouseDown(e) {
    if (e.evt.button === 1 && this.state.isEdit) {
      // 中键
      if (this.isMiddleMousePressed) return

      e.evt.preventDefault() // 阻止默认行为
      e.evt.stopPropagation() // 阻止事件传播到节点
      // 清空变换框选择
      this.stateManage.class.transformer.resetTransformer([])
      // 标记鼠标中键被按下
      this.isMiddleMousePressed = true
      this.lastMousePosition = { x: e.evt.clientX, y: e.evt.clientY }
      // 启用性能优化
      this.enableDragOptimization()
      // 禁用所有节点的拖动
      this.stateManage.class.node.disableDragging()
      // 设置画布拖拽状态
      this.state.isCanvasDragging = true

      // 启用画布拖放
      if (!this.state.stage.draggable()) {
        // 中键移动时 不启用画布拖动 启用拖动属性会造成性能损失  但是需要启用光标变换
        this.stateManage.class.stage.enableStageDrag(true)
      }
    }
  }

  /**
   * 处理鼠标移动事件（中键拖动）
   * @param {Object} e - 鼠标事件对象
   */
  handleMouseMove(e) {
    if (this.isMiddleMousePressed && this.state.isEdit) {
      const currentMousePosition = { x: e.evt.clientX, y: e.evt.clientY }
      const dx = currentMousePosition.x - this.lastMousePosition.x
      const dy = currentMousePosition.y - this.lastMousePosition.y

      const stage = this.state.stage
      stage.x(stage.x() + dx)
      stage.y(stage.y() + dy)

      // 使用 requestAnimationFrame 延迟绘制和 DOM 更新
      this.stateManage.class.dom.updateDomPosition()
      this.stateManage.class.event.trigger('mouseMiddleMove', e)
      this.lastMousePosition = currentMousePosition
    }
  }

  /**
   * 处理鼠标抬起事件（中键释放）
   * @param {Object} e - 鼠标事件对象
   */
  handleMouseUp(e) {
    if (e.button === 1) {
      // 鼠标中键
      // 解除标记
      this.isMiddleMousePressed = false
      // 启用所有节点的拖动
      this.stateManage.class.node.enableDragging()
      // 禁用画布拖放
      this.stateManage.class.stage.disableStageDrag()
      // 恢复性能优化
      this.disableDragOptimization()
      //  清除画布拖拽状态
      this.state.isCanvasDragging = false
    }
  }
  /**
   * 启用拖拽性能优化
   * 在大量节点时禁用节点事件并启用缓存
   */
  enableDragOptimization() {
    if (this.isDragOptimized) return
    const allNodes = this.stateManage.class.node.getAllLayersNodes()
    const nodeCount = allNodes.length
    // 只在节点数量超过阈值时启用优化
    const threshold = this.config.dragOptimizationThreshold || 50
    if (nodeCount < threshold) return
    this.isDragOptimized = true
    // 分批处理节点以避免阻塞
    this.processBatchOptimization(allNodes, 0, 20)
  }
  /**
   * 批量处理节点优化
   * @param {Array} nodes - 节点数组
   * @param {number} startIndex - 开始索引
   * @param {number} batchSize - 批次大小
   */
  processBatchOptimization(nodes, startIndex, batchSize) {
    const endIndex = Math.min(startIndex + batchSize, nodes.length)
    const batch = nodes.slice(startIndex, endIndex)

    batch.forEach((node) => {
      try {
        // 禁用节点事件
        if (node.listening()) {
          node.listening(false)
          this.disabledNodes.add(node)
        }

        // 为节点添加缓存
        if (!node.isCached() && this.canSafelyCache(node)) {
          node.cache({
            pixelRatio: 0.8,
            imageSmoothingEnabled: false
          })
          this.cachedNodes.add(node)
        }
      } catch (error) {
        console.warn(`优化节点 ${node.attrs.id} 失败:`, error)
      }
    })

    // 继续处理下一批
    if (endIndex < nodes.length) {
      requestAnimationFrame(() => {
        this.processBatchOptimization(nodes, endIndex, batchSize)
      })
    }
  }

  //：检查是否可以安全缓存
  canSafelyCache(node) {
    try {
      // 检查图片尺寸
      if (node.width() <= 0 || node.height() <= 0) return false

      // 如果是跨域图片
      if (this.isCrossOriginSrc(node.attrs.props?.data)) {
        return false
      }

      return true
    } catch (error) {
      console.warn('检查缓存安全性时出错:', error)
      return false
    }
  }
  // 检查是否是跨域资源
  isCrossOriginSrc(src) {
    if (!src) return false
    // 数据URL不是跨域的
    if (String(src).startsWith('data:')) return false

    // 相对路径不是跨域的
    if (!String(src).startsWith('http')) return false

    // 检查是否与当前域名相同
    try {
      const url = new URL(String(src))
      const currentOrigin = window.location.origin
      return url.origin !== currentOrigin
    } catch (error) {
      return false
    }
  }
  /**
   * 禁用拖拽性能优化
   * 恢复节点事件并清除缓存
   */
  disableDragOptimization() {
    if (!this.isDragOptimized) return
    this.isDragOptimized = false

    // 使用防抖避免频繁恢复缓存
    if (this.cacheRestoreDebounce) {
      clearTimeout(this.cacheRestoreDebounce)
    }
    this.cacheRestoreDebounce = setTimeout(() => {
      // 复用现有的恢复逻辑
      const allDisabledNodes = Array.from(this.disabledNodes)
      const allCachedNodes = Array.from(this.cachedNodes)
      this.processBatchRestore(allDisabledNodes, allCachedNodes, 0, 15)
      this.cacheRestoreDebounce = null
    }, 500)
  }
  /**
   * 批量恢复节点
   * @param {Array} disabledNodes - 禁用事件的节点数组
   * @param {Array} cachedNodes - 缓存的节点数组
   * @param {number} startIndex - 开始索引
   * @param {number} batchSize - 批次大小
   */
  processBatchRestore(disabledNodes, cachedNodes, startIndex, batchSize) {
    const endIndex = Math.min(
      startIndex + batchSize,
      Math.max(disabledNodes.length, cachedNodes.length)
    )

    // 恢复事件监听
    if (startIndex < disabledNodes.length) {
      const disabledBatch = disabledNodes.slice(
        startIndex,
        Math.min(endIndex, disabledNodes.length)
      )
      disabledBatch.forEach((node) => {
        try {
          node.listening(true)
          this.disabledNodes.delete(node)
        } catch (error) {
          console.warn(`恢复节点事件失败:`, error)
        }
      })
    }

    // 清除缓存
    if (startIndex < cachedNodes.length) {
      const cachedBatch = cachedNodes.slice(startIndex, Math.min(endIndex, cachedNodes.length))
      cachedBatch.forEach((node) => {
        try {
          if (node.isCached()) {
            node.clearCache()
          }
          this.cachedNodes.delete(node)
        } catch (error) {
          console.warn(`清除节点缓存失败:`, error)
        }
      })
    }

    // 继续处理下一批
    if (endIndex < Math.max(disabledNodes.length, cachedNodes.length)) {
      requestAnimationFrame(() => {
        this.processBatchRestore(disabledNodes, cachedNodes, endIndex, batchSize)
      })
    }
  }
  /**
   * 全选所有可选择的节点
   */
  selectAllNodes() {
    const allNodes = this.stateManage.class.node.getAllLayersNodes()
    const selectableNodes = allNodes.filter(
      (node) =>
        node.attrs.transformable &&
        !node.attrs.lock &&
        node.visible() &&
        node.attrs.name !== 'kd_mask'
    )

    if (selectableNodes.length > 0) {
      this.stateManage.class.transformer.resetTransformer(selectableNodes)
    }
  }

  /**
   * 撤销操作
   */
  undo() {
    if (this.stateManage.class.history && this.stateManage.class.history.undo) {
      this.stateManage.class.history.undo()
    }
  }

  /**
   * 重做操作
   */
  redo() {
    if (this.stateManage.class.history && this.stateManage.class.history.redo) {
      this.stateManage.class.history.redo()
    }
  }

  /**
   * 组合选中的节点
   */
  groupSelectedNodes() {
    const selectedNodes = this.stateManage.state.transformer.nodes()
    if (selectedNodes.length > 1) {
      this.stateManage.class.node.groupNodes()
    }
  }

  /**
   * 解组选中的节点
   */
  ungroupSelectedNodes() {
    const selectedNodes = this.stateManage.state.transformer.nodes()
    if (selectedNodes.length === 1 && selectedNodes[0].attrs?.name === 'group') {
      this.stateManage.class.node.ungroupNodes(selectedNodes[0])
    }
  }

  /**
   * 切换选中节点的锁定状态
   */
  toggleLockSelectedNodes() {
    const selectedNodes = this.stateManage.state.transformer.nodes()
    if (selectedNodes.length > 0) {
      const isAnyLocked = selectedNodes.some((node) => node.attrs.lock)
      if (isAnyLocked) {
        this.stateManage.class.node.unlockNodes()
      } else {
        this.stateManage.class.node.lockNodes()
      }
    }
  }

  /**
   * 切换选中节点的可见性
   */
  toggleVisibilitySelectedNodes() {
    const selectedNodes = this.stateManage.state.transformer.nodes()
    if (selectedNodes.length > 0) {
      const isAnyHidden = selectedNodes.some((node) => !node.visible())
      if (isAnyHidden) {
        this.stateManage.class.node.showNodes(null, 200)
      } else {
        this.stateManage.class.node.hideNodes(null, 200)
      }
    }
  }

  /**
   * 将选中节点移动到顶层
   */
  moveSelectedToTop() {
    const selectedNodes = this.stateManage.state.transformer.nodes()
    if (selectedNodes.length > 0) {
      this.stateManage.class.layer.moveToTop()
    }
  }

  /**
   * 将选中节点移动到底层
   */
  moveSelectedToBottom() {
    const selectedNodes = this.stateManage.state.transformer.nodes()
    if (selectedNodes.length > 0) {
      this.stateManage.class.layer.moveToBottom()
    }
  }

  /**
   * 将选中节点上移一层
   */
  moveSelectedUp() {
    const selectedNodes = this.stateManage.state.transformer.nodes()
    if (selectedNodes.length > 0) {
      this.stateManage.class.layer.moveUp()
    }
  }

  /**
   * 将选中节点下移一层
   */
  moveSelectedDown() {
    const selectedNodes = this.stateManage.state.transformer.nodes()
    if (selectedNodes.length > 0) {
      this.stateManage.class.layer.moveDown()
    }
  }

  /**
   * 聚焦到选中的节点
   */
  focusSelectedNode() {
    const selectedNodes = this.stateManage.state.transformer.nodes()
    if (selectedNodes.length === 1) {
      this.stateManage.class.node.focusNode(selectedNodes[0])
    }
  }

  /**
   * 获取快捷键帮助信息
   * @returns {Array} 快捷键列表
   */
  getHotKeyList() {
    return [
      { key: 'Ctrl+A / ⌘+A', description: '全选所有节点' },
      { key: 'Ctrl+C / ⌘+C', description: '复制选中节点' },
      { key: 'Ctrl+X / ⌘+X', description: '剪切选中节点' },
      { key: 'Ctrl+V / ⌘+V', description: '粘贴节点' },
      { key: 'Delete/Backspace', description: '删除选中节点' },
      { key: 'Ctrl+Z / ⌘+Z', description: '撤销' },
      { key: 'Ctrl+Y / Ctrl+Shift+Z / ⌘+Shift+Z', description: '重做' },
      { key: 'Ctrl+G / ⌘+G', description: '组合选中节点' },
      { key: 'Ctrl+Shift+G / ⌘+Shift+G', description: '解散组合' },
      { key: 'Ctrl+L / ⌘+L', description: '切换锁定状态' },
      { key: 'Ctrl+H / ⌘+H', description: '切换显示/隐藏' },
      { key: 'Ctrl+] / ⌘+]', description: '移到顶层' },
      { key: 'Ctrl+[ / ⌘+[', description: '移到底层' },
      { key: 'Ctrl+↑ / ⌘+↑', description: '上移一层' },
      { key: 'Ctrl+↓ / ⌘+↓', description: '下移一层' },
      { key: '↑↓←→', description: '微移动选中节点' },
      { key: 'F', description: '聚焦到选中节点' },
      { key: '长按空格键/鼠标中键', description: '拖动画布' }
    ]
  }
}
