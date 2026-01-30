/**
 * @module nodeMAnager
 * @name   节点
 * @classdesc 用于管理 Konva.js 舞台上的节点操作，包括添加、删除、复制、剪切、粘贴、分组、解组等操作。
 * 该类能够处理节点的各种属性更新、位置调整和节点的隐藏显示等功能。
 */

import { getParamNodes } from '../utils/index'
import { v4 as uuidv4 } from 'uuid'
export default class nodeMAnager {
  constructor(state, stateManage, config) {
    this.config = config
    this.stateManage = stateManage
    this.state = state
  }
  /**
   * 添加节点到 Konva 舞台上
   * 根据事件的模块数据，调整位置，并将节点添加到最优图层
   * @param {Object} event - 触发添加节点的事件，包含模块数据
   * @param {Object} [layer] - 指定的图层（可选）
   */
  addNode(event, layer) {
    try {
      if (!event || !event.moduleData) {
        console.warn('节点添加异常：缺少必要参数')
        return
      }

      const scale = this.state.stage.scale()
      const position = this.state.stage.position()
      let adjustedX, adjustedY
      let targetLayer = layer || this.state.layers[2] // 默认使用 middle 层
      // 根据画布的缩放比例和偏移调整图片位置
      if (event.type === 'drop') {
        adjustedX = (event.offsetX - position.x) / scale.x
        adjustedY = (event.offsetY - position.y) / scale.y
      } else {
        const stageWidth = window.innerWidth - 621
        const stageHeight = window.innerHeight - 92
        const startX = -position.x / scale.x
        const startY = -position.y / scale.x
        adjustedX = stageWidth / 2 / scale.x + startX
        adjustedY = stageHeight / 2 / scale.y + startY
      }

      if (isNaN(adjustedX) || isNaN(adjustedY)) {
        console.warn('节点添加异常：节点位置计算错误')
        adjustedX = 0
        adjustedY = 0
      }

      const type = event.moduleData.type
      const moduleWidth = event.moduleData.width || 0
      const moduleHeight = event.moduleData.height || 0

      if (moduleWidth !== 0 || moduleHeight !== 0) {
        adjustedX -= moduleWidth / 2
        adjustedY -= moduleHeight / 2
      }

      // 构造节点数据
      const nodeData = {
        ...event.moduleData,
        x: parseInt(adjustedX),
        y: parseInt(adjustedY),
        type: type,
        props: event.moduleData.props
      }
      const params = {
        ...nodeData,
        layer: targetLayer
      }

      // 原有的节点创建逻辑保持不变
      switch (type) {
        case 'image':
          this.stateManage.class.modules.addImage(params)
          break
        case 'text':
          this.stateManage.class.modules.addText(params)
          break
        case 'button':
          this.stateManage.class.modules.addButton(params)
          break
        case 'switch':
          this.stateManage.class.modules.addSwitch(params)
          break
        case 'circle':
          this.stateManage.class.modules.addCircle(params)
          break
        case 'square':
          this.stateManage.class.modules.addSquare(params)
          break
        case 'star':
          this.stateManage.class.modules.addStar(params)
          break
        default:
          console.error(
            '未处理模块类型 konva组件检查:addNode方法;  DOM 组件检查:componentName是否配置 , 类型:',
            type
          )
          break
      }

      setTimeout(() => {
        try {
          this.stateManage.class.history.addHistory({ title: '添加节点' })

          // 触发节点添加完成事件
          const addedNode = this.getLastAddedNode(targetLayer)
          if (addedNode) {
            this.stateManage.class.event.trigger('nodeAdded', addedNode)
          }
        } catch (error) {
          console.warn('添加历史记录或触发事件失败:', error)
        }
      }, 300)
    } catch (error) {
      console.error('添加节点过程中发生错误:', error)
    }
  }
  /**
   * 获取最后添加的节点（辅助方法）
   * @param {Object} layer - 目标图层
   * @returns {Object|null} - 最后添加的节点
   */
  getLastAddedNode(layer) {
    try {
      if (!layer || !layer.children || layer.children.length === 0) {
        return null
      }

      const children = layer.children
      const lastChild = children[children.length - 1]

      // 确保是有效的节点（有ID且不是系统节点）
      if (lastChild && lastChild.attrs && lastChild.attrs.id) {
        return lastChild
      }

      return null
    } catch (error) {
      console.warn('获取最后添加的节点失败:', error)
      return null
    }
  }

