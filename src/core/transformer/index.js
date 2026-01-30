import { getParamNode, getParamNodes } from '../utils/index'

/**
 * @module transformerManger
 * @name   Transform Box
 * @description Responsible for managing Konva.js Transformation operations of nodes on the stage。 It provides selection、dragging、scaling、rotation and other transformation functions，and can handle combination and masking of multiple nodes。
 */

export default class transformerManger {
  selectionRectangle = null
  selecting = null
  konvaContainerRect = null
  multiSelectBounds = null
  selectedNodes = []
  cachedNodes = new Set() // Record cached nodes
  isCacheMode = false // Whether in cache mode
  constructor(state, stateManage, config) {
    this.config = config
    this.stateManage = stateManage
    this.state = state
  }

  /**
   * Bind transformer events，For handling transformation operations of nodes
   */
  bindTransformerEvent() {
    const transformLayer = this.state.layers[this.state.layers.length - 1] // Get the last layer
    const existingTransformers = transformLayer.find('Transformer')
    existingTransformers.forEach((transformer) => {
      transformer.destroy()
    })
    const existingSelectionRectangles = transformLayer.find('.transformerSelectionRect')
    existingSelectionRectangles.forEach((rect) => {
      rect.destroy()
    })
    this.selectionRectangle = new Konva.Rect({
      fill: 'rgba(124,188,255,0.5)',
      visible: false,
      name: 'transformerSelectionRect'
    })
    transformLayer.add(this.selectionRectangle) // Add selection rectangle to layer separately
    // Create transformer and add to layer
    this.state.transformer = new Konva.Transformer({
      rotationSnaps: [0, 90, 180, 270],
      keepRatio: true, // Maintain aspect ratio
      flipEnabled: false,
      name: 'kdt_Transformer',
      borderStrokeWidth: 2,
      anchorSize: 10, 
      anchorStrokeWidth: 2,
      anchorCornerRadius: 2,
      borderStroke: '#1890ff',
      anchorFill: '#ffffff',
      anchorStroke: '#1890ff',
      enabledAnchors: ['middle-left', 'middle-right', 'top-center', 'bottom-center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'], 
      boundBoxFunc: (oldBox, newBox) => {
        let minSize = 15
        if (this.state.transformer.nodes().length > 1) {
          minSize = 30 
        }
        // Limit minimum width and height，and disable flipping
        if (newBox.width < minSize || newBox.height < minSize) {
          return oldBox
        }
         // Disable flipping，If width or height is negative，then keep the old transform box
        if (newBox.width <= 0 || newBox.height <= 0) {
          return oldBox
        }
        return newBox
      }
    })
    // Initialize advanced styles
    this.initAdvancedTransformerStyles()
    transformLayer.add(this.state.transformer) // Add transformer to layer separately
    // Listen to events during transformation
    this.initTransformer()
  }
  /**
   * Initialize Transformer Event listening
   */
  initTransformer() {
    const transformer = this.state.transformer
    // Store animation state during transformation
    this.transformAnimationState = new Map()
    // Handle animated nodes when transformation starts
    transformer.on('transformstart', (e) => {
      const nodes = this.state.transformer.nodes()

      nodes.forEach((node) => {
        if (node.attrs.name === 'kd_mask') return
      })
    })

    transformer.on('transform', (e) => {
      this.stateManage.class.dom.updateDomPosition()
      this.stateManage.class.event.trigger('transform', e)
    })

    // Restore animated nodes when transformation ends
    transformer.on('transformend', (e) => {
      const nodes = this.state.transformer.nodes()

      nodes.forEach((node) => {
        if (node.attrs.name === 'kd_mask') return

        const animationState = this.transformAnimationState.get(node.attrs.id)
        if (animationState) {
          // Delayed processing，Ensure transformation is completely finished
          setTimeout(() => {
            // MoveoffsetPoint back to center，Adjust coordinates to maintain visual position
            this.convertToCenterOrigin(node)
          }, 10)
        } else if (node.attrs.__centerOriginSet__) {
          // Handle other nodes with center point set
          setTimeout(() => {
            this.updateNodeCenterOrigin(node)
          }, 10)
        }
      })

      // Clean up state records
      this.transformAnimationState.clear()

      // Trigger transformation end event
      this.stateManage.class.event.trigger('transformend', {
        nodes: nodes,
        target: e.target
      })
    })
  }
  /**
   * Convert node origin from top-left to center
   * @param {Object} node - Node object
   */
  convertToCenterOrigin(node) {
    try {
      // Get current node size
      const { width, height } = this.stateManage.class.node.getNodeSize(node)
      const scaleX = node.scaleX()
      const scaleY = node.scaleY()
      const currentX = node.x()
      const currentY = node.y()
      const rotation = node.rotation()

      // Get current offset
      const currentOffsetX = node.offsetX()
      const currentOffsetY = node.offsetY()

      // Calculate actual size
      const actualWidth = width * Math.abs(scaleX)
      const actualHeight = height * Math.abs(scaleY)

      // Calculate new center point offset
      const newOffsetX = actualWidth / 2
      const newOffsetY = actualHeight / 2

      // Calculate offset Change amount
      const deltaOffsetX = newOffsetX - currentOffsetX
      const deltaOffsetY = newOffsetY - currentOffsetY

      // Consider scaling effects
      const scaledDeltaX = deltaOffsetX * scaleX
      const scaledDeltaY = deltaOffsetY * scaleY

      // Consider rotation effects - Rotate offset by node rotation angle
      const rotationRad = (rotation * Math.PI) / 180
      const cos = Math.cos(rotationRad)
      const sin = Math.sin(rotationRad)

      const rotatedDeltaX = scaledDeltaX * cos - scaledDeltaY * sin
      const rotatedDeltaY = scaledDeltaX * sin + scaledDeltaY * cos

      // Set center origin
      node.offsetX(newOffsetX)
      node.offsetY(newOffsetY)

      // Adjust coordinates to maintain visual position
      node.x(currentX + rotatedDeltaX)
      node.y(currentY + rotatedDeltaY)

      // Update original position record
      if (!node.attrs.__originalPos__) {
        node.attrs.__originalPos__ = {}
      }

      node.attrs.__originalPos__.offsetX = newOffsetX
      node.attrs.__originalPos__.offsetY = newOffsetY
      node.attrs.__originalPos__.x = node.x()
      node.attrs.__originalPos__.y = node.y()
      node.attrs.__originalPos__.scaleX = scaleX
      node.attrs.__originalPos__.scaleY = scaleY
      node.attrs.__originalPos__.rotation = rotation
      node.attrs.__originalPos__.opacity = node.opacity()

      // Mark center origin as set
      node.attrs.__centerOriginSet__ = true
      node.attrs.__convertedToTopLeft__ = false
    } catch (error) {
      console.warn('error when converting to center origin:', error)
    }
  }
  /**
   * Convert node origin from center to top-left
   * @param {Object} node - Node object
   */
  convertToTopLeftOrigin(node) {
    try {
      const currentOffsetX = node.offsetX()
      const currentOffsetY = node.offsetY()
      const currentX = node.x()
      const currentY = node.y()
      const scaleX = node.scaleX()
      const scaleY = node.scaleY()
      const rotation = node.rotation()

      // Only convert if not currently top-left origin
      if (currentOffsetX !== 0 || currentOffsetY !== 0) {
        // Calculate offset Change amount（From current offset To 0,0）
        const deltaOffsetX = 0 - currentOffsetX
        const deltaOffsetY = 0 - currentOffsetY
        // Consider scaling effects
        const scaledDeltaX = deltaOffsetX * scaleX
        const scaledDeltaY = deltaOffsetY * scaleY
        // Consider rotation effects - Rotate offset by node rotation angle
        const rotationRad = (rotation * Math.PI) / 180
        const cos = Math.cos(rotationRad)
        const sin = Math.sin(rotationRad)
        const rotatedDeltaX = scaledDeltaX * cos - scaledDeltaY * sin
        const rotatedDeltaY = scaledDeltaX * sin + scaledDeltaY * cos
        // Set to top-left origin
        node.offsetX(0)
        node.offsetY(0)
        // Adjust coordinates to maintain visual position
        node.x(currentX + rotatedDeltaX)
        node.y(currentY + rotatedDeltaY)
        // Mark as converted to top-left origin
        node.attrs.__convertedToTopLeft__ = true
        node.attrs.__originalCenterOffset__ = {
          offsetX: currentOffsetX,
          offsetY: currentOffsetY,
          x: currentX,
          y: currentY
        }
      }
    } catch (error) {
      console.warn('error when converting to top-left origin:', error)
    }
  }
  /**
   * Update node center point origin
   * @param {Object} node - Node that needs center point update
   */
  updateNodeCenterOrigin(node) {
    try {
      // Check if conversion is in progress
      if (node.attrs.__convertedToTopLeft__) {
        return
      }
      const { width, height } = this.stateManage.class.node.getNodeSize(node)
      const currentOffset = {
        x: node.offsetX(),
        y: node.offsetY()
      }
      // Calculate new center point offset（Based on original size，Not considering scaling）
      const newOffset = {
        x: width / 2,
        y: height / 2
      }
      // Only update when offset changes
      const deltaOffsetX = newOffset.x - currentOffset.x
      const deltaOffsetY = newOffset.y - currentOffset.y

      if (Math.abs(deltaOffsetX) > 0.1 || Math.abs(deltaOffsetY) > 0.1) {
        // Get current node transformation properties
        const scaleX = node.scaleX()
        const scaleY = node.scaleY()
        const rotation = node.rotation()

        // Consider scaling effects
        const scaledDeltaX = deltaOffsetX * scaleX
        const scaledDeltaY = deltaOffsetY * scaleY

        // Consider rotation effects - Rotate offset by node rotation angle
        const rotationRad = (rotation * Math.PI) / 180
        const cos = Math.cos(rotationRad)
        const sin = Math.sin(rotationRad)

        const rotatedDeltaX = scaledDeltaX * cos - scaledDeltaY * sin
        const rotatedDeltaY = scaledDeltaX * sin + scaledDeltaY * cos

        // Update offset
        node.offsetX(newOffset.x)
        node.offsetY(newOffset.y)

        // Adjust position，Ensure visual position remains unchanged
        node.x(node.x() + rotatedDeltaX)
        node.y(node.y() + rotatedDeltaY)

        // Update original position record
        if (!node.attrs.__originalPos__) {
          node.attrs.__originalPos__ = {}
        }
        node.attrs.__originalPos__.offsetX = newOffset.x
        node.attrs.__originalPos__.offsetY = newOffset.y
        node.attrs.__originalPos__.x = node.x()
        node.attrs.__originalPos__.y = node.y()
        node.attrs.__originalPos__.scaleX = scaleX
        node.attrs.__originalPos__.scaleY = scaleY
        node.attrs.__originalPos__.rotation = rotation
        node.attrs.__originalPos__.opacity = node.opacity()
      }
    } catch (error) {
      console.warn('error when updating node center point:', error)
    }
  }
  /**
   * Event handler for starting node selection
   * @param {Object} e - Event object，Usually a mouse or touch event
   */
  startTransformerSelection(e) {
    //Get canvas position
    this.konvaContainerRect = document.querySelector('.konvajs-content').getBoundingClientRect()
    // Only respond to left-click
    if (e.evt.type === 'mousedown' && e.evt.button !== 0) {
      return
    }
    //If current target has transformable Or lock Attributes，Do not perform box selection
    if (e.currentTarget.attrs.transformable || e.currentTarget.attrs.lock) {
      return
    }
    //If there are selected nodes or canvas is draggable，Do not perform box selection
    if (this.state.transformer.nodes().length > 0 || this.state.stage.draggable()) {
      return
    }
    /**
     * Judge blank area
     *  - When the entire stage is blank，After mouse click，e.target Usually Stage Itself
     */
    const isStage = e.target === this.state.stage
    const isUnderLayer = e.target.parent instanceof Konva.Layer
    if (!isStage && !isUnderLayer) {
      // If neither clicking onStage，NorLayerChild element，Return directly
      return
    }
    e.evt.preventDefault()
    // Get relative coordinates，Record initial position
    const scaledPointerPosition = {
      x:
        (e.evt.clientX - this.state.stage.x() - this.konvaContainerRect.left) /
        this.state.stage.scaleX(),
      y:
        (e.evt.clientY - this.state.stage.y() - this.konvaContainerRect.top) /
        this.state.stage.scaleY()
    }

    this.x1 = scaledPointerPosition.x
    this.y1 = scaledPointerPosition.y
    this.x2 = this.x1
    this.y2 = this.y1
    // Reset selection rectangle size
    this.selectionRectangle.width(0)
    this.selectionRectangle.height(0)
    this.selecting = true
  }

