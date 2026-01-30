import { v4 as uuidv4 } from 'uuid'
import { enableTextEditing } from './common'

class CustomText extends Konva.Label {
  constructor(params, state, stateManage) {
    // 定义文本的默认参数
    const defaultProps = {
      data: '',
      fontSize: 18,
      fontFamily: 'Source Han Sans',
      fill: '#000',
      textAlign: 'center',
      verticalAlign: 'middle',
      padding: 0,
      borderColor: '#000',
      borderSize: 0,
      cornerRadius: 5,
      borderStyle: 'solid',
      fontWeight: 'normal',
      letterSpacing: 0,
      lineHeight: 1,
      backgroundColor: '',
      singleLine: false,
      // 超链接的属性
      hyperlinkEnabled: false,
      hyperlinkUrl: '',
      hyperlinkTarget: '_self', // 或 '_blank'
      decimalPlaces: null
    }
    // 合并传入的参数和默认参数
    const props = { ...defaultProps, ...(params.props || {}) }
    // 调用父类构造函数
    super({
      title: params.title || '文本',
      x: params.x,
      y: params.y,
      id: params.id || uuidv4().split('-').join(''),
      name: 'text',
      transformable: params.transformable !== undefined ? params.transformable : true,
      offsetX: 0,
      offsetY: 0,
      scaleX: params.scaleX || 1,
      scaleY: params.scaleY || 1,
      skewX: params.skewX || 0,
      skewX: params.skewY || 0,
      rotation: params.rotation || 0,
      draggable:
        params.draggable !== undefined
          ? params.draggable
          : !(
              params.transformable === false ||
              params.props?._inGroup === true ||
              params.props?.lock === true
            ),
      props: props,
      dataSourceConfig: params.dataSourceConfig || {},
      component: params.component
    })

    this.state = state || window.kdt.state
    this.stateManage = stateManage || window.kdt.stateManage
    this.isEditing = false // 初始化编辑状态
    if (!params.id) {
      // 初始化文本节点
      this.initText(params)
      // 初始化文本事件
      this.registerEvents()
    } else {
      setTimeout(() => {
        this.tag = this.children[0]
        this.textNode = this.children[1]
        enableTextEditing(this.textNode, this.tag, this.state, this.stateManage, this)
        this.registerEvents()
      })
    }
  }

  initText(params) {
    const props = this.attrs.props
    // 创建标签背景
    this.tag = new Konva.Tag({
      fill: props.backgroundColor,
      stroke: props.borderColor,
      strokeWidth: props.borderSize,
      lineJoin: 'round',
      cornerRadius: props.cornerRadius,
      dash: props.borderStyle === 'dashed' ? [10, 5] : props.borderStyle === 'dotted' ? [2, 2] : []
    })

    // 创建文本节点
    this.textNode = new Konva.Text({
      text: this.getFormattedText(
        typeof props.data === 'object' ? JSON.stringify(props.data) : props.data,
        props.decimalPlaces
      ),
      fontSize: props.fontSize,
      fontFamily: props.fontFamily,
      fontStyle: props.fontWeight,
      letterSpacing: props.letterSpacing,
      lineHeight: props.lineHeight,
      fill: props.fill,
      align: props.textAlign,
      verticalAlign: props.verticalAlign,
      padding: props.padding,
      width: params.width,
      height: params.height
    })

    // 将标签和文本添加到标签组
    this.add(this.tag)
    this.add(this.textNode)
    const layer = params.layer || this.state.layers[2]
    layer.add(this)
    this.stateManage.class.event.trigger('addNode', {
      type: 'canvas',
      name: 'text',
      node: this
    })

    // 如果有宽高 说明尺寸已经预先计算好了
    const hasPreCalculatedSize =
      params.width && params.height && params.width > 0 && params.height > 0
    if (!hasPreCalculatedSize) {
      setTimeout(() => {
        this.updateTextSize()
      })
    } else {
      // 如果有预计算的尺寸，直接应用到标签上
      this.tag.width(params.width)
      this.tag.height(params.height)
    }
    // 启用文本编辑
    enableTextEditing(this.textNode, this.tag, this.state, this.stateManage, this)
  }
  getFormattedText(data, decimalPlaces) {
    if (typeof data === 'object') {
      return JSON.stringify(data)
    }
    return this.formatNumber(data, decimalPlaces)
  }