  /**
   * 批量添加节点 - 性能优化版本
   * @param {Array} nodeDataArray - 节点数据数组
   * @param {Function} onProgress - 进度回调
   */
  batchAddNodes(nodeDataArray, onProgress) {
    if (!nodeDataArray || nodeDataArray.length === 0) return

    console.log(`开始批量添加 ${nodeDataArray.length} 个节点`)

    // 大量节点时优化处理
    const enableBatchMode = nodeDataArray.length > 50

    if (enableBatchMode) {
      // 暂停重绘和事件监听
      this.state.stage.listening(false)
      this.state.layers.forEach((layer) => layer.listening(false))
    }

    // 分批处理
    const batchSize = 20
    const processBatch = (startIndex) => {
      const endIndex = Math.min(startIndex + batchSize, nodeDataArray.length)

      for (let i = startIndex; i < endIndex; i++) {
        try {
          const nodeData = nodeDataArray[i]
          const mockEvent = {
            moduleData: nodeData,
            type: 'batch'
          }

          this.addNode(mockEvent)

          if (onProgress) {
            onProgress(i + 1, nodeDataArray.length)
          }
        } catch (error) {
          console.error(`添加第 ${i + 1} 个节点时出错:`, error)
        }
      }

      // 如果还有更多节点，继续处理下一批
      if (endIndex < nodeDataArray.length) {
        setTimeout(() => processBatch(endIndex), 1)
      } else {
        // 所有节点添加完成
        if (enableBatchMode) {
          setTimeout(() => {
            this.state.stage.listening(true)
            this.state.layers.forEach((layer) => layer.listening(true))
            this.state.stage.batchDraw()
          }, 50)
        }
      }
    }
    // 开始处理第一批
    processBatch(0)
  }
  /**
   * 删除指定的节点，支持批量删除，支持DOM相关节点的处理
   * @param {Object} node - 要删除的节点，可以为空，则删除选中的节点
   */
  // 递归找到所有的event
  findEventsInChildren(obj, result = []) {
    // 检查当前对象是否有event属性且不为空数组
    if (
      obj.attrs &&
      obj.attrs.event &&
      Array.isArray(obj.attrs.event) &&
      obj.attrs.event.length > 0
    ) {
      result.push({
        id: obj.attrs.id || null,
        name: obj.attrs.name || null,
        events: obj.attrs.event
      })
    }

    // 如果有children数组，递归处理每个子元素
    if (obj.children && Array.isArray(obj.children)) {
      obj.children.forEach((child) => {
        this.findEventsInChildren(child, result)
      })
    }

    return result
  }
  // 判断删除的id 是否在事件id 中是否存在
  hasNoCommonElements(a, b) {
    return !b.some((item) => a.includes(item))
  }
  deleteNodes(node) {
    // window.kdt.state.stage
    let nodess = [...getParamNodes(node, this)]
    let delIds = []
    nodess.forEach((item) => {
      delIds.push(item.attrs.id)
    })
    // console.log(JSON.stringify(window.store.state.stage.systemConfig),777777)

    // 画布事件
    let systemConfig = window.store.state.stage.systemConfig
    let systemConfigIds = []
    if (systemConfig && systemConfig.event && systemConfig.event.length > 0) {
      systemConfig.event.forEach((item) => {
        item.actionTabs.forEach((ite) => {
          systemConfigIds = ite.selectedComponents.concat(systemConfigIds)
        })
      })
    }
    let nodes = [...getParamNodes(node, this)]
    nodes.forEach((el) => {
      if (el.attrs.domId) {
        var dom = document.getElementById(el.attrs.domId)
        if (dom) {
          var parent = dom?.parentNode
          if (parent) {
            // 删除过渡 (避免删除时闪烁)
            dom.style.opacity = 0
            dom.style.transition = 'opacity 0.2s'
            // 延迟 0.3 秒后再删除 DOM 节点
            setTimeout(() => {
              if (dom && parent && dom.parentNode === parent) {
                parent.removeChild(dom)
              }
            }, 200)
          }
        }
      } else if (el instanceof Konva.Group) {
        el.children.forEach((child) => {
          if (child.attrs.domId) {
            var dom = document.getElementById(child.attrs.domId)
            if (dom) {
              var parent = dom?.parentNode
              if (parent) {
                dom.style.opacity = 0
                dom.style.transition = 'opacity 0.2s'
                setTimeout(() => {
                  if (dom && parent && dom.parentNode === parent) {
                    parent.removeChild(dom)
                  }
                }, 200)
              }
            }
          }
        })
      }
      el.to({
        opacity: 0,
        duration: 0.08,
        onFinish: () => {
          this.stateManage.class.transformer.resetTransformer()
          // 移除konva节点或者dom的遮罩节点
          el.destroy()
        }
      })
    })
    setTimeout(() => {
      this.stateManage.state.selectedNodes = []
      this.stateManage.class.event.trigger('deleteNodes', [...nodes])
      this.stateManage.class.event.trigger('nodeUpdate', {
        type: 'delete',
        nodes: [...nodes]
      })
      this.stateManage.class.transformer.clearMask()
      this.stateManage.class.history.addHistory({ title: '删除节点' })
    }, 220)
  }

