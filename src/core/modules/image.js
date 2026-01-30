import { v4 as uuidv4 } from 'uuid'
import { getAssetPath } from '@/utils/utils'

// Default image when loading fails
const defaultImg =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABABAMAAABYR2ztAAAAG1BMVEUAAAAsLCwrKyssLCwwMDArKyssLCwtLS0sLCyqHixOAAAACHRSTlMAv5+AIN9AYKcgioIAAAFvSURBVEjH3dSxT4NAFAbwq1BcS0IiY2M1dSQ62BFNjIyNduhI0qUj+h8UpN6fLY/j7juOvFvc+k195Zev4V1BXEi+43ES+jIchrUQM+mkIlDoaSs2zvXfviDVYy3cgiWBFzO2BFZPyLOgHNTw2F0U9DNsih4seTD7Bwj9ILqXN15Ay0k8IKANNAzAoisebPRO/WDBg3Q4SHHlb+DBsQcZD+Y9yHkQ7rvrZzEB77n+9NaBcgrSxHQc1oQdMJOnXCAWwN3vPIAG2eYMMNvZ8SCS0lS8fpRjgO1RBZV9uoAKUBHINrMB/iOoaGyAhxEVMrOBfsZR8aAqAFLn8S6oAsAukD/DUhoAmpFS31MGcC2Rs1lKA3C0QIWlZBpEEmmsrdYaFM4bKDKDAncSqVFAkwKxBRa0VYy3BOyc9LEgAChgAAp4sFXnyoIWL9kJwEGnPGhL/DEssMcxocAGOGkUjFY7ZwpwY1+xChUEsZOVuIz8AbTYum13ev4fAAAAAElFTkSuQmCC'

class CustomImage extends Konva.Image {
  constructor(params, state, stateManage) {
    const defaultProps = {
      data: getAssetPath('/assets/imgs/module/img.svg'),
      filtersEnabled: false,
      brightness: 0,
      contrast: 0,
      blur: 0,
      red: 255,
      green: 255,
      blue: 255,
      lastSuccessfulSrc: '', // Record the last successfully loaded image address
      svgRenderMode: 'colorReplace' //SVGImage Rendering mode   colorReplace|konvaFilter
    }

    const props = { ...defaultProps, ...(params.props || {}) }
    // Call the parent class constructor
    super({
      x: params.x,
      y: params.y,
      id: params.id || uuidv4().split('-').join(''),
      name:String( params.props?.data).split('.').pop().toLowerCase() === 'gif' ? 'gif' : 'image',
      offsetX: 0,
      offsetY: 0,
      skewX: params.skewX || 0,
      skewY: params.skewY || 0,
      opacity: params.opacity || 1,
      title: params.title || 'Image',
      width: params.width || 100, // Default width
      height: params.height || 100, //Default height
      scaleX: params.scaleX || 1,
      scaleY: params.scaleY || 1,
      rotation: params.rotation || 0,
      transformable: params.transformable !== undefined ? params.transformable : true,
      draggable:
        params.draggable !== undefined
          ? params.draggable
          : !(
              params.transformable === false ||
              params.props?._inGroup === true ||
              params?.lock === true
            ),
      dataSourceConfig: params.dataSourceConfig || {},
      props: props,
      component: params.component
    })

    // Loading state management
    this.loading = false
    this.loadingPromise = null // AddPromiseTo track the loading state
    this.isImageReady = false // Clear flag indicating loading completion
    this.usingSVGStringReplace = false // Mark whether the filter usesSVGString replacement
    this.originalSVGString = null
    this.currentBlobUrl = null
    // Save state and state management object
    this.state = state || window.kdt.state
    this.stateManage = stateManage || window.kdt.stateManage

    if (!params.id) {
      // New creation scenario，Initialize image and add to layer
      this.initImage(params)
      const layer = params.layer || this.state.layers[2]
      layer.add(this)
    } else {
      // Restore scenario，Delay initializing the image
      setTimeout(() => {
        this.initImage(params)
      })
    }

    window.kdt.on(`dataUpdate.${this.id()}`, (e) => {
      if (e.id === this.id()) {
        this.updateParams({ data: e.data })
      }
    })
    this.on('transformend', this.handleTransformEnd.bind(this))
  }