  registerEvents() {
    // 变换事件
    this.on('transform', () => {
      const width = Math.abs(this.width() * this.scaleX())
      const height = Math.abs(this.height() * this.scaleY())
      this.scaleX(this.scaleX() < 0 ? -1 : 1)
      this.scaleY(this.scaleY() < 0 ? -1 : 1)
      this.tag.width(width)
      this.tag.height(height)
      this.textNode.width(width)
      this.textNode.height(height)
    })

    // 数据更新事件
    window.kdt.on(`dataUpdate.${this.id()}`, (e) => {
      if (e.id === this.id()) {
        const formattedText = this.getFormattedText(e.data, this.attrs.props.decimalPlaces)
        this.textNode.text(formattedText)
        this.updateTextSize()
      }
    })

    // 点击事件，用于处理超链接
    this.on('click', (e) => {
      if (this.state.isEdit && !this.attrs.lock) {
        return
      }
      const props = this.attrs.props
      if (props.hyperlinkEnabled && !this.isEditing) {
        const url = props.hyperlinkUrl
        const hyperlinkTarget = props.hyperlinkTarget
        const target = props.hyperlinkTarget || '_self'
        if (url) {
          window.open(url, target)
          if(hyperlinkTarget == '_self'){
            location.reload(true)
          }
        }
      }
    })

    // 监听文本编辑状态的变化
    this.textNode.on('editing', (isEditing) => {
      this.isEditing = isEditing
    })
  }
  formatNumber(value, decimalPlaces) {
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
  // 自定义的 updateParams 方法
  updateParams(newProps) {
    // 合并新的属性
    // 更新文本节点
    if (newProps.data !== undefined && newProps.data !== this.attrs.props.data) {
      this.textNode.text(
        typeof newProps.data === 'object' ? JSON.stringify(newProps.data) : newProps.data
      )
      window.kdt.updateNodeData({ id: this.id(), data: newProps.data, type: 'component' })
    }
    // 如果小数位设置发生变化，重新格式化文本
    if (
      newProps.decimalPlaces !== undefined &&
      newProps.decimalPlaces !== this.attrs.props.decimalPlaces
    ) {
      const currentData = this.attrs.props.data
      const formattedText = this.getFormattedText(currentData, newProps.decimalPlaces)
      this.textNode.text(formattedText)
    }
    this.attrs.props = { ...this.attrs.props, ...newProps }
    const props = this.attrs.props

    if (newProps.fontFamily !== undefined) {
      this.textNode.fontFamily(newProps.fontFamily)
    }
    if (newProps.fill !== undefined) {
      this.textNode.fill(newProps.fill)
    }
    if (newProps.fontSize !== undefined) {
      this.textNode.fontSize(newProps.fontSize)
    }
    if (newProps.fontWeight !== undefined) {
      this.textNode.fontStyle(newProps.fontWeight)
    }
    if (newProps.padding !== undefined) {
      this.textNode.padding(newProps.padding)
    }
    if (newProps.textAlign !== undefined) {
      this.textNode.align(newProps.textAlign)
    }
    if (newProps.verticalAlign !== undefined) {
      this.textNode.verticalAlign(newProps.verticalAlign)
    }
    if (newProps.letterSpacing !== undefined) {
      this.textNode.letterSpacing(newProps.letterSpacing)
    }
    if (newProps.lineHeight !== undefined) {
      this.textNode.lineHeight(newProps.lineHeight)
    }

    // 更新标签背景
    if (newProps.backgroundColor !== undefined) {
      this.tag.fill(newProps.backgroundColor)
    }
    if (newProps.borderSize !== undefined) {
      this.tag.strokeWidth(newProps.borderSize)
    }
    if (newProps.borderColor !== undefined) {
      this.tag.stroke(newProps.borderColor)
    }
    if (newProps.borderStyle !== undefined) {
      if (newProps.borderStyle === 'dashed') {
        this.tag.dash([10, 5])
      } else if (newProps.borderStyle === 'dotted') {
        this.tag.dash([2, 2])
      } else {
        this.tag.dash([])
      }
    }

    // 更新超链接属性
    if (newProps.hyperlinkEnabled !== undefined) {
      props.hyperlinkEnabled = newProps.hyperlinkEnabled
    }
    if (newProps.hyperlinkUrl !== undefined) {
      props.hyperlinkUrl = newProps.hyperlinkUrl
    }
    if (newProps.hyperlinkTarget !== undefined) {
      props.hyperlinkTarget = newProps.hyperlinkTarget
    }

    // 更新尺寸
    this.updateTextSize()

    // 重绘层
    this.getLayer().draw()
  }

  updateTextSize() {
    const props = this.attrs.props
    if (props.singleLine) {
      const tempText = new Konva.Text({
        text: this.textNode.text(),
        fontSize: this.textNode.fontSize(),
        fontFamily: this.textNode.fontFamily(),
        padding: this.textNode.padding()
      })
      const layer = this.textNode.getLayer()
      layer.add(tempText)
      const textWidth = tempText.width()
      const textHeight = tempText.height()
      tempText.destroy()
      if (textWidth > this.textNode.width()) {
        this.textNode.width(textWidth)
        this.tag.width(textWidth)
      }
      //去掉高度限制
      // if (textHeight > this.textNode.height()) {
      //   this.textNode.height(textHeight)
      //   this.tag.height(textHeight)
      // }
    } else {
      // 原有的多行逻辑保持不变
      const tempText = new Konva.Text({
        text: this.textNode.text(),
        fontSize: this.textNode.fontSize(),
        fontFamily: this.textNode.fontFamily(),
        width: this.textNode.width(),
        padding: this.textNode.padding()
      })
      const layer = this.textNode.getLayer()
      layer.add(tempText)
      const textHeight = tempText.height()
      tempText.destroy()
      //去掉高度限制
      // if (textHeight > this.textNode.height()) {
      //   this.textNode.height(textHeight)
      //   this.tag.height(textHeight)
      // }
    }

    this.stateManage.class.node.forceUpdate()
  }
  // 设置宽度
  setWidth(width) {
    // 更新文本和标签的宽度
    this.textNode.width(width)
    this.tag.width(width)
  }

  // 设置高度
  setHeight(height) {
    // 更新文本和标签的高度
    this.textNode.height(height)
    this.tag.height(height)
  }
  destroy() {
    // 移除文本编辑事件
    if (this.textNode) {
      const stageEventNamespace = `edit_stage_${this.id()}`
      window.kdt.off(`addNode.${stageEventNamespace}`)
      window.kdt.off(`paste.${stageEventNamespace}`)
      window.kdt.off(`stageMode.${stageEventNamespace}`)
      window.kdt.off(`dragmove.${stageEventNamespace}`)
      window.kdt.off(`wheel.${stageEventNamespace}`)
    }
    window.kdt.off(`dataUpdate.${this.id()}`)
    super.destroy()
  }
}

// 设置类名并注册
CustomText.prototype.className = 'kdtText'
Konva['kdtText'] = CustomText

// 导出自定义文本类
export { CustomText }
