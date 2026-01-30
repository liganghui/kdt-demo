import { v4 as uuidv4 } from 'uuid'
import { getAssetPath } from '@/utils/utils'

// 加载失败的时候默认图片
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
      lastSuccessfulSrc: '', // 记录最后成功加载的图片地址
      svgRenderMode: 'colorReplace' //SVG图片 渲染方式   colorReplace|konvaFilter
    }

    const props = { ...defaultProps, ...(params.props || {}) }
    // 调用父类构造函数
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
      title: params.title || '图片',
      width: params.width || 100, // 默认宽度
      height: params.height || 100, //默认高度
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

    // 加载状态管理
    this.loading = false
    this.loadingPromise = null // 添加Promise来跟踪加载状态
    this.isImageReady = false // 明确的加载完成标志
    this.usingSVGStringReplace = false // 标记是否滤镜使用SVG字符串替换
    this.originalSVGString = null
    this.currentBlobUrl = null
    // 保存状态和状态管理对象
    this.state = state || window.kdt.state
    this.stateManage = stateManage || window.kdt.stateManage

    if (!params.id) {
      // 新建情况，初始化图片并添加到层
      this.initImage(params)
      const layer = params.layer || this.state.layers[2]
      layer.add(this)
    } else {
      // 还原情况，延迟初始化图片
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
      console.warn('图片控件地址不存在')
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
          // 标记滤镜使用颜色替换
          this.usingSVGStringReplace = true
          // 使用颜色替换
          const blob = new Blob([result.modifiedSVG], { type: 'image/svg+xml' })
          this.currentBlobUrl = URL.createObjectURL(blob)
          this.loadingPromise = this.loadNormalImage(this.currentBlobUrl, params)
          return this.loadingPromise
        } else {
          this.usingSVGStringReplace = false
        }
      } catch (error) {
        console.error('SVG处理失败:', error)
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

        // 确保尺寸有效
        const imgWidth = imageElement.naturalWidth || imageElement.width || 100
        const imgHeight = imageElement.naturalHeight || imageElement.height || 100

        // 检查图片尺寸是否有效
        if (imgWidth <= 0 || imgHeight <= 0) {
          console.error('图片尺寸无效:', { width: imgWidth, height: imgHeight, src })
          if (src !== defaultImg) {
            this.loadNormalImage(defaultImg, params).then(resolve).catch(reject)
          } else {
            reject(new Error('图片尺寸无效'))
          }
          return
        }

        this.image(imageElement)
        this.isImageReady = true

        // 如果没有指定尺寸，使用图片的实际尺寸
        if (!params.width && !params.height) {
          this.width(imgWidth)
          this.height(imgHeight)
        } else {
          // 确保设置的尺寸是有效数值
          this.width(Math.max(1, params.width || imgWidth))
          this.height(Math.max(1, params.height || imgHeight))
        }

        // 图片加载完成后调整位置，使其中心点位于原始添加位置
        if (!params.id) {
          // 只对新添加的图片执行居中处理
          const currentX = this.x()
          const currentY = this.y()
          this.x(currentX - this.width() / 2)
          this.y(currentY - this.height() / 2)
        }

        // 延迟缓存和滤镜应用，确保图片完全准备好
        setTimeout(() => {
          try {
            // 先应用滤镜
            this.applyFilters()
            if (this.canSafelyCache()) {
              this.cache({
                pixelRatio: 2
              })
            }
          } catch (error) {
            console.warn('应用滤镜或缓存时出错:', error)
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
        console.error('图片加载失败:', src)
        if (src !== defaultImg) {
          // 递归加载默认图片
          this.loadNormalImage(defaultImg, params).then(resolve).catch(reject)
        } else {
          reject(error)
        }
      }

      imageElement.src = src
    })
  }

  handleTransformEnd() {
    // 计算新的宽高
    const width = Math.abs(this.width() * this.scaleX())
    const height = Math.abs(this.height() * this.scaleY())

    // 重置缩放比例
    this.scaleX(this.scaleX() < 0 ? -1 : 1)
    this.scaleY(this.scaleY() < 0 ? -1 : 1)

    // 应用新的宽高
    this.setWidth(width)
    this.setHeight(height)

    // 是GIF实例，更新其大小
    if (this._gifInstance && this._gifInstance.get_canvas()) {
      this.updateParams({
        width: width,
        height: height
      })
    } else {
      // 先清除缓存，然后重新应用滤镜和缓存
      if (this.isCached()) {
        this.clearCache()
      }
      // 重新应用滤镜
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

        // 检查图片尺寸
        const imgWidth = imageElement.naturalWidth || imageElement.width || 100
        const imgHeight = imageElement.naturalHeight || imageElement.height || 100

        if (imgWidth <= 0 || imgHeight <= 0) {
          console.error('GIF图片尺寸无效:', { width: imgWidth, height: imgHeight, src })
          this.loadNormalImage(defaultImg, params).then(resolve).catch(reject)
          return
        }

        const gif = new SuperGif({ gif: imageElement })
        this._gifInstance = gif

        gif.load(() => {
          const gifCanvas = gif.get_canvas()

          // 检查GIF canvas尺寸
          if (!gifCanvas || gifCanvas.width <= 0 || gifCanvas.height <= 0) {
            console.error('GIF canvas尺寸无效')
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

          // 图片加载完成后调整位置，使其中心点位于原始添加位置
          if (!params.id) {
            const currentX = this.x()
            const currentY = this.y()
            this.x(currentX - this.width() / 2)
            this.y(currentY - this.height() / 2)
          }

          // 开始GIF播放
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
        console.error('GIF 图片加载失败:', src)
        this.loadNormalImage(defaultImg, params).then(resolve).catch(reject)
      }

      imageElement.src = src
    })
  }

  // 检查是否是跨域资源
  isCrossOriginSrc(src) {
    if (!src) return false

    // 数据URL不是跨域的
    if (src.startsWith('data:')) return false

    // 相对路径不是跨域的
    if (!src.startsWith('http')) return false

    // 检查是否与当前域名相同
    try {
      const url = new URL(src)
      const currentOrigin = window.location.origin
      return url.origin !== currentOrigin
    } catch (error) {
      return false
    }
  }

  //：检查是否可以安全缓存
  canSafelyCache() {
    try {
      const image = this.image()
      if (!image) return false

      // 检查图片尺寸
      if (this.width() <= 0 || this.height() <= 0) return false

      // 如果是跨域图片
      if (this.isCrossOriginSrc(this.attrs.props?.data)) {
        return false
      }

      return true
    } catch (error) {
      console.warn('检查缓存安全性时出错:', error)
      return false
    }
  }
  animateGif() {
    const animate = () => {
      // 检查层是否存在
      const layer = this.getLayer()
      if (layer) {
        layer.batchDraw() // 刷新画布
        this.attrs._animFrameId = requestAnimationFrame(animate)
      } else {
        // 层不存在，取消动画帧
        if (this.attrs._animFrameId) {
          cancelAnimationFrame(this.attrs._animFrameId)
          this.attrs._animFrameId = null
        }
      }
    }
    this.attrs._animFrameId = requestAnimationFrame(animate)
  }

  // 销毁方法，确保动画帧被取消
  destroy() {
    if (this._gifInstance) {
      this._gifInstance.pause() // 停止 GIF 动画
      this._gifInstance = null
    }
    if (this.attrs._animFrameId) {
      cancelAnimationFrame(this.attrs._animFrameId)
      this.attrs._animFrameId = null
    }
    this.image(null) // 释放图片引用
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

    // 更新props
    this.attrs.props = { ...this.attrs.props, ...newProps }

    // 如果图片地址变化，重新加载
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

    // 检查是否需要重新获取SVG字符串
    if (this.isSVG(this.attrs.props.data) && !this.originalSVGString && newFiltersEnabled) {
      // 异步获取SVG字符串，然后继续处理
      this.getSVGString(this.attrs.props.data)
        .then((svgString) => {
          this.originalSVGString = svgString
          // 获取到SVG字符串后，再次调用updateParams处理
          this.handleSVGUpdate(newProps)
        })
        .catch((error) => {
          console.error('SVG字符串获取失败:', error)
          // 获取失败，直接应用其他滤镜
          this.applyFilters()
        })
      return
    }

    // 处理SVG相关的更新
    if (this.isSVG(this.attrs.props.data)) {
      this.handleSVGUpdate(newProps, oldRed, oldGreen, oldBlue, oldFiltersEnabled, oldSvgRenderMode)
      return
    }

    // 其他情况使用滤镜
    this.applyFilters()
  }

  // 处理SVG相关的更新逻辑
  handleSVGUpdate(newProps, oldRed, oldGreen, oldBlue, oldFiltersEnabled, oldSvgRenderMode) {
    const {
      red: newRed,
      green: newGreen,
      blue: newBlue,
      filtersEnabled: newFiltersEnabled,
      svgRenderMode: newSvgRenderMode
    } = newProps

    // 如果没有SVG字符串，直接应用滤镜
    if (!this.originalSVGString) {
      this.applyFilters()
      return
    }

    const colorChanged = newRed !== oldRed || newGreen !== oldGreen || newBlue !== oldBlue
    const renderModeChanged = newSvgRenderMode !== oldSvgRenderMode
    const filtersEnabledChanged = newFiltersEnabled !== oldFiltersEnabled

    // 检查是否需要重新处理SVG
    const needsReprocessing =
      // 渲染模式变化
      renderModeChanged ||
      // 滤镜状态变化
      filtersEnabledChanged ||
      // 滤镜启用状态下颜色变化
      (newFiltersEnabled && colorChanged)

    if (needsReprocessing) {
      // 清理当前状态
      this.cleanupBlobUrl()
      this.clearCache()

      // 如果滤镜未启用，直接加载原始图片
      if (!newFiltersEnabled) {
        this.usingSVGStringReplace = false
        this.loadingPromise = this.loadNormalImage(this.attrs.props.data, this.attrs)
        return
      }

      // 如果颜色是默认值（白色），直接加载原始图片并应用其他滤镜
      if (newRed === 255 && newGreen === 255 && newBlue === 255) {
        this.usingSVGStringReplace = false
        this.loadingPromise = this.loadNormalImage(this.attrs.props.data, this.attrs)
        return
      }

      // 处理颜色滤镜
      const targetColor = this.rgbToHex(newRed || 255, newGreen || 255, newBlue || 255)
      const result = this.processSVGForColor(this.originalSVGString, targetColor)

      if (result.useStringReplace) {
        // 使用颜色替换方式
        this.usingSVGStringReplace = true
        const blob = new Blob([result.modifiedSVG], { type: 'image/svg+xml' })
        this.currentBlobUrl = URL.createObjectURL(blob)
        this.loadingPromise = this.loadNormalImage(this.currentBlobUrl, this.attrs)
      } else {
        // 使用Konva滤镜方式
        this.usingSVGStringReplace = false
        this.loadingPromise = this.loadNormalImage(this.attrs.props.data, this.attrs)
      }
      return
    }

    // 其他情况使用滤镜
    this.applyFilters()
  }

  // 清理Blob URL
  cleanupBlobUrl() {
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl)
      this.currentBlobUrl = null
    }
  }

  // 应用滤镜
  applyFilters() {
    const props = this.attrs.props
    if (props.filtersEnabled && this.attrs.name !== 'gif') {
      const filters = []

      // 检查是否可以应用滤镜
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

  // 设置组件宽度的方法
  setWidth(width) {
    // 确保传入的是有效数值
    const numWidth = Number(width)
    if (isNaN(numWidth) || numWidth <= 0) {
      return
    }

    // 直接设置属性，避免调用this.width()导致的递归
    this.attrs.width = numWidth

    // 如果图片已经缓存，需要更新缓存
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
    // 确保传入的是有效数值
    const numHeight = Number(height)
    if (isNaN(numHeight) || numHeight <= 0) {
      return
    }

    // 直接设置属性，避免调用this.height()导致的递归
    this.attrs.height = numHeight

    // 如果图片已经缓存，需要更新缓存
    if (this.isCached()) {
      this.clearCache()
      setTimeout(() => {
        if (this.canSafelyCache()) {
          this.cache()
        }
      }, 10)
    }
  }

  // 获取加载状态的方法
  isLoaded() {
    return this.isImageReady && !this.loading
  }

  // 等待加载完成的方法
  waitForLoad() {
    if (this.isLoaded()) {
      return Promise.resolve(this)
    }
    return this.loadingPromise || Promise.resolve(this)
  }

  // SVG颜色检测
  extractSVGColors(svgString) {
    const colors = new Set()
    // 匹配16进制颜色
    const hexMatches = svgString.match(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g) || []
    hexMatches.forEach((color) => colors.add(color.toLowerCase()))
    // 匹配RGB颜色
    const rgbMatches = [...svgString.matchAll(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g)]
    rgbMatches.forEach((match) => colors.add(match[0]))
    // 匹配颜色名称
    const namedMatches =
      svgString.match(
        /\b(black|white|red|green|blue|yellow|orange|purple|pink|brown|gray|grey|cyan|magenta|lime|navy|olive|maroon|silver|aqua|fuchsia|teal)\b/g
      ) || []
    namedMatches.forEach((color) => colors.add(color.toLowerCase()))

    return Array.from(colors)
  }

  // SVG颜色替换
  replaceSVGColor(svgString, fromColor, toColor) {
    const escapedFromColor = fromColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escapedFromColor, 'gi')
    return svgString.replace(regex, toColor)
  }

  // SVG处理方法
  processSVGForColor(svgString, targetColor) {
    const renderMode = this.attrs.props.svgRenderMode || 'colorReplace'

    // 根据用户选择的渲染模式决定处理方式
    if (renderMode === 'colorReplace') {
      // 使用颜色替换方式
      const colors = this.extractSVGColors(svgString)
      let modifiedSVG = svgString
      colors.forEach((color) => {
        modifiedSVG = this.replaceSVGColor(modifiedSVG, color, targetColor)
      })
      return { useStringReplace: true, modifiedSVG }
    } else {
      // 使用Konva滤镜方式
      return { useStringReplace: false, modifiedSVG: svgString }
    }
  }

  // 检查是否为SVG
  isSVG(src) {
    return (
      src &&
      (src.toLowerCase().endsWith('.svg') ||
        src.startsWith('data:image/svg+xml') ||
        src.includes('<svg'))
    )
  }

  // 获取SVG字符串
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

// 设置类名并注册
CustomImage.prototype.className = 'CustomImage'
Konva['CustomImage'] = CustomImage

// 导出自定义图片类
export { CustomImage }