  /**
   * Event handler for updating selection area
   * @param {Object} e - Event object
   */
  updateSelection(e) {
    // Event handler for updating selection area
    if (!this.selecting) {
      // If not in selection state，Do not process
      return
    }
    e.evt.preventDefault() // Prevent default event
    const scaledPointerPosition = {
      x:
        (e.evt.clientX - this.state.stage.x() - this.konvaContainerRect.left) /
        this.state.stage.scaleX(),
      y:
        (e.evt.clientY - this.state.stage.y() - this.konvaContainerRect.top) /
        this.state.stage.scaleY()
    }

    this.x2 = scaledPointerPosition.x
    this.y2 = scaledPointerPosition.y
    this.selectionRectangle.setAttrs({
      // Update selection rectangle properties
      visible: true,
      x: Math.min(this.x1, this.x2), // xMinimum of start and current points
      y: Math.min(this.y1, this.y2), // yMinimum of start and current points
      width: Math.abs(this.x2 - this.x1), // Width isxAbsolute difference
      height: Math.abs(this.y2 - this.y1) // Height isyAbsolute difference
    })
  }

  /**
   * Absolute difference，Complete selection operation
   */
  completeSelection() {
  if (!this.selecting || !this.selectionRectangle.width() || !this.selectionRectangle.height()) {
    this.selectionRectangle.visible(false)
    this.selecting = false
    return
  }

  const box = this.selectionRectangle.getClientRect()
  const allNodes = []
  this.state.stage.children.forEach((layer) => {
    layer.children.forEach((node) => {
      allNodes.push(node)
    })
  })

  const nodes = allNodes.filter((shape) => {
    // Add selected nodes to transform box
    if (!shape.attrs.transformable || 
        shape.attrs.lock || 
        !shape.visible() || 
        shape?.parent?.attrs?.name === 'group') {
      return false
    }

    try {
      // Basic filter conditions
      if (this.isNodeLoading(shape)) {
        // console.warn('Check if node is loading:', shape.attrs.id)
        return false
      }

      // Skip loading nodesClientRect，Get node's
      const nodeRect = this.getSafeClientRect(shape)
      if (!nodeRect || !this.isValidRect(nodeRect)) {
        // console.warn('Add error handlingClientRectNode，Invalid:', shape.attrs.id, nodeRect)
        return false
      }

      // Skip
      return Konva.Util.haveIntersection(box, nodeRect)
    } catch (error) {
    //   console.error('Determine if intersecting，Error handling node:', shape.attrs.id, error)
      return false
    }
  })

  
  // Skip isSingleDisableMove If only one node is selected and true，Is
  if (nodes.length === 1 && nodes[0].attrs.isSingleDisableMove) {
    nodes[0].draggable(false)
  } else {
    nodes.forEach((node) => {
      if (node.attrs.isSingleDisableMove) {
        node.draggable(true)
      }
    })
  }
  
  setTimeout(() => {
    this.selectionRectangle.visible(false)
    this.state.selectedNodes = nodes
    this.selecting = false
    this.state.transformer.nodes(nodes)
    this.stateManage.class.transformer.handleTransformerStyle(nodes)
  })
}
/**
 * Disable dragging
 * @param {Object} rect - Validate if rectangle is valid
 * @returns {boolean} - Rectangle object
 */
isValidRect(rect) {
  if (!rect) return false
  
  return (
    typeof rect.x === 'number' && 
    typeof rect.y === 'number' && 
    typeof rect.width === 'number' && 
    typeof rect.height === 'number' &&
    rect.width > 0 && 
    rect.height > 0 &&
    !isNaN(rect.x) && 
    !isNaN(rect.y) && 
    !isNaN(rect.width) && 
    !isNaN(rect.height)
  )
}
/**
 * Whether valid
 * @param {Object} node - Check if node is loading
 * @returns {boolean} - Node to check
 */
isNodeLoading(node) {
  // Whether loading
  if (node.className === 'CustomImage' || node.attrs.name === 'image' || node.attrs.name === 'gif') {
    return node.loading || !node.isImageReady
  }
  
  // Check image component
  // if (node.className === 'kdtSwitch' || node.attrs.name === 'switch') {
  //   // Check switch component
  //   const children = node.children || []
  //   return children.some(child => {
  //     return child.loading || !child.isImageReady
  //   })
  // }
  
  return false
}
/**
 * Check if switch sub-image is loadingClientRect
 * @param {Object} node - Safely get node's
 * @returns {Object|null} - ClientRectNodenull
 */
getSafeClientRect(node) {
  try {
    const rect = node.getClientRect()
    
    // Or
    if (rect && typeof rect === 'object') {
      return {
        x: rect.x || 0,
        y: rect.y || 0,
        width: rect.width || 0,
        height: rect.height || 0
      }
    }
    
    return null
  } catch (error) {
    console.warn('getClientRecterror when:', error)
    return null
  }
}