  /**
   * 将选中的节点分组
   * 支持嵌套分组操作，将所有选中的节点或已有的分组节点组合成一个新的分组
   */
  groupNodes() {
    this.stateManage.class.transformer.clearMask()
    const selectedNodes = this.state.selectedNodes
    let groups = selectedNodes.filter((node) => node.attrs?.name === 'group')
    const group = new Konva.Group({
      id: uuidv4().split('-').join(''),
      attrs: {
        name: 'group',
        title: '新组合',
        transformable: true,
        draggable: true
      }
    })
    // 计算选中节点的边界框
    let boundingBox = this.calculateNodesBounds(selectedNodes)
    // 设置组合的位置为边界框的左上角
    group.position({
      x: boundingBox.x,
      y: boundingBox.y
    })
    if (groups.length > 0) {
      // 移动每个组合中的节点到新组合中
      groups.forEach((g) => {
        const groupScaleX = g.scaleX()
        const groupScaleY = g.scaleY()
        const groupX = g.x()
        const groupY = g.y()
        const groupRotation = g.rotation() // 使用角度，不转换为弧度
        const groupSkewX = group.skewX()
        const groupSkewY = group.skewY()
        ;[...g.children].forEach((child) => {
          // 考虑组合的缩放和旋转，将节点位置调整到新组合中
          //   const childX =
          //     child.x() * groupScaleX * Math.cos((groupRotation * Math.PI) / 180) -
          //     child.y() * groupScaleY * Math.sin((groupRotation * Math.PI) / 180) +
          //     groupX
          //   const childY =
          //     child.x() * groupScaleX * Math.sin((groupRotation * Math.PI) / 180) +
          //     child.y() * groupScaleY * Math.cos((groupRotation * Math.PI) / 180) +
          //     groupY
          child.position({
            x: child.x() + g.x() - boundingBox.x,
            y: child.y() + g.y() - boundingBox.y
          })
          child.rotation(child.rotation() + groupRotation)
          const childSkewX = groupSkewX + child.skewX()
          const childSkewY = groupSkewY + child.skewY()
          child.skewX(childSkewX)
          child.skewY(childSkewY)
          child.scaleX(child.scaleX() * groupScaleX)
          child.scaleY(child.scaleY() * groupScaleY)
          child.moveTo(group)
        })
        g.destroy()
      })
    }
    ;[...selectedNodes].forEach((node) => {
      if (!(node.attrs?.name === 'group')) {
        node.attrs.transformable = false
        if (node.attrs.props) {
          node.attrs.props._inGroup = true
        }
        node.position({
          x: node.x() - boundingBox.x,
          y: node.y() - boundingBox.y
        })
        node.moveTo(group)
        node.draggable(false)
      }
    })
    group.on('transform', (e) => {
      group.find('.dom-rect').forEach((child) => {
        const width = Math.abs(child.width() * group.scaleX())
        const height = Math.abs(child.height() * group.scaleY())
        child.scaleX(1)
        child.scaleY(1)
        child.width(width)
        child.height(height)
        this.stateManage.class.dom.updateDomPosition()
      })
      group.scaleX(1)
      group.scaleY(1)
    })
    // 添加新的组合到舞台
    this.state.layers[1].add(group)
    this.stateManage.class.transformer.addNodesTransformer([group])
    this.stateManage.class.event.trigger('group', group)
    this.stateManage.class.event.trigger('nodeUpdate', {
      type: 'group',
      nodes: [group]
    })
    this.stateManage.class.history.addHistory({ title: '组合节点' })
  }
  /**
   * 解散指定的组合，将组合中的节点恢复为独立的节点
   * @param {Object} [group=this.state.selectedNodes[0]] - 要解散的组合，默认使用选中的组合
   */
  ungroupNodes(group) {
    if (!group) {
      group = this.state.selectedNodes[0]
    }
    const layer = group.getLayer()
    // 获取组合的位置、缩放、旋转和skew属性
    const groupX = group.x()
    const groupY = group.y()
    const groupScaleX = group.scaleX()
    const groupScaleY = group.scaleY()
    const groupRotation = group.rotation() * (Math.PI / 180) // 将角度转换为弧度
    const groupSkewX = group.skewX()
    const groupSkewY = group.skewY()
    const childs = []
    ;[...group.children].forEach((child) => {
      if (child.attrs.name !== 'kd_mask') {
        // 排除遮罩
        // 使用旋转矩阵来计算子节点在组合中的新位置
        const childOffsetX = child.x() * groupScaleX
        const childOffsetY = child.y() * groupScaleY
        const rotatedX =
          childOffsetX * Math.cos(groupRotation) - childOffsetY * Math.sin(groupRotation)
        const rotatedY =
          childOffsetX * Math.sin(groupRotation) + childOffsetY * Math.cos(groupRotation)
        const childX = rotatedX + groupX
        const childY = rotatedY + groupY
        const childRotation = child.rotation() + groupRotation * (180 / Math.PI) // 将弧度转换回角度
        // 计算skew属性
        const childSkewX = groupSkewX + child.skewX()
        const childSkewY = groupSkewY + child.skewY()
        child.position({ x: childX, y: childY })
        child.rotation(childRotation)
        child.skewX(childSkewX)
        child.skewY(childSkewY)
        child.scaleX(child.scaleX() * groupScaleX)
        child.scaleY(child.scaleY() * groupScaleY)
        child.attrs.transformable = true
        if (child.attrs.props) {
          child.attrs.props._inGroup = false
        }
        child.draggable(true)
        child.moveTo(layer)
        childs.push(child)
      } else {
        child.hide()
      }
    })
    this.stateManage.class.transformer.resetTransformer()
    group.destroy()
    this.stateManage.class.event.trigger('ungroup', [...childs])
    this.stateManage.class.event.trigger('nodeUpdate', {
      type: 'group',
      nodes: [...childs]
    })
    this.stateManage.class.history.addHistory({ title: '拆分节点' })
  }
  /**
   * 锁定选中的节点，防止其被拖动或修改
   * @param {Object} [node] - 要锁定的节点，如果不提供则锁定选中的节点
   */
  lockNodes(node) {
    let nodes = [...getParamNodes(node, this)]
    nodes.forEach((node) => {
      node.attrs.lock = true
      node.draggable(false)
    })
    this.stateManage.class.transformer.handleTransformerStyle(nodes)
    this.stateManage.class.event.trigger('lock', [...nodes])
    this.stateManage.class.event.trigger('nodeUpdate', {
      type: 'lock',
      nodes: [...nodes]
    })
    this.stateManage.class.history.addHistory({ title: '锁定节点' })
  }
  /**
   * 解锁选中的节点，使其可以被拖动或修改
   * @param {Object} [node] - 要解锁的节点，如果不提供则解锁选中的节点
   */
  unlockNodes(node) {
    let nodes = [...getParamNodes(node, this)]
    nodes.forEach((node) => {
      node.attrs.lock = false
      node.draggable(true)
    })
    this.stateManage.class.transformer.handleTransformerStyle(nodes)
    this.stateManage.class.event.trigger('unlock', [...nodes])
    this.stateManage.class.event.trigger('nodeUpdate', {
      type: 'unlock',
      nodes: [...nodes]
    })
    this.stateManage.class.history.addHistory({ title: '解锁节点' })
  }
  /**
   * 复制选中的节点，并将其加入到剪贴板中
   * @param {Object} [node] - 要复制的节点
   */ copyNodes(node) {
    let nodes = getParamNodes(node, this)
    nodes = nodes.filter((child) => {
      return child.attrs.name !== 'kd_mask'
    })
    if (nodes.length === 0) {
      return
    }

    // 检查是否有管道组件处于编辑模式，如果有则先退出编辑模式
    const editingFlowLines = nodes.filter(
      (child) =>
        (child.className === 'kdtFlowLine' ||
          child.attrs.name === 'flowLine' ||
          child.className === 'CustomLine') &&
        child.attrs.isEdit === true
    )

    if (editingFlowLines.length > 0) {
      // 退出所有管道的编辑模式
      editingFlowLines.forEach((flowLine) => {
        if (typeof flowLine.exitEditMode === 'function') {
          flowLine.exitEditMode()
        }
      })

      // 重新选中这些节点到变换框
      setTimeout(() => {
        this.stateManage.class.transformer.resetTransformer(nodes)
        // 延迟执行复制，确保变换框状态已更新
        setTimeout(() => {
          this.executeCopyNodes(nodes)
        }, 50)
      }, 50)
      return
    }

    this.executeCopyNodes(nodes)
  }

