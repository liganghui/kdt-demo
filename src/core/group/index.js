export default class GroupManger {
    constructor(state, stateManage, config) {
      this.state = state
      this.stateManage = stateManage
      this.CLEAR_THRESHOLD = 8
      this.originalNodes = null
      this.proxyShape = null // 代理形状（不是组）
      this.isOptimized = false
      this.transformerEventsBound = false
    }
  
    /**
     * 创建代理组合(用于多选节点时缩放画布 画布卡顿的性能优化)
     * 原始节点保持不动，只创建一个代理对象
     */
    createProxyGroup() {
      const nodes = this.state.transformer.nodes()
      
      if (nodes.length <= this.CLEAR_THRESHOLD || this.isOptimized) {
        return false
      }
  
      try {
        // 保存原始节点引用（重要：节点保持在原位不动）
        this.originalNodes = [...nodes]
        //计算所有节点的边界框（使用用户的计算逻辑）
        const bounds = this.calculateNodesBounds(this.originalNodes)
        //  创建一个代理矩形，代表整个选择区域
        this.proxyShape = new Konva.Rect({
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
          fill: 'rgba(0,0,255,0.0)', // 透明填充
          // fill: 'rgba(0, 0, 255, 0.5)', // 半透明填充（调试时） 
          stroke: 'blue',
          strokeWidth: 1,
          dash: [5, 5],
          name: 'proxy-group-shape',
          draggable: true,
          listening: false 
        })
        //添加到合适的图层
        const layer = this.state.layers[1] || this.state.layers[this.state.layers.length - 1]
        layer.add(this.proxyShape)
        // 让变换框只操作代理形状
        this.state.transformer.nodes([this.proxyShape])
        //  绑定代理形状的变换事件到原始节点
        this.bindProxyEvents()
        this.isOptimized = true
        return true
      } catch (error) {
        console.error('创建代理组合失败:', error)
        this.cleanupProxy()
        return false
      }
    }
  
    /**
     * 绑定代理形状的变换事件到原始节点
     */
    bindProxyEvents() {
      if (!this.proxyShape || this.transformerEventsBound) {
        return
      }
  
      // 记录初始状态
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
  
      // 监听代理形状的变换事件
      this.proxyShape.on('transform', () => {
        this.syncProxyToNodes()
      })
      this.proxyShape.on('dragmove', () => {
        this.syncProxyToNodes()
      })
      this.transformerEventsBound = true
    }
    /**
     * 将代理形状的变换同步到原始节点
     */
    syncProxyToNodes() {
      if (!this.proxyShape || !this.originalNodes || !this.isOptimized) {
        return false
      }
  
      try {
        // 获取代理形状当前状态
        const currentProxy = {
          x: this.proxyShape.x(),
          y: this.proxyShape.y(),
          scaleX: this.proxyShape.scaleX(),
          scaleY: this.proxyShape.scaleY(),
          rotation: this.proxyShape.rotation()
        }
        
        // 计算变换差值
        const deltaX = currentProxy.x - this.initialProxyState.x
        const deltaY = currentProxy.y - this.initialProxyState.y
        const scaleFactorX = currentProxy.scaleX / this.initialProxyState.scaleX
        const scaleFactorY = currentProxy.scaleY / this.initialProxyState.scaleY
        const deltaRotation = currentProxy.rotation - this.initialProxyState.rotation
        
        // 应用变换到原始节点
        this.originalNodes.forEach((node, index) => {
          const initialState = this.initialNodesState[index]
          
          // 简单的线性变换（避免复杂的矩阵运算）
          node.position({
            x: initialState.x + deltaX,
            y: initialState.y + deltaY
          })
          node.scaleX(initialState.scaleX * scaleFactorX)
          node.scaleY(initialState.scaleY * scaleFactorY)
          node.rotation(initialState.rotation + deltaRotation)
        })
        
        // 更新DOM位置
        if (this.stateManage.class.dom) {
          this.stateManage.class.dom.updateDomPosition()
        }
        return true
        
      } catch (error) {
        console.warn('同步代理变换失败:', error)
        return false
      }
    }
  
    /**
     * 移除代理组合，恢复原始变换框
     */
    removeProxyGroup() {
      if (!this.isOptimized) {
        return false
      }
  
      try {
        // 解绑事件
        if (this.proxyShape && this.transformerEventsBound) {
          this.proxyShape.off('transform')
          this.proxyShape.off('dragmove')
          this.transformerEventsBound = false
        }
        // 最后一次同步（确保状态一致）
        this.syncProxyToNodes()
        // 销毁代理形状
        if (this.proxyShape) {
          this.proxyShape.destroy()
          this.proxyShape = null
        }
        // 恢复变换框到原始节点
        if (this.originalNodes && this.originalNodes.length > 0) {
          this.state.transformer.nodes(this.originalNodes)
        }
        // 清理状态
        this.originalNodes = null
        this.initialProxyState = null
        this.initialNodesState = null
        this.isOptimized = false
        return true
        
      } catch (error) {
        console.error('移除代理组合失败:', error)
        this.cleanupProxy()
        return false
      }
    }
  
    /**
     * 使用用户的边界计算逻辑
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
        // 获取节点的位置、宽度、高度
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
  
      // 计算边界宽度和高度
      const width = maxX - minX
      const height = maxY - minY
      
      // 计算的边界框
      const bounds = { x: minX, y: minY, width, height, maxX, minX, maxY, minY }
      return bounds
    }
  
    /**
     * 清理代理组合
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
     * 检查是否处于优化模式
     */
    isInOptimizationMode() {
      return this.isOptimized
    }
  
    /**
     * 切换代理形状的可见性（调试）
     */
    toggleProxyVisibility() {
      if (this.proxyShape) {
        this.proxyShape.visible(!this.proxyShape.visible())
      }
    }
  }
  