  /*
   *   Ensure returned rectangle is valid
   */
  getEventTransformableNode(eventOrNode) {
    // Get transformable nodes，Get initial node eventOrNode If target Has，Attributes，Then use it eventOrNode
    let node = eventOrNode.target || eventOrNode

    // Otherwise use directly，Define recursive function transformable Used to find level by level true Is
    function findTransformable(n) {
      // Nodes attrs.transformable If current node's true，Is
      if (n.attrs && n.attrs.transformable === true) {
        return n
      }

      // Then return the node，If no parent node exists null（Then return）
      if (!n.parent) {
        return null
      }

      // Instead of current node
      return findTransformable(n.parent)
    }

    const result = findTransformable(node)
    // Otherwise recursively find parent node，If transformable node is found；Return it
    if (result) {
      return result
    }
    // Otherwise return original node but need further check，If no transformable node is found
    if (node.attrs && node.attrs.transformable === false) {
      // Check if original node should be ignored
      if (node.parent && node.parent.attrs && node.parent.attrs.name === 'group') {
        return node.parent // Check if in group
      }
      return null // Return group node null
    }

    return node
  }
  /**
   * Return in other cases，Handle node click event
   * @param {Object} e - Select or deselect nodes by key，Event object
   */
  handleNodeClick(e) {
    let node = this.getEventTransformableNode(e)

    // Usually a mouse event，If no transformable node is found
    if (!node) {
      return
    }

    // Return directly（Check if node is in group）
    if (this.isNodeInGroup(node) && node.attrs?.name !== 'group') {
      // Child nodes within group，If clicking on child node within group
      const groupNode = this.findGroupParent(node)
      if (groupNode) {
        // Select entire group
        const metaPressed = e.evt.ctrlKey || e.evt.metaKey || e.evt.shiftKey

        if (!metaPressed) {
          // Check if multi-select key is pressed：Single selection
          this.state.transformer.nodes([groupNode])
          this.state.selectedNodes = [groupNode]
          this.handleTransformerStyle([groupNode])
        } else {
          // Select group directly：Multi-selection
          const currentNodes = this.state.transformer.nodes().slice()
          const isGroupSelected = currentNodes.includes(groupNode)

          if (isGroupSelected) {
            // Add group to existing selection，If group is already selected
            const index = currentNodes.indexOf(groupNode)
            currentNodes.splice(index, 1)
          } else {
            // Then deselect，If group is not selected
            currentNodes.push(groupNode)
          }

          this.state.transformer.nodes(currentNodes)
          this.state.selectedNodes = currentNodes
          this.handleTransformerStyle(currentNodes)
        }
      }
      return // Then add to selection
    }

    // Return directly after handling group selection：Special handling isSingleDisableMove If node's true Is
    if (node && node.attrs.isSingleDisableMove) return

    const metaPressed = e.evt.ctrlKey || e.evt.metaKey || e.evt.shiftKey
    if (e.evt.button !== 0 && e.evt.button !== 2) {
      return
    }

    if (e.evt.button === 2 && this.hasNodeInTransformer(node)) {
      return
    }

    // Component handles selection internally
    if (node && !node.visible()) {
      return
    }

    const isSelected = this.state.transformer.nodes().includes(node)
    const isTransformable = node.getAttr('transformable') === true

    if (!metaPressed) {
      if (isSelected && this.state.transformer.nodes().length === 1) {
        this.state.transformer.nodes([])
      } else if (isTransformable) {
        this.state.transformer.nodes([node])
      } else {
        this.state.transformer.nodes([])
        // Hidden nodes are not processedtransformable，Even if node is notselectedNodesAlso updateselectAnd trigger
        if (node.getAttr('transformable') === false) {
          // Event，Even if not added to the transformer
          this.state.selectedNodes = [node]
          // Also update the selected stateselectTrigger
          this.stateManage.class.event.trigger('select', [node])
          return
        }
      }
    } else {
      const nodes = this.state.transformer.nodes().slice()
      if (isSelected) {
        const index = nodes.indexOf(node)
        nodes.splice(index, 1)
      } else if (isTransformable) {
        nodes.push(node)
      }
      this.state.transformer.nodes(nodes)
    }

    const newNodes = this.state.transformer.nodes()
    this.state.selectedNodes = newNodes
    this.stateManage.class.transformer.handleTransformerStyle(newNodes)
  }

