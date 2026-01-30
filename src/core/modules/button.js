import { v4 as uuidv4 } from 'uuid'
import { enableTextEditing } from './common'
class CustomButton extends Konva.Group {
  constructor(params, state, stateManage) {
    // 默认参数
    const defaultProps = {
      data: '按钮',
      fontFamily: 'Source Han Sans',
      textColor: '#ffffff',
      fontSize: 18,
      fontWeight: 'normal',
      backgroundColor: '#409EFE',
      backgroundType: 'solid',
      gradientColors: [
        { color: '#409EFE', offset: 0 },
        { color: '#67aef7', offset: 1 }
      ],
      gradientDirection: 'horizontal',
      borderColor: '#ffffff',
      borderWidth: 1,
      borderRadius: 10,
      padding: 10,
      textAlign: 'center',
      singleLine: true,
      disabled: false,
      decimalPlaces: 2
    }
    // 合并传入的参数和默认属性
    const props = { ...defaultProps, ...(params.props || {}) }
    // 调用父类构造函数
    super({
      x: params.x,
      y: params.y,
      title: params.title || '按钮',
      id: params.id || uuidv4().split('-').join(''),
      name: 'button',
      transformable: params.transformable !== undefined ? params.transformable:true,
      offsetX: 0,
      offsetY: 0,
      scaleX: params.scaleX || 1,
      scaleY: params.scaleY || 1,
      skewX:params.skewX||0,
      skewY:params.skewY||0,
      rotation: params.rotation || 0,
      draggable: params.draggable !== undefined ? params.draggable : !(params.transformable === false || params.props?._inGroup === true ||params?.lock === true),
      component: params.component,
      dataSourceConfig: params.dataSourceConfig || {},
      props
    })
    this.state = state || window.kdt.state
    this.stateManage = stateManage || window.kdt.stateManage
    if (!params.id) {
      this.initButton(params)
      this.registerEvents()
    } else {
      setTimeout(() => {
        this.buttonRect = this.children[0]
        this.buttonText = this.children[1]
        enableTextEditing(
          this.buttonText,
          this.buttonRect,
          window.kdt.state,
          window.kdt.stateManage
        )
        this.registerEvents()
      })
    }
  }

