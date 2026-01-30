/**
 * @module EventHandler
 * @name 事件
 * @description 管理和处理 Konva 舞台中的事件。
 * 能够监听、触发和解绑事件，支持拖拽、缩放、点击等多种操作。
 */
import { throttle } from 'lodash'

export default class EventHandler {
  constructor(state, stateManage, config) {
    this.config = config
    this.stateManage = stateManage
    this.state = state
    this.usedTemporaryLayer = false
    // 预先绑定事件处理函数
    this.boundDragStart = this.handleDragStart.bind(this)
    this.boundDragMove = throttle(this.handleDragMove.bind(this), 6)
    this.boundDragEnd = throttle(this.handleDragEnd.bind(this), 100, {
      leading: true,
      trailing: false
    })
    this.timers = new Set()
    this.isDomDragging = false // DOM拖动状态标记
    this.currentTween = null
    this.cacheRestoreTimer = null // 缓存恢复延迟定时器
    this.isZooming = false
    this.zoomTimeout = null
    this.boundWheel = throttle(this.handleWheel.bind(this), 50)
    this.boundClickTap = this.handleClickTap.bind(this)
    this.boundMouseDownTouchStart = this.handleMouseDownTouchStart.bind(this)
    this.boundMouseMoveTouchMove = throttle(this.handleMouseMoveTouchMove.bind(this), 20)
    this.boundMouseUpTouchEnd = this.handleMouseUpTouchEnd.bind(this)
    this.boundSystemMouseUp = this.handleSystemMouseUp.bind(this)
    this.boundMouseLeave = this.handleMouseLeave.bind(this)
    this.boundContextMenu = this.handleContextMenu.bind(this)
    this.playingAnimationsBeforeZoom = new Map() // 记录缩放前正在播放的动画
  }

  /**
   * 初始化所有事件绑定，包括变换框、快捷键、DOM 更新等
   */
  initEvents() {
    this.unbindEvents()
    // 变换框和框选事件
    this.stateManage.class.transformer.bindTransformerEvent()
    this.stateManage.class.transformer.resetTransformer()
    // DOM位置更新事件
    this.stateManage.class.dom.bindUpdateDomEvent()
    // 快捷键事件
    this.stateManage.class.hotkey.bindHotKeys()
    this.bindStageEvent()
    this.initEventsHandler()
    // 绑定全局 mouseup 事件
    window.addEventListener('mouseup', this.boundSystemMouseUp)
  }

  /**
   * 解绑所有事件监听器
   */
  unbindEvents() {
    // 清理定时器和动画
    this.clearAllTimers()

    // 清理当前动画
    if (this.currentTween) {
      this.currentTween.destroy()
      this.currentTween = null
    }

    // 清理缩放超时
    if (this.zoomTimeout) {
      clearTimeout(this.zoomTimeout)
      this.zoomTimeout = null
    }
    // 清理缩放优化状态
    if (this.stateManage.class.hotkey.isDragOptimized) {
      this.stateManage.class.hotkey.disableDragOptimization()
    }
    if (this.cacheRestoreTimer) {
      clearTimeout(this.cacheRestoreTimer)
      this.cacheRestoreTimer = null
    }
    // 快捷键事件
    this.stateManage.class.hotkey.unbindHotKeys()
    this.unbindStageEvent()
    this.unbindEventsHandler()
    // 移除全局 mouseup 事件
    window.removeEventListener('mouseup', this.boundSystemMouseUp)

    // 清理状态
    this.isZooming = false
    this.usedTemporaryLayer = false
    this.isDomDragging = false

    // 清理动画相关状态
    this.playingAnimationsBeforeZoom.clear()
  }

  /**
   * 绑定 Konva 舞台上的事件，如拖拽、缩放、点击等
   */
  bindStageEvent() {
    // 定义事件映射
    const eventMap = {
      dragstart: this.boundDragStart,
      dragmove: this.boundDragMove,
      dragend: this.boundDragEnd,
      wheel: this.boundWheel,
      'click tap': this.boundClickTap,
      'mousedown touchstart': this.boundMouseDownTouchStart,
      'mousemove touchmove': this.boundMouseMoveTouchMove,
      'mouseup touchend': this.boundMouseUpTouchEnd,
      mouseleave: this.boundMouseLeave,
      contextmenu: this.boundContextMenu
    }

    // 绑定事件
    Object.keys(eventMap).forEach((eventType) => {
      this.state.stage.on(eventType, eventMap[eventType])
    })

    // 存储绑定的事件映射以便后续解绑
    this.stageEventMap = eventMap
  }