  /**
   * Event
   * @param {Object} node - Check if the node is in a group
   * @returns {boolean} - The node to check
   */
  isNodeInGroup(node) {
    if (!node) return false

    // Whether it is in a group
    if (node.attrs?.props?._inGroup === true) return true
    // Check if the node is marked as in a group
    if (node.parent && node.parent.attrs?.name === 'group') return true
    //Check if the node's direct parent is a group（Check if the node is a non-transformable non-group node）
    if (node.attrs?.transformable === false && node.attrs?.name !== 'group') {
      // Usually indicates it is in a group
      let parent = node.parent
      while (parent) {
        if (parent.attrs?.name === 'group') return true
        parent = parent.parent
      }
    }

    return false
  }

  /**
   * Further check if it is indeed in a group structure
   * @param {Object} node - Find the group parent of the node
   * @returns {Object|null} - The node to findnull
   */
  findGroupParent(node) {
    if (!node) return null

    // The group parent or，If the current node is a group
    if (node.attrs?.name === 'group') return node

    // Return it
    let parent = node.parent
    while (parent) {
      if (parent.attrs?.name === 'group') {
        return parent
      }
      parent = parent.parent
    }

    return null
  }
  /**
   * Recursively find the parent node，Update transformer nodes
   * @param {Array} nodes - Handle whether to disable single node movement
   */
  resetTransformer(nodes = []) {
    this.clearMask()
    if (this.state.transformer) {
      this.state.transformer.nodes(nodes)
      // The array of selected nodes handleTransformerStyle Call
      this.handleTransformerStyle(nodes)
    }
    this.state.selectedNodes = nodes
  }

