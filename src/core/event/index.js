/**
 * @module EventHandler
 * @name Event
 * @description Manage and handle Konva Events in the stage。
 * Can listen、Trigger and unbind events，Support dragging、Zooming、Clicking and other operations。
 */
import { throttle } from 'lodash'

export default class EventHandler {
  constructor(state, stateManage, config) {
    this.config = config
    this.stateManage = stateManage
    this.state = state
    this.usedTemporaryLayer = false
    // Pre-bind event handlers
    this.boundDragStart = this.handleDragStart.bind(this)
    this.boundDragMove = throttle(this.handleDragMove.bind(this), 6)
    this.boundDragEnd = throttle(this.handleDragEnd.bind(this), 100, {
      leading: true,
      trailing: false
    })
    this.timers = new Set()
    this.isDomDragging = false // DOMDragging state flag
    this.currentTween = null
    this.cacheRestoreTimer = null // Cache recovery delay timer
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
    this.playingAnimationsBeforeZoom = new Map() // Record animations playing before zoom
  }

  /**
   * Initialize all event bindings，Including the transformer、Keyboard shortcuts、DOM Updates, etc.
   */
  initEvents() {
    this.unbindEvents()
    // Transformer and selection events
    this.stateManage.class.transformer.bindTransformerEvent()
    this.stateManage.class.transformer.resetTransformer()
    // DOMPosition update events
    this.stateManage.class.dom.bindUpdateDomEvent()
    // Keyboard shortcut events
    this.stateManage.class.hotkey.bindHotKeys()
    this.bindStageEvent()
    this.initEventsHandler()
    // Bind global mouseup Events
    window.addEventListener('mouseup', this.boundSystemMouseUp)
  }

  /**
   * Unbind all event listeners
   */
  unbindEvents() {
    // Clear timers and animations
    this.clearAllTimers()

    // Clear current animation
    if (this.currentTween) {
      this.currentTween.destroy()
      this.currentTween = null
    }

    // Clear zoom timeout
    if (this.zoomTimeout) {
      clearTimeout(this.zoomTimeout)
      this.zoomTimeout = null
    }
    // Clear zoom optimization state
    if (this.stateManage.class.hotkey.isDragOptimized) {
      this.stateManage.class.hotkey.disableDragOptimization()
    }
    if (this.cacheRestoreTimer) {
      clearTimeout(this.cacheRestoreTimer)
      this.cacheRestoreTimer = null
    }
    // Keyboard shortcut events
    this.stateManage.class.hotkey.unbindHotKeys()
    this.unbindStageEvent()
    this.unbindEventsHandler()
    // Remove global mouseup Events
    window.removeEventListener('mouseup', this.boundSystemMouseUp)

    // Clean up state
    this.isZooming = false
    this.usedTemporaryLayer = false
    this.isDomDragging = false

    // Clean up animation related states
    this.playingAnimationsBeforeZoom.clear()
  }

  /**
   * Bind Konva Events on the stage，Such as dragging、Zooming、Clicking, etc.
   */
  bindStageEvent() {
    // Define event mapping
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

    // Bind events
    Object.keys(eventMap).forEach((eventType) => {
      this.state.stage.on(eventType, eventMap[eventType])
    })

    // Store the bound event mapping for later unbinding
    this.stageEventMap = eventMap
  }

  /**
   * Unbind Konva Events on the stage
   */
  unbindStageEvent() {
    if (this.stageEventMap) {
      Object.keys(this.stageEventMap).forEach((eventType) => {
        this.state.stage.off(eventType, this.stageEventMap[eventType])
      })
    }
  }

  /**
   * Initialize custom event handlers，Such as node addition events
   */
  initEventsHandler() {
    this.on('addNode', this.handleAddNode.bind(this))
  }

  /**
   * Unbind custom event handlers
   */
  unbindEventsHandler() {
    this.off('addNode', this.handleAddNode.bind(this))
  }

