/**
 * @module DomElementHandler
 * @name DOM
 * @description DomElementHandler The class is used to handle Konva.js on the stage DOM elements。 It can create、update、observe and bind DOM elements，and keep in sync with Konva.js nodes stay synchronized。
 */
import { getDecompose, isJSONString } from '../utils'
import { throttle } from 'lodash'
export default class DomElementHandler {
  domClassName = 'dom-base'

  constructor(state, stateManage, config) {
    this.config = config
    this.stateManage = stateManage
    this.domCache = {}
    this.mutationObserver = null // Store observer instance
    this.state = state
  }
  /**
   * Create DOM node and add to Konva on the stage
   * @param {Array} [domArray] - DOM element array，if not provided, it will automatically query from the page
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
           * KeepDOMnode scale ratio unchanged , change width and height when scaling,
           * here get the node that triggered the event instead of the node that bound the event avoid the copied node from being unable to scale
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
          this.stateManage.class.history.addHistory({ title: 'Add Node' })
        }, 300)
        animationLayer.draw()
      })
    })
  }
  /**
   * Observe DOM element changes，monitor newly added DOM elements and dynamically create corresponding Konva nodes
   */
  observeDomElements() {
    // first stop the previous observer
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
   * Bind Konva node update events，synchronously update the corresponding when the node is dragged or transformed DOM element position
   */
  bindUpdateDomEvent() {
    // listen for transform end and drag end events
    this.state.stage.find('.dom-rect').forEach((shape) => {
      shape.on('transform', (e) => {
        /**
         * [description]
         * KeepDOMnode scale ratio unchanged , change width and height when scaling,
         * here get the node that triggered the event instead of the node that bound the event avoid the copied node from being unable to scale
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
   * Update all DOM element position and scale information
   */
  updateStageDom() {
    const domElements = document.querySelectorAll('.dom-base')
    const konvaNodes = this.state.stage.find('.dom-rect')
    this.clearCache()
    this.stateManage.class.event.trigger('domReset', konvaNodes)
  }
  /**
   * According to ID Get DOM element，use caching mechanism to improve performance
   * @param {string} id - DOM element's ID
   * @returns {HTMLElement|null} return the corresponding DOM element or null
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
   * Clear DOM element cache
   */
  clearCache() {
    this.domCache = {}
  }
  /**
   * Update DOM element's scale and position
   * According to Konva node's absolute position, rotation angle, and other information to synchronously update DOM element's style
   */
  // UpdateDOMmethod to update element's scale and position
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
            // konva obtained skew has errors need to be obtained through point matrix parsing
            let { x: skewX, y: skewY } = getDecompose(node.getAbsoluteTransform().getMatrix()).skew
            nodeSkewX = parseFloat(skewX.toFixed(4)) * (180 / Math.PI)
            nodeSkewY = parseFloat(skewY.toFixed(4)) * (180 / Math.PI)
          }
          //   compatible with mobile devices
          if (stageRotation === 90) {
            nodeRotation += 90
          }
          //   remove extra decimal places
          x = parseFloat(parseFloat(x.toFixed(2)))
          y = parseFloat(parseFloat(y.toFixed(2)))
          scale = parseFloat(parseFloat(scale.toFixed(2)))
          const transform = `translate(${x}px, ${y}px) scale(${nodeScaleX === -1 ? -scale : scale}, ${nodeScaleY === -1 ? -scale : scale})    rotate(${nodeRotation}deg)  skewX(${nodeSkewX}deg) skewY(${nodeSkewY}deg)`
          if (domElement.style.zIndex !== '' || domElement.style.zIndex === 0) {
            node.attrs.domStyle.zIndex = domElement.style.zIndex
          }
          //  each updateDOMwhen updating element's scale and position，need to update the style ensure to trigger property update monitoring
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
   * Stop observing DOM element changes
   */
  stopObservingDomElements() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect()
      this.mutationObserver = null
    }
  }

  /**
   * Destroy DOM handler，clean up all resources
   */
  destroy() {
    this.stopObservingDomElements()
    this.clearCache()
  }
}
