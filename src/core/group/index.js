export default class GroupManger {
    constructor(state, stateManage, config) {
      this.state = state
      this.stateManage = stateManage
      this.CLEAR_THRESHOLD = 8
      this.originalNodes = null
      this.proxyShape = null // Proxy shape（Not a group）
      this.isOptimized = false
      this.transformerEventsBound = false
    }
  
    /**
     * Create proxy group(Used for scaling the canvas when multiple nodes are selected Performance optimization for canvas lag)
     * Original nodes remain in place，Only create a proxy object
     */
    createProxyGroup() {
      const nodes = this.state.transformer.nodes()
      
      if (nodes.length <= this.CLEAR_THRESHOLD || this.isOptimized) {
        return false
      }
  
      try {
        // Save original node references（Important：Nodes remain in their original positions）
        this.originalNodes = [...nodes]
        //Calculate the bounding box of all nodes（Using user's calculation logic）
        const bounds = this.calculateNodesBounds(this.originalNodes)
        //  Create a proxy rectangle，Represents the entire selection area
        this.proxyShape = new Konva.Rect({
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
          fill: 'rgba(0,0,255,0.0)', // Transparent fill
          // fill: 'rgba(0, 0, 255, 0.5)', // Semi-transparent fill（For debugging） 
          stroke: 'blue',
          strokeWidth: 1,
          dash: [5, 5],
          name: 'proxy-group-shape',
          draggable: true,
          listening: false 
        })
        //Add to the appropriate layer
        const layer = this.state.layers[1] || this.state.layers[this.state.layers.length - 1]
        layer.add(this.proxyShape)
        // Make the transform box only operate on the proxy shape
        this.state.transformer.nodes([this.proxyShape])
        //  Bind the transformation events of the proxy shape to the original nodes
        this.bindProxyEvents()
        this.isOptimized = true
        return true
      } catch (error) {
        console.error('failed to create proxy composition:', error)
        this.cleanupProxy()
        return false
      }
    }
  
    /**
     * Bind the transformation events of the proxy shape to the original nodes
     */
    bindProxyEvents() {
      if (!this.proxyShape || this.transformerEventsBound) {
        return
      }
  
      // Record initial state
      this.initialProxyState = {
        x: this.proxyShape.x(),
        y: this.proxyShape.y(),
        scaleX: this.proxyShape.scaleX(),
        scaleY: this.proxyShape.scaleY(),
        rotation: this.proxyShape.rotation()
      }
      this.initialNodesState = this.originalNodes.map(node => ({
        x: node.x(),
        y: node.y(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
        rotation: node.rotation()
      }))
  
      // Listen for transformation events of the proxy shape
      this.proxyShape.on('transform', () => {
        this.syncProxyToNodes()
      })
      this.proxyShape.on('dragmove', () => {
        this.syncProxyToNodes()
      })
      this.transformerEventsBound = true
    }
    /**
     * Sync the transformation of the proxy shape to the original nodes
     */
    syncProxyToNodes() {
      if (!this.proxyShape || !this.originalNodes || !this.isOptimized) {
        return false
      }
  
      try {
        // Get current state of the proxy shape
        const currentProxy = {
          x: this.proxyShape.x(),
          y: this.proxyShape.y(),
          scaleX: this.proxyShape.scaleX(),
          scaleY: this.proxyShape.scaleY(),
          rotation: this.proxyShape.rotation()
        }
        
        // Calculate transformation difference
        const deltaX = currentProxy.x - this.initialProxyState.x
        const deltaY = currentProxy.y - this.initialProxyState.y
        const scaleFactorX = currentProxy.scaleX / this.initialProxyState.scaleX
        const scaleFactorY = currentProxy.scaleY / this.initialProxyState.scaleY
        const deltaRotation = currentProxy.rotation - this.initialProxyState.rotation
        
        // Apply transformation to original nodes
        this.originalNodes.forEach((node, index) => {
          const initialState = this.initialNodesState[index]
          
          // Simple linear transformation（Avoid complex matrix operations）
          node.position({
            x: initialState.x + deltaX,
            y: initialState.y + deltaY
          })
          node.scaleX(initialState.scaleX * scaleFactorX)
          node.scaleY(initialState.scaleY * scaleFactorY)
          node.rotation(initialState.rotation + deltaRotation)
        })
        
        // UpdateDOMPosition
        if (this.stateManage.class.dom) {
          this.stateManage.class.dom.updateDomPosition()
        }
        return true
        
      } catch (error) {
        console.warn('failed to sync proxy transformation:', error)
        return false
      }
    }
  
    /**
     * Remove proxy group，Restore original transform box
     */
    removeProxyGroup() {
      if (!this.isOptimized) {
        return false
      }
  
      try {
        // Unbind events
        if (this.proxyShape && this.transformerEventsBound) {
          this.proxyShape.off('transform')
          this.proxyShape.off('dragmove')
          this.transformerEventsBound = false
        }
        // Last synchronization（Ensure state consistency）
        this.syncProxyToNodes()
        // Destroy proxy shape
        if (this.proxyShape) {
          this.proxyShape.destroy()
          this.proxyShape = null
        }
        // Restore transform box to original nodes
        if (this.originalNodes && this.originalNodes.length > 0) {
          this.state.transformer.nodes(this.originalNodes)
        }
        // Cleanup state
        this.originalNodes = null
        this.initialProxyState = null
        this.initialNodesState = null
        this.isOptimized = false
        return true
        
      } catch (error) {
        console.error('failed to remove proxy composition:', error)
        this.cleanupProxy()
        return false
      }
    }
  
    /**
     * Use user's bounding calculation logic
     */
    calculateNodesBounds(nodes) {
      const selectedNodes = nodes || this.state.selectedNodes
      const stage = this.state.stage
      const stageScaleX = stage.scaleX()
      const stageScaleY = stage.scaleY()
      const stageX = stage.x()
      const stageY = stage.y()
      
      let minX = Infinity
      let maxX = -Infinity
      let minY = Infinity
      let maxY = -Infinity
      
      selectedNodes.forEach((node) => {
        // Get node position、Width、Height
        let { x, y, width, height } = node.getClientRect()
        x = (x - stageX) / stageScaleX
        y = (y - stageY) / stageScaleY
        width = width / stageScaleX
        height = height / stageScaleY
  
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x + width)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y + height)
      })
  
      // Calculate bounding width and height
      const width = maxX - minX
      const height = maxY - minY
      
      // Calculated bounding box
      const bounds = { x: minX, y: minY, width, height, maxX, minX, maxY, minY }
      return bounds
    }
  
    /**
     * Cleanup proxy group
     */
    cleanupProxy() {
      if (this.proxyShape) {
        this.proxyShape.off('transform')
        this.proxyShape.off('dragmove')
        this.proxyShape.destroy()
        this.proxyShape = null
      }
      
      if (this.originalNodes && this.originalNodes.length > 0) {
        this.state.transformer.nodes(this.originalNodes)
      }
      
      this.originalNodes = null
      this.initialProxyState = null
      this.initialNodesState = null
      this.isOptimized = false
      this.transformerEventsBound = false
    }
  
    /**
     * Check if in optimization mode
     */
    isInOptimizationMode() {
      return this.isOptimized
    }
  
    /**
     * Toggle proxy shape visibility（Debugging）
     */
    toggleProxyVisibility() {
      if (this.proxyShape) {
        this.proxyShape.visible(!this.proxyShape.visible())
      }
    }
  }
  