  /**
   * Handle dragstart Events
   * @param {Object} e - Event object
   */
  handleDragStart(e) {
    if (this.state.isCanvasDragging) {
      return
    }

    // Get the currently dragged node
    const draggedNode = this.stateManage.class.node.getEventNode(e)
    // Check node status in real time (Fault tolerance processing Avoid when node status is wrong Node is dragged incorrectly)
    if (!this.canNodeBeDragged(draggedNode)) {
      // Force stop dragging
      e.target.draggable(false)
      e.evt.preventDefault()
      return
    }
    // Check if it isDOMNode dragging
    if (this.isDomNode(draggedNode)) {
      this.isDomDragging = true
      this.trigger('dragstart', e)
      return
    }

    this.trigger('dragstart', e)

    // Determine if the node is transformable
    if (draggedNode && draggedNode.attrs && draggedNode.attrs.transformable) {
      // Determine if the node is in the transformer
      const isInTransformer = this.stateManage.class.transformer.hasNodeInTransformer(draggedNode)

      // If not in the transformer，Clear the current transformer and resetselectedNodes
      if (!isInTransformer) {
        // Clear the transformer and add the current node
        this.stateManage.class.transformer.resetTransformer([])
        // ResetselectedNodes
        this.state.selectedNodes = [draggedNode]
      }
      // Temporarily disable this function Causes performance and crash issues
      //   const selectedNodes = this.state.selectedNodes || []
      //   if (selectedNodes.length === 1 && selectedNodes[0]?.attrs.props?.disabledSelect !== undefined) {
      //     // Lines with thisdisabledSelectAttribute skip AvoidmoveToTopTemporaryCausing system crash
      //     this.usedTemporaryLayer = false
      //   } else if (selectedNodes.length < this.config.tempLayerNodeLimit) {
      //     this.stateManage.class.layer.moveToTopTemporary(selectedNodes)
      //     // Mark that current dragging uses temporary layer function
      //     this.usedTemporaryLayer = true
      //   } else {
      //     this.usedTemporaryLayer = false
      //   }
    }
  }
  /**
   * Check if the node can be dragged
   */
  canNodeBeDragged(node) {
    if (!node) return false
    //  Check if the node itself is locked
    if (node.attrs?.lock === true) {
      return false
    }
    //  Check if in a locked group
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
   * Handle dragmove Events
   * @param {Object} e - Event object
   */
  handleDragMove(e) {
    // Check if in canvas drag mode，If so, only updateDOMPosition，Do not handle alignment lines
    if (this.state.isCanvasDragging) {
      // Update DOM Position
      this.stateManage.class.dom.updateDomPosition()
      this.trigger('dragmove', e)
      return
    }
    // Update DOM Position
    this.stateManage.class.dom.updateDomPosition()
    this.trigger('dragmove', e)
    requestAnimationFrame(() => {
      // Draw alignment reference lines
      this.stateManage.class.align.handleAlignLineDraw(e)
    })
  }

  /**
   * Handle dragend Events
   * @param {Object} e - Event object
   */
  handleDragEnd(e) {

    // Check if in canvas drag mode
    if (this.state.isCanvasDragging) {
      this.trigger('dragend', e)
      return
    }

    if (this.state.isEdit) {
      this.createTimer(() => {
        this.stateManage.class.align.clearAlignLine(e)
      }, 0)
      if (this.state.transformer.nodes.length) {
        this.stateManage.class.history.addHistory({ title: 'Move Node' })
      } else {
        this.stateManage.class.history.addHistory({ title: 'Move Canvas' })
      }
    }

    // IfDOMDrag end，Reset state
    if (this.isDomDragging) {
      this.isDomDragging = false
      this.trigger('dragend', e)
      return
    }
    if (this.usedTemporaryLayer) {
      // Restore node to original layer
      this.stateManage.class.layer.restoreOriginalLayer(this.state.selectedNodes)
      this.usedTemporaryLayer = false
    }
    
    this.trigger('dragend', e)
  }
  /**
   * Handle wheel Events（Zoom）
   * @param {Object} e - Event object
   */
  handleWheel(e) {
    e.evt.preventDefault()

    // Check if in multi-select drag state，If so, return directly，Avoid conflicts
    const transformer = this.stateManage.class.transformer
    if (transformer.isGroupDragging) {
      return
    }

    // Create a temporary group and pause all animations when starting zoom
    if (!this.isZooming) {
      this.isZooming = true
      this.stateManage.class.group.createProxyGroup()

      // If in multi-select state，Temporarily clear multi-select cache to avoid position calculation errors
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

    // Stop previous animation
    if (this.currentTween) {
      this.currentTween.destroy()
      this.currentTween = null
    }

    const stage = this.state.stage
    const scaleBy = 1.15 // Zoom step
    const oldScale = stage.scaleX()

    // Determine zoom center point according to edit state
    let centerPoint
    if (this.state.isEdit) {
      // Edit mode：Center on mouse position
      centerPoint = stage.getPointerPosition()
    } else {
      // Non-edit mode：Center on canvas center
      centerPoint = {
        x: stage.width() / 2,
        y: stage.height() / 2
      }
    }

    // Calculate new zoom ratio
    const direction = e.evt.deltaY > 0 ? -1 : 1
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy
    const boundedScale = Math.max(0.1, Math.min(5, newScale))

    // Zoom with specified center point
    const centerPointTo = {
      x: (centerPoint.x - stage.x()) / oldScale,
      y: (centerPoint.y - stage.y()) / oldScale
    }

    const newPos = {
      x: centerPoint.x - centerPointTo.x * boundedScale,
      y: centerPoint.y - centerPointTo.y * boundedScale
    }

    // Create smooth animation
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

        // Update multi-select bounds during zoom
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

        // Force update transformer after zoom ends
        if (this.state.transformer && this.state.transformer.nodes().length > 0) {
          setTimeout(() => {
            this.state.transformer.forceUpdate()
          }, 10)
        }
      }
    })
    this.currentTween.play()

