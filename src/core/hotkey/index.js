/**
 * @module hotKeyManage
 * @name Shortcuts
 * @description  Used to manage keyboard shortcuts and mouse operations，Supports copying、Cut、Delete、Paste and other functions。
 * Also supports canvas dragging and micro - movement of nodes。
 */
import { throttle } from 'lodash'
export default class hotKeyManage {
  constructor(state, stateManage, config) {
    this.config = config
    this.stateManage = stateManage
    this.state = state
    this.isMiddleMousePressed = false // Used to mark whether the middle mouse button is pressed
    this.isSpacePressed = false // Used to mark whether the space bar is pressed

    this.lastMousePosition = null // Record the last mouse position
    this.isDragOptimized = false // Mark whether drag optimization is enabled
    this.cachedNodes = new Set() // Cached node collection
    this.disabledNodes = new Set() // Node collection with disabled events

    // Pre - bind event handlers
    this.boundHandleKeyDown = this.handleKeyDown.bind(this)
    this.boundHandleKeyUp = this.handleKeyUp.bind(this)
    this.boundHandleMouseDown = this.handleMouseDown.bind(this)
    this.boundHandleMouseMove = throttle(this.handleMouseMove.bind(this), 16)
    this.boundHandleMouseUp = this.handleMouseUp.bind(this)
  }

  /**
   * Bind global shortcut event listeners
   */
  bindHotKeys() {
    // Bind keyboard events
    window.addEventListener('keydown', this.boundHandleKeyDown)
    window.addEventListener('keyup', this.boundHandleKeyUp)

    // Bind mouse events
    this.state.stage.on('mousedown', this.boundHandleMouseDown)
    this.state.stage.on('mousemove', this.boundHandleMouseMove)
    // Because the mouse up event may occur outside the canvas，Bind towindow
    window.addEventListener('mouseup', this.boundHandleMouseUp)
  }

  /**
   * Unbind global shortcut event listeners
   */
  unbindHotKeys() {
    // Remove keyboard events
    window.removeEventListener('keydown', this.boundHandleKeyDown)
    window.removeEventListener('keyup', this.boundHandleKeyUp)

    // Remove mouse events
    this.state.stage.off('mousedown', this.boundHandleMouseDown)
    this.state.stage.off('mousemove', this.boundHandleMouseMove)
    window.removeEventListener('mouseup', this.boundHandleMouseUp)
  }