  async initImage(params) {
    const props = this.attrs.props
    const imageSrc = props?.data
    if (!imageSrc) {
      console.warn('image control address does not exist')
      return
    }

    if (
      this.isSVG(imageSrc) &&
      (props.red !== 255 || props.green !== 255 || props.blue !== 255) &&
      props.filtersEnabled
    ) {
      try {
        this.originalSVGString = await this.getSVGString(imageSrc)
        const targetColor = this.rgbToHex(props.red, props.green, props.blue)
        const result = this.processSVGForColor(this.originalSVGString, targetColor)

        if (result.useStringReplace) {
          // Mark the filter to use color replacement
          this.usingSVGStringReplace = true
          // Use color replacement
          const blob = new Blob([result.modifiedSVG], { type: 'image/svg+xml' })
          this.currentBlobUrl = URL.createObjectURL(blob)
          this.loadingPromise = this.loadNormalImage(this.currentBlobUrl, params)
          return this.loadingPromise
        } else {
          this.usingSVGStringReplace = false
        }
      } catch (error) {
        console.error('SVGprocessing failed:', error)
      }
    } else {
      this.usingSVGStringReplace = false
    }

    if (imageSrc.split('.').pop().toLowerCase() === 'gif') {
      this.loadingPromise = this.loadGif(imageSrc, params)
    } else {
      this.loadingPromise = this.loadNormalImage(imageSrc, params)
    }
    return this.loadingPromise
  }