  /**
   * 解绑 Konva 舞台上的事件
   */
  unbindStageEvent() {
    if (this.stageEventMap) {
      Object.keys(this.stageEventMap).forEach((eventType) => {
        this.state.stage.off(eventType, this.stageEventMap[eventType])
      })
    }
  }

  /**
   * 初始化自定义事件的处理程序，如节点添加事件
   */
  initEventsHandler() {
    this.on('addNode', this.handleAddNode.bind(this))
  }

  /**
   * 解绑自定义事件的处理程序
   */
  unbindEventsHandler() {
    this.off('addNode', this.handleAddNode.bind(this))
  }

  /**
   * 处理 dragstart 事件
   * @param {Object} e - 事件对象
   */
  handleDragStart(e) {
    if (this.state.isCanvasDragging) {
      return
    }

    // 获取当前拖动的节点
    const draggedNode = this.stateManage.class.node.getEventNode(e)
    // 实时检查节点状态 (容错处理 避免节点状态错误的时候 节点被错误的拖动)
    if (!this.canNodeBeDragged(draggedNode)) {
      // 强制停止拖动
      e.target.draggable(false)
      e.evt.preventDefault()
      return
    }
    // 检查是否是DOM节点拖动
    if (this.isDomNode(draggedNode)) {
      this.isDomDragging = true
      this.trigger('dragstart', e)
      return
    }

    this.trigger('dragstart', e)

    // 判断节点是否为可变换的节点
    if (draggedNode && draggedNode.attrs && draggedNode.attrs.transformable) {
      // 判断节点是否在变换框中
      const isInTransformer = this.stateManage.class.transformer.hasNodeInTransformer(draggedNode)

      // 如果不在变换框中，清空当前变换框并重置selectedNodes
      if (!isInTransformer) {
        // 清空变换框并添加当前节点
        this.stateManage.class.transformer.resetTransformer([])
        // 重置selectedNodes
        this.state.selectedNodes = [draggedNode]
      }
      // 暂时干掉这个功能 会引发影响性能和崩溃问题
      //   const selectedNodes = this.state.selectedNodes || []
      //   if (selectedNodes.length === 1 && selectedNodes[0]?.attrs.props?.disabledSelect !== undefined) {
      //     // 线条这种存在的disabledSelect属性的跳过 避免moveToTopTemporary引发的系统崩溃
      //     this.usedTemporaryLayer = false
      //   } else if (selectedNodes.length < this.config.tempLayerNodeLimit) {
      //     this.stateManage.class.layer.moveToTopTemporary(selectedNodes)
      //     // 标记当前拖动使用了临时层级功能
      //     this.usedTemporaryLayer = true
      //   } else {
      //     this.usedTemporaryLayer = false
      //   }
    }
  }
  /**
   * 检查节点是否可以被拖动
   */
  canNodeBeDragged(node) {
    if (!node) return false
    //  检查节点本身是否被锁定
    if (node.attrs?.lock === true) {
      return false
    }
    //  检查是否在锁定的组合中
    let parent = node.parent
    while (parent) {
      if (parent.attrs?.name === 'group' && parent.attrs?.lock === true) {
        return false
      }
      parent = parent.parent
    }
    return true
  }

  /**
   * 处理 dragmove 事件
   * @param {Object} e - 事件对象
   */
  handleDragMove(e) {
    // 检查是否处于画布拖拽模式，如果是则只更新DOM位置，不处理对齐线
    if (this.state.isCanvasDragging) {
      // 更新 DOM 位置
      this.stateManage.class.dom.updateDomPosition()
      this.trigger('dragmove', e)
      return
    }
    // 更新 DOM 位置
    this.stateManage.class.dom.updateDomPosition()
    this.trigger('dragmove', e)
    requestAnimationFrame(() => {
      // 绘制对齐参考线
      this.stateManage.class.align.handleAlignLineDraw(e)
    })
  }