  // 实际复制节点
  executeCopyNodes(nodes) {
    // 计算节点相对变换框的偏移量
    nodes = nodes.map((child) => {
      const pos = child.getAbsolutePosition()
      const transformerPos = this.state.transformer.getAbsolutePosition()
      const scale = this.state.stage.scaleX()

      // 特殊处理编辑模式刚退出的管道组件
      if (
        child.className === 'kdtFlowLine' ||
        child.attrs.name === 'flowLine' ||
        child.className === 'CustomLine'
      ) {
        // 检查变换框位置是否有效
        if (transformerPos.x <= -1000000 || transformerPos.y <= -1000000) {
          // 变换框位置无效时，使用管道自身位置
          child.attrs.transformerOffset = {
            x: pos.x / scale,
            y: pos.y / scale
          }
        } else {
          // 变换框位置有效，使用相对偏移
          child.attrs.transformerOffset = {
            x: (pos.x - transformerPos.x) / scale,
            y: (pos.y - transformerPos.y) / scale
          }
        }
      } else {
        // 普通组件的处理逻辑
        child.attrs.transformerOffset = {
          x: (pos.x - transformerPos.x) / scale,
          y: (pos.y - transformerPos.y) / scale
        }
      }
      return child
    })

    if (this.state.clipBoard && this.state.clipBoard.type === 'cut') {
      this.state.clipBoard.nodes.forEach((child) => {
        if (child.attrs.domId) {
          var dom = document.getElementById(child.attrs.domId)
          if (dom) {
            dom.style.opacity = 1
          }
        }
      })
    }

    this.state.clipBoard = {
      nodes: nodes,
      id: new Date().getTime(),
      type: 'copy'
    }
    this.stateManage.class.event.trigger('copy', [...nodes])
    this.stateManage.class.event.trigger('nodeUpdate', {
      type: 'copy',
      nodes: [...nodes]
    })
  }
  /**
   * 剪切选中的节点，并将其加入到剪贴板中
   * @param {Object} [node] - 要剪切的节点
   */
  cutNodes(node) {
    let nodes = getParamNodes(node, this)
    nodes = nodes.filter((child) => {
      return child.attrs.name !== 'kd_mask'
    })
    if (nodes.length === 0) {
      return
    }

    // 检查是否有管道组件处于编辑模式，如果有则先退出编辑模式
    const editingFlowLines = nodes.filter(
      (child) =>
        (child.className === 'kdtFlowLine' ||
          child.attrs.name === 'flowLine' ||
          child.className === 'CustomLine') &&
        child.attrs.isEdit === true
    )

    if (editingFlowLines.length > 0) {
      // 退出所有管道的编辑模式
      editingFlowLines.forEach((flowLine) => {
        if (typeof flowLine.exitEditMode === 'function') {
          flowLine.exitEditMode()
        }
      })

      // 重新选中这些节点到变换框
      setTimeout(() => {
        this.stateManage.class.transformer.resetTransformer(nodes)
        // 延迟执行剪切，确保变换框状态已更新
        setTimeout(() => {
          this.executeCutNodes(nodes)
        }, 50)
      }, 50)
      return
    }

    this.executeCutNodes(nodes)
  }

  // 将原来的剪切逻辑提取为单独方法
  executeCutNodes(nodes) {
    // 计算节点相对变换框的偏移量
    nodes = nodes.map((child) => {
      const pos = child.getAbsolutePosition()
      const transformerPos = this.state.transformer.getAbsolutePosition()
      const scale = this.state.stage.scaleX()

      // 特殊处理管道组件
      if (
        child.className === 'kdtFlowLine' ||
        child.attrs.name === 'flowLine' ||
        child.className === 'CustomLine'
      ) {
        // 检查变换框位置是否有效
        if (transformerPos.x <= -1000000 || transformerPos.y <= -1000000) {
          // 变换框位置无效时，使用管道自身的边界框中心
          const bounds = child.getClientRect()
          const centerX = bounds.x + bounds.width / 2
          const centerY = bounds.y + bounds.height / 2

          child.attrs.transformerOffset = {
            x: centerX / scale,
            y: centerY / scale
          }
        } else {
          // 变换框位置有效，使用边界框中心相对变换框的偏移
          const bounds = child.getClientRect()
          const centerX = bounds.x + bounds.width / 2
          const centerY = bounds.y + bounds.height / 2

          child.attrs.transformerOffset = {
            x: (centerX - transformerPos.x) / scale,
            y: (centerY - transformerPos.y) / scale
          }
        }
      } else {
        // 普通组件的处理逻辑
        if (
          transformerPos.x <= -1000000 ||
          transformerPos.y <= -1000000 ||
          !child.attrs.transformable
        ) {
          child.attrs.transformerOffset = {
            x: pos.x / scale,
            y: pos.y / scale
          }
        } else {
          child.attrs.transformerOffset = {
            x: (pos.x - transformerPos.x) / scale,
            y: (pos.y - transformerPos.y) / scale
          }
        }
      }
      return child
    })

    if (this.state.clipBoard && this.state.clipBoard.type === 'cut') {
      this.state.clipBoard.nodes.forEach((child) => {
        if (child.attrs.domId) {
          var dom = document.getElementById(child.attrs.domId)
          if (dom) {
            dom.style.opacity = 1
          }
        }
      })
    }

    ;[...nodes].forEach((child) => {
      if (child.attrs.domId) {
        var dom = document.getElementById(child.attrs.domId)
        if (dom) {
          dom.style.opacity = 0.5
        }
      }
    })

    this.state.clipBoard = {
      nodes: nodes,
      id: new Date().getTime(),
      type: 'cut'
    }
    this.stateManage.class.event.trigger('cut', [...nodes])
    this.stateManage.class.event.trigger('nodeUpdate', {
      type: 'cut',
      nodes: [...nodes]
    })
  }

