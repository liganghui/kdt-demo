/**
 * @module LayerManage
 * @name   Layer
 * @description  Used to manage Konva.js the layer and node hierarchy in the Konva.js stage。
 * Provides the function to create layers、Move nodes to the top layer、Bottom layer、the functions to move up and down。
 */
export default class LayerManage {
  constructor(state, stateManage, config) {
    this.config = config
    this.stateManage = stateManage
    this.state = state
  }

  /**
   * Create according to the configured layer name Konva Layer，and add it to the stage。
   * and set each layer's z-index，to ensure the correct stacking order of layers。
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
   *  Reset the layer's z-index
   *
   */
  resetLayerIndex() {
    const canvasArr = document.querySelectorAll('.konvajs-content > canvas')
    canvasArr.forEach((element, index) => {
      element.style.zIndex = index === canvasArr.length - 1 ? 999 : index
    })
  }

  /**
   * Move the specified node to the bottom of the layer。
   * @param {Object} node - The node to move
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
        // UpdateDOMElement'sz-index
        const dom = document.getElementById(el.attrs.domId)
        dom.style.zIndex = 1

        // MoveDOMthe element to the front of its parent container（the earliest position in the document flow）
        const parent = dom.parentNode
        if (parent && parent.firstChild !== dom) {
          parent.insertBefore(dom, parent.firstChild)
        }

        // Simultaneously moveKonvathe proxy node in Konva to the second layer
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
   * Move the specified node to the top of the layer。
   * If the node has DOM association，then modify its z-index，and move the correspondingKonvaproxy node。
   * @param {Object} node - The node to move
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
        // Get the maximumz-index
        const konvaContent = document.querySelector('.konvajs-content')
        const elements = konvaContent.querySelectorAll(':scope > div, :scope > canvas')
        let maxZIndex = 0
        elements.forEach((element) => {
          const zIndex = parseInt(element.style.zIndex, 10) || 0
          if (zIndex > maxZIndex) {
            maxZIndex = zIndex
          }
        })

        // UpdateDOMElement'sz-index
        const dom = document.getElementById(el.attrs.domId)
        dom.style.zIndex = maxZIndex + 1+"!important"

        // Simultaneously moveKonvathe proxy node in Konva to the top layer
        const lastLayer = this.state.layers[this.state.layers.length - 1]
        el.moveTo(lastLayer)
        el.moveToTop()
      } else {
        const lastLayer = this.state.layers[this.state.layers.length - 1]
        el.moveTo(lastLayer)
        el.moveToTop()
      }
    })
    // Ensure the stage's transformer is at the top layer
    this.state.transformer.moveToTop()
  }

  /**
   * Move the specified node up one layer。
   * @param {Object} node - The node to move
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

        // Adjustz-index
        dom.style.zIndex = parseInt(dom.style.zIndex || 1) + 1

        // AdjustDOMthe element's position in the document flow
        const parent = dom.parentNode
        if (parent && dom.nextElementSibling) {
          // Move back one position（Move after the next sibling element）
          parent.insertBefore(dom.nextElementSibling, dom)
        } else if (parent) {
          // If there is no next sibling element，then move to the end of the parent container
          parent.appendChild(dom)
        }

        // MoveKonvaNode
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
   * Move the specified node down one layer。
   * @param {Object} node - The node to move
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

        // Adjustz-index
        if (parseInt(dom.style.zIndex) > 1) {
          if (dom.style.zIndex > 900) {
            dom.style.zIndex = 3
          } else {
            dom.style.zIndex = parseInt(dom.style.zIndex || 1) - 1
          }
        }

        // AdjustDOMthe element's position in the document flow
        const parent = dom.parentNode
        if (parent && dom.previousElementSibling) {
          // Move forward one position（Move before the previous sibling element）
          parent.insertBefore(dom, dom.previousElementSibling)
        }

        // MoveKonvaNode
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
   *  Check if the element is the last element in its parent（i.e., the top element）
   * @param {Object} konvaNode - Konva Node
   * @returns {boolean} - whether it is the top element
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
   * Check if the node is the bottom element in the layer。
   * @param {Object} konvaNode - Konva Node
   * @returns {boolean} - whether it is the bottom element
   */
  isElementOnBottom(konvaNode) {
    if (!konvaNode || !konvaNode.getParent()) {
      // If the element does not exist or has no parent，Returnfalse
      return false
    }

    const parent = konvaNode.getParent()
    const children = parent.getChildren()
    const elementIndex = children.indexOf(konvaNode)

    // Check if the element is the first element in its parent（i.e., the bottom element）
    return elementIndex === 0
  }
  /**
   * Move the node to the bottom of the next layer。
   * @param {Object} konvaNode - Konva Node
   * @param {Object} stage - Konva Stage object
   */
  moveToBottomOfNextLayer(konvaNode, stage) {
    if (!konvaNode || !konvaNode.getParent() || !stage) {
      return false
    }
    const currentLayer = konvaNode.getParent()

    const layers = stage.getChildren()
    const currentIndex = layers.indexOf(currentLayer)

    // Check if there is a next layer (Here subtract2 Keep the last layer Not keep, subtract1)
    if (currentIndex === -1 || currentIndex >= layers.length - 1) {
      return false
    }

    const nextLayer = layers[currentIndex + 1]

    // Move the element to the bottom of the next layer
    konvaNode.moveToBottom()
    konvaNode.moveTo(nextLayer)
    nextLayer.draw()
  }
  /**
   * Move the node to the top of the previous layer。
   * @param {Object} konvaNode - Konva Node
   * @param {Object} stage - Konva Stage object
   */
  moveToTopOfPreviousLayer(konvaNode, stage) {
    if (!konvaNode || !konvaNode.getParent() || !stage) {
      return false
    }
    const currentLayer = konvaNode.getParent()
    const layers = stage.getChildren()
    const currentIndex = layers.indexOf(currentLayer)
    // Check if there is a previous layer (Keep the bottom layer Not keep Change the judgment here to0)
    if (currentIndex <= 1) {
      return false
    }
    const previousLayer = layers[currentIndex - 1]
    // Move the element to the top of the previous layer
    konvaNode.moveToTop()
    konvaNode.moveTo(previousLayer)
    previousLayer.draw()
  }
  /**
   * Temporarily move the node to the top layer（Record the original position）
   * @param {Array|Object} nodes - The node or array of nodes to move
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

      // Record the original layer information
      const originalLayer = node.getParent()
      const originalIndex = originalLayer.getChildren().indexOf(node)

      // Store the original position information in the node's attributes
      node.attrs.__originalLayerInfo__ = {
        layer: originalLayer,
        index: originalIndex,
        zIndex: node.zIndex() || 0
      }

      if (node.attrs.domId) {
        // HandleDOMNode
        const dom = document.getElementById(node.attrs.domId)
        if (dom) {
          // Record the originalDOM'sz-index
          node.attrs.__originalLayerInfo__.domZIndex = dom.style.zIndex || '1'
        }

        // MoveKonvathe proxy node to the top layer
        const lastLayer = this.state.layers[this.state.layers.length - 1]
        node.moveTo(lastLayer)
        node.moveToTop()
      } else {
        // Handle ordinaryKonvaNode
        const lastLayer = this.state.layers[this.state.layers.length - 1]
        node.moveTo(lastLayer)
        node.moveToTop()
      }
    })

    // Ensure the transformer is always at the top layer
    if (this.state.transformer) {
      this.state.transformer.moveToTop()
    }
  }

  /**
   * Restore the node to its original layer position
   * @param {Array|Object} nodes - The node or array of nodes to restore
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

      // RestoreKonvathe node to its original layer
      if (originalInfo.layer && originalInfo.layer.getStage()) {
        // Move to the original layer
        node.moveTo(originalInfo.layer)

        // Restore to the original position
        const children = originalInfo.layer.getChildren()
        if (originalInfo.index < children.length) {
          // Move to the specified position
          node.setZIndex(originalInfo.index)
        }
      }

      // Clear the temporarily stored information
      delete node.attrs.__originalLayerInfo__
    })
  }

  /**
   * Check if the node has temporary layer information（being temporarily moved）
   * @param {Object} node - The node to check
   * @returns {boolean} - whether it has temporary layer information
   */
  hasTemporaryLayerInfo(node) {
    return node && node.attrs && node.attrs.__originalLayerInfo__
  }

  /**
   * Clear the temporary layer information of all nodes
   */
  clearAllTemporaryLayerInfo() {
    // Traverse all nodes in all layers
    this.state.layers.forEach((layer) => {
      layer.getChildren().forEach((node) => {
        if (node.attrs && node.attrs.__originalLayerInfo__) {
          delete node.attrs.__originalLayerInfo__
        }
      })
    })
  }
}