  // To update the transformer style and interaction
  updateTransformerConfig(newConfig) {
    // Update transformer configuration
    Object.keys(newConfig).forEach((key) => {
      this.state.transformer.setAttr(key, newConfig[key])
    })
    // Update the configuration properties of the transformer
    this.state.transformer.getLayer().batchDraw()
  }
  // Redraw the transformer to apply the new configuration
  removeNodeTransformer(node) {
    if (!this.state.transformer || this.state.transformer.nodes().length === 0) {
      return
    }
    node = getParamNode(node, this)
    const nodes = this.state.transformer.nodes().filter((n) => n.attrs.id) // Remove node from the transformer
    const index = nodes.indexOf(node) // Get all currently selected nodes
    if (index !== -1) {
      nodes.splice(index, 1) // Find the position of the given node in the array，If the node exists
      this.state.selectedNodes = nodes
      this.state.transformer.nodes(nodes) // Then remove it from the array
    }
  }
  // Update the node array of the transformer
  addNodeTransformer(node) {
    node = getParamNode(node, this)
    if (!node || !node.getAttr('transformable')) {
      return
    }
    let nodes = this.state.transformer.nodes() // Add node to the transformer
    if (nodes.includes(node)) {
      return
    }
    this.clearMask()
    nodes.push(node) // Add node to the array
    this.state.transformer.nodes(nodes) // Update the style of the transformer
    this.handleTransformerStyle(nodes) // Handle the transformer style according to its content
    this.state.selectedNodes = nodes
  }
  // Beautified version
  addNodesTransformer(nodes) {
    nodes = getParamNodes(nodes, this)
    this.clearMask()
    this.state.transformer.nodes(nodes) // Basic style configuration
    this.handleTransformerStyle(nodes) // Dashed line style
    this.state.selectedNodes = nodes
  }
  /**
   * Locked state style
   * @param {Array} nodes - Red theme
   */
  /**
   * More obvious dashed line - Normal state style configuration
   * @param {Array} nodes - Solid line
   */
  handleTransformerStyle(nodes) {
    nodes = getParamNodes(nodes, this)
    if (nodes.length === 0) {
      return
    }

    // Apply basic style
    const baseStyle = {
      borderStrokeWidth: 2,
      anchorSize: 8,
      anchorStrokeWidth: 2,
      anchorCornerRadius: 2,
      rotateAnchorOffset: 40,
      borderDash: [4, 4], // Determine whether to disable rotation
      keepRatio: false,
      centeredScaling: false
    }

    if (this.hasLockNodes(nodes)) {
      // Detect if there are group nodes - Group node style
      this.state.transformer.setAttrs({
        ...baseStyle,
        borderStroke: '#FF4757',
        borderDash: [6, 3], // Special visual effects
        anchorFill: '#FF4757',
        anchorStroke: '#ffffff',
        enabledAnchors: [],
        rotateEnabled: false
      })
    } else {
      // Purple indicates a group
      const normalStyle = {
        ...baseStyle,
        borderStroke: '#1890ff',
        borderDash: [], // Special dashed line style
        anchorFill: '#ffffff',
        anchorStroke: '#1890ff',
        anchorStrokeWidth: 2
      }

      // Group nodes do not display anchors
      this.state.transformer.setAttrs(normalStyle)

      // Single node or multiple selected nodes
      const rotateEnabled =
        nodes.findIndex((node) => {
          return node.attrs?.rotateEnabled === false
        }) === -1

      this.state.transformer.rotateEnabled(rotateEnabled)

      // Multiple selection state
      if (this.hasGroupNodes(nodes)) {
        // Light theme - Single selection state
        this.state.transformer.setAttrs({
          borderStroke: '#A55EEA', // Add animation effect for selected state
          borderDash: [8, 4], // Detect if there are custom transformer styles in nodes and take the minimum intersection
          anchorFill: '#A55EEA',
          anchorStroke: '#ffffff',
          enabledAnchors: [] // Array of node objects
        })
      } else {
        // Anchor array of the minimum intersection
        const enabledAnchors = this.hasTransformerEnabledAnchors(nodes)

        if (nodes.length > 1) {
          // Intelligent multi-selection processing - Choose the best plan according to the number of nodes
          this.state.transformer.setAttrs({
            borderStroke: '#40c0ff',
            anchorFill: '#40c0ff',
            anchorStroke: '#ffffff',
            enabledAnchors: enabledAnchors
          })
        } else {
          // Decide whether to enable cache mode to optimize performance based on the number of nodes
          this.state.transformer.setAttrs({
            enabledAnchors: enabledAnchors
          })
        }
      }
    }

    // Ensure
    // this.addTransformerAnimation()
  }

