/**
 * @module LayerManage
 * @name   图层
 * @description  用于管理 Konva.js 舞台中的图层和节点的层级顺序。
 * 提供了创建图层、移动节点至顶层、底层、上移和下移的功能。
 */
export default class LayerManage {
  constructor(state, stateManage, config) {
    this.config = config
    this.stateManage = stateManage
    this.state = state
  }

  /**
   * 根据配置的图层名称创建 Konva 图层，并将其添加到舞台上。
   * 同时设置每个图层的 z-index，以确保图层的正确堆叠顺序。
   */
  createLayers() {
    this.config.layerNames.forEach((name) => {
      const layer = new Konva.Layer({ name })
      this.state.layers.push(layer)
      this.state.stage.add(layer)
    })
    setTimeout(() => {
      this.resetLayerIndex()
    })
  }
  /**
   *  重置图层的 z-index
   *
   */
  resetLayerIndex() {
    const canvasArr = document.querySelectorAll('.konvajs-content > canvas')
    canvasArr.forEach((element, index) => {
      element.style.zIndex = index === canvasArr.length - 1 ? 999 : index
    })
  }

  /**
   * 将指定的节点移动到图层的底部。
   * @param {Object} node - 要移动的节点
   */
  moveToBottom(node) {
    let nodes = []
    if (node instanceof Konva.Node) {
      nodes = [node]
    } else if (!node) {
      nodes = this.state.selectedNodes
    }

    nodes.forEach((el) => {
      if (el.attrs.domId) {
        // 更新DOM元素的z-index
        const dom = document.getElementById(el.attrs.domId)
        dom.style.zIndex = 1

        // 移动DOM元素到其父容器的最前面（文档流中最早的位置）
        const parent = dom.parentNode
        if (parent && parent.firstChild !== dom) {
          parent.insertBefore(dom, parent.firstChild)
        }

        // 同时移动Konva中的代理节点到第二层
        const secondLayer = this.state.layers[1]
        el.moveTo(secondLayer)
        el.moveToBottom()
      } else {
        const secondLayer = this.state.layers[1]
        el.moveTo(secondLayer)
        el.moveToBottom()
      }
    })
  }

  /**
   * 将指定的节点移动到图层的顶层。
   * 如果节点有 DOM 关联，则修改其 z-index，并移动对应的Konva代理节点。
   * @param {Object} node - 要移动的节点
   */
  moveToTop(node) {
    let nodes = []
    if (node instanceof Konva.Node) {
      nodes = [node]
    } else if (!node) {
      nodes = this.state.selectedNodes
    }
    nodes.forEach((el) => {
      if (el.attrs.domId) {
        // 获取最大z-index
        const konvaContent = document.querySelector('.konvajs-content')
        const elements = konvaContent.querySelectorAll(':scope > div, :scope > canvas')
        let maxZIndex = 0
        elements.forEach((element) => {
          const zIndex = parseInt(element.style.zIndex, 10) || 0
          if (zIndex > maxZIndex) {
            maxZIndex = zIndex
          }
        })

        // 更新DOM元素的z-index
        const dom = document.getElementById(el.attrs.domId)
        dom.style.zIndex = maxZIndex + 1+"!important"

        // 同时移动Konva中的代理节点到最顶层
        const lastLayer = this.state.layers[this.state.layers.length - 1]
        el.moveTo(lastLayer)
        el.moveToTop()
      } else {
        const lastLayer = this.state.layers[this.state.layers.length - 1]
        el.moveTo(lastLayer)
        el.moveToTop()
      }
    })
    // 确保舞台的变换器处于顶层
    this.state.transformer.moveToTop()
  }

