import { getParamNode, getParamNodes } from '../utils/index'

/**
 * @module transformerManger
 * @name   变换框
 * @description 负责管理 Konva.js 舞台上节点的变换操作。 它提供了选择、拖动、缩放、旋转等变换功能，并且能够对多个节点进行组合和遮罩处理。
 */

export default class transformerManger {
  selectionRectangle = null
  selecting = null
  konvaContainerRect = null
  multiSelectBounds = null
  selectedNodes = []
  cachedNodes = new Set() // 记录已缓存的节点
  isCacheMode = false // 是否处于缓存模式
  constructor(state, stateManage, config) {
    this.config = config
    this.stateManage = stateManage
    this.state = state
  }

  /**
   * 绑定变换器的事件，用于处理节点的变换操作
   */
  bindTransformerEvent() {
    const transformLayer = this.state.layers[this.state.layers.length - 1] // 获取最后一个图层
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
    transformLayer.add(this.selectionRectangle) // 单独添加选择矩形到图层
    // 创建变换器并添加到图层
    this.state.transformer = new Konva.Transformer({
      rotationSnaps: [0, 90, 180, 270],
      keepRatio: true, // 保持宽高比
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
        // 限制最小宽度和高度，并禁止翻转
        if (newBox.width < minSize || newBox.height < minSize) {
          return oldBox
        }
         // 禁止翻转，如果宽度或高度为负，则保持旧的变换框
        if (newBox.width <= 0 || newBox.height <= 0) {
          return oldBox
        }
        return newBox
      }
    })
    // 初始化高级样式
    this.initAdvancedTransformerStyles()
    transformLayer.add(this.state.transformer) // 单独添加变换器到图层
    // 监听变换过程中的事件
    this.initTransformer()
  }
  /**
   * 初始化 Transformer 事件监听
   */
  initTransformer() {
    const transformer = this.state.transformer
    // 存储变换时的动画状态
    this.transformAnimationState = new Map()
    // 变换开始时处理动画节点
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

    // 变换结束时恢复动画节点
    transformer.on('transformend', (e) => {
      const nodes = this.state.transformer.nodes()

      nodes.forEach((node) => {
        if (node.attrs.name === 'kd_mask') return

        const animationState = this.transformAnimationState.get(node.attrs.id)
        if (animationState) {
          // 延迟处理，确保变换完全结束
          setTimeout(() => {
            // 将offset点恢复到中心，同时调整坐标保持视觉位置不变
            this.convertToCenterOrigin(node)
          }, 10)
        } else if (node.attrs.__centerOriginSet__) {
          // 处理其他设置了中心点的节点
          setTimeout(() => {
            this.updateNodeCenterOrigin(node)
          }, 10)
        }
      })

      // 清理状态记录
      this.transformAnimationState.clear()

      // 触发变换结束事件
      this.stateManage.class.event.trigger('transformend', {
        nodes: nodes,
        target: e.target
      })
    })
  }
  /**
   * 将节点的原点从左上角转换回中心
   * @param {Object} node - 节点对象
   */
  convertToCenterOrigin(node) {
    try {
      // 获取当前节点尺寸
      const { width, height } = this.stateManage.class.node.getNodeSize(node)
      const scaleX = node.scaleX()
      const scaleY = node.scaleY()
      const currentX = node.x()
      const currentY = node.y()
      const rotation = node.rotation()

      // 获取当前的 offset
      const currentOffsetX = node.offsetX()
      const currentOffsetY = node.offsetY()

      // 计算实际尺寸
      const actualWidth = width * Math.abs(scaleX)
      const actualHeight = height * Math.abs(scaleY)

      // 计算新的中心点偏移量
      const newOffsetX = actualWidth / 2
      const newOffsetY = actualHeight / 2

      // 计算 offset 的变化量
      const deltaOffsetX = newOffsetX - currentOffsetX
      const deltaOffsetY = newOffsetY - currentOffsetY

      // 考虑缩放的影响
      const scaledDeltaX = deltaOffsetX * scaleX
      const scaledDeltaY = deltaOffsetY * scaleY

      // 考虑旋转的影响 - 将偏移量按节点旋转角度进行旋转变换
      const rotationRad = (rotation * Math.PI) / 180
      const cos = Math.cos(rotationRad)
      const sin = Math.sin(rotationRad)

      const rotatedDeltaX = scaledDeltaX * cos - scaledDeltaY * sin
      const rotatedDeltaY = scaledDeltaX * sin + scaledDeltaY * cos

      // 设置中心原点
      node.offsetX(newOffsetX)
      node.offsetY(newOffsetY)

      // 调整坐标保持视觉位置不变
      node.x(currentX + rotatedDeltaX)
      node.y(currentY + rotatedDeltaY)

      // 更新原始位置记录
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

      // 标记已设置中心原点
      node.attrs.__centerOriginSet__ = true
      node.attrs.__convertedToTopLeft__ = false
    } catch (error) {
      console.warn('转换到中心原点时出错:', error)
    }
  }
  /**
   * 将节点的原点从中心转换为左上角
   * @param {Object} node - 节点对象
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

      // 只有当前不是左上角原点时才转换
      if (currentOffsetX !== 0 || currentOffsetY !== 0) {
        // 计算 offset 的变化量（从当前 offset 到 0,0）
        const deltaOffsetX = 0 - currentOffsetX
        const deltaOffsetY = 0 - currentOffsetY
        // 考虑缩放的影响
        const scaledDeltaX = deltaOffsetX * scaleX
        const scaledDeltaY = deltaOffsetY * scaleY
        // 考虑旋转的影响 - 将偏移量按节点旋转角度进行旋转变换
        const rotationRad = (rotation * Math.PI) / 180
        const cos = Math.cos(rotationRad)
        const sin = Math.sin(rotationRad)
        const rotatedDeltaX = scaledDeltaX * cos - scaledDeltaY * sin
        const rotatedDeltaY = scaledDeltaX * sin + scaledDeltaY * cos
        // 设置为左上角原点
        node.offsetX(0)
        node.offsetY(0)
        // 调整坐标保持视觉位置不变
        node.x(currentX + rotatedDeltaX)
        node.y(currentY + rotatedDeltaY)
        // 标记已转换为左上角原点
        node.attrs.__convertedToTopLeft__ = true
        node.attrs.__originalCenterOffset__ = {
          offsetX: currentOffsetX,
          offsetY: currentOffsetY,
          x: currentX,
          y: currentY
        }
      }
    } catch (error) {
      console.warn('转换到左上角原点时出错:', error)
    }
  }
  /**
   * 更新节点的中心点原点
   * @param {Object} node - 需要更新中心点的节点
   */
  updateNodeCenterOrigin(node) {
    try {
      // 检查是否正在转换过程中
      if (node.attrs.__convertedToTopLeft__) {
        return
      }
      const { width, height } = this.stateManage.class.node.getNodeSize(node)
      const currentOffset = {
        x: node.offsetX(),
        y: node.offsetY()
      }
      // 计算新的中心点偏移量（基于原始尺寸，不考虑缩放）
      const newOffset = {
        x: width / 2,
        y: height / 2
      }
      // 仅当偏移量发生变化时更新
      const deltaOffsetX = newOffset.x - currentOffset.x
      const deltaOffsetY = newOffset.y - currentOffset.y

      if (Math.abs(deltaOffsetX) > 0.1 || Math.abs(deltaOffsetY) > 0.1) {
        // 获取当前节点的变换属性
        const scaleX = node.scaleX()
        const scaleY = node.scaleY()
        const rotation = node.rotation()

        // 考虑缩放的影响
        const scaledDeltaX = deltaOffsetX * scaleX
        const scaledDeltaY = deltaOffsetY * scaleY

        // 考虑旋转的影响 - 将偏移量按节点旋转角度进行旋转变换
        const rotationRad = (rotation * Math.PI) / 180
        const cos = Math.cos(rotationRad)
        const sin = Math.sin(rotationRad)

        const rotatedDeltaX = scaledDeltaX * cos - scaledDeltaY * sin
        const rotatedDeltaY = scaledDeltaX * sin + scaledDeltaY * cos

        // 更新偏移量
        node.offsetX(newOffset.x)
        node.offsetY(newOffset.y)

        // 调整位置，确保视觉上的位置保持不变
        node.x(node.x() + rotatedDeltaX)
        node.y(node.y() + rotatedDeltaY)

        // 更新原始位置记录
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
      console.warn('更新节点中心点时出错:', error)
    }
  }
  /**
   * 开始选择节点的事件处理方法
   * @param {Object} e - 事件对象，通常为鼠标或触摸事件
   */
  startTransformerSelection(e) {
    //获取画布位置
    this.konvaContainerRect = document.querySelector('.konvajs-content').getBoundingClientRect()
    // 只响应左键点击
    if (e.evt.type === 'mousedown' && e.evt.button !== 0) {
      return
    }
    //如果当前目标自己带有 transformable 或 lock 属性，则不进行框选
    if (e.currentTarget.attrs.transformable || e.currentTarget.attrs.lock) {
      return
    }
    //如果已有选中的节点或者当前画布处于可拖拽状态，也不进行框选
    if (this.state.transformer.nodes().length > 0 || this.state.stage.draggable()) {
      return
    }
    /**
     * 判断空白区域
     *  - 当整个舞台是空白时，鼠标点击后，e.target 通常是 Stage 自身
     */
    const isStage = e.target === this.state.stage
    const isUnderLayer = e.target.parent instanceof Konva.Layer
    if (!isStage && !isUnderLayer) {
      // 如果既不是点击到Stage，也不是Layer子元素，直接返回
      return
    }
    e.evt.preventDefault()
    // 获取相对坐标，记录初始位置
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
    // 重置选择矩形的大小
    this.selectionRectangle.width(0)
    this.selectionRectangle.height(0)
    this.selecting = true
  }

  /**
   * 更新选择区域的事件处理方法
   * @param {Object} e - 事件对象
   */
  updateSelection(e) {
    // 更新选择区域的事件处理方法
    if (!this.selecting) {
      // 如果没有在选择状态，不处理
      return
    }
    e.evt.preventDefault() // 阻止默认事件
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
      // 更新选择矩形的属性
      visible: true,
      x: Math.min(this.x1, this.x2), // x为起始点和当前点的较小值
      y: Math.min(this.y1, this.y2), // y为起始点和当前点的较小值
      width: Math.abs(this.x2 - this.x1), // 宽度为x差的绝对值
      height: Math.abs(this.y2 - this.y1) // 高度为y差的绝对值
    })
  }

  /**
   * 完成选择操作，将选中的节点加入变换框
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
    // 基本筛选条件
    if (!shape.attrs.transformable || 
        shape.attrs.lock || 
        !shape.visible() || 
        shape?.parent?.attrs?.name === 'group') {
      return false
    }

    try {
      // 检查节点是否处于加载状态
      if (this.isNodeLoading(shape)) {
        // console.warn('跳过正在加载的节点:', shape.attrs.id)
        return false
      }

      // 获取节点的ClientRect，增加容错处理
      const nodeRect = this.getSafeClientRect(shape)
      if (!nodeRect || !this.isValidRect(nodeRect)) {
        // console.warn('节点ClientRect无效，跳过:', shape.attrs.id, nodeRect)
        return false
      }

      // 判断是否相交
      return Konva.Util.haveIntersection(box, nodeRect)
    } catch (error) {
    //   console.error('处理节点时出错，跳过:', shape.attrs.id, error)
      return false
    }
  })

  
  // 如果选择的节点只有一个且 isSingleDisableMove 为 true，禁用拖拽
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
 * 验证矩形是否有效
 * @param {Object} rect - 矩形对象
 * @returns {boolean} - 是否有效
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
 * 检查节点是否正在加载中
 * @param {Object} node - 要检查的节点
 * @returns {boolean} - 是否正在加载
 */