  /**
   * 处理 dragend 事件
   * @param {Object} e - 事件对象
   */
  handleDragEnd(e) {

    // 检查是否处于画布拖拽模式
    if (this.state.isCanvasDragging) {
      this.trigger('dragend', e)
      return
    }

    if (this.state.isEdit) {
      this.createTimer(() => {
        this.stateManage.class.align.clearAlignLine(e)
      }, 0)
      if (this.state.transformer.nodes.length) {
        this.stateManage.class.history.addHistory({ title: '移动节点' })
      } else {
        this.stateManage.class.history.addHistory({ title: '移动画布' })
      }
    }

    // 如果是DOM拖动结束，重置状态
    if (this.isDomDragging) {
      this.isDomDragging = false
      this.trigger('dragend', e)
      return
    }
    if (this.usedTemporaryLayer) {
      // 恢复节点到原始层级
      this.stateManage.class.layer.restoreOriginalLayer(this.state.selectedNodes)
      this.usedTemporaryLayer = false
    }
    
    this.trigger('dragend', e)
  }
  /**
   * 处理 wheel 事件（缩放）
   * @param {Object} e - 事件对象
   */
  handleWheel(e) {
    e.evt.preventDefault()

    // 检查是否处于多选拖拽状态，如果是则直接返回，避免冲突
    const transformer = this.stateManage.class.transformer
    if (transformer.isGroupDragging) {
      return
    }

    // 开始缩放时创建临时组并暂停所有动画
    if (!this.isZooming) {
      this.isZooming = true
      this.stateManage.class.group.createProxyGroup()

      // 如果当前有多选状态，暂时清除多选缓存以避免位置计算错误
      if (transformer.selectedNodes && transformer.selectedNodes.length > 1) {
        transformer.disableCacheMode()
      }

      if (this.cacheRestoreTimer) {
        clearTimeout(this.cacheRestoreTimer)
        this.cacheRestoreTimer = null
      }
      if (!this.state.isEdit) {
        this.stateManage.class.hotkey.enableDragOptimization()
      }
    }

    // 停止之前的动画
    if (this.currentTween) {
      this.currentTween.destroy()
      this.currentTween = null
    }

    const stage = this.state.stage
    const scaleBy = 1.15 // 缩放步长
    const oldScale = stage.scaleX()

    // 根据编辑状态决定缩放中心点
    let centerPoint
    if (this.state.isEdit) {
      // 编辑模式：以鼠标位置为中心
      centerPoint = stage.getPointerPosition()
    } else {
      // 非编辑模式：以画布中心点为中心
      centerPoint = {
        x: stage.width() / 2,
        y: stage.height() / 2
      }
    }

    // 计算新缩放比例
    const direction = e.evt.deltaY > 0 ? -1 : 1
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy
    const boundedScale = Math.max(0.1, Math.min(5, newScale))

    // 以指定中心点进行缩放
    const centerPointTo = {
      x: (centerPoint.x - stage.x()) / oldScale,
      y: (centerPoint.y - stage.y()) / oldScale
    }

    const newPos = {
      x: centerPoint.x - centerPointTo.x * boundedScale,
      y: centerPoint.y - centerPointTo.y * boundedScale
    }

    // 创建平滑动画
    this.currentTween = new Konva.Tween({
      node: stage,
      duration: 0.1,
      scaleX: boundedScale,
      scaleY: boundedScale,
      x: newPos.x,
      y: newPos.y,
      easing: Konva.Easings.EaseOut,
      onUpdate: () => {
        this.trigger('wheel', e)
        this.stateManage.class.dom.updateDomPosition()

        // 缩放过程中更新多选边界
        if (transformer.selectedNodes && transformer.selectedNodes.length > 1) {
          transformer.multiSelectBounds = this.stateManage.class.node.calculateNodesBounds(
            transformer.selectedNodes
          )
        }
      },
      onFinish: () => {
        this.trigger('wheel', e)
        this.currentTween = null
        this.endZooming()

        // 缩放结束后强制更新变换框
        if (this.state.transformer && this.state.transformer.nodes().length > 0) {
          setTimeout(() => {
            this.state.transformer.forceUpdate()
          }, 10)
        }
      }
    })
    this.currentTween.play()

    // 触发其他相关事件
    this.stateManage.class.stage.stageSetFocus()
    this.stateManage.class.align.clearAlignLine(e)
  }

  /**
   * 结束缩放状态
   */
  endZooming() {
    if (this.isZooming) {
      this.isZooming = false

      // 解散临时组
      this.stateManage.class.group.removeProxyGroup()

      // 如果有多选状态，重新计算边界并更新变换框
      const transformer = this.stateManage.class.transformer
      if (transformer.selectedNodes && transformer.selectedNodes.length > 1) {
        // 重新计算多选边界
        transformer.multiSelectBounds = this.stateManage.class.node.calculateNodesBounds(
          transformer.selectedNodes
        )

        // 延迟更新变换框位置，确保缩放完全结束
        setTimeout(() => {
          if (this.state.transformer && this.state.transformer.nodes().length > 0) {
            this.state.transformer.forceUpdate()
          }
        }, 50)
      }
      // 延迟恢复缓存优化
      if (!this.state.isEdit && this.stateManage.class.hotkey.isDragOptimized) {
        // 延迟600ms恢复，避免频繁缩放时的缓存操作
        this.cacheRestoreTimer = setTimeout(() => {
          this.stateManage.class.hotkey.disableDragOptimization()
          this.cacheRestoreTimer = null
        }, 600)
      }

      clearTimeout(this.zoomTimeout)
    }
  }