  initButton(params) {
    const props = this.attrs.props

    // 创建按钮矩形
    this.buttonRect = new Konva.Rect({
      width: params.width || 120,
      height: params.height || 50,
      offsetX: 0,
      offsetY: 0,
      fill: props.backgroundType === 'gradient' ? null : props.backgroundColor,
      cornerRadius: props.borderRadius,
      stroke: props.borderColor,
      strokeWidth: props.borderWidth
    })

    // 如果是渐变背景，设置渐变属性
    if (props.backgroundType === 'gradient' && props.gradientColors) {
      // 根据 gradientDirection 设置渐变的起始点和终止点
      if (props.gradientDirection === 'vertical') {
        this.buttonRect.fillLinearGradientStartPoint({ x: 0, y: 0 })
        this.buttonRect.fillLinearGradientEndPoint({ x: 0, y: this.buttonRect.height() })
      } else {
        // 默认水平方向
        this.buttonRect.fillLinearGradientStartPoint({ x: 0, y: 0 })
        this.buttonRect.fillLinearGradientEndPoint({ x: this.buttonRect.width(), y: 0 })
      }
      // 构建颜色停靠点数组
      const colorStops = []
      props.gradientColors.forEach(({ offset, color }) => {
        colorStops.push(offset, color)
      })
      this.buttonRect.fillLinearGradientColorStops(colorStops)
    }

    // 创建按钮文本
    this.buttonText = new Konva.Text({
      text: this.getFormattedText(props.data, props.decimalPlaces),
      fontSize: props.fontSize,
      fontFamily: props.fontFamily,
      fill: props.textColor,
      align: props.textAlign,
      fontStyle: props.fontWeight || 'normal',  
      verticalAlign: 'middle',
      padding: props.padding,
      width: this.buttonRect.width(),
      height: this.buttonRect.height()
    })

    // 将矩形和文本添加到组
    this.add(this.buttonRect)
    this.add(this.buttonText)

    // 启用文本编辑
    enableTextEditing(this.buttonText, this.buttonRect, this.state, this.stateManage)
    const layer = params.layer || this.state.layers[2]
    layer.add(this)

    this.stateManage.class.event.trigger('addNode', {
      type: 'canvas',
      name: 'button',
      node: this
    })
  }
  formatNumber(value, decimalPlaces) {
    // 如果 decimalPlaces 为空或 null，不处理
    if (decimalPlaces === null || decimalPlaces === undefined || decimalPlaces === '') {
      return value
    }
    // 检查是否是数字或可以转换为数字
    const numValue = Number(value)
    if (isNaN(numValue)) {
      return value // 如果不是数字，返回原值
    }
    // 格式化为指定小数位
    return numValue.toFixed(parseInt(decimalPlaces))
  }
  getFormattedText(data, decimalPlaces) {
    if (typeof data === 'object') {
      return JSON.stringify(data)
    }
    return this.formatNumber(data, decimalPlaces)
  }
  registerEvents() {
    // 鼠标悬停事件
    this.on('mouseover', () => {
      if (this.attrs.lock || this.attrs.props.disabled) return
      document.body.style.cursor = 'pointer'
      this.buttonRect.opacity(0.9)
    })

    this.on('mouseout', () => {
      if (this.attrs.lock || this.attrs.props.disabled) return
      this.buttonRect.opacity(1)
      document.body.style.cursor = 'default'
    })

    // 变换事件
    this.on('transform', () => {
      const width = Math.abs(this.buttonRect.width() * this.scaleX())
      const height = Math.abs(this.buttonRect.height() * this.scaleY())
      this.scaleX(this.scaleX() < 0 ? -1 : 1)
      this.scaleY(this.scaleY() < 0 ? -1 : 1)
      this.buttonRect.width(width)
      this.buttonRect.height(height)
      this.buttonText.width(width)
      this.buttonText.height(height)
    })

    // 数据更新事件
    window.kdt.on(`dataUpdate.${this.id()}`, (e) => { 
      if (e.id === this.id()) {
        const formattedText = this.getFormattedText(e.data, this.attrs.props.decimalPlaces)
        this.buttonText.text(formattedText)
        this.updateButtonSize()
      }
    })
  }
  // 自定义的 updateParams 方法
  updateParams(newProps) {
    // 更新按钮文本
    if (newProps.data !== undefined ) {
      const formattedText = this.getFormattedText(newProps.data, newProps.decimalPlaces)
      this.buttonText.text(formattedText)
      window.kdt.updateNodeData({ id: this.id(), data: newProps.data, type: 'component' })
    }
    // 合并新的属性
    this.attrs.props = { ...this.attrs.props, ...newProps }
    const props = this.attrs.props

    if (newProps.textColor !== undefined) {
      this.buttonText.fill(newProps.textColor)
    }
    if (newProps.fontSize !== undefined) {
      this.buttonText.fontSize(newProps.fontSize)
    }
    if (newProps.fontWeight !== undefined) {
      this.buttonText.fontStyle(newProps.fontWeight)
    }
    if (newProps.fontFamily !== undefined) {
      this.buttonText.fontFamily(newProps.fontFamily)
    }
    if (newProps.padding !== undefined) {
      this.buttonText.padding(newProps.padding)
    }
    if (newProps.textAlign !== undefined) {
      this.buttonText.align(newProps.textAlign)
    }

    // 更新按钮矩形
    this.buttonRect.fill(null)
    this.buttonRect.clearCache()
    if (props.backgroundType === 'gradient' && props.gradientColors) {
      // 根据 gradientDirection 设置渐变的起始点和终止点
      if (props.gradientDirection === 'vertical') {
        this.buttonRect.fillLinearGradientStartPoint({ x: 0, y: 0 })
        this.buttonRect.fillLinearGradientEndPoint({ x: 0, y: this.buttonRect.height() })
      } else {
        // 默认水平方向
        this.buttonRect.fillLinearGradientStartPoint({ x: 0, y: 0 })
        this.buttonRect.fillLinearGradientEndPoint({ x: this.buttonRect.width(), y: 0 })
      }
      // 构建颜色停靠点数组
      const colorStops = []
      props.gradientColors.forEach(({ offset, color }) => {
        colorStops.push(offset, color)
      })
      this.buttonRect.fillLinearGradientColorStops(colorStops)
    } else {
      this.buttonRect.fill(props.backgroundColor)
    }

    if (newProps.borderColor !== undefined) {
      this.buttonRect.stroke(newProps.borderColor)
    }
    if (newProps.borderWidth !== undefined) {
      this.buttonRect.strokeWidth(newProps.borderWidth)
    }
    if (newProps.borderRadius !== undefined) {
      this.buttonRect.cornerRadius(newProps.borderRadius)
    }
    if (newProps.disabled !== undefined) {
      if (newProps.disabled) {
        this.buttonRect.opacity(0.5) // 禁用时降低透明度
      } else {
        this.buttonRect.opacity(1)
      }
    }
    // 更新尺寸
    this.updateButtonSize()
    this.stateManage.class.node.forceUpdate()
  }