isNodeLoading(node) {
  // 检查图片组件
  if (node.className === 'CustomImage' || node.attrs.name === 'image' || node.attrs.name === 'gif') {
    return node.loading || !node.isImageReady
  }
  
  // 检查开关组件
  // if (node.className === 'kdtSwitch' || node.attrs.name === 'switch') {
  //   // 检查开关的子图片是否在加载
  //   const children = node.children || []
  //   return children.some(child => {
  //     return child.loading || !child.isImageReady
  //   })
  // }
  
  return false
}
/**
 * 安全获取节点的ClientRect
 * @param {Object} node - 节点
 * @returns {Object|null} - ClientRect或null
 */
getSafeClientRect(node) {
  try {
    const rect = node.getClientRect()
    
    // 确保返回的矩形有效
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
    console.warn('获取ClientRect时出错:', error)
    return null
  }
}

  /*
   *   获取可被变换的节点
   */
  getEventTransformableNode(eventOrNode) {
    // 获取初始节点，如果 eventOrNode 有 target 属性，则使用它，否则直接使用 eventOrNode
    let node = eventOrNode.target || eventOrNode

    // 定义递归函数，用于逐级查找 transformable 为 true 的节点
    function findTransformable(n) {
      // 如果当前节点的 attrs.transformable 为 true，则返回该节点
      if (n.attrs && n.attrs.transformable === true) {
        return n
      }

      // 如果不存在父节点，则返回 null（而不是当前节点）
      if (!n.parent) {
        return null
      }

      // 否则递归查找父节点
      return findTransformable(n.parent)
    }

    const result = findTransformable(node)
    // 如果找到了可变换的节点，返回它；否则返回原节点但需要进一步检查
    if (result) {
      return result
    }
    // 如果没有找到可变换的节点，检查原节点是否应该被忽略
    if (node.attrs && node.attrs.transformable === false) {
      // 检查是否在组合中
      if (node.parent && node.parent.attrs && node.parent.attrs.name === 'group') {
        return node.parent // 返回组合节点
      }
      return null // 其他情况返回 null
    }

    return node
  }
  /**
   * 处理节点点击事件，根据按键选择或取消选择节点
   * @param {Object} e - 事件对象，通常为鼠标事件
   */
  handleNodeClick(e) {
    let node = this.getEventTransformableNode(e)

    // 如果没有找到可变换的节点，直接返回
    if (!node) {
      return
    }

    // 检查节点是否在组合中（组合内的子节点）
    if (this.isNodeInGroup(node) && node.attrs?.name !== 'group') {
      // 如果点击的是组合内的子节点，选择整个组合
      const groupNode = this.findGroupParent(node)
      if (groupNode) {
        // 检查是否按下了多选键
        const metaPressed = e.evt.ctrlKey || e.evt.metaKey || e.evt.shiftKey

        if (!metaPressed) {
          // 单选：直接选择组合
          this.state.transformer.nodes([groupNode])
          this.state.selectedNodes = [groupNode]
          this.handleTransformerStyle([groupNode])
        } else {
          // 多选：将组合添加到现有选择中
          const currentNodes = this.state.transformer.nodes().slice()
          const isGroupSelected = currentNodes.includes(groupNode)

          if (isGroupSelected) {
            // 如果组合已被选中，则取消选择
            const index = currentNodes.indexOf(groupNode)
            currentNodes.splice(index, 1)
          } else {
            // 如果组合未被选中，则添加到选择中
            currentNodes.push(groupNode)
          }

          this.state.transformer.nodes(currentNodes)
          this.state.selectedNodes = currentNodes
          this.handleTransformerStyle(currentNodes)
        }
      }
      return // 处理完组合选择后直接返回
    }

    // 特殊处理：如果节点的 isSingleDisableMove 为 true 组件内部处理选中
    if (node && node.attrs.isSingleDisableMove) return

    const metaPressed = e.evt.ctrlKey || e.evt.metaKey || e.evt.shiftKey
    if (e.evt.button !== 0 && e.evt.button !== 2) {
      return
    }

    if (e.evt.button === 2 && this.hasNodeInTransformer(node)) {
      return
    }

    // 隐藏节点不处理
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
        // 即使节点不是transformable，也要更新selectedNodes并触发select事件
        if (node.getAttr('transformable') === false) {
          // 即使不添加到变换框，也更新选中状态
          this.state.selectedNodes = [node]
          // 触发select事件
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
   * 检查节点是否在组合中
   * @param {Object} node - 要检查的节点
   * @returns {boolean} - 是否在组合中
   */
  isNodeInGroup(node) {
    if (!node) return false

    // 检查节点是否标记为在组合中
    if (node.attrs?.props?._inGroup === true) return true
    // 检查节点的直接父节点是否是组合
    if (node.parent && node.parent.attrs?.name === 'group') return true
    //检查节点是否为不可变换的非组合节点（通常表示在组合中）
    if (node.attrs?.transformable === false && node.attrs?.name !== 'group') {
      // 进一步检查是否确实在组合结构中
      let parent = node.parent
      while (parent) {
        if (parent.attrs?.name === 'group') return true
        parent = parent.parent
      }
    }

    return false
  }

  /**
   * 查找节点的组合父节点
   * @param {Object} node - 要查找的节点
   * @returns {Object|null} - 组合父节点或null
   */
  findGroupParent(node) {
    if (!node) return null

    // 如果当前节点就是组合，返回它
    if (node.attrs?.name === 'group') return node

    // 递归查找父节点
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
   * 更新变换框节点，处理是否禁用单个节点移动
   * @param {Array} nodes - 选中的节点数组
   */
  resetTransformer(nodes = []) {
    this.clearMask()
    if (this.state.transformer) {
      this.state.transformer.nodes(nodes)
      // 调用 handleTransformerStyle 来更新变换框样式和交互
      this.handleTransformerStyle(nodes)
    }
    this.state.selectedNodes = nodes
  }

  // 更新变换框配置
  updateTransformerConfig(newConfig) {
    // 更新变换框的配置属性
    Object.keys(newConfig).forEach((key) => {
      this.state.transformer.setAttr(key, newConfig[key])
    })
    // 重新绘制变换框以应用新的配置
    this.state.transformer.getLayer().batchDraw()
  }
  // 从变换框中移除节点
  removeNodeTransformer(node) {
    if (!this.state.transformer || this.state.transformer.nodes().length === 0) {
      return
    }
    node = getParamNode(node, this)
    const nodes = this.state.transformer.nodes().filter((n) => n.attrs.id) // 获取当前所有选中的节点
    const index = nodes.indexOf(node) // 查找给定节点在数组中的位置
    if (index !== -1) {
      nodes.splice(index, 1) // 如果节点存在，则从数组中移除
      this.state.selectedNodes = nodes
      this.state.transformer.nodes(nodes) // 更新变换器的节点数组
    }
  }
  // 添加节点到变换框中
  addNodeTransformer(node) {
    node = getParamNode(node, this)
    if (!node || !node.getAttr('transformable')) {
      return
    }
    let nodes = this.state.transformer.nodes() // 获取当前所有选中的节点
    if (nodes.includes(node)) {
      return
    }
    this.clearMask()
    nodes.push(node) // 添加节点到数组
    this.state.transformer.nodes(nodes) // 更新变换器的节点数组
    this.handleTransformerStyle(nodes) // 更新变换框的样式
    this.state.selectedNodes = nodes
  }
  // 添加节点到变换框中
  addNodesTransformer(nodes) {
    nodes = getParamNodes(nodes, this)
    this.clearMask()
    this.state.transformer.nodes(nodes) // 更新变换器的节点数组
    this.handleTransformerStyle(nodes) // 更新变换框的样式
    this.state.selectedNodes = nodes
  }
  /**
   * 根据变换框内容处理变换框的样式
   * @param {Array} nodes - 选中的节点数组
   */
  /**
   * 根据变换框内容处理变换框的样式 - 美化版本
   * @param {Array} nodes - 选中的节点数组
   */
  handleTransformerStyle(nodes) {
    nodes = getParamNodes(nodes, this)
    if (nodes.length === 0) {
      return
    }

    // 基础样式配置
    const baseStyle = {
      borderStrokeWidth: 2,
      anchorSize: 8,
      anchorStrokeWidth: 2,
      anchorCornerRadius: 2,
      rotateAnchorOffset: 40,
      borderDash: [4, 4], // 虚线样式
      keepRatio: false,
      centeredScaling: false
    }

    if (this.hasLockNodes(nodes)) {
      // 锁定状态样式 - 红色主题
      this.state.transformer.setAttrs({
        ...baseStyle,
        borderStroke: '#FF4757',
        borderDash: [6, 3], // 更明显的虚线
        anchorFill: '#FF4757',
        anchorStroke: '#ffffff',
        enabledAnchors: [],
        rotateEnabled: false
      })
    } else {
      // 正常状态样式配置
      const normalStyle = {
        ...baseStyle,
        borderStroke: '#1890ff',
        borderDash: [], // 实线
        anchorFill: '#ffffff',
        anchorStroke: '#1890ff',
        anchorStrokeWidth: 2
      }

      // 应用基础样式
      this.state.transformer.setAttrs(normalStyle)

      // 判断是否禁用旋转
      const rotateEnabled =
        nodes.findIndex((node) => {
          return node.attrs?.rotateEnabled === false
        }) === -1

      this.state.transformer.rotateEnabled(rotateEnabled)

      // 检测是否存在组合节点
      if (this.hasGroupNodes(nodes)) {
        // 组合节点样式 - 特殊的视觉效果
        this.state.transformer.setAttrs({
          borderStroke: '#A55EEA', // 紫色表示组合
          borderDash: [8, 4], // 特殊虚线样式
          anchorFill: '#A55EEA',
          anchorStroke: '#ffffff',
          enabledAnchors: [] // 组合节点不显示锚点
        })
      } else {
        // 单个节点或多选节点
        const enabledAnchors = this.hasTransformerEnabledAnchors(nodes)

        if (nodes.length > 1) {
          // 多选状态 - 浅色主题
          this.state.transformer.setAttrs({
            borderStroke: '#40c0ff',
            anchorFill: '#40c0ff',
            anchorStroke: '#ffffff',
            enabledAnchors: enabledAnchors
          })
        } else {
          // 单选状态
          this.state.transformer.setAttrs({
            enabledAnchors: enabledAnchors
          })
        }
      }
    }

    // 添加选中状态的动画效果
    // this.addTransformerAnimation()
  }

  /**
   * 检测节点中是否存在自定义变换框样式并取最小交集
   *
   * @param {Array} nodes - 节点对象数组
   * @returns {Array} - 最小交集的锚点数组
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
   * 智能的多选处理 - 根据节点数量选择最佳方案
   * @param {Object[]} nodes - 选中的节点数组
   */
  autoAddMaskToTransformer(nodes) {
    this.clearMultiSelectState()
    nodes = getParamNodes(nodes, this)
    nodes = nodes.filter((item) => item && item.attrs && item.attrs.id)
    if (nodes.length > 1) {
      this.multiSelectBounds = this.stateManage.class.node.calculateNodesBounds(nodes)
      this.selectedNodes = nodes
      this.handleTransformerStyle(nodes)
  
      // 根据节点数量决定是否启用缓存模式来优化性能
      if (nodes.length > this.config.cacheEnableCount) {
        // 确保 selectedNodes 已经设置后再启用缓存模式
        setTimeout(() => {
          if (this.selectedNodes && this.selectedNodes.length > 0) {
            this.enableCacheMode()
          }
        }, 0)
      }
    } else {
      // 单选或无选择时，确保清除缓存模式
      this.selectedNodes = nodes.length === 1 ? nodes : []
      this.disableCacheMode()
    }
  }

  /**
   * 检查鼠标位置是否在多选区域内
   * @param {Object} mousePos - 鼠标位置 {x, y}
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
   * 检查鼠标是否直接点击在某个节点上
   * @param {Object} mousePos - 鼠标位置 {x, y}
   * @returns {Object|null} - 点击的节点或null
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
   * 启用缓存模式 - 为所有选中节点添加缓存
   */
  enableCacheMode() {
    if (this.isCacheMode || !this.selectedNodes || !Array.isArray(this.selectedNodes) || this.selectedNodes.length === 0) {
      return
    }
    
    this.isCacheMode = true
    this.cachedNodes.clear()
  
    // 立即创建选中节点的副本，避免异步执行时节点列表被清空
    const nodesToCache = [...this.selectedNodes].filter(node => {
      // 确保节点有效且存在
      return node && typeof node === 'object' && node.attrs && node.attrs.id && this.canNodeBeSafelyCached(node)
    })
  
    if (nodesToCache.length === 0) {
      this.isCacheMode = false
      return
    }
  
    // 分批处理节点缓存，避免一次性处理造成卡顿
    const batchSize = 10
    let index = 0
  
    const processBatch = () => {
      const endIndex = Math.min(index + batchSize, nodesToCache.length)
      const batch = nodesToCache.slice(index, endIndex)
  
      batch.forEach((node) => {
        try {
          // 额外检查节点是否仍然有效
          if (node && node.isCached && typeof node.isCached === 'function' && !node.isCached()) {
            node.cache({
              pixelRatio: 1,
              imageSmoothingEnabled: false
            })
            this.cachedNodes.add(node)
          }
        } catch (error) {
          console.warn(`为节点 ${node?.attrs?.id || 'unknown'} 添加缓存失败:`, error)
        }
      })
  
      index = endIndex
      if (index < nodesToCache.length) {
        requestAnimationFrame(processBatch)
      } else {
        // 所有节点处理完成
        console.log(`缓存模式已启用，共缓存 ${this.cachedNodes.size} 个节点`)
      }
    }
  
    requestAnimationFrame(processBatch)
  }
/**
   * 检查节点是否可以安全缓存
   * @param {Object} node - 要检查的节点
   * @returns {boolean} - 是否可以安全缓存
   */
  canNodeBeSafelyCached(node) {
    try {
      // 基本条件检查
      if (!node.attrs.transformable || node.attrs.lock || !node.visible()) {
        return false
      }

      // 特殊处理图片节点
      if (this.isImageNode(node)) {
        return this.canImageNodeBeSafelyCached(node)
      }

      // 特殊处理GIF节点 - 不缓存
      if (node.attrs.name === 'gif' || node._gifInstance) {
        return false
      }

      // 检查节点尺寸
      const nodeSize = this.stateManage.class.node.getNodeSize(node)
      if (nodeSize.width <= 0 || nodeSize.height <= 0) {
        return false
      }

      return true
    } catch (error) {
      console.warn('检查节点安全缓存条件时出错:', error)
      return false
    }
  }

  /**
   * 检查图片节点是否可以安全缓存
   * @param {Object} node - 图片节点
   * @returns {boolean} - 是否可以安全缓存
   */
  canImageNodeBeSafelyCached(node) {
    try {
      // 检查是否是CustomImage实例
      if (node.className === 'CustomImage') {
        // 检查图片是否已加载完成
        if (node.loading || !node.isImageReady) {
          return false
        }

        // 使用CustomImage的内置方法检查是否可以安全缓存
        if (typeof node.canSafelyCache === 'function') {
          return node.canSafelyCache()
        }

        // 检查是否是跨域图片
        if (this.isCrossOriginImage(node)) {
          return false
        }

        // 检查图片尺寸
        const image = node.image()
        if (!image || image.width <= 0 || image.height <= 0) {
          return false
        }
      }

      // 检查节点自身尺寸
      const width = node.width()
      const height = node.height()
      if (!width || !height || width <= 0 || height <= 0) {
        return false
      }

      return true
    } catch (error) {
      console.warn('检查图片节点安全缓存条件时出错:', error)
      return false
    }
  }

  /**
   * 检查是否是图片节点
   * @param {Object} node - 节点
   * @returns {boolean} - 是否是图片节点
   */
  isImageNode(node) {
    return (
      node.attrs.name === 'image' ||
      node.className === 'CustomImage' ||
      node instanceof Konva.Image
    )
  }

  /**
   * 检查是否是跨域图片
   * @param {Object} node - 图片节点
   * @returns {boolean} - 是否是跨域图片
   */
  isCrossOriginImage(node) {
    try {
      const image = node.image()
      if (!image) return false

      // 检查图片的src是否跨域
      const imageSrc = node.attrs.props?.data || image.src
      if (!imageSrc) return false

      // 检查是否是外部URL
      if (imageSrc.startsWith('http') && !imageSrc.startsWith(window.location.origin)) {
        return true
      }

      // 如果是CustomImage，使用其内置方法
      if (node.className === 'CustomImage' && typeof node.isCrossOriginSrc === 'function') {
        return node.isCrossOriginSrc(imageSrc)
      }

      // 尝试通过canvas检测是否tainted
      if (image.width > 0 && image.height > 0) {
        const testCanvas = document.createElement('canvas')
        testCanvas.width = 1
        testCanvas.height = 1
        const testCtx = testCanvas.getContext('2d')
        testCtx.drawImage(image, 0, 0, 1, 1)
        
        try {
          testCtx.getImageData(0, 0, 1, 1)
          return false // 可以正常获取数据，不是跨域
        } catch (e) {
          return true // 无法获取数据，是跨域
        }
      }

      return false
    } catch (error) {
      console.warn('检查跨域图片时出错:', error)
      return true // 出错时谨慎处理，当作跨域处理
    }
  }
  /**
   * 禁用缓存模式 - 清除所有节点的缓存
   */
  disableCacheMode() {
    if (!this.isCacheMode) return
    // 清除我们添加的缓存
    this.cachedNodes.forEach((node) => {
      try {
        if (node.isCached()) {
          node.clearCache()
        }
      } catch (error) {
        console.warn(`清除节点 ${node.attrs.id} 缓存失败:`, error)
      }
    })
    this.cachedNodes.clear()
    this.isCacheMode = false
    console.log('缓存模式已禁用')
  }
  /**
   * 清除多选状态 - 增强版
   */
  clearMultiSelectState() {
    this.multiSelectBounds = null
    // 清除缓存模式
    this.disableCacheMode()
    this.selectedNodes = null
  }
  /**
   * 清除遮罩层
   */
  clearMask() {
    this.clearMultiSelectState()
  }
  /**
   * 手动触发缓存模式（用于测试）
   */
  forceCacheMode() {
    if (this.selectedNodes && this.selectedNodes.length > 0) {
      this.enableCacheMode()
    }
  }
  /**
   * 手动清除缓存模式（用于测试）
   */
  forceClearCache() {
    this.disableCacheMode()
  }
  // 判断节点是含有组合节点
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
  // 判断节点是否为锁定
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
    // 性能问题，待优化
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
   * 检测节点是否完全位于画布可视范围内
   * 考虑画布的缩放和偏移，判断节点是否完全可见
   * @param {Object} node - 要检测的节点
   * @returns {boolean} - 如果节点完全在可视范围内返回true，否则返回false
   */
  isNodeVisible(node) {
    // 获取节点
    let nodes = [...getParamNodes(node, this)]
    if (nodes.length === 0) return false
    node = nodes[0]

    // 获取舞台和容器信息
    const stage = this.state.stage
    const container = stage.container()
    const containerRect = container.getBoundingClientRect()
    const stageScale = stage.scaleX()
    const stagePosition = stage.position()

    // 获取节点相对于舞台的边界框
    const nodeBox = node.getClientRect({
      relativeTo: stage
    })

    // 将节点边界框从舞台坐标转换为屏幕坐标
    const nodeScreenX1 = nodeBox.x * stageScale + stagePosition.x
    const nodeScreenY1 = nodeBox.y * stageScale + stagePosition.y
    const nodeScreenX2 = nodeScreenX1 + nodeBox.width * stageScale
    const nodeScreenY2 = nodeScreenY1 + nodeBox.height * stageScale

    // 判断节点是否完全在容器可视区域内
    const isFullyVisible =
      nodeScreenX1 >= 0 &&
      nodeScreenY1 >= 0 &&
      nodeScreenX2 <= containerRect.width &&
      nodeScreenY2 <= containerRect.height

    return isFullyVisible
  }
  /**
   * 初始化变换框的高级样式配置
   */
  initAdvancedTransformerStyles() {
    const transformer = this.state.transformer
    if (!transformer) return

    // 设置默认的高级样式
    transformer.setAttrs({
      // 边框样式
      borderStrokeWidth: 2,
      borderDash: [],

      // 锚点样式
      anchorSize: 10, // Increased from 8
      anchorStrokeWidth: 2,
      anchorCornerRadius: 2,
      anchorFill: '#ffffff',
      anchorStroke: '#409eff',
      // 交互样式
      resizeEnabled: true,
      rotateEnabled: true,
      borderEnabled: true
    })
  }
  /**
   * 为变换框添加动画效果
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
   * 根据主题切换变换框样式
   * @param {string} theme - 主题名称 ('light', 'dark', 'colorful')
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