  /**
   * 将指定的节点向上移动一层。
   * @param {Object} node - 要移动的节点
   */
  moveUp(node) {
    let nodes = []
    if (node instanceof Konva.Node) {
      nodes = [node]
    } else if (!node) {
      nodes = this.state.selectedNodes
    }

    nodes.forEach((el) => {
      if (el.attrs.domId) {
        const dom = document.getElementById(el.attrs.domId)

        // 调整z-index
        dom.style.zIndex = parseInt(dom.style.zIndex || 1) + 1

        // 调整DOM元素在文档流中的位置
        const parent = dom.parentNode
        if (parent && dom.nextElementSibling) {
          // 向后移动一位（移到后一个兄弟元素之后）
          parent.insertBefore(dom.nextElementSibling, dom)
        } else if (parent) {
          // 如果没有下一个兄弟元素，则移到父容器的最后
          parent.appendChild(dom)
        }

        // 移动Konva节点
        if (el instanceof Konva.Node) {
          if (this.isElementOnTop(el)) {
            this.moveToBottomOfNextLayer(el, this.state.stage)
          } else {
            el.moveUp()
          }
        }
      } else if (el instanceof Konva.Node) {
        if (this.isElementOnTop(el)) {
          this.moveToBottomOfNextLayer(el, this.state.stage)
        } else {
          el.moveUp()
        }
      }
    })
  }

  /**
   * 将指定的节点向下移动一层。
   * @param {Object} node - 要移动的节点
   */
  moveDown(node) {
    let nodes = []
    if (node instanceof Konva.Node) {
      nodes = [node]
    } else if (!node) {
      nodes = this.state.selectedNodes
    }

    nodes.forEach((el) => {
      if (el.attrs.domId) {
        const dom = document.getElementById(el.attrs.domId)

        // 调整z-index
        if (parseInt(dom.style.zIndex) > 1) {
          if (dom.style.zIndex > 900) {
            dom.style.zIndex = 3
          } else {
            dom.style.zIndex = parseInt(dom.style.zIndex || 1) - 1
          }
        }

        // 调整DOM元素在文档流中的位置
        const parent = dom.parentNode
        if (parent && dom.previousElementSibling) {
          // 向前移动一位（移到前一个兄弟元素之前）
          parent.insertBefore(dom, dom.previousElementSibling)
        }

        // 移动Konva节点
        if (el instanceof Konva.Node) {
          if (this.isElementOnBottom(el)) {
            this.moveToTopOfPreviousLayer(el, this.state.stage)
          } else {
            el.moveDown()
          }
        }
      } else if (el instanceof Konva.Node) {
        if (this.isElementOnBottom(el)) {
          this.moveToTopOfPreviousLayer(el, this.state.stage)
        } else {
          el.moveDown()
        }
      }
    })
  }
  /**
   *  检查元素是否是父级中最后一个元素（即顶层元素）
   * @param {Object} konvaNode - Konva 节点
   * @returns {boolean} - 是否是顶层元素
   */
  isElementOnTop(konvaNode) {
    if (!konvaNode || !konvaNode.getParent()) {
      return false
    }
    const parent = konvaNode.getParent()
    const children = parent.getChildren()
    const elementIndex = children.indexOf(konvaNode)
    return elementIndex === children.length - 1
  }
  /**
   * 检查节点是否是图层中的底层元素。
   * @param {Object} konvaNode - Konva 节点
   * @returns {boolean} - 是否是底层元素
   */
  isElementOnBottom(konvaNode) {
    if (!konvaNode || !konvaNode.getParent()) {
      // 如果元素不存在或没有父级，返回false
      return false
    }

    const parent = konvaNode.getParent()
    const children = parent.getChildren()
    const elementIndex = children.indexOf(konvaNode)

    // 检查元素是否是父级中的第一个元素（即底层元素）
    return elementIndex === 0
  }
  /**
   * 将节点移动到下一个图层的底部。
   * @param {Object} konvaNode - Konva 节点
   * @param {Object} stage - Konva 舞台对象
   */
  moveToBottomOfNextLayer(konvaNode, stage) {
    if (!konvaNode || !konvaNode.getParent() || !stage) {
      return false
    }
    const currentLayer = konvaNode.getParent()

    const layers = stage.getChildren()
    const currentIndex = layers.indexOf(currentLayer)

    // 检查是否存在下一个图层 (此处减2 保留最后一个图层 不保留减1)
    if (currentIndex === -1 || currentIndex >= layers.length - 1) {
      return false
    }

    const nextLayer = layers[currentIndex + 1]

    // 移动元素到下一个图层的底部
    konvaNode.moveToBottom()
    konvaNode.moveTo(nextLayer)
    nextLayer.draw()
  }
  /**
   * 将节点移动到上一个图层的顶部。
   * @param {Object} konvaNode - Konva 节点
   * @param {Object} stage - Konva 舞台对象
   */
  moveToTopOfPreviousLayer(konvaNode, stage) {
    if (!konvaNode || !konvaNode.getParent() || !stage) {
      return false
    }
    const currentLayer = konvaNode.getParent()
    const layers = stage.getChildren()
    const currentIndex = layers.indexOf(currentLayer)
    // 检查是否存在上一个图层 (保留底层 不保留 此处判断改成0)
    if (currentIndex <= 1) {
      return false
    }
    const previousLayer = layers[currentIndex - 1]
    // 移动元素到上一个图层的顶部
    konvaNode.moveToTop()
    konvaNode.moveTo(previousLayer)
    previousLayer.draw()
  }
  /**
   * 临时将节点移动到顶层（记录原始位置）
   * @param {Array|Object} nodes - 要移动的节点或节点数组
   */
  moveToTopTemporary(nodes) {
    let nodeArray = []
    if (nodes instanceof Konva.Node) {
      nodeArray = [nodes]
    } else if (Array.isArray(nodes)) {
      nodeArray = nodes
    } else if (!nodes) {
      nodeArray = this.state.selectedNodes
    }

    nodeArray.forEach((node) => {
      if (!node || !node.getParent()) return

      // 记录原始层级信息
      const originalLayer = node.getParent()
      const originalIndex = originalLayer.getChildren().indexOf(node)

      // 将原始位置信息存储到节点属性中
      node.attrs.__originalLayerInfo__ = {
        layer: originalLayer,
        index: originalIndex,
        zIndex: node.zIndex() || 0
      }

      if (node.attrs.domId) {
        // 处理DOM节点
        const dom = document.getElementById(node.attrs.domId)
        if (dom) {
          // 记录原始DOM的z-index
          node.attrs.__originalLayerInfo__.domZIndex = dom.style.zIndex || '1'
        }

        // 移动Konva代理节点到最顶层
        const lastLayer = this.state.layers[this.state.layers.length - 1]
        node.moveTo(lastLayer)
        node.moveToTop()
      } else {
        // 处理普通Konva节点
        const lastLayer = this.state.layers[this.state.layers.length - 1]
        node.moveTo(lastLayer)
        node.moveToTop()
      }
    })

    // 确保变换器始终在最顶层
    if (this.state.transformer) {
      this.state.transformer.moveToTop()
    }
  }