  updateButtonSize() {
    const props = this.attrs.props
    // 构造一个临时文字实例，仅用于测量
    const tempTextConfig = {
      text: this.buttonText.text(),
      fontSize: this.buttonText.fontSize(),
      fontFamily: this.buttonText.fontFamily(),
      padding: this.buttonText.padding()
    }
    if (!props.singleLine) {
      tempTextConfig.width = this.buttonText.width()
    }
    const tempText = new Konva.Text(tempTextConfig)

    const textWidth = tempText.width()
    const textHeight = tempText.height()
    tempText.destroy()

    if (props.singleLine) {
      if (textWidth > this.buttonText.width()) {
        this.buttonText.width(textWidth)
        this.buttonRect.width(textWidth)
      }
    } else {
      if (textHeight > this.buttonText.height()) {
        this.buttonText.height(textHeight)
        this.buttonRect.height(textHeight)
      }
    }

    window.kdt.forceUpdate()
  }
  destroy() {
    window.kdt.off(`dataUpdate.${this.id()}`)
    // 移除文本编辑事件
    if (this.buttonText) {
      const stageEventNamespace = `edit_stage_${this.id()}`
      window.kdt.off(`addNode.${stageEventNamespace}`)
      window.kdt.off(`paste.${stageEventNamespace}`)
      window.kdt.off(`stageMode.${stageEventNamespace}`)
      window.kdt.off(`dragmove.${stageEventNamespace}`)
      window.kdt.off(`wheel.${stageEventNamespace}`)
    }
    // 调用父类的destroy方法
    super.destroy()
  }

  /**
   * 设置按钮宽度
   * @param {number} width - 新的宽度
   */
  setWidth(width) {
    if (!this.buttonRect || !this.buttonText) return

    // 更新矩形和文本宽度
    this.buttonRect.width(width)
    this.buttonText.width(width)

    // 重新计算渐变（如果有）
    if (this.attrs.props.backgroundType === 'gradient') {
      this.buttonRect.fillLinearGradientStartPoint({ x: 0, y: 0 })
      if (this.attrs.props.gradientDirection === 'horizontal') {
        this.buttonRect.fillLinearGradientEndPoint({ x: width, y: 0 })
      } else {
        this.buttonRect.fillLinearGradientEndPoint({ x: 0, y: this.buttonRect.height() })
      }
    }

    // 更新props中的值
    this.attrs.props.width = width
  }

  /**
   * 设置按钮高度
   * @param {number} height - 新的高度
   */
  setHeight(height) {
    if (!this.buttonRect || !this.buttonText) return

    // 更新矩形和文本高度
    this.buttonRect.height(height)
    this.buttonText.height(height)

    // 重新计算渐变（如果有）
    if (this.attrs.props.backgroundType === 'gradient') {
      this.buttonRect.fillLinearGradientStartPoint({ x: 0, y: 0 })
      if (this.attrs.props.gradientDirection === 'vertical') {
        this.buttonRect.fillLinearGradientEndPoint({ x: 0, y: height })
      } else {
        this.buttonRect.fillLinearGradientEndPoint({ x: this.buttonRect.width(), y: 0 })
      }
    }

    // 更新props中的值
    this.attrs.props.height = height
  }

  /**
   * 获取按钮尺寸
   * @returns {Object} 包含width和height的对象
   */
  getSize() {
    if (!this.buttonRect) {
      return { width: 0, height: 0 }
    }
    return {
      width: this.buttonRect.width(),
      height: this.buttonRect.height()
    }
  }
}

// 设置类名并注册
CustomButton.prototype.className = 'kdtButton'
Konva['kdtButton'] = CustomButton

// 导出自定义按钮类
export { CustomButton }