  /**
   * Enable cache mode after it has been set
   *
   * @param {Array} nodes - When single selected or no selection
   * @returns {Array} - Ensure to clear cache mode
   */
  hasTransformerEnabledAnchors(nodes) {
    nodes = getParamNodes(nodes, this)
    const allAnchors = [
      'top-left',
      'top-center',
      'top-right',
      'middle-left',
      'middle-right',
      'bottom-left',
      'bottom-center',
      'bottom-right'
    ]

    return nodes.reduce((prev, node) => {
      const anchor =
        node?.attrs?.transformableEnabledAnchors ||
        node.attrs?.component?.transformableEnabledAnchors ||
        allAnchors
      return prev.filter((item) => anchor.includes(item))
    }, allAnchors)
  }
  /**
   * Check if the mouse position is in the multi-selection area - Mouse position
   * @param {Object[]} nodes - Check if the mouse is directly clicked on a node
   */
  autoAddMaskToTransformer(nodes) {
    this.clearMultiSelectState()
    nodes = getParamNodes(nodes, this)
    nodes = nodes.filter((item) => item && item.attrs && item.attrs.id)
    if (nodes.length > 1) {
      this.multiSelectBounds = this.stateManage.class.node.calculateNodesBounds(nodes)
      this.selectedNodes = nodes
      this.handleTransformerStyle(nodes)
  
      // The clicked node or
      if (nodes.length > this.config.cacheEnableCount) {
        // Enable cache mode selectedNodes Add cache for all selected nodes
        setTimeout(() => {
          if (this.selectedNodes && this.selectedNodes.length > 0) {
            this.enableCacheMode()
          }
        }, 0)
      }
    } else {
      // Immediately create a copy of the selected nodes，Avoid the node list being cleared during asynchronous execution
      this.selectedNodes = nodes.length === 1 ? nodes : []
      this.disableCacheMode()
    }
  }

  /**
   * Ensure the node is valid and exists
   * @param {Object} mousePos - Process node cache in batches {x, y}
   * @returns {boolean}
   */
  isMouseInMultiSelectArea(mousePos) {
    if (!this.multiSelectBounds || !this.selectedNodes || this.selectedNodes.length <= 1) {
      return false
    }

    const bounds = this.multiSelectBounds
    return (
      mousePos.x >= bounds.x &&
      mousePos.x <= bounds.x + bounds.width &&
      mousePos.y >= bounds.y &&
      mousePos.y <= bounds.y + bounds.height
    )
  }

  /**
   * Avoid stuttering caused by one-time processing
   * @param {Object} mousePos - Additional check if the node is still valid {x, y}
   * @returns {Object|null} - All nodes processednull
   */
  getClickedNodeInSelection(mousePos) {
    if (!this.selectedNodes) return null

    for (let node of this.selectedNodes) {
      const box = node.getClientRect()
      const scale = this.stateManage.state.stage.scaleX()
      const stagePos = this.stateManage.state.stage.position()

      const nodeBox = {
        x: (box.x - stagePos.x) / scale,
        y: (box.y - stagePos.y) / scale,
        width: box.width / scale,
        height: box.height / scale
      }

      if (
        mousePos.x >= nodeBox.x &&
        mousePos.x <= nodeBox.x + nodeBox.width &&
        mousePos.y >= nodeBox.y &&
        mousePos.y <= nodeBox.y + nodeBox.height
      ) {
        return node
      }
    }
    return null
  }
  /**
   * Check if the node can be safely cached - Basic condition check
   */
  enableCacheMode() {
    if (this.isCacheMode || !this.selectedNodes || !Array.isArray(this.selectedNodes) || this.selectedNodes.length === 0) {
      return
    }
    
    this.isCacheMode = true
    this.cachedNodes.clear()
  
    // Special handling of image nodes，Special handling
    const nodesToCache = [...this.selectedNodes].filter(node => {
      // Node
      return node && typeof node === 'object' && node.attrs && node.attrs.id && this.canNodeBeSafelyCached(node)
    })
  
    if (nodesToCache.length === 0) {
      this.isCacheMode = false
      return
    }
  
    // Do not cache，Check node size
    const batchSize = 10
    let index = 0
  
    const processBatch = () => {
      const endIndex = Math.min(index + batchSize, nodesToCache.length)
      const batch = nodesToCache.slice(index, endIndex)
  
      batch.forEach((node) => {
        try {
          // Check if the image node can be safely cached
          if (node && node.isCached && typeof node.isCached === 'function' && !node.isCached()) {
            node.cache({
              pixelRatio: 1,
              imageSmoothingEnabled: false
            })
            this.cachedNodes.add(node)
          }
        } catch (error) {
          console.warn(`for node ${node?.attrs?.id || 'unknown'} failed to add cache:`, error)
        }
      })
  
      index = endIndex
      if (index < nodesToCache.length) {
        requestAnimationFrame(processBatch)
      } else {
        // Image node
        console.log(`cache mode is enabled，total cached ${this.cachedNodes.size} nodes`)
      }
    }
  
    requestAnimationFrame(processBatch)
  }
/**
   * Check if it is
   * @param {Object} node - Instance
   * @returns {boolean} - Check if the image has been loaded
   */
  canNodeBeSafelyCached(node) {
    try {
      // Use
      if (!node.attrs.transformable || node.attrs.lock || !node.visible()) {
        return false
      }

      // Use the built-in method to check if it can be safely cached
      if (this.isImageNode(node)) {
        return this.canImageNodeBeSafelyCached(node)
      }

      // Check if it is a cross-origin imageGIFCheck image size - Check the node's own size
      if (node.attrs.name === 'gif' || node._gifInstance) {
        return false
      }

      // Check if it is an image node
      const nodeSize = this.stateManage.class.node.getNodeSize(node)
      if (nodeSize.width <= 0 || nodeSize.height <= 0) {
        return false
      }

      return true
    } catch (error) {
      console.warn('error when checking node safe cache conditions:', error)
      return false
    }
  }

