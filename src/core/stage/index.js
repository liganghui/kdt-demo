/**
 * @module StageManage
 * @name    Canvas
 * @description Used to manage various operations of the canvas , Including Initialize the canvas, Redraw the canvas,  Set the background color/Images, etc.
 */
import { isMobile } from '../utils/index'

export default class StageManage {
  constructor(state, stateManage, config) {
    this.config = config
    this.state = state || window.kdt.state
    this.stateManage = stateManage || window.kdt.stateManage
    // Whether the canvas is zoomable
    this.zoomEnabled = true
  }

  /**
   * Initialize the stage，Load layers and set the background color，Supports resetting the stage via JSON JSON string to reset the stage
   * @param {string} [jsonStr] - Optional JSON JSON string，Used to reset the stage from the saved state
   */
  initStage(jsonStr) {
    if (jsonStr) {
      this.resetStageByJSON(jsonStr)
    } else {
      this.stateManage.class.layer.createLayers()
      this.setBackgroundColor(this.config.stageBackgroundColor)
      if (this.config.gridSwich) {
        this.stateManage.class.grid.drawLinesSolution()
      }
      this.stateManage.class.event.initEvents()
      this.stateManage.class.event.initStateObservers()
      this.stateManage.class.dom.observeDomElements()
    }
    this.stateManage.class.history.addHistory({ title: 'Canvas Initialization' })
  }