  rgbToHex(r, g, b) {
    const toHex = (n) => {
      const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  loadNormalImage(src, params) {
    this.loading = true
    this.isImageReady = false

    return new Promise((resolve, reject) => {
      const imageElement = new Image()
      if (this.isCrossOriginSrc(src)) {
        imageElement.crossOrigin = 'anonymous'
      }
      imageElement.onload = () => {
        this.loading = false

        // Ensure dimensions are valid
        const imgWidth = imageElement.naturalWidth || imageElement.width || 100
        const imgHeight = imageElement.naturalHeight || imageElement.height || 100

        // Check if image dimensions are valid
        if (imgWidth <= 0 || imgHeight <= 0) {
          console.error('invalid image size:', { width: imgWidth, height: imgHeight, src })
          if (src !== defaultImg) {
            this.loadNormalImage(defaultImg, params).then(resolve).catch(reject)
          } else {
            reject(new Error('invalid image size'))
          }
          return
        }

        this.image(imageElement)
        this.isImageReady = true

        // If no dimensions are specified，Use the actual dimensions of the image
        if (!params.width && !params.height) {
          this.width(imgWidth)
          this.height(imgHeight)
        } else {
          // Ensure the set dimensions are valid numbers
          this.width(Math.max(1, params.width || imgWidth))
          this.height(Math.max(1, params.height || imgHeight))
        }

        // Adjust position after image loading is complete，Center it at the original added position
        if (!params.id) {
          // Only center newly added images
          const currentX = this.x()
          const currentY = this.y()
          this.x(currentX - this.width() / 2)
          this.y(currentY - this.height() / 2)
        }

        // Delay cache and filter application，Ensure the image is completely ready
        setTimeout(() => {
          try {
            // Apply filters first
            this.applyFilters()
            if (this.canSafelyCache()) {
              this.cache({
                pixelRatio: 2
              })
            }
          } catch (error) {
            console.warn('error applying filter or cache:', error)
          }

          if (!params || !params.id) {
            this.stateManage.class.event.trigger('addNode', {
              type: 'canvas',
              name: 'image',
              node: this
            })
          }

          resolve(this)
        }, 10)
      }

      imageElement.onerror = (error) => {
        this.loading = false
        this.isImageReady = false
        console.error('image load failed:', src)
        if (src !== defaultImg) {
          // Recursively load default image
          this.loadNormalImage(defaultImg, params).then(resolve).catch(reject)
        } else {
          reject(error)
        }
      }

      imageElement.src = src
    })
  }

  handleTransformEnd() {
    // Calculate new width and height
    const width = Math.abs(this.width() * this.scaleX())
    const height = Math.abs(this.height() * this.scaleY())

    // Reset scale ratio
    this.scaleX(this.scaleX() < 0 ? -1 : 1)
    this.scaleY(this.scaleY() < 0 ? -1 : 1)

    // Apply new width and height
    this.setWidth(width)
    this.setHeight(height)

    // IsGIFInstance，Update its size
    if (this._gifInstance && this._gifInstance.get_canvas()) {
      this.updateParams({
        width: width,
        height: height
      })
    } else {
      // Clear cache first，Then reapply filters and cache
      if (this.isCached()) {
        this.clearCache()
      }
      // Reapply filters
      this.applyFilters()
      this.cache({
        pixelRatio: 2
      })
    }

    if (this.stateManage && this.stateManage.class && this.stateManage.class.node) {
      this.stateManage.class.node.forceUpdate()
    }
  }

  loadGif(src, params) {
    this.clearCache()
    this.loading = true
    this.isImageReady = false

    return new Promise((resolve, reject) => {
      const imageElement = new Image()

      if (this.isCrossOriginSrc(src)) {
        imageElement.crossOrigin = 'anonymous'
      }

      imageElement.onload = () => {
        this.loading = false

        // Check image dimensions
        const imgWidth = imageElement.naturalWidth || imageElement.width || 100
        const imgHeight = imageElement.naturalHeight || imageElement.height || 100

        if (imgWidth <= 0 || imgHeight <= 0) {
          console.error('GIFinvalid image size:', { width: imgWidth, height: imgHeight, src })
          this.loadNormalImage(defaultImg, params).then(resolve).catch(reject)
          return
        }

        const gif = new SuperGif({ gif: imageElement })
        this._gifInstance = gif

        gif.load(() => {
          const gifCanvas = gif.get_canvas()

          // CheckGIF canvasDimensions
          if (!gifCanvas || gifCanvas.width <= 0 || gifCanvas.height <= 0) {
            console.error('GIF canvasinvalid size')
            this.loadNormalImage(defaultImg, params).then(resolve).catch(reject)
            return
          }

          this.image(gifCanvas)
          this.isImageReady = true

          if (!params.width && !params.height) {
            this.width(imgWidth)
            this.height(imgHeight)
          } else {
            this.width(Math.max(1, params.width || imgWidth))
            this.height(Math.max(1, params.height || imgHeight))
          }

          // Adjust position after image loading is complete，Center it at the original added position
          if (!params.id) {
            const currentX = this.x()
            const currentY = this.y()
            this.x(currentX - this.width() / 2)
            this.y(currentY - this.height() / 2)
          }

          // StartGIFPlay
          this.animateGif()

          if (!params || !params.id) {
            this.stateManage.class.event.trigger('addNode', {
              type: 'canvas',
              name: 'image',
              node: this
            })
          }

          resolve(this)
        })
      }

      imageElement.onerror = (error) => {
        this.loading = false
        this.isImageReady = false
        console.error('GIF image load failed:', src)
        this.loadNormalImage(defaultImg, params).then(resolve).catch(reject)
      }

      imageElement.src = src
    })
  }

  // Check if it is a cross-origin resource
  isCrossOriginSrc(src) {
    if (!src) return false

    // DataURLNot cross-origin
    if (src.startsWith('data:')) return false

    // Relative paths are not cross-origin
    if (!src.startsWith('http')) return false

    // Check if it is the same as the current domain
    try {
      const url = new URL(src)
      const currentOrigin = window.location.origin
      return url.origin !== currentOrigin
    } catch (error) {
      return false
    }
  }

  //：Check if it can be safely cached
  canSafelyCache() {
    try {
      const image = this.image()
      if (!image) return false

      // Check image dimensions
      if (this.width() <= 0 || this.height() <= 0) return false

      // If it is a cross-origin image
      if (this.isCrossOriginSrc(this.attrs.props?.data)) {
        return false
      }

      return true
    } catch (error) {
      console.warn('error checking cache security:', error)
      return false
    }
  }
  animateGif() {
    const animate = () => {
      // Check if layer exists
      const layer = this.getLayer()
      if (layer) {
        layer.batchDraw() // Refresh the canvas
        this.attrs._animFrameId = requestAnimationFrame(animate)
      } else {
        // Layer does not exist，Cancel animation frame
        if (this.attrs._animFrameId) {
          cancelAnimationFrame(this.attrs._animFrameId)
          this.attrs._animFrameId = null
        }
      }
    }
    this.attrs._animFrameId = requestAnimationFrame(animate)
  }

  // Destroy method，Ensure animation frame is canceled
  destroy() {
    if (this._gifInstance) {
      this._gifInstance.pause() // Stop GIF Animation
      this._gifInstance = null
    }
    if (this.attrs._animFrameId) {
      cancelAnimationFrame(this.attrs._animFrameId)
      this.attrs._animFrameId = null
    }
    this.image(null) // Release image reference
    super.destroy()
  }

  updateParams(newProps) {
    const oldData = this.attrs.props.data
    const newData = newProps.data
    const oldRed = this.attrs.props.red
    const oldGreen = this.attrs.props.green
    const oldBlue = this.attrs.props.blue
    const oldFiltersEnabled = this.attrs.props.filtersEnabled
    const oldSvgRenderMode = this.attrs.props.svgRenderMode
    const newRed = newProps.red
    const newGreen = newProps.green
    const newBlue = newProps.blue
    const newFiltersEnabled = newProps.filtersEnabled
    const newSvgRenderMode = newProps.svgRenderMode

    // Updateprops
    this.attrs.props = { ...this.attrs.props, ...newProps }

    // If the image address changes，Reload
    if (newData && newData !== oldData && !this.loading) {
      if (this._gifInstance) {
        this._gifInstance.pause()
        this._gifInstance = null
      }
      this.image(null)
      this.clearCache()
      this.cleanupBlobUrl()

      const ext = newData.split('.').pop().toLowerCase()
      if (ext === 'gif') {
        this.loadingPromise = this.loadGif(newData, this.attrs)
      } else {
        this.loadingPromise = this.initImage(this.attrs)
      }
      return
    }

    // Check if re-acquisition is neededSVGString
    if (this.isSVG(this.attrs.props.data) && !this.originalSVGString && newFiltersEnabled) {
      // Asynchronously acquireSVGThen continue processing，Obtained
      this.getSVGString(this.attrs.props.data)
        .then((svgString) => {
          this.originalSVGString = svgString
          // After string is obtainedSVGCall again，ProcessupdateParamsFailed to acquire
          this.handleSVGUpdate(newProps)
        })
        .catch((error) => {
          console.error('SVGfailed to get string:', error)
          // Directly apply other filters，Process
          this.applyFilters()
        })
      return
    }

    // Related updatesSVGUse filters in other cases
    if (this.isSVG(this.attrs.props.data)) {
      this.handleSVGUpdate(newProps, oldRed, oldGreen, oldBlue, oldFiltersEnabled, oldSvgRenderMode)
      return
    }

    // Process
    this.applyFilters()
  }

  // Related update logicSVGIf there is no
  handleSVGUpdate(newProps, oldRed, oldGreen, oldBlue, oldFiltersEnabled, oldSvgRenderMode) {
    const {
      red: newRed,
      green: newGreen,
      blue: newBlue,
      filtersEnabled: newFiltersEnabled,
      svgRenderMode: newSvgRenderMode
    } = newProps

    // StringSVGDirectly apply filters，Check if reprocessing is needed
    if (!this.originalSVGString) {
      this.applyFilters()
      return
    }

    const colorChanged = newRed !== oldRed || newGreen !== oldGreen || newBlue !== oldBlue
    const renderModeChanged = newSvgRenderMode !== oldSvgRenderMode
    const filtersEnabledChanged = newFiltersEnabled !== oldFiltersEnabled

    // Rendering mode changesSVG
    const needsReprocessing =
      // Filter state changes
      renderModeChanged ||
      // Color changes when filter is enabled
      filtersEnabledChanged ||
      // Clean up current state
      (newFiltersEnabled && colorChanged)

    if (needsReprocessing) {
      // If filter is not enabled
      this.cleanupBlobUrl()
      this.clearCache()

      // Directly load original image，If color is the default value
      if (!newFiltersEnabled) {
        this.usingSVGStringReplace = false
        this.loadingPromise = this.loadNormalImage(this.attrs.props.data, this.attrs)
        return
      }

      // White（Directly load original image and apply other filters），Process color filter
      if (newRed === 255 && newGreen === 255 && newBlue === 255) {
        this.usingSVGStringReplace = false
        this.loadingPromise = this.loadNormalImage(this.attrs.props.data, this.attrs)
        return
      }

      // Use color replacement method
      const targetColor = this.rgbToHex(newRed || 255, newGreen || 255, newBlue || 255)
      const result = this.processSVGForColor(this.originalSVGString, targetColor)

      if (result.useStringReplace) {
        // Use
        this.usingSVGStringReplace = true
        const blob = new Blob([result.modifiedSVG], { type: 'image/svg+xml' })
        this.currentBlobUrl = URL.createObjectURL(blob)
        this.loadingPromise = this.loadNormalImage(this.currentBlobUrl, this.attrs)
      } else {
        // Filter methodKonvaUse filters in other cases
        this.usingSVGStringReplace = false
        this.loadingPromise = this.loadNormalImage(this.attrs.props.data, this.attrs)
      }
      return
    }

    // Cleanup
    this.applyFilters()
  }

  // Apply filtersBlob URL
  cleanupBlobUrl() {
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl)
      this.currentBlobUrl = null
    }
  }