  /**
   * 取消动画恢复定时器
   */
  cancelAnimationResumeTimer() {
    if (this.animationResumeTimeout) {
      clearTimeout(this.animationResumeTimeout)
      this.animationResumeTimeout = null
    }
  }
  /**
   * 处理 click 和 tap 事件
   * @param {Object} e - 事件对象
   */
  handleClickTap(e) {
    if (this.state.isEdit) {
      this.stateManage.class.transformer.handleNodeClick(e)
    }
    // 判断是否为节点,触发节点点击的事件
    if (e.target?.attrs?.id) {
      this.trigger('nodeClick', e.target)
    } else if (e.target?.parent?.attrs?.id) {
      this.trigger('nodeClick', e.target.parent)
    }
    this.trigger('click', e)
  }

  /**
   * 处理 mousedown 和 touchstart 事件
   * @param {Object} e - 事件对象
   */
  handleMouseDownTouchStart(e) {
    if (this.state.isEdit) {
      // 检查是否点击在DOM节点上
      const targetNode = this.stateManage.class.node.getEventNode(e)
      if (this.isDomNode(targetNode)) {
        // 如果是DOM节点，不启动框选
        return
      }
      this.stateManage.class.transformer.startTransformerSelection(e)
    }
    this.stateManage.class.hotkey.handleMouseDown(e)
    this.trigger('mousedown', e)
  }

  /**
   * 处理 mousemove 和 touchmove 事件
   * @param {Object} e - 事件对象
   */
  handleMouseMoveTouchMove(e) {
    if (this.state.isEdit) {
      // 如果正在进行DOM拖动，不更新框选
      if (!this.isDomDragging) {
        this.stateManage.class.transformer.updateSelection(e)
      }
    }
    this.stateManage.class.hotkey.handleMouseMove(e)
    this.trigger('mousemove', e)
    // 判断鼠标是否移入或移出节点 只非编辑器检测
    if (this.state.isEdit) return
    const mousePos = this.state.stage.getPointerPosition()
    this.stateManage.class.node.getAllLayersNodes().forEach((node) => {
      const nodeBox = node.getClientRect()
      if (
        mousePos.x >= nodeBox.x &&
        mousePos.x <= nodeBox.x + nodeBox.width &&
        mousePos.y >= nodeBox.y &&
        mousePos.y <= nodeBox.y + nodeBox.height
      ) {
        if (!node.attrs._mouseInside) {
          node.attrs._mouseInside = true
          this.trigger('nodeMouseenter', node)
        }
      } else {
        if (node.attrs._mouseInside) {
          node.attrs._mouseInside = false
          this.trigger('nodeLeave', node)
        }
      }
    })
  }

  /**
   *  处理 mouseup 和 touchend 事件
   * @param {Object} e - 事件对象
   */
  handleMouseUpTouchEnd(e) {
    if (this.state.isEdit) {
      // 如果正在进行DOM拖动，不完成框选
      if (!this.isDomDragging) {
        this.stateManage.class.transformer.completeSelection(e)
      }
    }
    if (this.stateManage?.class) {
      this.stateManage.class.align.clearAlignLine(e)
    } else {
      setTimeout(() => {
        this.stateManage.class.align.clearAlignLine(e)
      }, 100)
    }
    this.stateManage.class.hotkey.handleMouseUp(e)
    this.trigger('mouseup', e)
  }

  /**
   * 处理系统级 mouseup 事件
   * @param {Object} e - 事件对象
   */
  handleSystemMouseUp(e) {
    // 如果在编辑模式下
    if (this.state.isEdit) {
      // 清除对齐参考线
      setTimeout(() => {
        this.stateManage.class.align.clearAlignLine(e)
      }, 100)
      // 如果不是DOM拖动，才完成框选
      if (!this.isDomDragging) {
        this.stateManage.class.transformer.completeSelection(e)
      }
    }

    // 重置DOM拖动状态
    if (this.isDomDragging) {
      this.isDomDragging = false
    }

    // 触发自定义 mouseup 事件
    this.trigger('systemMouseUp', e)
  }