  /**
   * Reset the stage via JSON JSON data to reset the stage，Keep the current stage's scale and position
   * @param {string} jsonStr - Used to reset the stage's JSON JSON data
   */
  resetStageByJSON(jsonStr) {
    if (typeof jsonStr === 'object') {
      jsonStr = JSON.stringify(jsonStr)
    }

    // Completely clean up existing resources
    this.cleanupBeforeReset()

    // Temporarily disable automatic addition of transform boxes
    this.state.disableAutoAddTransformer = true

    // Record the old stage state
    const oldStageScale = this.state.stage.scaleX()
    const oldStagePosition = this.state.stage.position()
    const container = this.state.stage.container()

    // Destroy the old stage
    this.state.stage.off()
    this.state.stage.destroy()

    // ParseJSONJSON data
    const newJson = JSON.parse(jsonStr)

    // Create a new stage
    const { width, height } = newJson.attrs || {}
    this.state.stage = new Konva.Stage({ container, width, height })

    // Create layers
    newJson.children.forEach((layerData) => {
      const layer = new Konva.Layer(layerData.attrs || {})
      this.state.stage.add(layer)
    })

    this.state.layers = this.state.stage
      .getChildren()
      .filter((node) => node.getClassName() === 'Layer')

    // Used to collect background settings
    let backgroundSettings = {
      backgroundColor: null,
      backgroundImage: null
    }

    // Create nodes
    newJson.children.forEach((layerData, layerIndex) => {
      const layer = this.state.layers[layerIndex]
      layerData.children.forEach((nodeData) => {
        if (
          nodeData?.attrs.name &&
          nodeData?.attrs?.name.indexOf('kd_grid') !== -1 &&
          !this.state.isEdit
        ) {
          return
        } else if (nodeData?.attrs.name) {
          // Collect background color information
          if (nodeData?.attrs?.name === 'backgroundColor') {
            backgroundSettings.backgroundColor = nodeData.attrs.fill
            if (!this.state.isEdit) {
              document.body.style.backgroundColor = nodeData.attrs.fill
            }
          }

          // Collect background image information
          if (nodeData.attrs.url && nodeData?.attrs?.name === 'backgroundImage') {
            backgroundSettings.backgroundImage = {
              url: nodeData.attrs.url,
              opacity: nodeData.attrs.opacity || 1
            }
            return // Do not directly create nodes，Handle them uniformly later
          }

          const node = Konva.Node.create(nodeData)
          if (nodeData.attrs.visible === false) node.visible(false)
          if (nodeData.attrs.lock) {
            node.attrs.lock = true
            node.draggable(false)
          }
          if (nodeData.attrs.transformable === false || nodeData.attrs?.props?._inGroup === true) {
            node.attrs.transformable = false
            node.draggable(false)
          }
          layer.add(node)
        }
      })
    })

    // Restore the stage state
    this.state.stage.scale({ x: oldStageScale, y: oldStageScale })
    this.state.stage.position({ x: oldStagePosition.x, y: oldStagePosition.y })

    // Re-initialize
    setTimeout(() => {
      if (isMobile() && this.state.config.allowMobileRotation) {
        this.state.stage.rotation(90)
      } else {
        this.state.stage.rotation(0)
      }
      this.stateManage.class.event.initEvents()
      this.stateManage.class.dom.updateStageDom()
      this.stateManage.class.dom.updateDomPosition()
      this.stateManage.class.event.initStateObservers()
      this.stateManage.class.layer.resetLayerIndex()
      // Add import identification to nodes
      this.markAllNodesAsImported()
      // Delay setting the background，Ensure layers are fully initialized
      setTimeout(() => {
        this.stateManage.class.dom.updateDomPosition()
        this.stateManage.class.dom.observeDomElements()
      }, 100)

      // Set the background color and image
      setTimeout(() => {
        // Set the background color
        if (backgroundSettings.backgroundColor) {
          this.setBackgroundColor(backgroundSettings.backgroundColor)
        }

        // Set the background image
        if (backgroundSettings.backgroundImage) {
          this.setBackgroundImage(backgroundSettings.backgroundImage)
        }
      }, 500)
      setTimeout(() => {
        this.state.disableAutoAddTransformer = false
      }, 3000)
      setTimeout(() => {
        this.clearImportedFlags()
      }, 15000)
    }, 100)
  }
  /**
   * Auto scale the stage，To adapt it to the specified window size，And adjust according to the scale type and whether to apply margins
   * @param {number} windowWidth - Window width
   * @param {number} windowHeight - Window height
   * @param {string} scaleType - Scale type，Optional values are 'fill'（Fill the canvas）、'fitWidth'（Fit width）、'fitHeight'（Fit height）、'fit'（Maintain aspect ratio and fit the window as much as possible）
   * @param {boolean} [isMargin=false] - Whether to apply margins，When it is true True，The calculated scale will be subtracted by 0.03
   * @param {boolean} [IsAnimate=true] - Whether to enable animation effects，The default is true
   * @param {function} [fn] - Optional callback function，Executed after the scaling is completed
   * @param {object} [systemConfig] - System configuration
   *
   * @returns {Object} - Contains x X-axis and y Y-axis scale
   */
  autoStageScale(
    windowWidth,
    windowHeight,
    scaleType = 'fit',
    isMargin = false,
    IsAnimate = true,
    fn,
    systemConfig = {}
  ) {
    let stageWidth = systemConfig?.stageWidth || this.state.stage.width()
    let stageHeight = systemConfig?.stageHeight || this.state.stage.height()
    const angle = this.state.stage.rotation()
    const stage = this.state.stage
    // Read whether mobile rotation is allowed
    const allowMobileRotation = this.state.config.allowMobileRotation !== false
    // Need to swap width and height when it is a mobile phone and rotation is allowed
    if (allowMobileRotation && angle === 90) {
      let temp = windowWidth
      windowWidth = windowHeight
      windowHeight = temp
      stage.offsetX(0)
      stage.offsetY(0)
    }

    let scaleX, scaleY

    // Check whether DOM scaling should be used in preview modeDOMDOM scaling
    const isPreviewMode = this.state.isEdit === false
    const canvasSmallThanWindow = stageWidth < windowWidth || stageHeight < windowHeight
    const shouldUseDomScale = isPreviewMode && canvasSmallThanWindow
    const shouldFillScreen = shouldUseDomScale
    if (shouldUseDomScale) {
      // Use DOM scaling for small canvases in preview modeDOMDOM scaling，Calculate according to the scale type
      if (scaleType === 'fill') {
        // Full screen fill - Non-proportional scaling
        scaleX = windowWidth / stageWidth
        scaleY = windowHeight / stageHeight
      } else if (scaleType === 'fitWidth') {
        // Fit width - Width scaled to window width，Height proportionally scaled
        scaleX = scaleY = windowWidth / stageWidth
      } else if (scaleType === 'fitHeight') {
        // Fit height - Height scaled to window height，Width proportionally scaled
        scaleX = scaleY = windowHeight / stageHeight
      } else {
        // 'fit'
        // Maintain aspect ratio and fit the window as much as possible
        scaleX = scaleY = Math.min(windowWidth / stageWidth, windowHeight / stageHeight)
      }
    } else {
      // Use Konva built-in scaling for edit mode or large canvasesKonvaBuilt-in scaling
      if (scaleType === 'fill') {
        scaleX = windowWidth / stageWidth
        scaleY = windowHeight / stageHeight
      } else if (scaleType === 'fitWidth') {
        scaleX = scaleY = windowWidth / stageWidth
      } else if (scaleType === 'fitHeight') {
        scaleX = scaleY = windowHeight / stageHeight
      } else {
        scaleX = scaleY = Math.min(windowWidth / stageWidth, windowHeight / stageHeight)
      }
    }

    // If margins are needed，Adjust the scale
    if (isMargin) {
      scaleX = Math.max(scaleX - 0.11, 0.01)
      scaleY = Math.max(scaleY - 0.11, 0.01)
    }

    let newPos = { x: 0, y: 0 }
    if (angle === 90) {
      // For rotation 90 Degree mobile phone，Calculate position according to different scale types
      if (scaleType === 'fitHeight') {
        newPos = {
          x: windowHeight,
          y: (windowHeight * scaleX) / 2
        }
      } else if (shouldFillScreen && scaleType === 'fill') {
        // Non-proportional scaling position when mobile is rotated
        newPos = {
          x: windowHeight,
          y: 0
        }
      } else {
        newPos = {
          x: windowHeight,
          y: 0
        }
      }
    } else {
      // Position calculation for desktop or unrotated devices
      if (shouldFillScreen && scaleType === 'fill') {
        // DOMDOM scaledfillMode，Fill the entire window directly
        newPos = { x: 0, y: 0 }
      } else {
        // Other cases，Center on the stage center
        newPos = {
          x: (windowWidth - stageWidth * scaleX) / 2,
          y: (windowHeight - stageHeight * scaleY) / 2
        }
      }
    }
    if (shouldFillScreen) {
      // Use CSS to scale toCSSKonva containerkonvaContainer
      const konvaContainer = document.getElementById('konvaContainer')
      if (konvaContainer) {
        konvaContainer.style.transform = `scale(${scaleX}, ${scaleY})`
        konvaContainer.style.transformOrigin = 'top left'
        konvaContainer.style.position = 'absolute'
      }

      // Reset the stageStageTo default state
      stage.scale({ x: 1, y: 1 })
      stage.position({ x: 0, y: 0 })

      // Trigger update event
      this.stateManage.class.event.trigger('updateSketchRule')
      this.stateManage.class.dom.updateDomPosition()

      if (fn) {
        fn()
      }

      return { scaleX, scaleY, position: newPos, fillScreen: shouldFillScreen }
    } else {
      // ResetkonvaContainerKonva container'sCSSCSS transform，Using KonvaKonvaBuilt-in scaling
      const konvaContainer = document.getElementById('konvaContainer')
      if (konvaContainer) {
        konvaContainer.style.transform = ''
        konvaContainer.style.transformOrigin = ''
        konvaContainer.style.position = ''
        konvaContainer.style.left = ''
        konvaContainer.style.top = ''
      }
    }

    // Transition effect
    const tween = new Konva.Tween({
      node: stage,
      duration: IsAnimate ? 0.25 : 0.001, // Animation transition time
      scaleX: scaleX,
      scaleY: scaleY,
      x: newPos.x,
      y: newPos.y,
      easing: Konva.Easings.EaseInOut
    })
    tween.play()
    tween.onUpdate = () => {
      this.stateManage.class.event.trigger('updateSketchRule')
      this.stateManage.class.dom.updateDomPosition()
    }
    tween.onFinish = () => {
      this.stateManage.class.event.trigger('updateSketchRule')
      this.stateManage.class.dom.updateDomPosition()
      if (fn) {
        fn()
      }
    }

    // Return scaling information
    return { scaleX, scaleY, position: newPos, fillScreen: shouldFillScreen }
  }
  /**
   * Add import identification to all nodes
   */
  markAllNodesAsImported() {
    this.state.layers.forEach((layer) => {
      layer.getChildren().forEach((node) => {
        // Exclude system nodes
        if (
          !node.attrs.name ||
          (!node.attrs.name.includes('backgroundColor') &&
            !node.attrs.name.includes('backgroundImage') &&
            !node.attrs.name.includes('kd_grid') &&
            !node.attrs.name.includes('transformer'))
        ) {
          node.attrs._isImported = true
        }
      })
    })
  }