  // Check if filters can be applied
  applyFilters() {
    const props = this.attrs.props
    if (props.filtersEnabled && this.attrs.name !== 'gif') {
      const filters = []

      // Method to set component width
      if (!this.canSafelyCache() && this.isCrossOriginSrc(props.data)) {
        this.filters([])
        return
      }

      if (
        !this.usingSVGStringReplace &&
        (props.red !== 255 || props.green !== 255 || props.blue !== 255)
      ) {
        filters.push(Konva.Filters.RGB)
        this.red(props.red)
        this.green(props.green)
        this.blue(props.blue)
      }

      if (props.brightness !== 0) {
        filters.push(Konva.Filters.Brighten)
        this.brightness(props.brightness)
      }

      if (props.contrast !== 0) {
        filters.push(Konva.Filters.Contrast)
        this.contrast(props.contrast)
      }

      if (props.blur !== 0) {
        filters.push(Konva.Filters.Blur)
        this.blurRadius(props.blur)
      }

      this.filters(filters)
    } else {
      this.filters([])
    }
  }

  // Ensure the input is a valid number
  setWidth(width) {
    // Directly set property
    const numWidth = Number(width)
    if (isNaN(numWidth) || numWidth <= 0) {
      return
    }

    // Avoid calling，Resulting recursionthis.width()If the image is already cached
    this.attrs.width = numWidth

    // Need to update cache，Ensure the input is a valid number
    if (this.isCached()) {
      this.clearCache()
      setTimeout(() => {
        if (this.canSafelyCache()) {
          this.cache()
        }
      }, 10)
    }
  }