  /**
   * 处理 mouseleave 事件
   * @param {Object} e - 事件对象
   */
  handleMouseLeave(e) {
    this.stateManage.class.hotkey.handleMouseUp(e)
    this.trigger('mouseleave', e)
  }

  /**
   * 处理 contextmenu 事件
   * @param {Object} e - 事件对象
   */
  handleContextMenu(e) {
    e.evt.preventDefault() // 阻止默认右键菜单
    if (this.state.isEdit) {
      const node = this.stateManage.class.node.getEventNode(e)
      e.target = node
      this.trigger('contextmenu', e)
    }
  }

  /**
   * 初始化观察者，用于监听选中的节点变化
   */
  initStateObservers() {
    let preVal = null
    this.stateManage.sub('selectedNodes', (newVal) => {
      if (JSON.stringify(preVal) === JSON.stringify(newVal)) {
        return
      }
      newVal = newVal.filter((item) => {
        return item.attrs.id
      })
      preVal = newVal
      this.stateManage.class.transformer.autoAddMaskToTransformer(newVal)
      this.trigger('select', newVal)
    })
    this.stateManage.sub('history', (newVal) => {
      this.trigger('historyChange', newVal)
    })
  }

  /**
   * 初始化自定义事件的处理程序，如节点添加事件
   */
  handleAddNode(e) {
    // 添加新节点时，检查节点是否有导入标识或被禁用
    if (
      e &&
      e.node &&
      !e.node.attrs._isImported &&
      !this.state.disableAutoAddTransformer &&
      this.state.isEdit
    ) {
      if (e.node && e.node.attrs.id) {
        var findNode = this.stateManage.class.node.getNodeById(e.node.attrs.id)
        if (findNode) {
          // 确保添加的节点存在
          this.stateManage.class.transformer.resetTransformer([e.node])
        }
      }
    }
  }

  /**
   * 监听自定义事件
   * @param {string} eventType - 事件类型
   * @param {Function} callback - 事件触发时执行的回调函数
   */
  on(eventType, callback) {
    if (!this.state.listeners[eventType]) {
      this.state.listeners[eventType] = []
    }
    this.state.listeners[eventType].push(callback)
  }

  /**
   * 移除自定义事件的监听器
   * @param {string} eventType - 事件类型（支持命名空间，例如 'click' 或 'click.2323'）
   * @param {Function} [callback] - 可选的回调函数，如果不传入则移除该类型的所有监听器
   */
  off(eventType, callback) {
    // 遍历所有事件类型，匹配 eventType 或以 eventType. 开头的
    Object.keys(this.state.listeners).forEach((key) => {
      if (key === eventType || key.indexOf(eventType + '.') === 0) {
        if (callback) {
          this.state.listeners[key] = this.state.listeners[key].filter(
            (listener) => listener !== callback
          )
        } else {
          delete this.state.listeners[key]
        }
      }
    })
  }

  /**
   * 触发自定义事件
   * @param {string} eventType -  事件类型（支持触发时自动匹配命名空间，例如触发 'click' 时 'click.2323' 的监听器也会被触发）
   * @param {Object} data - 传递给事件回调的数据
   */
  trigger(eventType, data) {
    // 如果 data 是对象且非数组，默认增加 state 数据对象
    if (typeof data === 'object' && !Array.isArray(data)) {
      data.state = this.state
    }
    // 遍历所有监听器，匹配事件名或以 eventType. 开头的情况
    Object.keys(this.state.listeners).forEach((key) => {
      if (key === eventType || key.indexOf(eventType + '.') === 0) {
        this.state.listeners[key].forEach((callback) => callback(data))
      }
    })
  }

  /**
   * 创建可清理的定时器
   */
  createTimer(callback, delay) {
    const timerId = setTimeout(() => {
      this.timers.delete(timerId)
      callback()
    }, delay)
    this.timers.add(timerId)
    return timerId
  }

  /**
   * 清理所有定时器
   */
  clearAllTimers() {
    this.timers.forEach((timerId) => clearTimeout(timerId))
    this.timers.clear()
  }
  /**
   * 检查是否是DOM类型的节点
   * @param {Object} node - 要检查的节点
   * @returns {boolean} - 是否是DOM节点
   */
  isDomNode(node) {
    return (
      node && (node.attrs?.domId || node.name() === 'dom-rect' || node.attrs?.name === 'dom-rect')
    )
  }
  /**
   * 完全销毁事件处理器，清理所有资源
   */
  destroy() {
    this.unbindEvents()
    if (this.state.listeners) {
      this.state.listeners = {}
    }
  }
}