  /**
   * Clear import flags for all nodes
   */
  clearImportedFlags() {
    this.state.layers.forEach((layer) => {
      layer.getChildren().forEach((node) => {
        if (node.attrs._isImported) {
          delete node.attrs._isImported
        }
      })
    })
  }
  /**
   * Remove the stage's background color
   */
  removeBackgroundColor() {
    const bgNode = this.state.stage.findOne('.backgroundColor')
    if (bgNode) {
      bgNode.destroy()
    }
  }

  /**
   * Set the stage's background color
   * @param {string} color - Background color to be set
   */
  setBackgroundColor(color) {
    // Forcibly remove all existing background color nodes
    const bgNodes = this.state.stage.find('.backgroundColor')
    bgNodes.forEach((node) => {
      node.destroy()
    })

    if (color && this.state.layers.length > 0) {
      const background = new Konva.Rect({
        x: 0,
        y: 0,
        name: 'backgroundColor',
        width: this.state.stage.width(),
        height: this.state.stage.height(),
        fill: color
      })
      this.state.layers[0].add(background)
      background.zIndex(0)
      this.state.layers[0].draw()
    }
  }

  /**
   * Remove the stage's background image
   */
  removeBackgroundImage() {
    const bgImgNode = this.state.stage.findOne('.backgroundImage')
    if (bgImgNode) {
      bgImgNode.destroy()
    }
  }