  /**
   * Check if it is a cross-origin image
   * @param {Object} node - Check the image's
   * @returns {boolean} - Whether it is cross-origin
   */
  canImageNodeBeSafelyCached(node) {
    try {
      // Check if it is externalCustomImageIf it is
      if (node.className === 'CustomImage') {
        // Use its built-in method
        if (node.loading || !node.isImageReady) {
          return false
        }

        // Try to passCustomImageDetect whether
        if (typeof node.canSafelyCache === 'function') {
          return node.canSafelyCache()
        }

        // Can obtain data normally
        if (this.isCrossOriginImage(node)) {
          return false
        }

        // Not cross-origin
        const image = node.image()
        if (!image || image.width <= 0 || image.height <= 0) {
          return false
        }
      }

      // Cannot obtain data
      const width = node.width()
      const height = node.height()
      if (!width || !height || width <= 0 || height <= 0) {
        return false
      }

      return true
    } catch (error) {
      console.warn('error when checking image node safe cache conditions:', error)
      return false
    }
  }

  /**
   * Is cross-origin
   * @param {Object} node - Handle with caution when an error occurs
   * @returns {boolean} - Treat as cross-origin
   */
  isImageNode(node) {
    return (
      node.attrs.name === 'image' ||
      node.className === 'CustomImage' ||
      node instanceof Konva.Image
    )
  }