  /**
   * 粘贴剪贴板中的节点到舞台上，并将其加入到当前图层中
   */
  pasteNodes() {
    var clipBoard = this.state.clipBoard
    if (!clipBoard || !clipBoard.nodes || clipBoard.nodes.length === 0) {
      return
    }

    const mousePos = this.state.stage.getPointerPosition()
    const stagePosition = this.state.stage.position()
    const scale = this.state.stage.scaleX()
    const newNodes = []
    const oldNodes = [...clipBoard.nodes]
    const bounds = this.calculateNodesBounds(clipBoard.nodes)

    // 用于跟踪异步加载的图片节点的Promise
    const asyncLoadingPromises = []

    oldNodes.forEach((child) => {
      const globalMousePos = {
        x: (mousePos.x - stagePosition.x) / scale,
        y: (mousePos.y - stagePosition.y) / scale
      }
      let newX, newY

      // 检查是否为特殊处理的节点
      if (!child.attrs.transformable) {
        newX = globalMousePos.x - bounds.width / 2
        newY = globalMousePos.y - bounds.height / 2
      } else {
        newX = globalMousePos.x + child.attrs.transformerOffset.x - bounds.width / 2
        newY = globalMousePos.y + child.attrs.transformerOffset.y - bounds.height / 2
      }

      if (clipBoard.type === 'cut') {
        if (child.attrs.domId) {
          let dom = document.getElementById(child.attrs.domId)
          if (dom) {
            dom.style.opacity = 1
          }
        }
        child.setAttrs({
          x: newX,
          y: newY
        })
        newNodes.push(child)
      } else if (clipBoard.type === 'copy') {
        // 为顶层节点创建新ID
        var id = uuidv4().split('-').join('')
        let newNode = child.clone({
          x: newX,
          y: newY
        })
        newNode.attrs.id = id

        // 处理顶层节点的domId
        if (child.attrs.domId) {
          var dom = document.getElementById(child.attrs.domId)
          if (dom) {
            newNode.attrs.domId = 'dom_' + id
            this.stateManage.class.event.trigger('domReset', [newNode])
          }
        }

        // 如果是组节点，递归处理所有子节点
        if (newNode instanceof Konva.Group) {
          this.recursiveResetNodeIds(newNode)
        }

        const currentLayer = child.getParent()
        currentLayer.add(newNode)

        // 检查是否是图片类型的节点，需要等待异步加载
        if (this.isImageNode(newNode)) {
          // 创建一个Promise来跟踪图片加载
          const loadPromise = this.waitForImageLoad(newNode)
          asyncLoadingPromises.push(loadPromise)
        }

        newNodes.push(newNode)
      }
    })

    // 等待所有异步操作完成后设置选择
    if (asyncLoadingPromises.length > 0) {
      Promise.allSettled(asyncLoadingPromises)
        .then((results) => {
          // 记录加载失败的节点
          const failedNodes = results
            .filter((result) => result.status === 'rejected')
            .map((result, index) => ({
              node: newNodes[index],
              error: result.reason
            }))

          if (failedNodes.length > 0) {
            console.warn('部分图片节点加载失败:', failedNodes)
          }

          // 无论是否有失败，都设置变换框
          setTimeout(() => {
            this.stateManage.class.transformer.resetTransformer(newNodes)
          }, 50)
        })
        .catch((error) => {
          console.error('等待图片加载时出错:', error)
          // 即使出错也要设置变换框
          setTimeout(() => {
            this.stateManage.class.transformer.resetTransformer(newNodes)
          }, 50)
        })
    } else {
      // 没有异步加载的节点，立即设置变换框
      setTimeout(() => {
        this.stateManage.class.transformer.resetTransformer(newNodes)
      }, 50)
    }

    this.stateManage.class.dom.updateDomPosition()
    this.state.clipBoard = null
    this.stateManage.class.event.trigger('paste', [...newNodes])
    this.stateManage.class.event.trigger('nodeUpdate', {
      type: 'paste',
      nodes: [...newNodes]
    })
    this.stateManage.class.history.addHistory({ title: '粘贴节点' })
  }
  /**
   * 等待图片节点加载完成
   * @param {Object} node - 图片节点
   * @returns {Promise} - 加载Promise
   */
  waitForImageLoad(node) {
    return new Promise((resolve, reject) => {
      // 设置超时时间为5秒
      const timeout = setTimeout(() => {
        reject(new Error(`图片节点 ${node.attrs.id} 加载超时`))
      }, 5000)

      // 检查是否是CustomImage实例且有waitForLoad方法
      if (node.waitForLoad && typeof node.waitForLoad === 'function') {
        node
          .waitForLoad()
          .then(() => {
            clearTimeout(timeout)
            resolve(node)
          })
          .catch((error) => {
            clearTimeout(timeout)
            reject(error)
          })
      } else {
        // 传统的检测方式
        const checkLoad = () => {
          try {
            // 多种检测方式
            const hasImage = node.image() !== null && node.image() !== undefined
            const hasValidSize =
              node.width() > 0 && node.height() > 0 && !isNaN(node.width()) && !isNaN(node.height())
            const notLoading = node.loading === false
            const isReady = node.isImageReady === true || node.isLoaded === true

            if ((hasImage && hasValidSize) || notLoading || isReady) {
              clearTimeout(timeout)
              resolve(node)
            } else {
              // 继续检测，但限制检测次数
              if (checkLoad.count < 100) {
                checkLoad.count++
                setTimeout(checkLoad, 50)
              } else {
                clearTimeout(timeout)
                reject(new Error(`图片节点 ${node.attrs.id} 检测次数超限`))
              }
            }
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        }

        checkLoad.count = 0
        checkLoad()
      }
    })
  }

  /**
   * 判断节点是否为图片类型
   * @param {Object} node - 节点对象
   * @returns {boolean} - 是否为图片节点
   */
  isImageNode(node) {
    return (
      node.attrs.name === 'image' ||
      node.attrs.name === 'gif' ||
      node.className === 'CustomImage' ||
      (node.constructor && node.constructor.name === 'CustomImage')
    )
  }

  calculateNodesBounds(nodes) {
    const selectedNodes = nodes || this.state.selectedNodes
    const stage = this.state.stage
    const stageScaleX = stage.scaleX()
    const stageScaleY = stage.scaleY()
    const stageX = stage.x()
    const stageY = stage.y()
    // 创建一个透明的遮罩以覆盖整个范围
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
   * 隐藏指定的节点。
   * 支持批量隐藏节点，并处理与 DOM 相关的节点。
   * @param {Object} [node] - 要隐藏的节点，如果不提供则隐藏选中的节点
   * @param {number} [duration=0] - 动画持续时间，单位为毫秒
   */
  hideNodes(node, duration = 0) {
    let nodes = getParamNodes(node, this)
    if (nodes.length === 0) {
      return
    }
    nodes.forEach((child) => {
      if (child?.attrs && child?.attrs?.domId) {
        var dom = document.getElementById(child.attrs.domId)
        if (dom) {
          if (duration > 0) {
            dom.style.transition = `opacity ${duration}ms`
            dom.style.opacity = '0'
            setTimeout(() => {
              dom.style.display = 'none'
            }, duration)
          } else {
            dom.style.display = 'none'
          }
        }
      }
      //   判断是否已经隐藏了 隐藏了不要重复隐藏
      if (child.visible()) {
        if (duration > 0) {
          child.to({
            opacity: 0,
            duration: duration / 1000,
            onFinish: () => {
              child.visible(false)
              child.attrs.visible = false
            }
          })
        } else {
          child.visible(false)
          child.attrs.visible = false
        }
        // 如果节点当前在变换框中，需要将其从变换框中移除
        this.stateManage.class.transformer.removeNodeTransformer(child)
      }
    })
    this.stateManage.class.event.trigger('hide', [...nodes])
    this.stateManage.class.event.trigger('nodeUpdate', {
      type: 'hide',
      nodes: [...nodes]
    })
    this.stateManage.class.history.addHistory({ title: '隐藏节点' })
  }

  /**
   * 显示指定的节点。
   * 支持批量显示节点，并处理与 DOM 相关的节点。
   * @param {Object} [node] - 要显示的节点，如果不提供则显示选中的节点
   * @param {number} [duration=0] - 动画持续时间，单位为毫秒
   */
  showNodes(node, duration = 0) {
    let nodes = getParamNodes(node, this)
    nodes.forEach((child) => {
      if (child.attrs.domId) {
        var dom = document.getElementById(child.attrs.domId)
        if (dom) {
          dom.style.display = 'block'
          if (duration > 0) {
            dom.style.transition = `opacity ${duration}ms`
            dom.style.opacity = '1'
          }
        }
      }
      if (duration > 0) {
        child.visible(true)
        child.attrs.visible = true
        child.to({
          opacity: 1,
          duration: duration / 1000
        })
      } else {
        child.visible(true)
        child.attrs.visible = true
      }
    })
    this.stateManage.class.event.trigger('show', [...nodes])
    this.stateManage.class.event.trigger('nodeUpdate', {
      type: 'show',
      nodes: [...nodes]
    })
    this.stateManage.class.history.addHistory({ title: '显示节点' })
  }
  /**
   * 更新节点的属性。
   * 支持批量更新，并可以选择是否更新节点的可见性。
   * @param {Object} node - 要更新的节点
   * @param {Object} attrs - 要更新的属性对象
   */
  updateNodeAttrs(node, attrs) {
    let nodes = getParamNodes(node, this, false)
    nodes.forEach((child) => {
      child.attrs = { ...child.attrs, ...attrs }
    })
  }
  /**
   * 切换指定节点的显示状态。
   * 如果节点当前可见，则隐藏；如果不可见，则显示。
   * 支持批量处理节点，并适配 DOM 和 Konva 节点。
   * @param {Object} [node] - 要切换的节点，如果不提供则切换选中的节点
   * @param {number} [duration=0] - 动画持续时间，单位为毫秒
   */
  toggleNodes(node, duration = 0) {
    let nodes = getParamNodes(node, this)
    nodes.forEach((child) => {
      if (child.visible()) {
        // 节点当前是可见的，隐藏它
        this.hideNodes(child, duration)
      } else {
        // 节点当前是隐藏的，显示它
        this.showNodes(child, duration)
      }
    })
  }
  /**
   * 获取所有图层中的所有节点。
   * 该方法会返回所有有效节点，并排除未命名或没有有效 ID 的节点。
   * @returns {Object[]} - 返回所有符合条件的节点数组
   */
  getAllLayersNodes() {
    let filteredNodes = []

    // 递归提取非 group 节点
    const extractNodes = (nodes) => {
      nodes.forEach((node) => {
        const name = node.name()
        const id = node.attrs?.id

        if (!name || !id) return

        if (node.attrs.name === 'group' && Array.isArray(node.children)) {
          // 如果是 group，则递归提取其子节点
          extractNodes(node.children)
        } else {
          filteredNodes.push(node)
        }
      })
    }

    // 遍历每个图层
    this.state.stage.children.forEach((layer) => {
      extractNodes(layer.children)
    })

    return filteredNodes
  }

  /**
   * 处理节点拖动事件的回调函数。
   * 当前方法没有实际操作，仅作为示例保留。
   * @param {Object} e - 拖动事件对象
   */
  nodeDragmovehandler(e) {
    // var x = shape.x();
    // var y = shape.y();
    // var width = shape.width();
    // var height = shape.height();
    // var stageWidth = stage.width();
    // var stageHeight = stage.height();
    // // 限制拖动范围
    // if (x < 0) {
    //   shape.x(0);
    // }
    // if (x + width > stageWidth) {
    //   shape.x(stageWidth - width);
    // }
    // if (y < 0) {
    //   shape.y(0);
    // }
    // if (y + height > stageHeight) {
    //   shape.y(stageHeight - height);
    // }
  }
  /**
   * 设置节点的高度。
   * 通用方法，适应不同类型的节点
   * @param {Object} node - 要设置高度的节点
   * @param {number} newHeight - 要设置的新高度
   */
  setNodeHeight(node, newHeight) {
    if (!node) return
    newHeight = Math.max(0, newHeight)
    if (node.attrs && node.attrs.props) {
      node.attrs.props.height = newHeight
    }
    if (typeof node.setHeight === 'function' && String(node.setHeight).indexOf('setHeight') > -1) {
      node.setHeight(newHeight)
      return
    } else if (node instanceof Konva.Group && node.children && node.children.length > 0) {
      const firstChild = node.children[0]
      if (typeof firstChild.height === 'function') {
        firstChild.height(newHeight)
      } else {
        node.height(newHeight)
      }
    } else if (typeof node.height === 'function') {
      node.height(newHeight)
    }
    if (!node.attrs.domId) {
      this.stateManage.class.transformer.updateNodeCenterOrigin(node)
    }
    setTimeout(() => {
      this.stateManage.class.dom.updateDomPosition()
    })
    window.kdt.forceUpdate()
  }
  /**
   * 设置节点的宽度。
   * 通用方法，适应不同类型的节点
   * @param {Object} node - 要设置宽度的节点
   * @param {number} newWidth - 要设置的新宽度
   */
  setNodeWidth(node, newWidth) {
    if (!node) return
    newWidth = Math.max(0, newWidth)
    if (node.attrs && node.attrs.props) {
      node.attrs.props.width = newWidth
    }
    if (typeof node.setWidth === 'function' && String(node.setWidth).indexOf('setWidth') > -1) {
      node.setWidth(newWidth)
      return
    } else if (typeof node.width === 'function') {
      node.width(newWidth)
    }
    if (!node.attrs.domId) {
      this.stateManage.class.transformer.updateNodeCenterOrigin(node)
    }
    setTimeout(() => {
      this.stateManage.class.dom.updateDomPosition()
    })
    window.kdt.forceUpdate()
  }
  /**
   * 强制更新节点的状态。
   * 该方法用于刷新节点的状态、更新变换框，并重新绘制舞台。
   */
  forceUpdate() {
    if (this.state.transformer) {
      this.state.transformer.forceUpdate()
    }
    this.stateManage.class.transformer.clearMask()
    this.stateManage.class.transformer.autoAddMaskToTransformer()
    this.state.stage.draw()
  }
  /**
   * 更新指定节点的数据。
   * 通过节点的 ID 找到节点并更新其数据属性，同时触发数据更新事件。
   *  @isForceUpdateData Bool  是否强制更新数据
   *  @type    DataUpdateType
   */
  updateNodeData({ id, data, isForceUpdateData, type }) {
    data = data instanceof Object ? JSON.parse(JSON.stringify(data)) : data
    let allNodes = this.getAllLayersNodes()
    allNodes.forEach((node) => {
      if (node.attrs.id === id) {
        if (type === 'textProject') {
          node.attrs.props = { ...node.attrs.props, projectOrTextData: data }
        } else {
          node.attrs.props._lastDataUpdateType = type || ''
          if (!isForceUpdateData) {
            node.attrs.props._rawData = data
          }
          if (!node.attrs.component.disibleAutoUpdateData || isForceUpdateData) {
            // 触发节点更新事件
            this.stateManage.class.event.trigger('dataUpdate', {
              data: data,
              id,
              type: type || '',
              node
            })
            node.attrs.props.data = data
          }
        }
      }
    })
  }
  /**
   * 根据节点 ID 获取节点。
   * 在所有图层中查找并返回具有指定 ID 的节点。
   * @param {string} id - 节点的 ID
   * @returns {Object|undefined} - 返回找到的节点对象，未找到则返回 undefined
   */
  getNodeById(id) {
    let allNodes = this.getAllLayersNodes()
    return allNodes.find(
      (node) =>
        node.attrs.id === id ||
        (node.attrs.name === 'group' && node.children.some((child) => child.attrs.id === id))
    )
  }
  /**
   * 将所有节点的拖动功能禁用。
   * 遍历所有图层的所有节点，禁用其拖动功能。
   */
  allNodesDisableDrag() {
    this.getAllLayersNodes().forEach((node) => {
      node.draggable(false)
    })
  }
  /**
   * 将所有节点的拖动功能启用
   * 遍历所有图层的所有节点，启用其拖动功能
   * 但如果节点的 lock 属性为 true，则不会启用拖动功能
   */
  allNodesAllowDrag() {
    this.getAllLayersNodes().forEach((node) => {
      // 检查节点是否被锁定
      if (node.attrs.lock) {
        return
      }
      // 检查节点是否在组合中（父节点是组合）
      if (node.parent && node.parent.attrs && node.parent.attrs.name === 'group') {
        return
      }
      // 检查节点自身的 transformable 属性
      if (node.attrs.transformable === false) {
        return
      }
      node.draggable(true)
    })
  }
  /**
   *  用于获取事件或者子节点的实际节点(解决嵌套节点, 事件在子节点触发的问题)
   *  @param {Object} event - 事件对象 或者 某个子节点
   *  @return {Object} node - 实际的节点
   *
   */
  getEventNode(eventOrNode) {
    let node
    if (eventOrNode.target) {
      node = eventOrNode.target
    } else {
      node = eventOrNode
    }
    if (node.parent instanceof Konva.Group) {
      node = node.parent
      if (node.parent instanceof Konva.Group && node.parent.attrs.name === 'group') {
        node = node.parent
      }
    }
    return node
  }
  /**
   * 禁用所有节点的拖动功能
   */
  disableDragging() {
    const allNodes = this.getAllLayersNodes()
    allNodes.forEach((node) => {
      node.draggable(false)
    })
  }
  /**
   * 启用所有节点的拖动功能（除非节点被锁定）
   */
  enableDragging() {
    const allNodes = this.getAllLayersNodes()
    allNodes.forEach((node) => {
      if (!node.attrs.lock && this.state.isEdit) {
        node.draggable(true)
      }
    })
  }
  /**
   * 获取节点的尺寸
   * 通用方法，适用于各种自定义组件
   * @param {Object} node - 要获取尺寸的节点
   * @returns {Object} - 包含width和height属性的对象
   */
  getNodeSize(node) {
    let width, height
    const stageScale = window.kdt.getStageScale().x
    // 临时重置旋转获取正确尺寸
    const originalRotation = node.rotation()
    // 临时将旋转设为0
    node.rotation(0)
    // 获取未旋转时的尺寸
    const rect = node.getClientRect()
    width = rect.width
    height = rect.height
    // 恢复原始旋转
    node.rotation(originalRotation)
    return {
      width: parseFloat(parseFloat(width / stageScale).toFixed(1)),
      height: parseFloat(parseFloat(height / stageScale).toFixed(1))
    }
  }
  /**
   * 对指定节点进行缓存
   * @param {Array<Konva.Node>} nodes - 要缓存的节点数组
   */
  cacheNodes(nodes) {
    nodes.forEach((node) => {
      if (
        !node.isCached() &&
        node.attrs.transformable &&
        !node.attrs.lock &&
        node.visible() 
      ) {
        node.cache()
      }
    })
  }

  /**
   * 取消指定节点的缓存
   * @param {Array<Konva.Node>} nodes - 要取消缓存的节点数组
   */
  clearCacheNodes(nodes) {
    nodes.forEach((node) => {
      if (node.isCached()) {
        node.clearCache()
      }
    })
  }
  /**
   * 递归重置节点及其子节点的ID
   * @param {Object} node - 要重置ID的节点
   */
  recursiveResetNodeIds(node) {
    // 处理所有子节点
    if (node.children && node.children.length > 0) {
      node.children.forEach((child, index) => {
        // 为每个子节点分配新ID
        if (child.attrs.id) {
          const newId = uuidv4().split('-').join('')
          child.attrs.id = newId

          // 处理domId
          if (child.attrs.domId) {
            child.attrs.domId = 'dom_' + newId
            this.stateManage.class.event.trigger('domReset', [child])
          }

          // 递归处理子节点的子节点
          if (child instanceof Konva.Group) {
            this.recursiveResetNodeIds(child)
          }
        }
      })
    }
  }
  /**
   * 聚焦指定节点，使该节点位于画布中心
   * 根据当前画布的缩放和偏移更新画布位置
   * @param {Object} node - 要聚焦的节点
   * @param {boolean} enableAnimation - 是否启用动画
   */
  focusNode(node, enableAnimation = true) {
    let nodes = [...getParamNodes(node, this)]
    if (nodes.length === 0) return
    node = nodes[0]
    const stage = this.state.stage
    const container = stage.container()
    const containerRect = container.getBoundingClientRect()
    // 视口中心点 - 需要考虑容器在视口中的位置
    const viewportCenterX = window.innerWidth / 2
    const viewportCenterY = window.innerHeight / 2
    // 计算容器相对于视口的偏移量
    const containerOffsetX = containerRect.left
    const containerOffsetY = containerRect.top
    // 计算容器在视口坐标系中的中心点
    const containerCenterX = viewportCenterX - containerOffsetX
    const containerCenterY = viewportCenterY - containerOffsetY
    const stageScale = window.kdt.getStageScale().x
    // 获取节点相对于舞台的包围盒
    const nodeBox = node.getClientRect({
      relativeTo: stage
    })
    // 节点中心点在舞台坐标系中的位置
    const nodeCenter_stageX = nodeBox.x + nodeBox.width / 2
    const nodeCenter_stageY = nodeBox.y + nodeBox.height / 2
    // 计算舞台需要移动到的位置，使节点中心点与视口中心点对齐
    let newStageX = containerCenterX - nodeCenter_stageX * stageScale
    let newStageY = containerCenterY - nodeCenter_stageY * stageScale
    // 如果启用动画，检查并调整缩放比以确保元素完整显示
    let newScale = stageScale
    if (enableAnimation) {
      // 计算节点在当前缩放下的视觉尺寸
      const nodeVisualWidth = nodeBox.width * stageScale
      const nodeVisualHeight = nodeBox.height * stageScale
      // 计算可用的容器尺寸（考虑一些边距）
      const availableWidth = containerRect.width * 0.85 // 留15%的边距
      const availableHeight = containerRect.height * 0.85 // 留15%的边距
      // 如果节点视觉尺寸超过可用尺寸，计算新的缩放比
      if (nodeVisualWidth > availableWidth || nodeVisualHeight > availableHeight) {
        const scaleX = availableWidth / nodeBox.width
        const scaleY = availableHeight / nodeBox.height

        // 选择较小的缩放比确保完整显示
        newScale = Math.min(scaleX, scaleY)

        // 使用新的缩放比重新计算位置
        newStageX = containerCenterX - nodeCenter_stageX * newScale
        newStageY = containerCenterY - nodeCenter_stageY * newScale
      }
    }

    // 创建并播放过渡动画
    const tweenOptions = {
      node: stage,
      duration: 0.3,
      x: newStageX,
      y: newStageY,
      easing: Konva.Easings.EaseInOut
    }
    const tween = new Konva.Tween(tweenOptions)
    tween.onUpdate = () => {
      this.stateManage.class.dom.updateDomPosition()
      if (this.stateManage.class.event) {
        this.stateManage.class.event.trigger('updateSketchRule')
      }
    }
    tween.onFinish = () => {
      this.stateManage.class.dom.updateDomPosition()
      if (this.stateManage.class.event) {
        this.stateManage.class.event.trigger('updateSketchRule')
      }
    }
    tween.play()
  }
  /**
   * 获取节点的坐标(左上角)
   * @param {Object} node - 节点对象
   * @returns {Object} - {x, y} 左上角坐标
   */
  getNodePosition(node) {
    const currentX = node.x()
    const currentY = node.y()
    const offsetX = node.offsetX() || 0
    const offsetY = node.offsetY() || 0
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    const rotation = node.rotation()
    // 如果没有偏移，直接返回当前坐标
    if (offsetX === 0 && offsetY === 0) {
      return { x: currentX, y: currentY }
    }

    // 计算偏移量对应的实际距离
    const scaledOffsetX = offsetX * scaleX
    const scaledOffsetY = offsetY * scaleY

    // 考虑旋转的影响
    const rotationRad = (rotation * Math.PI) / 180
    const cos = Math.cos(rotationRad)
    const sin = Math.sin(rotationRad)

    const rotatedOffsetX = scaledOffsetX * cos - scaledOffsetY * sin
    const rotatedOffsetY = scaledOffsetX * sin + scaledOffsetY * cos

    return {
      x: currentX - rotatedOffsetX,
      y: currentY - rotatedOffsetY
    }
  }
  /**
   * 设置节点的坐标(左上角)
   * @param {Object} node - 节点对象
   * @param {number} x - 目标左上角x坐标
   * @param {number} y - 目标左上角y坐标
   */
  setNodePosition(node, x, y) {
    const offsetX = node.offsetX() || 0
    const offsetY = node.offsetY() || 0
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    const rotation = node.rotation()
    setTimeout(() => {
      this.focusNode(node)
    }, 30)
    // 如果没有偏移，直接设置坐标
    if (offsetX === 0 && offsetY === 0) {
      node.x(x)
      node.y(y)
      return
    }

    // 计算偏移量对应的实际距离
    const scaledOffsetX = offsetX * scaleX
    const scaledOffsetY = offsetY * scaleY

    // 考虑旋转的影响
    const rotationRad = (rotation * Math.PI) / 180
    const cos = Math.cos(rotationRad)
    const sin = Math.sin(rotationRad)

    const rotatedOffsetX = scaledOffsetX * cos - scaledOffsetY * sin
    const rotatedOffsetY = scaledOffsetX * sin + scaledOffsetY * cos

    // 设置节点的实际坐标
    node.x(x + rotatedOffsetX)
    node.y(y + rotatedOffsetY)
  }
}