  /**
   * Set the stage's background image
   * @param {string} url - Source of the background image URL
   */
  setBackgroundImage({ url, opacity = 1 }) {
    const existing = this.state.stage.findOne('.backgroundImage')
    if (existing && existing.attrs.url === url) {
      return
    }
    this.removeBackgroundImage()
    if (url) {
      const imageObj = new Image()
      const onLoadHandler = () => {
        if (this.state.stage && this.state.layers[0]) {
          const konvaImage = new Konva.Image({
            x: 0,
            y: 0,
            opacity: 0, // Initial opacity set to0
            name: 'backgroundImage',
            attrs: {
              base64: this.convertImgUrlToBase64(url),
              url,
              opacity: 0
            },
            image: imageObj,
            width: this.state.stage.width(),
            height: this.state.stage.height()
          })
          this.state.layers[0].add(konvaImage)
          konvaImage.zIndex(1)

          // Add transition animation
          const tween = new Konva.Tween({
            node: konvaImage,
            duration: 0.3, // Animation duration
            opacity: opacity, // Target opacity
            easing: Konva.Easings.EaseInOut
          })
          tween.play()
        }
        // Remove event listener
        imageObj.onload = null
      }
      imageObj.onload = onLoadHandler
      imageObj.src = url
    }
  }

  /**
   * Make the stage get focus
   */
  stageSetFocus() {
    const canvas = document.querySelector('.konvajs-content canvas')
    if (canvas) {
      // Set tabindex To make canvas Can get focus
      canvas.setAttribute('tabindex', '0')
      // Set outline Style to avoid focus border
      canvas.style.outline = 'none'
      // Get focus
      canvas.focus()
      if (this.state.isEdit) {
        document.querySelector('.h-container').style.top = '20px'
      }
    }
  }

  /**
   * Set edit mode or preview mode
   * @param {string} mode - Edit mode or preview mode
   */
  setStageMode(mode) {
    this.config.mode = mode
    if (mode === 'edit') {
      this.state.isEdit = true
      this.stateManage.class.event.trigger('stageMode', 'edit')
      this.stateManage.class.node.allNodesAllowDrag()
    } else {
      // Clear grid
      this.stateManage.class.grid.removeGridLines()
      // Clear transform box
      this.stateManage.class.transformer.resetTransformer()
      // Disable dragging
      this.stateManage.class.node.allNodesDisableDrag()
      this.state.isEdit = false
      this.stateManage.class.event.trigger('stageMode', 'preview')
    }
  }

  /**
   * Get current edit mode
   * @returns {string} - Current edit mode，'edit' or 'preview'
   */
  getStageMode() {
    return this.state.isEdit === true ? 'edit' : 'preview'
  }

  /**
   * Get current stage drag state
   * @returns {boolean} - Whether the stage is currently draggable
   */
  getStageDrag() {
    return this.state.stage.draggable()
  }

  /**
   * Enable canvas dragging
   */
  enableStageDrag(isMiddleMousePressed = false) {
    if (!isMiddleMousePressed) {
      this.state.stage.draggable(true)
    }
    this.stateManage.class.stage.stageSetFocus()
    this.state.stage.container().style.cursor = 'grabbing'
    this.stateManage.class.event.trigger('stageDrag', true)
  }

  /**
   * Disable canvas dragging
   */
  disableStageDrag() {
    this.state.stage.container().style.cursor = 'default'
    this.state.stage.draggable(false)
    this.stateManage.class.event.trigger('stageDrag', false)
  }

