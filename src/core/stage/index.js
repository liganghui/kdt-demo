/**
 * @module StageManage
 * @name    画布
 * @description 用于管理画布的各种操作 , 包括 初始化画布, 重绘画布,  设置背景色/图片等
 */
import { isMobile } from '../utils/index'

export default class StageManage {
  constructor(state, stateManage, config) {
    this.config = config
    this.state = state || window.kdt.state
    this.stateManage = stateManage || window.kdt.stateManage
    // 画布是否可缩放
    this.zoomEnabled = true
  }

  /**
   * 初始化舞台，加载图层并设置背景颜色，支持通过 JSON 字符串重置舞台
   * @param {string} [jsonStr] - 可选的 JSON 字符串，用于从保存的状态重置舞台
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
    this.stateManage.class.history.addHistory({ title: '画布初始化' })
  }

  /**
   * 通过 JSON 数据重置舞台，保留当前舞台的缩放和位置
   * @param {string} jsonStr - 用于重置舞台的 JSON 数据
   */
  resetStageByJSON(jsonStr) {
    if (typeof jsonStr === 'object') {
      jsonStr = JSON.stringify(jsonStr)
    }

    // 完整清理现有资源
    this.cleanupBeforeReset()

    // 临时禁用自动添加变换框
    this.state.disableAutoAddTransformer = true

    // 记录旧舞台状态
    const oldStageScale = this.state.stage.scaleX()
    const oldStagePosition = this.state.stage.position()
    const container = this.state.stage.container()

    // 销毁旧舞台
    this.state.stage.off()
    this.state.stage.destroy()

    // 解析JSON数据
    const newJson = JSON.parse(jsonStr)

    // 创建新舞台
    const { width, height } = newJson.attrs || {}
    this.state.stage = new Konva.Stage({ container, width, height })

    // 创建图层
    newJson.children.forEach((layerData) => {
      const layer = new Konva.Layer(layerData.attrs || {})
      this.state.stage.add(layer)
    })

    this.state.layers = this.state.stage
      .getChildren()
      .filter((node) => node.getClassName() === 'Layer')

    // 用于收集背景设置
    let backgroundSettings = {
      backgroundColor: null,
      backgroundImage: null
    }

    // 创建节点
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
          // 收集背景颜色信息
          if (nodeData?.attrs?.name === 'backgroundColor') {
            backgroundSettings.backgroundColor = nodeData.attrs.fill
            if (!this.state.isEdit) {
              document.body.style.backgroundColor = nodeData.attrs.fill
            }
          }

          // 收集背景图片信息
          if (nodeData.attrs.url && nodeData?.attrs?.name === 'backgroundImage') {
            backgroundSettings.backgroundImage = {
              url: nodeData.attrs.url,
              opacity: nodeData.attrs.opacity || 1
            }
            return // 不直接创建节点，稍后统一处理
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

    // 恢复舞台状态
    this.state.stage.scale({ x: oldStageScale, y: oldStageScale })
    this.state.stage.position({ x: oldStagePosition.x, y: oldStagePosition.y })

    // 重新初始化
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
      // 给节点添加导入标识
      this.markAllNodesAsImported()
      // 延迟设置背景，确保图层完全初始化
      setTimeout(() => {
        this.stateManage.class.dom.updateDomPosition()
        this.stateManage.class.dom.observeDomElements()
      }, 100)

      // 设置背景颜色和图片
      setTimeout(() => {
        // 设置背景颜色
        if (backgroundSettings.backgroundColor) {
          this.setBackgroundColor(backgroundSettings.backgroundColor)
        }

        // 设置背景图片
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
   * 自动缩放舞台，使其适应指定窗口大小，并根据缩放类型和是否应用边距进行调整
   * @param {number} windowWidth - 窗口宽度
   * @param {number} windowHeight - 窗口高度
   * @param {string} scaleType - 缩放类型，可选值为 'fill'（铺满画布）、'fitWidth'（宽度铺满）、'fitHeight'（高度铺满）、'fit'（保持纵横比并尽可能大地适应窗口）
   * @param {boolean} [isMargin=false] - 是否应用边距，当为 true 时，计算出的缩放比例将减去 0.03
   * @param {boolean} [IsAnimate=true] - 是否启用动画效果，默认为 true
   * @param {function} [fn] - 可选的回调函数，在缩放完成后执行
   * @param {object} [systemConfig] - 系统配置
   *
   * @returns {Object} - 包含 x 轴和 y 轴的缩放比例
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
    // 读取是否允许移动端旋转
    const allowMobileRotation = this.state.config.allowMobileRotation !== false
    // 手机端且允许旋转时需要交换宽高
    if (allowMobileRotation && angle === 90) {
      let temp = windowWidth
      windowWidth = windowHeight
      windowHeight = temp
      stage.offsetX(0)
      stage.offsetY(0)
    }

    let scaleX, scaleY

    // 检查是否应该在预览模式下使用DOM缩放
    const isPreviewMode = this.state.isEdit === false
    const canvasSmallThanWindow = stageWidth < windowWidth || stageHeight < windowHeight
    const shouldUseDomScale = isPreviewMode && canvasSmallThanWindow
    const shouldFillScreen = shouldUseDomScale
    if (shouldUseDomScale) {
      // 预览模式下小画布使用DOM缩放，根据缩放类型计算
      if (scaleType === 'fill') {
        // 全屏铺满 - 不等比缩放
        scaleX = windowWidth / stageWidth
        scaleY = windowHeight / stageHeight
      } else if (scaleType === 'fitWidth') {
        // 宽度铺满 - 宽度缩放到窗口宽度，高度等比缩放
        scaleX = scaleY = windowWidth / stageWidth
      } else if (scaleType === 'fitHeight') {
        // 高度铺满 - 高度缩放到窗口高度，宽度等比缩放
        scaleX = scaleY = windowHeight / stageHeight
      } else {
        // 'fit'
        // 保持纵横比并尽可能大地适应窗口
        scaleX = scaleY = Math.min(windowWidth / stageWidth, windowHeight / stageHeight)
      }
    } else {
      // 编辑模式或大画布使用Konva内置缩放
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

    // 如果需要边距，调整缩放比例
    if (isMargin) {
      scaleX = Math.max(scaleX - 0.11, 0.01)
      scaleY = Math.max(scaleY - 0.11, 0.01)
    }

    let newPos = { x: 0, y: 0 }
    if (angle === 90) {
      // 针对旋转 90 度的手机端，按不同缩放类型计算位置
      if (scaleType === 'fitHeight') {
        newPos = {
          x: windowHeight,
          y: (windowHeight * scaleX) / 2
        }
      } else if (shouldFillScreen && scaleType === 'fill') {
        // 移动端旋转时的不等比缩放位置
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
      // 桌面端或未旋转时的位置计算
      if (shouldFillScreen && scaleType === 'fill') {
        // DOM缩放的fill模式，直接填满整个窗口
        newPos = { x: 0, y: 0 }
      } else {
        // 其他情况，以舞台中心居中
        newPos = {
          x: (windowWidth - stageWidth * scaleX) / 2,
          y: (windowHeight - stageHeight * scaleY) / 2
        }
      }
    }
    if (shouldFillScreen) {
      // 使用CSS缩放到konvaContainer
      const konvaContainer = document.getElementById('konvaContainer')
      if (konvaContainer) {
        konvaContainer.style.transform = `scale(${scaleX}, ${scaleY})`
        konvaContainer.style.transformOrigin = 'top left'
        konvaContainer.style.position = 'absolute'
      }

      // 重置Stage到默认状态
      stage.scale({ x: 1, y: 1 })
      stage.position({ x: 0, y: 0 })

      // 触发更新事件
      this.stateManage.class.event.trigger('updateSketchRule')
      this.stateManage.class.dom.updateDomPosition()

      if (fn) {
        fn()
      }

      return { scaleX, scaleY, position: newPos, fillScreen: shouldFillScreen }
    } else {
      // 重置konvaContainer的CSS变换，使用Konva内置缩放
      const konvaContainer = document.getElementById('konvaContainer')
      if (konvaContainer) {
        konvaContainer.style.transform = ''
        konvaContainer.style.transformOrigin = ''
        konvaContainer.style.position = ''
        konvaContainer.style.left = ''
        konvaContainer.style.top = ''
      }
    }

    // 过度效果
    const tween = new Konva.Tween({
      node: stage,
      duration: IsAnimate ? 0.25 : 0.001, // 动画过渡时间
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

    // 返回缩放信息
    return { scaleX, scaleY, position: newPos, fillScreen: shouldFillScreen }
  }
  /**
   * 给所有节点添加导入标识
   */
  markAllNodesAsImported() {
    this.state.layers.forEach((layer) => {
      layer.getChildren().forEach((node) => {
        // 排除系统节点
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
   * 清理所有节点的导入标识
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
   * 移除舞台的背景颜色
   */
  removeBackgroundColor() {
    const bgNode = this.state.stage.findOne('.backgroundColor')
    if (bgNode) {
      bgNode.destroy()
    }
  }

  /**
   * 设置舞台的背景颜色
   * @param {string} color - 要设置的背景颜色
   */
  setBackgroundColor(color) {
    // 强制移除所有现有背景颜色节点
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
   * 移除舞台的背景图片
   */
  removeBackgroundImage() {
    const bgImgNode = this.state.stage.findOne('.backgroundImage')
    if (bgImgNode) {
      bgImgNode.destroy()
    }
  }

  /**
   * 设置舞台的背景图片
   * @param {string} url - 背景图片的源 URL
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
            opacity: 0, // 初始透明度设为0
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

          // 添加过渡动画
          const tween = new Konva.Tween({
            node: konvaImage,
            duration: 0.3, // 动画持续时间
            opacity: opacity, // 目标透明度
            easing: Konva.Easings.EaseInOut
          })
          tween.play()
        }
        // 移除事件监听器
        imageObj.onload = null
      }
      imageObj.onload = onLoadHandler
      imageObj.src = url
    }
  }

  /**
   * 使舞台获得焦点
   */
  stageSetFocus() {
    const canvas = document.querySelector('.konvajs-content canvas')
    if (canvas) {
      // 设置 tabindex 使 canvas 可以获得焦点
      canvas.setAttribute('tabindex', '0')
      // 设置 outline 样式避免焦点框
      canvas.style.outline = 'none'
      // 获得焦点
      canvas.focus()
      if (this.state.isEdit) {
        document.querySelector('.h-container').style.top = '20px'
      }
    }
  }

  /**
   * 设置编辑模式或预览模式
   * @param {string} mode - 编辑模式或预览模式
   */
  setStageMode(mode) {
    this.config.mode = mode
    if (mode === 'edit') {
      this.state.isEdit = true
      this.stateManage.class.event.trigger('stageMode', 'edit')
      this.stateManage.class.node.allNodesAllowDrag()
    } else {
      // 清除网格
      this.stateManage.class.grid.removeGridLines()
      // 清除变换框
      this.stateManage.class.transformer.resetTransformer()
      // 禁用拖拽
      this.stateManage.class.node.allNodesDisableDrag()
      this.state.isEdit = false
      this.stateManage.class.event.trigger('stageMode', 'preview')
    }
  }

  /**
   * 获取当前的编辑模式
   * @returns {string} - 当前的编辑模式，'edit' 或 'preview'
   */
  getStageMode() {
    return this.state.isEdit === true ? 'edit' : 'preview'
  }

  /**
   * 获取当前的舞台拖拽状态
   * @returns {boolean} - 舞台当前是否可以拖拽
   */
  getStageDrag() {
    return this.state.stage.draggable()
  }

  /**
   * 启用画布拖动
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
   * 禁用画布拖动
   */
  disableStageDrag() {
    this.state.stage.container().style.cursor = 'default'
    this.state.stage.draggable(false)
    this.stateManage.class.event.trigger('stageDrag', false)
  }

  /**
   * 修改画布的宽度和高度
   * @param {Object} size - 包含新的宽度和高度的对象
   * @param {number} size.width - 新的宽度
   * @param {number} size.height - 新的高度
   */
  setStageSize({ width, height }) {
    // 更新舞台尺寸
    this.state.stage.width(width)
    this.state.stage.height(height)

    // 更新背景颜色节点尺寸
    const bgNode = this.state.stage.findOne('.backgroundColor')
    if (bgNode) {
      bgNode.width(width)
      bgNode.height(height)
    }

    // 更新背景图片节点尺寸
    const bgImgNode = this.state.stage.findOne('.backgroundImage')
    if (bgImgNode) {
      bgImgNode.width(width)
      bgImgNode.height(height)
    }

    // 更新所有节点的位置和尺寸
    this.state.stage.find('*').forEach((node) => {
      if (node.attrs.x + node.width() > width) {
        node.x(Math.max(width - node.width(), 0))
      }
      if (node.attrs.y + node.height() > height) {
        node.y(Math.max(height - node.height(), 0))
      }
    })

    // 重新绘制舞台
    this.state.stage.draw()
    this.stateManage.class.dom.updateDomPosition()
    setTimeout(() => {
      this.stateManage.class.history.addHistory({ title: '修改画布尺寸' })
    }, 500)
  }

  /**
   * 禁用画布缩放
   */
  disableStageZoom() {
    this.zoomEnabled = false
  }

  /**
   * 启用画布缩放
   */
  enableStageZoom() {
    this.zoomEnabled = true
  }

  /**
   * 将图片 URL 转换为 Base64 编码（PNG 格式）
   * 如果输入已经是 Base64 格式，则直接返回
   *
   * @param {string} url 图片的 URL 或 Base64 字符串
   * @returns {Promise<string>} 返回一个 Promise，resolve 时返回图片的 Base64 编码字符串
   */
  convertImgUrlToBase64(url) {
    // 如果已经是 Base64 格式，则直接返回 Promise.resolve(url)
    if (url.startsWith('data:')) {
      return Promise.resolve(url)
    }

    return new Promise((resolve, reject) => {
      const image = new Image()
      // 设置跨域属性（图片服务器需支持 CORS，否则会读取失败）
      image.crossOrigin = 'Anonymous'

      image.onload = () => {
        // 创建 canvas 并设置尺寸为图片实际尺寸
        const canvas = document.createElement('canvas')
        canvas.width = image.naturalWidth
        canvas.height = image.naturalHeight
        const ctx = canvas.getContext('2d')

        // 将图片绘制到 canvas 上
        ctx.drawImage(image, 0, 0)

        try {
          // 将 canvas 转换为 Base64 格式的 PNG 图片
          const base64 = canvas.toDataURL('image/png')
          resolve(base64)
        } catch (error) {
          reject(new Error('转换 Base64 出错：' + error))
        }
      }

      image.onerror = (error) => {
        reject(new Error('加载图片失败：' + error))
      }

      // 触发图片加载
      image.src = url
    })
  }

  setStageScale(scale, animate = false) {
    const stage = this.state.stage
    if (animate) {
      const tween = new Konva.Tween({
        node: stage,
        duration: 0.3, // 动画时长可根据需要调整
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
   * 重置前的完整清理
   */
  cleanupBeforeReset() {
    // 清理 DOM 节点
    const allDomNodesIds = this.state.stage.find('.dom-rect').map((node) => node.attrs.id)
    this.stateManage.class.event.trigger('domClear', allDomNodesIds)

    // 强制清理所有背景节点，确保没有残留
    const bgColorNodes = this.state.stage.find('.backgroundColor')
    const bgImageNodes = this.state.stage.find('.backgroundImage')

    bgColorNodes.forEach((node) => {
      node.destroy()
    })
    bgImageNodes.forEach((node) => {
      node.destroy()
    })

    // 清理完后立即重绘所有图层
    this.state.layers.forEach((layer) => {
      if (layer && layer.draw) {
        layer.draw()
      }
    })

    // 停止观察器和清理事件
    if (this.stateManage.class.dom?.stopObservingDomElements) {
      this.stateManage.class.dom.stopObservingDomElements()
    }
    if (this.stateManage.class.event?.unbindEvents) {
      this.stateManage.class.event.unbindEvents()
    }

    // 清理变换器和状态
    this.stateManage.class.transformer?.resetTransformer([])
    this.stateManage.clearAllObservers()
    this.state.selectedNodes = []
    this.state.clipBoard = []
  }
}