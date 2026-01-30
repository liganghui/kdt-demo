/**
 * @module nodeMAnager
 * @name   Node
 * @classdesc Used to manage Konva.js Node operations on the stage，Including adding、Deleting、Copying、Cutting、Pasting、Grouping、Ungrouping and other operations。
 * This class can handle various property updates of nodes、Position adjustment and node hide/show functions。
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
   * Add node to Konva on the stage
   * According to the module data of the event，Adjust position，and add the node to the optimal layer
   * @param {Object} event - Event that triggers adding a node，Contains module data
   * @param {Object} [layer] - Specified layer（Optional）
   */
  addNode(event, layer) {
    try {
      if (!event || !event.moduleData) {
        console.warn('node addition exception：missing required parameters')
        return
      }

      const scale = this.state.stage.scale()
      const position = this.state.stage.position()
      let adjustedX, adjustedY
      let targetLayer = layer || this.state.layers[2] // By default, use middle Layer
      // Adjust image position according to canvas scale and offset
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
        console.warn('node addition exception：node position calculation error')
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

      // Construct node data
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

      // The original node creation logic remains unchanged
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
            'unhandled module type konvaComponent Check:addNodeMethod;  DOM Component Check:componentNameis configured , type:',
            type
          )
          break
      }

      setTimeout(() => {
        try {
          this.stateManage.class.history.addHistory({ title: 'Add Node' })

          // Trigger node addition complete event
          const addedNode = this.getLastAddedNode(targetLayer)
          if (addedNode) {
            this.stateManage.class.event.trigger('nodeAdded', addedNode)
          }
        } catch (error) {
          console.warn('failed to add history record or trigger event:', error)
        }
      }, 300)
    } catch (error) {
      console.error('error occurred during node addition:', error)
    }
  }
  /**
   * Get the last added node（Helper method）
   * @param {Object} layer - Target layer
   * @returns {Object|null} - The last added node
   */
  getLastAddedNode(layer) {
    try {
      if (!layer || !layer.children || layer.children.length === 0) {
        return null
      }

      const children = layer.children
      const lastChild = children[children.length - 1]

      // Ensure it is a valid node（WithIDand not a system node）
      if (lastChild && lastChild.attrs && lastChild.attrs.id) {
        return lastChild
      }

      return null
    } catch (error) {
      console.warn('failed to get last added node:', error)
      return null
    }
  }

  /**
   * Batch add nodes - Performance optimized version
   * @param {Array} nodeDataArray - Node data array
   * @param {Function} onProgress - Progress callback
   */
  batchAddNodes(nodeDataArray, onProgress) {
    if (!nodeDataArray || nodeDataArray.length === 0) return

    console.log(`start batch addition ${nodeDataArray.length} nodes`)

    // Optimized processing for a large number of nodes
    const enableBatchMode = nodeDataArray.length > 50

    if (enableBatchMode) {
      // Pause redrawing and event listening
      this.state.stage.listening(false)
      this.state.layers.forEach((layer) => layer.listening(false))
    }

    // Process in batches
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
          console.error(`adding the ${i + 1} th node failed:`, error)
        }
      }

      // If there are more nodes，Continue to process the next batch
      if (endIndex < nodeDataArray.length) {
        setTimeout(() => processBatch(endIndex), 1)
      } else {
        // All nodes added
        if (enableBatchMode) {
          setTimeout(() => {
            this.state.stage.listening(true)
            this.state.layers.forEach((layer) => layer.listening(true))
            this.state.stage.batchDraw()
          }, 50)
        }
      }
    }
    // Start processing the first batch
    processBatch(0)
  }
  /**
   * Delete specified node，Support batch deletion，SupportDOMProcessing of related nodes
   * @param {Object} node - Node to delete，Can be empty，Then delete the selected node
   */
  // Recursively find allevent
  findEventsInChildren(obj, result = []) {
    // Check if the current object haseventProperty and not an empty array
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

    // If there ischildrenArray，Recursively process each child element
    if (obj.children && Array.isArray(obj.children)) {
      obj.children.forEach((child) => {
        this.findEventsInChildren(child, result)
      })
    }

    return result
  }
  // Determine if the deletedid Whether in the eventid Exists in
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

    // Canvas events
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
            // Delete transition (Avoid flickering when deleting)
            dom.style.opacity = 0
            dom.style.transition = 'opacity 0.2s'
            // Delay 0.3 Delete after seconds DOM Node
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
          // RemovekonvaNode ordomMask node
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
      this.stateManage.class.history.addHistory({ title: 'Delete Node' })
    }, 220)
  }

  /**
   * Group the selected nodes
   * Support nested grouping operations，Combine all selected nodes or existing group nodes into a new group
   */
  groupNodes() {
    this.stateManage.class.transformer.clearMask()
    const selectedNodes = this.state.selectedNodes
    let groups = selectedNodes.filter((node) => node.attrs?.name === 'group')
    const group = new Konva.Group({
      id: uuidv4().split('-').join(''),
      attrs: {
        name: 'group',
        title: 'New Group',
        transformable: true,
        draggable: true
      }
    })
    // Calculate the bounding box of the selected nodes
    let boundingBox = this.calculateNodesBounds(selectedNodes)
    // Set the position of the group to the top-left corner of the bounding box
    group.position({
      x: boundingBox.x,
      y: boundingBox.y
    })
    if (groups.length > 0) {
      // Move each node in the group to the new group
      groups.forEach((g) => {
        const groupScaleX = g.scaleX()
        const groupScaleY = g.scaleY()
        const groupX = g.x()
        const groupY = g.y()
        const groupRotation = g.rotation() // Use angle，Do not convert to radians
        const groupSkewX = group.skewX()
        const groupSkewY = group.skewY()
        ;[...g.children].forEach((child) => {
          // Consider the scaling and rotation of the group，Adjust the node position to the new group
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
    // Add the new group to the stage
    this.state.layers[1].add(group)
    this.stateManage.class.transformer.addNodesTransformer([group])
    this.stateManage.class.event.trigger('group', group)
    this.stateManage.class.event.trigger('nodeUpdate', {
      type: 'group',
      nodes: [group]
    })
    this.stateManage.class.history.addHistory({ title: 'Group Nodes' })
  }
  /**
   * Ungroup the specified group，Restore the nodes in the group to independent nodes
   * @param {Object} [group=this.state.selectedNodes[0]] - Group to ungroup，Use the selected group by default
   */
  ungroupNodes(group) {
    if (!group) {
      group = this.state.selectedNodes[0]
    }
    const layer = group.getLayer()
    // Get the position of the group、Scale、Rotation andskewAttributes
    const groupX = group.x()
    const groupY = group.y()
    const groupScaleX = group.scaleX()
    const groupScaleY = group.scaleY()
    const groupRotation = group.rotation() * (Math.PI / 180) // Convert angle to radians
    const groupSkewX = group.skewX()
    const groupSkewY = group.skewY()
    const childs = []
    ;[...group.children].forEach((child) => {
      if (child.attrs.name !== 'kd_mask') {
        // Exclude mask
        // Use rotation matrix to calculate the new position of child nodes in the group
        const childOffsetX = child.x() * groupScaleX
        const childOffsetY = child.y() * groupScaleY
        const rotatedX =
          childOffsetX * Math.cos(groupRotation) - childOffsetY * Math.sin(groupRotation)
        const rotatedY =
          childOffsetX * Math.sin(groupRotation) + childOffsetY * Math.cos(groupRotation)
        const childX = rotatedX + groupX
        const childY = rotatedY + groupY
        const childRotation = child.rotation() + groupRotation * (180 / Math.PI) // Convert radians back to degrees
        // CalculateskewAttributes
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
    this.stateManage.class.history.addHistory({ title: 'Ungroup Nodes' })
  }
  /**
   * Lock the selected nodes，Prevent it from being dragged or modified
   * @param {Object} [node] - Node to lock，If not provided, lock the selected node
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
    this.stateManage.class.history.addHistory({ title: 'Lock Nodes' })
  }
  /**
   * Unlock selected nodes，Make it draggable or modifiable
   * @param {Object} [node] - The node to unlock，If not provided, unlock the selected nodes
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
    this.stateManage.class.history.addHistory({ title: 'Unlock Nodes' })
  }
  /**
   * Copy selected nodes，And add it to the clipboard
   * @param {Object} [node] - The node to copy
   */ copyNodes(node) {
    let nodes = getParamNodes(node, this)
    nodes = nodes.filter((child) => {
      return child.attrs.name !== 'kd_mask'
    })
    if (nodes.length === 0) {
      return
    }

    // Check if there are any pipeline components in edit mode，If yes, exit edit mode first
    const editingFlowLines = nodes.filter(
      (child) =>
        (child.className === 'kdtFlowLine' ||
          child.attrs.name === 'flowLine' ||
          child.className === 'CustomLine') &&
        child.attrs.isEdit === true
    )

    if (editingFlowLines.length > 0) {
      // Exit edit mode for all pipelines
      editingFlowLines.forEach((flowLine) => {
        if (typeof flowLine.exitEditMode === 'function') {
          flowLine.exitEditMode()
        }
      })

      // Reselect these nodes to the transform box
      setTimeout(() => {
        this.stateManage.class.transformer.resetTransformer(nodes)
        // Delayed copy，Ensure the transform box state is updated
        setTimeout(() => {
          this.executeCopyNodes(nodes)
        }, 50)
      }, 50)
      return
    }

    this.executeCopyNodes(nodes)
  }

  // Actually copy nodes
  executeCopyNodes(nodes) {
    // Calculate the offset of nodes relative to the transform box
    nodes = nodes.map((child) => {
      const pos = child.getAbsolutePosition()
      const transformerPos = this.state.transformer.getAbsolutePosition()
      const scale = this.state.stage.scaleX()

      // Special handling for pipeline components that just exited edit mode
      if (
        child.className === 'kdtFlowLine' ||
        child.attrs.name === 'flowLine' ||
        child.className === 'CustomLine'
      ) {
        // Check if the transform box position is valid
        if (transformerPos.x <= -1000000 || transformerPos.y <= -1000000) {
          // When the transform box position is invalid，Use the pipeline's own position
          child.attrs.transformerOffset = {
            x: pos.x / scale,
            y: pos.y / scale
          }
        } else {
          // The transform box position is valid，Use relative offset
          child.attrs.transformerOffset = {
            x: (pos.x - transformerPos.x) / scale,
            y: (pos.y - transformerPos.y) / scale
          }
        }
      } else {
        // Processing logic for ordinary components
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
   * Cut selected nodes，And add it to the clipboard
   * @param {Object} [node] - The node to cut
   */
  cutNodes(node) {
    let nodes = getParamNodes(node, this)
    nodes = nodes.filter((child) => {
      return child.attrs.name !== 'kd_mask'
    })
    if (nodes.length === 0) {
      return
    }

    // Check if there are any pipeline components in edit mode，If yes, exit edit mode first
    const editingFlowLines = nodes.filter(
      (child) =>
        (child.className === 'kdtFlowLine' ||
          child.attrs.name === 'flowLine' ||
          child.className === 'CustomLine') &&
        child.attrs.isEdit === true
    )

    if (editingFlowLines.length > 0) {
      // Exit edit mode for all pipelines
      editingFlowLines.forEach((flowLine) => {
        if (typeof flowLine.exitEditMode === 'function') {
          flowLine.exitEditMode()
        }
      })

      // Reselect these nodes to the transform box
      setTimeout(() => {
        this.stateManage.class.transformer.resetTransformer(nodes)
        // Delayed cut，Ensure the transform box state is updated
        setTimeout(() => {
          this.executeCutNodes(nodes)
        }, 50)
      }, 50)
      return
    }

    this.executeCutNodes(nodes)
  }

  // Extract the original cut logic into a separate method
  executeCutNodes(nodes) {
    // Calculate the offset of nodes relative to the transform box
    nodes = nodes.map((child) => {
      const pos = child.getAbsolutePosition()
      const transformerPos = this.state.transformer.getAbsolutePosition()
      const scale = this.state.stage.scaleX()

      // Special handling for pipeline components
      if (
        child.className === 'kdtFlowLine' ||
        child.attrs.name === 'flowLine' ||
        child.className === 'CustomLine'
      ) {
        // Check if the transform box position is valid
        if (transformerPos.x <= -1000000 || transformerPos.y <= -1000000) {
          // When the transform box position is invalid，Use the center of the pipeline's own bounding box
          const bounds = child.getClientRect()
          const centerX = bounds.x + bounds.width / 2
          const centerY = bounds.y + bounds.height / 2

          child.attrs.transformerOffset = {
            x: centerX / scale,
            y: centerY / scale
          }
        } else {
          // The transform box position is valid，Use the offset of the bounding box center relative to the transform box
          const bounds = child.getClientRect()
          const centerX = bounds.x + bounds.width / 2
          const centerY = bounds.y + bounds.height / 2

          child.attrs.transformerOffset = {
            x: (centerX - transformerPos.x) / scale,
            y: (centerY - transformerPos.y) / scale
          }
        }
      } else {
        // Processing logic for ordinary components
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
   * Paste nodes from clipboard onto the stage，And add it to the current layer
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

    // Used to track asynchronously loaded image nodesPromise
    const asyncLoadingPromises = []

    oldNodes.forEach((child) => {
      const globalMousePos = {
        x: (mousePos.x - stagePosition.x) / scale,
        y: (mousePos.y - stagePosition.y) / scale
      }
      let newX, newY

      // Check if it is a specially processed node
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
        // Create a new for top-level nodesID
        var id = uuidv4().split('-').join('')
        let newNode = child.clone({
          x: newX,
          y: newY
        })
        newNode.attrs.id = id

        // Handle the of the top-level nodedomId
        if (child.attrs.domId) {
          var dom = document.getElementById(child.attrs.domId)
          if (dom) {
            newNode.attrs.domId = 'dom_' + id
            this.stateManage.class.event.trigger('domReset', [newNode])
          }
        }

        // If it is a group node，Recursively process all child nodes
        if (newNode instanceof Konva.Group) {
          this.recursiveResetNodeIds(newNode)
        }

        const currentLayer = child.getParent()
        currentLayer.add(newNode)

        // Check if it is an image type node，Need to wait for asynchronous loading
        if (this.isImageNode(newNode)) {
          // Create aPromiseto track image loading
          const loadPromise = this.waitForImageLoad(newNode)
          asyncLoadingPromises.push(loadPromise)
        }

        newNodes.push(newNode)
      }
    })

    // Set the selection after all asynchronous operations are completed
    if (asyncLoadingPromises.length > 0) {
      Promise.allSettled(asyncLoadingPromises)
        .then((results) => {
          // Record the nodes that failed to load
          const failedNodes = results
            .filter((result) => result.status === 'rejected')
            .map((result, index) => ({
              node: newNodes[index],
              error: result.reason
            }))

          if (failedNodes.length > 0) {
            console.warn('some image nodes failed to load:', failedNodes)
          }

          // Whether there are failures or not，set the transform box
          setTimeout(() => {
            this.stateManage.class.transformer.resetTransformer(newNodes)
          }, 50)
        })
        .catch((error) => {
          console.error('error occurred while waiting for image to load:', error)
          // Set the transform box even if there is an error
          setTimeout(() => {
            this.stateManage.class.transformer.resetTransformer(newNodes)
          }, 50)
        })
    } else {
      // There are no nodes that need asynchronous loading，Set the transform box immediately
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
    this.stateManage.class.history.addHistory({ title: 'Paste Nodes' })
  }
  /**
   * Wait for the image node to finish loading
   * @param {Object} node - image node
   * @returns {Promise} - loadingPromise
   */
  waitForImageLoad(node) {
    return new Promise((resolve, reject) => {
      // Set the timeout to5Second
      const timeout = setTimeout(() => {
        reject(new Error(`image nodes ${node.attrs.id} load timeout`))
      }, 5000)

      // Check if it isCustomImageinstance and haswaitForLoadmethod
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
        // Traditional detection method
        const checkLoad = () => {
          try {
            // Multiple detection methods
            const hasImage = node.image() !== null && node.image() !== undefined
            const hasValidSize =
              node.width() > 0 && node.height() > 0 && !isNaN(node.width()) && !isNaN(node.height())
            const notLoading = node.loading === false
            const isReady = node.isImageReady === true || node.isLoaded === true

            if ((hasImage && hasValidSize) || notLoading || isReady) {
              clearTimeout(timeout)
              resolve(node)
            } else {
              // Continue detecting，but limit the number of detection attempts
              if (checkLoad.count < 100) {
                checkLoad.count++
                setTimeout(checkLoad, 50)
              } else {
                clearTimeout(timeout)
                reject(new Error(`image nodes ${node.attrs.id} detection times exceeded`))
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
   * Determine whether the node is of image type
   * @param {Object} node - node object
   * @returns {boolean} - whether it is an image node
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
    // Create a transparent mask to cover the entire range
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    selectedNodes.forEach((node) => {
      // Get the position of the node、Width、Height
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

    // Calculate the boundary width and height
    const width = maxX - minX
    const height = maxY - minY
    // Calculated bounding box
    const bounds = { x: minX, y: minY, width, height, maxX, minX, maxY, minY }
    return bounds
  }
  /**
   * Hide the specified nodes。
   * Supports hiding nodes in batches，and handle DOM related nodes。
   * @param {Object} [node] - nodes to hide，hide selected nodes if not provided
   * @param {number} [duration=0] - Animation duration，Unit is Milliseconds
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
      //   Check if it is already hidden if it is hidden, do not hide it again
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
        // If the node is currently in the transform box，it needs to be removed from the transform box
        this.stateManage.class.transformer.removeNodeTransformer(child)
      }
    })
    this.stateManage.class.event.trigger('hide', [...nodes])
    this.stateManage.class.event.trigger('nodeUpdate', {
      type: 'hide',
      nodes: [...nodes]
    })
    this.stateManage.class.history.addHistory({ title: 'Hide Nodes' })
  }

  /**
   * Show the specified nodes。
   * Supports displaying nodes in batches，and handle DOM related nodes。
   * @param {Object} [node] - nodes to show，show selected nodes if not provided
   * @param {number} [duration=0] - Animation duration，Unit is Milliseconds
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
    this.stateManage.class.history.addHistory({ title: 'Show Nodes' })
  }
  /**
   * Update node properties。
   * Support batch updates，And can choose whether to update the visibility of nodes。
   * @param {Object} node - The node to be updated
   * @param {Object} attrs - The attribute object to be updated
   */
  updateNodeAttrs(node, attrs) {
    let nodes = getParamNodes(node, this, false)
    nodes.forEach((child) => {
      child.attrs = { ...child.attrs, ...attrs }
    })
  }
  /**
   * Toggle the display state of the specified node。
   * If the node is currently visible，Then hide it；If it is not visible，Then show it。
   * Support batch processing of nodes，And adapt to DOM And Konva Nodes。
   * @param {Object} [node] - The node to be toggled，If not provided, toggle the selected node
   * @param {number} [duration=0] - Animation duration，Unit is Milliseconds
   */
  toggleNodes(node, duration = 0) {
    let nodes = getParamNodes(node, this)
    nodes.forEach((child) => {
      if (child.visible()) {
        // The node is currently visible，Hide it
        this.hideNodes(child, duration)
      } else {
        // The node is currently hidden，Show it
        this.showNodes(child, duration)
      }
    })
  }
  /**
   * Get all nodes in all layers。
   * This method will return all valid nodes，And exclude unnamed or invalid ID Nodes。
   * @returns {Object[]} - Return an array of all eligible nodes
   */
  getAllLayersNodes() {
    let filteredNodes = []

    // Recursively extract non group Nodes
    const extractNodes = (nodes) => {
      nodes.forEach((node) => {
        const name = node.name()
        const id = node.attrs?.id

        if (!name || !id) return

        if (node.attrs.name === 'group' && Array.isArray(node.children)) {
          // If it is group，Then recursively extract its child nodes
          extractNodes(node.children)
        } else {
          filteredNodes.push(node)
        }
      })
    }

    // Traverse each layer
    this.state.stage.children.forEach((layer) => {
      extractNodes(layer.children)
    })

    return filteredNodes
  }

  /**
   * Callback function for handling node drag events。
   * The current method has no actual operation，Only kept as an example。
   * @param {Object} e - Drag event object
   */
  nodeDragmovehandler(e) {
    // var x = shape.x();
    // var y = shape.y();
    // var width = shape.width();
    // var height = shape.height();
    // var stageWidth = stage.width();
    // var stageHeight = stage.height();
    // // Limit drag range
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
   * Set the height of the node。
   * General method，Adapt to different types of nodes
   * @param {Object} node - The node to set the height for
   * @param {number} newHeight - The new height to set
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
   * Set the width of the node。
   * General method，Adapt to different types of nodes
   * @param {Object} node - The node to set the width for
   * @param {number} newWidth - The new width to set
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
   * Force update the state of the node。
   * This method is used to refresh the state of the node、Update the transform box，And redraw the stage。
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
   * Update data of the specified node。
   * By the node's ID Find the node and update its data properties，and trigger a data update event at the same time。
   *  @isForceUpdateData Bool  Whether to force update data
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
            // Trigger a node update event
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
   * According to the node ID Get the node。
   * Find and return in all layers that have the specified ID node。
   * @param {string} id - node's ID
   * @returns {Object|undefined} - Returns the found node object，Returns if not found undefined
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
   * Disable the drag function of all nodes。
   * Traverse all nodes in all layers，Disable its drag function。
   */
  allNodesDisableDrag() {
    this.getAllLayersNodes().forEach((node) => {
      node.draggable(false)
    })
  }
  /**
   * Enable the drag function of all nodes
   * Traverse all nodes in all layers，Enable its drag function
   * But if the node's lock property is true，the drag function will not be enabled
   */
  allNodesAllowDrag() {
    this.getAllLayersNodes().forEach((node) => {
      // Check if the node is locked
      if (node.attrs.lock) {
        return
      }
      // Check if the node is in a group（The parent node is a group）
      if (node.parent && node.parent.attrs && node.parent.attrs.name === 'group') {
        return
      }
      // Check the node's own transformable property
      if (node.attrs.transformable === false) {
        return
      }
      node.draggable(true)
    })
  }
  /**
   *  Used to get the actual node of an event or a child node(Resolve nested nodes, the problem of events being triggered on child nodes)
   *  @param {Object} event - event object or a certain child node
   *  @return {Object} node - actual node
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
   * Disable the drag function of all nodes
   */
  disableDragging() {
    const allNodes = this.getAllLayersNodes()
    allNodes.forEach((node) => {
      node.draggable(false)
    })
  }
  /**
   * Enable the drag function of all nodes（unless the node is locked）
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
   * Get the size of the node
   * general method，applicable to various custom components
   * @param {Object} node - the node whose size is to be obtained
   * @returns {Object} - containswidthandheightobject with properties
   */
  getNodeSize(node) {
    let width, height
    const stageScale = window.kdt.getStageScale().x
    // Temporarily reset rotation to get the correct size
    const originalRotation = node.rotation()
    // Temporarily set rotation to0
    node.rotation(0)
    // Get the size when not rotated
    const rect = node.getClientRect()
    width = rect.width
    height = rect.height
    // Restore original rotation
    node.rotation(originalRotation)
    return {
      width: parseFloat(parseFloat(width / stageScale).toFixed(1)),
      height: parseFloat(parseFloat(height / stageScale).toFixed(1))
    }
  }
  /**
   * Cache the specified node
   * @param {Array<Konva.Node>} nodes - The array of nodes to cache
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
   * Clear the cache of specified nodes
   * @param {Array<Konva.Node>} nodes - The array of nodes to clear cache for
   */
  clearCacheNodes(nodes) {
    nodes.forEach((node) => {
      if (node.isCached()) {
        node.clearCache()
      }
    })
  }
  /**
   * Recursively reset the node and its children'sID
   * @param {Object} node - To resetIDThe node
   */
  recursiveResetNodeIds(node) {
    // Handle all child nodes
    if (node.children && node.children.length > 0) {
      node.children.forEach((child, index) => {
        // Assign a new ID to each child nodeID
        if (child.attrs.id) {
          const newId = uuidv4().split('-').join('')
          child.attrs.id = newId

          // HandledomId
          if (child.attrs.domId) {
            child.attrs.domId = 'dom_' + newId
            this.stateManage.class.event.trigger('domReset', [child])
          }

          // Recursively handle the child nodes of the child node
          if (child instanceof Konva.Group) {
            this.recursiveResetNodeIds(child)
          }
        }
      })
    }
  }
  /**
   * Focus on the specified node，Center the node on the canvas
   * Update the canvas position based on the current canvas scale and offset
   * @param {Object} node - The node to focus on
   * @param {boolean} enableAnimation - Whether to enable animation
   */
  focusNode(node, enableAnimation = true) {
    let nodes = [...getParamNodes(node, this)]
    if (nodes.length === 0) return
    node = nodes[0]
    const stage = this.state.stage
    const container = stage.container()
    const containerRect = container.getBoundingClientRect()
    // Viewport center point - Need to consider the position of the container in the viewport
    const viewportCenterX = window.innerWidth / 2
    const viewportCenterY = window.innerHeight / 2
    // Calculate the offset of the container relative to the viewport
    const containerOffsetX = containerRect.left
    const containerOffsetY = containerRect.top
    // Calculate the center point of the container in the viewport coordinate system
    const containerCenterX = viewportCenterX - containerOffsetX
    const containerCenterY = viewportCenterY - containerOffsetY
    const stageScale = window.kdt.getStageScale().x
    // Get the bounding box of the node relative to the stage
    const nodeBox = node.getClientRect({
      relativeTo: stage
    })
    // The position of the node's center point in the stage coordinate system
    const nodeCenter_stageX = nodeBox.x + nodeBox.width / 2
    const nodeCenter_stageY = nodeBox.y + nodeBox.height / 2
    // Calculate the position where the stage needs to move，Align the node's center point with the viewport center point
    let newStageX = containerCenterX - nodeCenter_stageX * stageScale
    let newStageY = containerCenterY - nodeCenter_stageY * stageScale
    // If animation is enabled，Check and adjust the scale ratio to ensure the element is fully displayed
    let newScale = stageScale
    if (enableAnimation) {
      // Calculate the visual size of the node at the current scale
      const nodeVisualWidth = nodeBox.width * stageScale
      const nodeVisualHeight = nodeBox.height * stageScale
      // Calculate the available container size（Consider some margins）
      const availableWidth = containerRect.width * 0.85 // Leave15%The margin
      const availableHeight = containerRect.height * 0.85 // If the visual size of the node exceeds the available size15%Calculate the new scale ratio
      // Select a smaller scale ratio to ensure complete display，Recalculate the position using the new scale ratio
      if (nodeVisualWidth > availableWidth || nodeVisualHeight > availableHeight) {
        const scaleX = availableWidth / nodeBox.width
        const scaleY = availableHeight / nodeBox.height

        // Create and play the transition animation
        newScale = Math.min(scaleX, scaleY)

        // Get the coordinates of the node
        newStageX = containerCenterX - nodeCenter_stageX * newScale
        newStageY = containerCenterY - nodeCenter_stageY * newScale
      }
    }

    // Top-left corner
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
   * Node object(Top-left corner coordinates)
   * @param {Object} node - If there is no offset
   * @returns {Object} - {x, y} Return the current coordinates directly
   */
  getNodePosition(node) {
    const currentX = node.x()
    const currentY = node.y()
    const offsetX = node.offsetX() || 0
    const offsetY = node.offsetY() || 0
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    const rotation = node.rotation()
    // Calculate the actual distance corresponding to the offset，Consider the effect of rotation
    if (offsetX === 0 && offsetY === 0) {
      return { x: currentX, y: currentY }
    }

    // Set the coordinates of the node
    const scaledOffsetX = offsetX * scaleX
    const scaledOffsetY = offsetY * scaleY

    // Target top-left corner
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
   * Coordinates(Target Top Left)
   * @param {Object} node - Coordinate
   * @param {number} x - If there is no offsetxSet the coordinates directly
   * @param {number} y - Calculate the actual distance corresponding to the offsetyConsider the effect of rotation
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
    // Set the actual coordinates of the node，Set coordinates directly
    if (offsetX === 0 && offsetY === 0) {
      node.x(x)
      node.y(y)
      return
    }

    // Calculate the actual distance corresponding to the offset
    const scaledOffsetX = offsetX * scaleX
    const scaledOffsetY = offsetY * scaleY

    // Consider the effect of rotation
    const rotationRad = (rotation * Math.PI) / 180
    const cos = Math.cos(rotationRad)
    const sin = Math.sin(rotationRad)

    const rotatedOffsetX = scaledOffsetX * cos - scaledOffsetY * sin
    const rotatedOffsetY = scaledOffsetX * sin + scaledOffsetY * cos

    // Set the actual coordinates of the node
    node.x(x + rotatedOffsetX)
    node.y(y + rotatedOffsetY)
  }
}