  /**
   * Modify the canvas's width and height
   * @param {Object} size - Object containing new width and height
   * @param {number} size.width - New width
   * @param {number} size.height - New height
   */
  setStageSize({ width, height }) {
    // Update stage size
    this.state.stage.width(width)
    this.state.stage.height(height)

    // Update background color node size
    const bgNode = this.state.stage.findOne('.backgroundColor')
    if (bgNode) {
      bgNode.width(width)
      bgNode.height(height)
    }

    // Update background image node size
    const bgImgNode = this.state.stage.findOne('.backgroundImage')
    if (bgImgNode) {
      bgImgNode.width(width)
      bgImgNode.height(height)
    }

    // Update all nodes' positions and sizes
    this.state.stage.find('*').forEach((node) => {
      if (node.attrs.x + node.width() > width) {
        node.x(Math.max(width - node.width(), 0))
      }
      if (node.attrs.y + node.height() > height) {
        node.y(Math.max(height - node.height(), 0))
      }
    })

    // Redraw the stage
    this.state.stage.draw()
    this.stateManage.class.dom.updateDomPosition()
    setTimeout(() => {
      this.stateManage.class.history.addHistory({ title: 'Canvas Size Modification' })
    }, 500)
  }

  /**
   * Disable canvas zoom
   */
  disableStageZoom() {
    this.zoomEnabled = false
  }

  /**
   * Enable canvas zoom
   */
  enableStageZoom() {
    this.zoomEnabled = true
  }

  /**
   * Convert image URL To Base64 Base64 encoding（PNG PNG format）
   * If the input is already in Base64 Base64 format，Return it directly
   *
   * @param {string} url Image's URL or Base64 Base64 string
   * @returns {Promise<string>} Returns a Promise，resolve Returns the image's Base64 Base64 encoded string
   */
  convertImgUrlToBase64(url) {
    // If it is already in Base64 Base64 format，Return Promise.resolve(url) directly Promise.resolve(url)
    if (url.startsWith('data:')) {
      return Promise.resolve(url)
    }

    return new Promise((resolve, reject) => {
      const image = new Image()
      // Set cross-domain attribute（Image server must support CORS，Otherwise, reading will fail）
      image.crossOrigin = 'Anonymous'

      image.onload = () => {
        // Create canvas And set size to image's actual size
        const canvas = document.createElement('canvas')
        canvas.width = image.naturalWidth
        canvas.height = image.naturalHeight
        const ctx = canvas.getContext('2d')

        // Draw image onto canvas Canvas
        ctx.drawImage(image, 0, 0)

        try {
          // Convert canvas To Base64 Base64 encoded PNG PNG image
          const base64 = canvas.toDataURL('image/png')
          resolve(base64)
        } catch (error) {
          reject(new Error('convert Base64 failed：' + error))
        }
      }

      image.onerror = (error) => {
        reject(new Error('failed to load image：' + error))
      }

      // Trigger image loading
      image.src = url
    })
  }

  setStageScale(scale, animate = false) {
    const stage = this.state.stage
    if (animate) {
      const tween = new Konva.Tween({
        node: stage,
        duration: 0.3, // Animation duration can be adjusted as needed
        scaleX: scale,
        scaleY: scale,
        easing: Konva.Easings.EaseInOut
      })
      tween.onUpdate = () => {
        this.stateManage.class.dom.updateDomPosition()
        this.stateManage.class.event.trigger('updateSketchRule')
      }
      tween.onFinish = () => {
        this.stateManage.class.dom.updateDomPosition()
        this.stateManage.class.event.trigger('updateSketchRule')
      }
      tween.play()
    } else {
      stage.scale({ x: scale, y: scale })
      this.stateManage.class.dom.updateDomPosition()
    }
  }

  setMobileRotation(isRotation) {
    this.state.config.allowMobileRotation = isRotation
  }

  getMobileRotation() {
    return this.state.config.allowMobileRotation
  }

  /**
   * Complete cleanup before reset
   */
  cleanupBeforeReset() {
    // Cleanup DOM DOM nodes
    const allDomNodesIds = this.state.stage.find('.dom-rect').map((node) => node.attrs.id)
    this.stateManage.class.event.trigger('domClear', allDomNodesIds)

    // Forcibly cleanup all background nodes，Ensure no residues
    const bgColorNodes = this.state.stage.find('.backgroundColor')
    const bgImageNodes = this.state.stage.find('.backgroundImage')

    bgColorNodes.forEach((node) => {
      node.destroy()
    })
    bgImageNodes.forEach((node) => {
      node.destroy()
    })

    // Redraw all layers immediately after cleanup
    this.state.layers.forEach((layer) => {
      if (layer && layer.draw) {
        layer.draw()
      }
    })

    // Stop observers and cleanup events
    if (this.stateManage.class.dom?.stopObservingDomElements) {
      this.stateManage.class.dom.stopObservingDomElements()
    }
    if (this.stateManage.class.event?.unbindEvents) {
      this.stateManage.class.event.unbindEvents()
    }

    // Cleanup transformers and states
    this.stateManage.class.transformer?.resetTransformer([])
    this.stateManage.clearAllObservers()
    this.state.selectedNodes = []
    this.state.clipBoard = []
  }
}