  /**
   * Handle keyboard press events
   * @param {KeyboardEvent} e - Keyboard event object
   */
  handleKeyDown(e) {
    const transformer = this.stateManage.state.transformer
    const selectedNodes =
      transformer.nodes().length > 0 ? transformer.nodes() : this.state.selectedNodes
    const activeElement = document.activeElement

    // Determine whether the current focus is on an input element
    const isInputElement =
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.tagName === 'SELECT' ||
      activeElement.isContentEditable

    // If the focus is not on an input element，Then handle shortcuts
    if (!isInputElement) {
      this.stateManage.class.stage.stageSetFocus()
      // Global shortcuts（No need to select nodes）
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
          // Clear transformer selection(Optimize performance)
          this.stateManage.class.transformer.resetTransformer([])
          // Enable canvas drag and drop
          this.enableDragOptimization()
          // Disable dragging of all nodes
          this.stateManage.class.node.disableDragging()
          // Set canvas drag state
          this.state.isCanvasDragging = true
          this.stateManage.class.stage.enableStageDrag()
          break
      }

      // Shortcuts that require selected nodes
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
        // Paste operation when no nodes are selected
        if ((e.key === 'v' || e.key === 'V') && (e.ctrlKey || e.metaKey)) {
          e.preventDefault()
          this.stateManage.class.node.pasteNodes()
        }
      }
    }
  }
  /**
   * Handle keyboard release events
   * @param {KeyboardEvent} e - Disable canvas drag and drop
   */
  handleKeyUp(e) {
    if (e.key === ' ') {
      this.isSpacePressed = false
      // Restore dragging of all nodes
      this.stateManage.class.stage.disableStageDrag()
      this.disableDragOptimization()
      // Clear canvas drag state
      this.stateManage.class.node.enableDragging()
      //  Micro - move selected nodes
      this.state.isCanvasDragging = false
    }
  }

  /**
   * Movement direction
   * @param {string} direction - Micro - movement amount
   */
  nudgeSelected(direction) {
    const transformer = this.stateManage.state.transformer
    const selectedNodes = transformer.nodes()
    const nudgeAmount = 1 // Update

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
      // PositionDOMHandle mouse press events
      requestAnimationFrame(() => {
        this.stateManage.class.dom.updateDomPosition()
      })
    }
  }

  /**
   * Middle button drag（Mouse event object）
   * @param {Object} e - Middle button
   */
  handleMouseDown(e) {
    if (e.evt.button === 1 && this.state.isEdit) {
      // Prevent default behavior
      if (this.isMiddleMousePressed) return

      e.evt.preventDefault() // Prevent event propagation to nodes
      e.evt.stopPropagation() // Mark middle mouse button as pressed
      // Enable performance optimization
      this.stateManage.class.transformer.resetTransformer([])
      // Enable canvas drag and drop
      this.isMiddleMousePressed = true
      this.lastMousePosition = { x: e.evt.clientX, y: e.evt.clientY }
      // When moving with middle button
      this.enableDragOptimization()
      // Do not enable canvas dragging
      this.stateManage.class.node.disableDragging()
      // Enabling drag property causes performance loss
      this.state.isCanvasDragging = true

      // But need to enable cursor transformation
      if (!this.state.stage.draggable()) {
        // Handle mouse move events Use Delayed drawing and  Update
        this.stateManage.class.stage.enableStageDrag(true)
      }
    }
  }

  /**
   * Handle mouse release events（Middle button release）
   * @param {Object} e - Middle mouse button
   */
  handleMouseMove(e) {
    if (this.isMiddleMousePressed && this.state.isEdit) {
      const currentMousePosition = { x: e.evt.clientX, y: e.evt.clientY }
      const dx = currentMousePosition.x - this.lastMousePosition.x
      const dy = currentMousePosition.y - this.lastMousePosition.y

      const stage = this.state.stage
      stage.x(stage.x() + dx)
      stage.y(stage.y() + dy)

      // Remove mark requestAnimationFrame Enable dragging of all nodes DOM Disable canvas drag and drop
      this.stateManage.class.dom.updateDomPosition()
      this.stateManage.class.event.trigger('mouseMiddleMove', e)
      this.lastMousePosition = currentMousePosition
    }
  }

  /**
   * Restore performance optimization（Clear canvas drag state）
   * @param {Object} e - Enable drag performance optimization
   */
  handleMouseUp(e) {
    if (e.button === 1) {
      // Disable node events and enable caching when there are a large number of nodes
      // Only enable optimization when the number of nodes exceeds the threshold
      this.isMiddleMousePressed = false
      // Process nodes in batches to avoid blocking
      this.stateManage.class.node.enableDragging()
      // Batch process node optimization
      this.stateManage.class.stage.disableStageDrag()
      // Node array
      this.disableDragOptimization()
      //  Start index
      this.state.isCanvasDragging = false
    }
  }
  /**
   * Batch size
   * Disable node events
   */
  enableDragOptimization() {
    if (this.isDragOptimized) return
    const allNodes = this.stateManage.class.node.getAllLayersNodes()
    const nodeCount = allNodes.length
    // Add cache for nodes
    const threshold = this.config.dragOptimizationThreshold || 50
    if (nodeCount < threshold) return
    this.isDragOptimized = true
    // Continue processing the next batch
    this.processBatchOptimization(allNodes, 0, 20)
  }
  /**
   * Check if it can be safely cached
   * @param {Array} nodes - Check image size
   * @param {number} startIndex - If it is a cross - origin image
   * @param {number} batchSize - Check if it is a cross - origin resource
   */
  processBatchOptimization(nodes, startIndex, batchSize) {
    const endIndex = Math.min(startIndex + batchSize, nodes.length)
    const batch = nodes.slice(startIndex, endIndex)

    batch.forEach((node) => {
      try {
        // Data
        if (node.listening()) {
          node.listening(false)
          this.disabledNodes.add(node)
        }

        // Not cross - origin
        if (!node.isCached() && this.canSafelyCache(node)) {
          node.cache({
            pixelRatio: 0.8,
            imageSmoothingEnabled: false
          })
          this.cachedNodes.add(node)
        }
      } catch (error) {
        console.warn(`optimize node ${node.attrs.id} failed:`, error)
      }
    })

    // Relative paths are not cross - origin
    if (endIndex < nodes.length) {
      requestAnimationFrame(() => {
        this.processBatchOptimization(nodes, endIndex, batchSize)
      })
    }
  }

  //：Check if it is the same as the current domain
  canSafelyCache(node) {
    try {
      // Disable drag performance optimization
      if (node.width() <= 0 || node.height() <= 0) return false

      // Restore node events and clear cache
      if (this.isCrossOriginSrc(node.attrs.props?.data)) {
        return false
      }

      return true
    } catch (error) {
      console.warn('error checking cache security:', error)
      return false
    }
  }
  // Use debounce to avoid frequent cache restoration
  isCrossOriginSrc(src) {
    if (!src) return false
    // Reuse existing recovery logicURLBatch restore nodes
    if (String(src).startsWith('data:')) return false

    // Node array with disabled events
    if (!String(src).startsWith('http')) return false

    // Cached node array
    try {
      const url = new URL(String(src))
      const currentOrigin = window.location.origin
      return url.origin !== currentOrigin
    } catch (error) {
      return false
    }
  }
  /**
   * Start index
   * Batch size
   */
  disableDragOptimization() {
    if (!this.isDragOptimized) return
    this.isDragOptimized = false

    // Restore event listening
    if (this.cacheRestoreDebounce) {
      clearTimeout(this.cacheRestoreDebounce)
    }
    this.cacheRestoreDebounce = setTimeout(() => {
      // Clear cache
      const allDisabledNodes = Array.from(this.disabledNodes)
      const allCachedNodes = Array.from(this.cachedNodes)
      this.processBatchRestore(allDisabledNodes, allCachedNodes, 0, 15)
      this.cacheRestoreDebounce = null
    }, 500)
  }
  /**
   * Continue processing the next batch
   * @param {Array} disabledNodes - Select all selectable nodes
   * @param {Array} cachedNodes - Undo operation
   * @param {number} startIndex - Redo operation
   * @param {number} batchSize - Group selected nodes
   */
  processBatchRestore(disabledNodes, cachedNodes, startIndex, batchSize) {
    const endIndex = Math.min(
      startIndex + batchSize,
      Math.max(disabledNodes.length, cachedNodes.length)
    )

    // Ungroup selected nodes
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
          console.warn(`failed to restore node event:`, error)
        }
      })
    }

    // Toggle lock state of selected nodes
    if (startIndex < cachedNodes.length) {
      const cachedBatch = cachedNodes.slice(startIndex, Math.min(endIndex, cachedNodes.length))
      cachedBatch.forEach((node) => {
        try {
          if (node.isCached()) {
            node.clearCache()
          }
          this.cachedNodes.delete(node)
        } catch (error) {
          console.warn(`failed to clear node cache:`, error)
        }
      })
    }

    // Toggle visibility of selected nodes
    if (endIndex < Math.max(disabledNodes.length, cachedNodes.length)) {
      requestAnimationFrame(() => {
        this.processBatchRestore(disabledNodes, cachedNodes, endIndex, batchSize)
      })
    }
  }
  /**
   * Move selected nodes to top
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
   * Move selected nodes to bottom
   */
  undo() {
    if (this.stateManage.class.history && this.stateManage.class.history.undo) {
      this.stateManage.class.history.undo()
    }
  }

  /**
   * Move selected nodes up one layer
   */
  redo() {
    if (this.stateManage.class.history && this.stateManage.class.history.redo) {
      this.stateManage.class.history.redo()
    }
  }

  /**
   * Move selected nodes down one layer
   */
  groupSelectedNodes() {
    const selectedNodes = this.stateManage.state.transformer.nodes()
    if (selectedNodes.length > 1) {
      this.stateManage.class.node.groupNodes()
    }
  }

  /**
   * Focus on selected nodes
   */
  ungroupSelectedNodes() {
    const selectedNodes = this.stateManage.state.transformer.nodes()
    if (selectedNodes.length === 1 && selectedNodes[0].attrs?.name === 'group') {
      this.stateManage.class.node.ungroupNodes(selectedNodes[0])
    }
  }

  /**
   * Get shortcut help information
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
   * Shortcut list
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
   * Move the selected node to the top
   */
  moveSelectedToTop() {
    const selectedNodes = this.stateManage.state.transformer.nodes()
    if (selectedNodes.length > 0) {
      this.stateManage.class.layer.moveToTop()
    }
  }

  /**
   * Move the selected node to the bottom
   */
  moveSelectedToBottom() {
    const selectedNodes = this.stateManage.state.transformer.nodes()
    if (selectedNodes.length > 0) {
      this.stateManage.class.layer.moveToBottom()
    }
  }

  /**
   * Move the selected node up one layer
   */
  moveSelectedUp() {
    const selectedNodes = this.stateManage.state.transformer.nodes()
    if (selectedNodes.length > 0) {
      this.stateManage.class.layer.moveUp()
    }
  }

  /**
   * Move the selected node down one layer
   */
  moveSelectedDown() {
    const selectedNodes = this.stateManage.state.transformer.nodes()
    if (selectedNodes.length > 0) {
      this.stateManage.class.layer.moveDown()
    }
  }

  /**
   * Focus on the selected node
   */
  focusSelectedNode() {
    const selectedNodes = this.stateManage.state.transformer.nodes()
    if (selectedNodes.length === 1) {
      this.stateManage.class.node.focusNode(selectedNodes[0])
    }
  }

  /**
   * Get shortcut help information
   * @returns {Array} Shortcut list
   */
  getHotKeyList() {
    return [
      { key: 'Ctrl+A / ⌘+A', description: 'select all nodes' },
      { key: 'Ctrl+C / ⌘+C', description: 'copy selected nodes' },
      { key: 'Ctrl+X / ⌘+X', description: 'cut selected nodes' },
      { key: 'Ctrl+V / ⌘+V', description: 'paste nodes' },
      { key: 'Delete/Backspace', description: 'delete selected nodes' },
      { key: 'Ctrl+Z / ⌘+Z', description: 'undo' },
      { key: 'Ctrl+Y / Ctrl+Shift+Z / ⌘+Shift+Z', description: 'redo' },
      { key: 'Ctrl+G / ⌘+G', description: 'group selected nodes' },
      { key: 'Ctrl+Shift+G / ⌘+Shift+G', description: 'ungroup' },
      { key: 'Ctrl+L / ⌘+L', description: 'toggle lock status' },
      { key: 'Ctrl+H / ⌘+H', description: 'toggle display/hide' },
      { key: 'Ctrl+] / ⌘+]', description: 'bring to front' },
      { key: 'Ctrl+[ / ⌘+[', description: 'send to back' },
      { key: 'Ctrl+↑ / ⌘+↑', description: 'bring forward' },
      { key: 'Ctrl+↓ / ⌘+↓', description: 'send backward' },
      { key: '↑↓←→', description: 'nudge selected nodes' },
      { key: 'F', description: 'focus on selected node' },
      { key: 'long press space/middle mouse button', description: 'pan canvas' }
    ]
  }
}
