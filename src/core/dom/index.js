/**
 * @module DomElementHandler
 * @name DOM
 * @description DomElementHandler 类用于处理 Konva.js 舞台上的 DOM 元素。 它能够创建、更新、观察和绑定 DOM 元素，并且与 Konva.js 节点保持同步。
 */
import { getDecompose, isJSONString } from '../utils'
import { throttle } from 'lodash'
export default class DomElementHandler {
  domClassName = 'dom-base'

  constructor(state, stateManage, config) {
    this.config = config
    this.stateManage = stateManage
    this.domCache = {}
    this.mutationObserver = null // 存储观察器实例
    this.state = state
  }
  /**
   * 创建 DOM 节点并添加到 Konva 舞台上
   * @param {Array} [domArray] - DOM 元素数组，如果不传入则从页面中自动查询
   */
  createDomNode(domArray) {
    const allDomElements =
      domArray || document.querySelectorAll(`.konvajs-content .${this.domClassName}`)
    const konvaContentDom = document.querySelector('.konvajs-content').getBoundingClientRect()
    const animationLayer = this.state.layers[this.state.layers.length - 1]
    const allNodes = this.stateManage.class.node.getAllLayersNodes()

    allDomElements.forEach((dom) => {
      if (dom.getAttribute('data-initialization')) {
        return
      }
      const domIndex = allNodes.findIndex((node) => node.attrs.domId == dom.id)
      if (domIndex !== -1) {
        return
      }
      requestAnimationFrame(() => {
        this.stateManage.class.transformer.resetTransformer()
        const domRect = dom.getBoundingClientRect()
        const scale = this.state.stage.scaleX()
        const stagePosition = this.state.stage.position()
        const rect = new Konva.Rect({
          x: (domRect.x - konvaContentDom.left - stagePosition.x) / scale,
          y: (domRect.y - konvaContentDom.top - stagePosition.y) / scale,
          width: domRect.width / scale,
          height: domRect.height / scale,
          name: 'dom-rect',
          id: dom.id.split('_')[1],
          attrs: {
            transformable: true,
            draggable: true,
            domId: dom.id,
            domStyle: {
              zIndex: dom.style.zIndex,
              transform: dom.style.transform
            }
          }
        })
        const dataAttributes = dom.dataset
        for (const key in dataAttributes) {
          rect.attrs[key] = isJSONString(dataAttributes[key])
            ? JSON.parse(dataAttributes[key])
            : dataAttributes[key]
        }
        dom.setAttribute('data-initialization', 'true')
        rect.on('transform', (e) => {
          /**
           * [description]
           * 保持DOM节点缩放比不变 , 缩放时改变宽高,
           * 此处获取事件触发的节点而不是绑定事件的节点 避免复制的节点无法缩放
           */
          const currentNode = e.currentTarget
          const width = Math.abs(currentNode.width() * currentNode.scaleX())
          const height = Math.abs(currentNode.height() * currentNode.scaleY())
          currentNode.scaleX(1)
          currentNode.scaleY(1)
          currentNode.width(width)
          currentNode.height(height)
        })
        if (this.state.disableAutoAddTransformer) {
          rect.attrs._isImported = true
        }

        animationLayer.add(rect)
        this.stateManage.class.event.trigger('addNode', {
          node: rect,
          name: 'dom',
          type: 'dom'
        })
        this.stateManage.class.dom.updateDomPosition()
        setTimeout(() => {
          this.stateManage.class.history.addHistory({ title: '添加节点' })
        }, 300)
        animationLayer.draw()
      })
    })
  }
  /**
   * 观察 DOM 元素的变化，监控新增的 DOM 元素并动态创建对应的 Konva 节点
   */
  observeDomElements() {
    // 先停止之前的观察器
    this.stopObservingDomElements()
    if (this.state.isEdit) {
      this.mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          const addedDomNodes = Array.from(mutation.addedNodes).filter((node) => {
            return (
              node.className &&
              typeof node.className === 'string' &&
              node.className.indexOf(`${this.domClassName}`) > -1
            )
          })
          if (addedDomNodes.length > 0) {
            addedDomNodes.forEach((node) => {
              requestAnimationFrame(() => {
                this.createDomNode([node])
              })
            })
          }
        })
      })

      const config = { childList: true, subtree: true }
      const targetNode = document.querySelector('.konvajs-content')
      if (targetNode) {
        this.mutationObserver.observe(targetNode, config)
      }
    }
  }

  /**
   * 绑定 Konva 节点的更新事件，在节点被拖拽或变换时同步更新对应的 DOM 元素位置
   */
  bindUpdateDomEvent() {
    // 监听变换结束和拖拽结束事件
    this.state.stage.find('.dom-rect').forEach((shape) => {
      shape.on('transform', (e) => {
        /**
         * [description]
         * 保持DOM节点缩放比不变 , 缩放时改变宽高,
         * 此处获取事件触发的节点而不是绑定事件的节点 避免复制的节点无法缩放
         */
        const currentNode = e.currentTarget
        const width = Math.abs(currentNode.width() * currentNode.scaleX())
        const height = Math.abs(currentNode.height() * currentNode.scaleY())
        currentNode.scaleX(1)
        currentNode.scaleY(1)
        currentNode.width(width)
        currentNode.height(height)
        throttle(this.updateDomPosition, 32)
      })
      shape.on('transformend dragend dragmove', () => {
        throttle(this.updateDomPosition, 32)
      })
    })
  }
  /**
   * 更新所有 DOM 元素的位置和缩放信息
   */
  updateStageDom() {
    const domElements = document.querySelectorAll('.dom-base')
    const konvaNodes = this.state.stage.find('.dom-rect')
    this.clearCache()
    this.stateManage.class.event.trigger('domReset', konvaNodes)
  }
  /**
   * 根据 ID 获取 DOM 元素，使用缓存机制提高性能
   * @param {string} id - DOM 元素的 ID
   * @returns {HTMLElement|null} 返回对应的 DOM 元素或 null
   */
  getDomElement(id) {
    if (!this.domCache[id]) {
      const element = document.getElementById(id)
      if (element) {
        this.domCache[id] = element
      } else {
        return null
      }
    }
    return this.domCache[id]
  }
  /**
   * 清空 DOM 元素缓存
   */
  clearCache() {
    this.domCache = {}
  }
  /**
   * 更新 DOM 元素的缩放和位置
   * 根据 Konva 节点的绝对位置和旋转角度等信息同步更新 DOM 元素的样式
   */
  // 更新DOM元素的缩放和位置的方法
  updateDomPosition() {
    let scale = this.state.stage.scaleX()
    const stageRotation = this.state.stage.rotation()
    this.state.stage.find('.dom-rect').forEach((node) => {
      const domId = node.attrs.domId
      if (domId) {
        const domElement = this.getDomElement(domId)
        if (domElement) {
          let nodeRotation, nodeSkewX, nodeSkewY, nodeScaleX, nodeScaleY, opacity, visible
          nodeScaleX = node.scaleX()
          nodeScaleY = node.scaleY()
          opacity = node.opacity()
          visible = node.attrs.visible
          let { x, y } = node.absolutePosition()
          let width = node.width()
          let height = node.height()
          if (node.parent instanceof Konva.Group) {
            let { skew, rotation } = getDecompose(node.getAbsoluteTransform().getMatrix())
            nodeSkewX = parseFloat(skew.x.toFixed(4)) * (180 / Math.PI)
            nodeSkewY = parseFloat(skew.y.toFixed(4)) * (180 / Math.PI)
            nodeRotation = parseFloat(rotation.toFixed(4)) * (180 / Math.PI)
          } else {
            nodeRotation = node.rotation()
            // konva 获取的 skew 存在错误 需要通过点位矩阵解析获取
            let { x: skewX, y: skewY } = getDecompose(node.getAbsoluteTransform().getMatrix()).skew
            nodeSkewX = parseFloat(skewX.toFixed(4)) * (180 / Math.PI)
            nodeSkewY = parseFloat(skewY.toFixed(4)) * (180 / Math.PI)
          }
          //   兼容手机端
          if (stageRotation === 90) {
            nodeRotation += 90
          }
          //   去除多余的小数位
          x = parseFloat(parseFloat(x.toFixed(2)))
          y = parseFloat(parseFloat(y.toFixed(2)))
          scale = parseFloat(parseFloat(scale.toFixed(2)))
          const transform = `translate(${x}px, ${y}px) scale(${nodeScaleX === -1 ? -scale : scale}, ${nodeScaleY === -1 ? -scale : scale})    rotate(${nodeRotation}deg)  skewX(${nodeSkewX}deg) skewY(${nodeSkewY}deg)`
          if (domElement.style.zIndex !== '' || domElement.style.zIndex === 0) {
            node.attrs.domStyle.zIndex = domElement.style.zIndex
          }
          //  每次更新DOM元素的缩放和位置的时候，都需要更新样式 确保触发属性更新监听
          node.attrs.domStyle.tId = Math.random().toString(36).substring(2, 15)
          node.attrs.domStyle.transform = transform
          if (visible == false) {
            domElement.style.display = 'none'
          }
          requestAnimationFrame(() => {
            domElement.style.transform = transform
            // domElement.style.left = position.x + 'px'
            // domElement.style.top = position.y + 'px'
            domElement.style.opacity = opacity
            domElement.style.width = `${width}px`
            domElement.style.height = `${height}px`
          })
        }
      }
    })
  }
  /**
   * 停止观察 DOM 元素变化
   */
  stopObservingDomElements() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect()
      this.mutationObserver = null
    }
  }

  /**
   * 销毁 DOM 处理器，清理所有资源
   */
  destroy() {
    this.stopObservingDomElements()
    this.clearCache()
  }
}