    // Trigger other related events
    this.stateManage.class.stage.stageSetFocus()
    this.stateManage.class.align.clearAlignLine(e)
  }

  /**
   * End zoom state
   */
  endZooming() {
    if (this.isZooming) {
      this.isZooming = false

      // Disband temporary group
      this.stateManage.class.group.removeProxyGroup()

      // If in multi-select state，Recalculate bounds and update transformer
      const transformer = this.stateManage.class.transformer
      if (transformer.selectedNodes && transformer.selectedNodes.length > 1) {
        // Recalculate multi-select bounds
        transformer.multiSelectBounds = this.stateManage.class.node.calculateNodesBounds(
          transformer.selectedNodes
        )

        // Delay updating transformer position，Ensure zoom is completely ended
        setTimeout(() => {
          if (this.state.transformer && this.state.transformer.nodes().length > 0) {
            this.state.transformer.forceUpdate()
          }
        }, 50)
      }
      // Delay restoring cache optimization
      if (!this.state.isEdit && this.stateManage.class.hotkey.isDragOptimized) {
        // Delay600msRestore，Avoid cache operations during frequent zooming
        this.cacheRestoreTimer = setTimeout(() => {
          this.stateManage.class.hotkey.disableDragOptimization()
          this.cacheRestoreTimer = null
        }, 600)
      }

      clearTimeout(this.zoomTimeout)
    }
  }

  /**
   * Cancel animation recovery timer
   */
  cancelAnimationResumeTimer() {
    if (this.animationResumeTimeout) {
      clearTimeout(this.animationResumeTimeout)
      this.animationResumeTimeout = null
    }
  }
  /**
   * Handle click and tap Events
   * @param {Object} e - Event object
   */
  handleClickTap(e) {
    if (this.state.isEdit) {
      this.stateManage.class.transformer.handleNodeClick(e)
    }
    // Determine if it is a node,Trigger node click event
    if (e.target?.attrs?.id) {
      this.trigger('nodeClick', e.target)
    } else if (e.target?.parent?.attrs?.id) {
      this.trigger('nodeClick', e.target.parent)
    }
    this.trigger('click', e)
  }

  /**
   * Handle mousedown and touchstart Events
   * @param {Object} e - Event object
   */
  handleMouseDownTouchStart(e) {
    if (this.state.isEdit) {
      // Check if clicked onDOMthe node
      const targetNode = this.stateManage.class.node.getEventNode(e)
      if (this.isDomNode(targetNode)) {
        // IfDOMNode，Do not start selection
        return
      }
      this.stateManage.class.transformer.startTransformerSelection(e)
    }
    this.stateManage.class.hotkey.handleMouseDown(e)
    this.trigger('mousedown', e)
  }

  /**
   * Handle mousemove and touchmove Events
   * @param {Object} e - Event object
   */
  handleMouseMoveTouchMove(e) {
    if (this.state.isEdit) {
      // If ongoingDOMDragging，Do not update selection
      if (!this.isDomDragging) {
        this.stateManage.class.transformer.updateSelection(e)
      }
    }
    this.stateManage.class.hotkey.handleMouseMove(e)
    this.trigger('mousemove', e)
    // Determine if mouse enters or leaves node Only non-editor detection
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
   *  Handle mouseup and touchend Events
   * @param {Object} e - Event object
   */
  handleMouseUpTouchEnd(e) {
    if (this.state.isEdit) {
      // If ongoingDOMDragging，Do not complete selection
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
   * Handle system-level mouseup Events
   * @param {Object} e - Event object
   */
  handleSystemMouseUp(e) {
    // If in edit mode
    if (this.state.isEdit) {
      // Clear alignment reference lines
      setTimeout(() => {
        this.stateManage.class.align.clearAlignLine(e)
      }, 100)
      // If notDOMDragging，Complete selection
      if (!this.isDomDragging) {
        this.stateManage.class.transformer.completeSelection(e)
      }
    }

    // ResetDOMDragging state
    if (this.isDomDragging) {
      this.isDomDragging = false
    }

    // Trigger custom mouseup Events
    this.trigger('systemMouseUp', e)
  }

  /**
   * Handle mouseleave Events
   * @param {Object} e - Event object
   */
  handleMouseLeave(e) {
    this.stateManage.class.hotkey.handleMouseUp(e)
    this.trigger('mouseleave', e)
  }

  /**
   * Handle contextmenu Events
   * @param {Object} e - Event object
   */
  handleContextMenu(e) {
    e.evt.preventDefault() // Prevent default right-click menu
    if (this.state.isEdit) {
      const node = this.stateManage.class.node.getEventNode(e)
      e.target = node
      this.trigger('contextmenu', e)
    }
  }

  /**
   * Initialize observer，Used to listen to selected node changes
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
   * Initialize custom event handlers，Such as node addition events
   */
  handleAddNode(e) {
    // When adding a new node，Check if node has import flag or is disabled
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
          // Ensure the added node exists
          this.stateManage.class.transformer.resetTransformer([e.node])
        }
      }
    }
  }

  /**
   * Listen for custom events
   * @param {string} eventType - Event type
   * @param {Function} callback - Callback function executed when event is triggered
   */
  on(eventType, callback) {
    if (!this.state.listeners[eventType]) {
      this.state.listeners[eventType] = []
    }
    this.state.listeners[eventType].push(callback)
  }

  /**
   * Remove custom event listener
   * @param {string} eventType - Event type（Support namespaces，For example 'click' or 'click.2323'）
   * @param {Function} [callback] - Optional callback function，Remove all listeners of this type if not passed
   */
  off(eventType, callback) {
    // Traverse all event types，Match eventType or eventType. starting with
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
   * Trigger custom event
   * @param {string} eventType -  Event type（Support automatic namespace matching when triggering，For example, when triggering 'click' when 'click.2323' the listener will also be triggered）
   * @param {Object} data - Data passed to the event callback
   */
  trigger(eventType, data) {
    // If data is an object and not an array，Add by default state data object
    if (typeof data === 'object' && !Array.isArray(data)) {
      data.state = this.state
    }
    // Traverse all listeners，Match event names or those starting with eventType. the case starting with
    Object.keys(this.state.listeners).forEach((key) => {
      if (key === eventType || key.indexOf(eventType + '.') === 0) {
        this.state.listeners[key].forEach((callback) => callback(data))
      }
    })
  }

  /**
   * Create a cleanable timer
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
   * Clear all timers
   */
  clearAllTimers() {
    this.timers.forEach((timerId) => clearTimeout(timerId))
    this.timers.clear()
  }
  /**
   * Check if it isDOMtype node
   * @param {Object} node - Node to check
   * @returns {boolean} - Whether it isDOMnode
   */
  isDomNode(node) {
    return (
      node && (node.attrs?.domId || node.name() === 'dom-rect' || node.attrs?.name === 'dom-rect')
    )
  }
  /**
   * Completely destroy the event handler，Clean up all resources
   */
  destroy() {
    this.unbindEvents()
    if (this.state.listeners) {
      this.state.listeners = {}
    }
  }
}