  /**
   * 恢复节点到原始层级位置
   * @param {Array|Object} nodes - 要恢复的节点或节点数组
   */
  restoreOriginalLayer(nodes) {
    let nodeArray = []
    if (nodes instanceof Konva.Node) {
      nodeArray = [nodes]
    } else if (Array.isArray(nodes)) {
      nodeArray = nodes
    } else if (!nodes) {
      nodeArray = this.state.selectedNodes
    }

    nodeArray.forEach((node) => {
      if (!node || !node.attrs.__originalLayerInfo__) return

      const originalInfo = node.attrs.__originalLayerInfo__

      // 恢复Konva节点到原始层级
      if (originalInfo.layer && originalInfo.layer.getStage()) {
        // 移动到原始图层
        node.moveTo(originalInfo.layer)

        // 恢复到原始位置
        const children = originalInfo.layer.getChildren()
        if (originalInfo.index < children.length) {
          // 移动到指定位置
          node.setZIndex(originalInfo.index)
        }
      }

      // 清除临时存储的信息
      delete node.attrs.__originalLayerInfo__
    })
  }

  /**
   * 检查节点是否有临时层级信息（正在被临时移动）
   * @param {Object} node - 要检查的节点
   * @returns {boolean} - 是否有临时层级信息
   */
  hasTemporaryLayerInfo(node) {
    return node && node.attrs && node.attrs.__originalLayerInfo__
  }

  /**
   * 清除所有节点的临时层级信息
   */
  clearAllTemporaryLayerInfo() {
    // 遍历所有图层的所有节点
    this.state.layers.forEach((layer) => {
      layer.getChildren().forEach((node) => {
        if (node.attrs && node.attrs.__originalLayerInfo__) {
          delete node.attrs.__originalLayerInfo__
        }
      })
    })
  }
}