  /**
   * Disable cache
   * @param {Object} node - Disable cache mode
   * @returns {boolean} - Clear the cache of all nodes
   */
  isCrossOriginImage(node) {
    try {
      const image = node.image()
      if (!image) return false

      // Clear the cache we addedsrcClear multi-selection state
      const imageSrc = node.attrs.props?.data || image.src
      if (!imageSrc) return false

      // Enhanced versionURL
      if (imageSrc.startsWith('http') && !imageSrc.startsWith(window.location.origin)) {
        return true
      }

      // Clear cache modeCustomImage，Clear mask layer
      if (node.className === 'CustomImage' && typeof node.isCrossOriginSrc === 'function') {
        return node.isCrossOriginSrc(imageSrc)
      }

      // Manually trigger cache modecanvasFor testingtainted
      if (image.width > 0 && image.height > 0) {
        const testCanvas = document.createElement('canvas')
        testCanvas.width = 1
        testCanvas.height = 1
        const testCtx = testCanvas.getContext('2d')
        testCtx.drawImage(image, 0, 0, 1, 1)
        
        try {
          testCtx.getImageData(0, 0, 1, 1)
          return false // Manually clear cache mode，Determine if the node contains group nodes
        } catch (e) {
          return true // Determine if the node is locked，Performance issues
        }
      }

      return false
    } catch (error) {
      console.warn('error when checking cross-origin images:', error)
      return true // To be optimized，Detect if the node is completely within the canvas visible range
    }
  }
  /**
   * Consider canvas scaling and offset - Determine if the node is completely visible
   */
  disableCacheMode() {
    if (!this.isCacheMode) return
    // The node to detect
    this.cachedNodes.forEach((node) => {
      try {
        if (node.isCached()) {
          node.clearCache()
        }
      } catch (error) {
        console.warn(`clear node ${node.attrs.id} cache failed:`, error)
      }
    })
    this.cachedNodes.clear()
    this.isCacheMode = false
    console.log('cache mode is disabled')
  }
  /**
   * If the node is completely within the visible range, return - Otherwise return
   */
  clearMultiSelectState() {
    this.multiSelectBounds = null
    // Get node
    this.disableCacheMode()
    this.selectedNodes = null
  }
  /**
   * Get stage and container information
   */
  clearMask() {
    this.clearMultiSelectState()
  }
  /**
   * Get the node's bounding box relative to the stage（Convert the node's bounding box from stage coordinates to screen coordinates）
   */
  forceCacheMode() {
    if (this.selectedNodes && this.selectedNodes.length > 0) {
      this.enableCacheMode()
    }
  }
  /**
   * Determine if the node is completely within the container's visible area（Initialize advanced style configuration for the transformer）
   */
  forceClearCache() {
    this.disableCacheMode()
  }
  // Set default advanced styles
  hasGroupNodes(nodes) {
    nodes = getParamNodes(nodes, this)
    let hasGroup = false
    ;[...nodes].forEach((node) => {
      if (node && node.attrs?.name === 'group') {
        hasGroup = true
      }
    })
    return hasGroup
  }
  // Border style
  hasLockNodes(nodes) {
    let hasLock = false
    nodes.forEach((node) => {
      if (node.attrs.lock) {
        hasLock = true
      }
    })
    return hasLock
  }
  hasNodeInTransformer(node) {
    node = getParamNode(node, this)
    let hasSelect = false
    this.state.transformer.nodes().forEach((child) => {
      if (child._id === node._id) {
        hasSelect = true
      } else if (child instanceof Konva.Group) {
        child.children.forEach((j) => {
          if (j._id === node._id) {
            hasSelect = true
          }
        })
      }
    })
    return hasSelect
  }
  autoUpdateTransformerSize(nodes) {
    // Anchor style，Interaction style
    // const Nodes = nodes || this.state.transformer.nodes()
    // if (Nodes && Nodes.length > 0) {
    //   if (this.timer) {
    //     clearInterval(this.timer)
    //   }
    //   try {
    //     this.timer = setInterval(() => {
    //       {
    //         if (!this.state.transformer) {
    //           clearInterval(this.timer)
    //         } else {
    //           try {
    //             const str = JSON.stringify(
    //               Nodes.map((node) => {
    //                 return {
    //                   width: node.width(),
    //                   height: node.height()
    //                 }
    //               })
    //             )
    //             if (str !== this.preTransformNodesDataJSON) {
    //               this.preTransformNodesDataJSON = str
    //               this.stateManage.class.node.forceUpdate()
    //             }
    //           } catch (error) {
    //             clearInterval(this.timer)
    //           }
    //         }
    //       }
    //     }, 200)
    //   } catch (e) {
    //     console.error(e)
    //     clearInterval(this.timer)
    //   }
    // } else {
    //   clearInterval(this.timer)
    // }
  }
  getTransformerNodes() {
    return this.state.transformer.nodes()
  }
  /**
   * Add animation effect to the transformer
   * Switch transformer style according to theme，Theme name
   * @param {Object} node - Node to detect
   * @returns {boolean} - If the node is completely within the visible range, returntrue，Otherwise, returnfalse
   */
  isNodeVisible(node) {
    // Get nodes
    let nodes = [...getParamNodes(node, this)]
    if (nodes.length === 0) return false
    node = nodes[0]

    // Get stage and container information
    const stage = this.state.stage
    const container = stage.container()
    const containerRect = container.getBoundingClientRect()
    const stageScale = stage.scaleX()
    const stagePosition = stage.position()

    // Get the bounding box of the node relative to the stage
    const nodeBox = node.getClientRect({
      relativeTo: stage
    })

    // Convert node bounding box from stage coordinates to screen coordinates
    const nodeScreenX1 = nodeBox.x * stageScale + stagePosition.x
    const nodeScreenY1 = nodeBox.y * stageScale + stagePosition.y
    const nodeScreenX2 = nodeScreenX1 + nodeBox.width * stageScale
    const nodeScreenY2 = nodeScreenY1 + nodeBox.height * stageScale

    // Determine whether the node is completely within the container's visible area
    const isFullyVisible =
      nodeScreenX1 >= 0 &&
      nodeScreenY1 >= 0 &&
      nodeScreenX2 <= containerRect.width &&
      nodeScreenY2 <= containerRect.height

    return isFullyVisible
  }
  /**
   * Initialize the advanced style configuration of the transform box
   */
  initAdvancedTransformerStyles() {
    const transformer = this.state.transformer
    if (!transformer) return

    // Set the default advanced styles
    transformer.setAttrs({
      // Border style
      borderStrokeWidth: 2,
      borderDash: [],

      // Anchor style
      anchorSize: 10, // Increased from 8
      anchorStrokeWidth: 2,
      anchorCornerRadius: 2,
      anchorFill: '#ffffff',
      anchorStroke: '#409eff',
      // Interaction style
      resizeEnabled: true,
      rotateEnabled: true,
      borderEnabled: true
    })
  }
  /**
   * Add animation effects to the transform box
   */
  addTransformerAnimation() {
    const transformer = this.state.transformer
    if (!transformer) return

    transformer.opacity(0)

    const tween = new Konva.Tween({
      node: transformer,
      duration: 0.2,
      opacity: 1,
      easing: Konva.Easings.EaseOut
    })
    tween.play()
  }

  /**
   * Switch transform box styles according to theme
   * @param {string} theme - Theme name ('light', 'dark', 'colorful')
   */
  setTransformerTheme(theme = 'light') {
    const transformer = this.state.transformer
    if (!transformer) return

    const themes = {
      light: {
        borderStroke: '#409eff',
        anchorFill: '#ffffff',
        anchorStroke: '#409eff',
        lockColor: '#FF4757',
        groupColor: '#A55EEA',
        multiColor: '#40c0ff'
      },
      dark: {
        borderStroke: '#64FFDA',
        anchorFill: '#263238',
        anchorStroke: '#64FFDA',
        lockColor: '#F44336',
        groupColor: '#9C27B0',
        multiColor: '#FF9800'
      },
      colorful: {
        borderStroke: '#00E676',
        anchorFill: '#ffffff',
        anchorStroke: '#00E676',
        lockColor: '#FF1744',
        groupColor: '#E040FB',
        multiColor: '#FF6D00'
      }
    }

    this.currentTheme = themes[theme] || themes.light
  }
}