  setHeight(height) {
    // Directly set property
    const numHeight = Number(height)
    if (isNaN(numHeight) || numHeight <= 0) {
      return
    }

    // Avoid calling，Resulting recursionthis.height()If the image is already cached
    this.attrs.height = numHeight

    // Need to update cache，Method to get loading state
    if (this.isCached()) {
      this.clearCache()
      setTimeout(() => {
        if (this.canSafelyCache()) {
          this.cache()
        }
      }, 10)
    }
  }

  // Method to wait for loading completion
  isLoaded() {
    return this.isImageReady && !this.loading
  }

  // Color detection
  waitForLoad() {
    if (this.isLoaded()) {
      return Promise.resolve(this)
    }
    return this.loadingPromise || Promise.resolve(this)
  }

  // SVGMatch
  extractSVGColors(svgString) {
    const colors = new Set()
    // Hexadecimal color16Match
    const hexMatches = svgString.match(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g) || []
    hexMatches.forEach((color) => colors.add(color.toLowerCase()))
    // ColorRGBMatch color names
    const rgbMatches = [...svgString.matchAll(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g)]
    rgbMatches.forEach((match) => colors.add(match[0]))
    // Color replacement
    const namedMatches =
      svgString.match(
        /\b(black|white|red|green|blue|yellow|orange|purple|pink|brown|gray|grey|cyan|magenta|lime|navy|olive|maroon|silver|aqua|fuchsia|teal)\b/g
      ) || []
    namedMatches.forEach((color) => colors.add(color.toLowerCase()))

    return Array.from(colors)
  }

  // SVGProcessing method
  replaceSVGColor(svgString, fromColor, toColor) {
    const escapedFromColor = fromColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escapedFromColor, 'gi')
    return svgString.replace(regex, toColor)
  }

  // SVGDecide processing method based on user-selected rendering mode
  processSVGForColor(svgString, targetColor) {
    const renderMode = this.attrs.props.svgRenderMode || 'colorReplace'

    // Use color replacement method
    if (renderMode === 'colorReplace') {
      // Use
      const colors = this.extractSVGColors(svgString)
      let modifiedSVG = svgString
      colors.forEach((color) => {
        modifiedSVG = this.replaceSVGColor(modifiedSVG, color, targetColor)
      })
      return { useStringReplace: true, modifiedSVG }
    } else {
      // Filter methodKonvaCheck if it is
      return { useStringReplace: false, modifiedSVG: svgString }
    }
  }

  // GetSVG
  isSVG(src) {
    return (
      src &&
      (src.toLowerCase().endsWith('.svg') ||
        src.startsWith('data:image/svg+xml') ||
        src.includes('<svg'))
    )
  }

  // StringSVGSet class name and register
  async getSVGString(src) {
    if (src.startsWith('data:image/svg+xml')) {
      return decodeURIComponent(src.split(',')[1])
    } else if (src.includes('<svg')) {
      return src
    } else {
      const response = await fetch(src)
      return await response.text()
    }
  }

  destroy() {
    if (this._gifInstance) {
      this._gifInstance.pause()
      this._gifInstance = null
    }
    if (this.attrs._animFrameId) {
      cancelAnimationFrame(this.attrs._animFrameId)
      this.attrs._animFrameId = null
    }
    this.cleanupBlobUrl()
    this.image(null)
    window.kdt.off(`dataUpdate.${this.id()}`)
    super.destroy()
  }
}

// Export custom image class
CustomImage.prototype.className = 'CustomImage'
Konva['CustomImage'] = CustomImage

// Export Custom Image Class
export { CustomImage }