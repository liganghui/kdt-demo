// 矩形

import { v4 as uuidv4 } from 'uuid'

class CustomSquare extends Konva.Group {
  constructor(params, state, stateManage) {
    super({
      x: params.x,
      y: params.y,
      id: params.id || uuidv4().split('-').join(''),
      name: 'square',
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
      title: params.title || '矩形',
      props: {
        fill: params.props?.fill || '',
        stroke: params.props?.stroke || '#000000',
        strokeWidth: params.props?.strokeWidth !== undefined ? params.props.strokeWidth : 1,
        cornerRadius: params.props?.cornerRadius || 0,
        opacity: params.props?.opacity !== undefined ? params.props.opacity : 1,
        width: params.props?.width || 100,
        height: params.props?.height || 100
      }
    })
    this.state = state || window.kdt.state
    this.stateManage = stateManage || window.kdt.stateManage
    if (!params.id) {
      this.init(params)
      this.registerEvents()
    } else {
      setTimeout(() => {
        this.rect = this.children[0]
        this.registerEvents()
      })
    }
  }

  init(params) {
    const props = this.attrs.props

    // 创建矩形
    this.rect = new Konva.Rect({
      width: props.width,
      height: props.height,
      fill: props.fill,
      stroke: props.stroke,
      strokeWidth: props.strokeWidth,
      cornerRadius: props.cornerRadius,
      opacity: props.opacity,
      offsetX: 0,
      offsetY: 0
    })

    // 将矩形添加到组
    this.add(this.rect)

    const layer = params.layer || this.state.layers[2]
    layer.add(this)

    this.stateManage.class.event.trigger('addNode', {
      type: 'canvas',
      name: 'rectangle',
      node: this
    })
  }

  registerEvents() {
    this.on('transform', () => {
      const width = Math.abs(this.rect.width() * this.scaleX())
      const height = Math.abs(this.rect.height() * this.scaleY())
      this.scaleX(this.scaleX() < 0 ? -1 : 1)
      this.scaleY(this.scaleY() < 0 ? -1 : 1)
      this.rect.width(width)
      this.rect.height(height)
    })
  }

  updateParams(newProps) {
    this.attrs.props = { ...this.attrs.props, ...newProps }
    if (newProps.fill !== undefined) {
      this.rect.fill(newProps.fill)
    }
    if (newProps.stroke !== undefined) {
      this.rect.stroke(newProps.stroke)
    }
    if (newProps.strokeWidth !== undefined) {
      this.rect.strokeWidth(newProps.strokeWidth)
    }
    if (newProps.cornerRadius !== undefined) {
      this.rect.cornerRadius(newProps.cornerRadius)
    }
    this.stateManage.class.node.forceUpdate()
  }
  /**
   * 设置矩形宽度
   * @param {number} width - 新的宽度
   */
  setWidth(width) {
    if (!this.rect) return
    // 直接设置矩形宽度
    this.rect.width(width)
    // 更新props中的值
    this.attrs.props.width = width
  }

  /**
   * 设置矩形高度
   * @param {number} height - 新的高度
   */
  setHeight(height) {
    if (!this.rect) return
    // 直接设置矩形高度
    this.rect.height(height)
    // 更新props中的值
    this.attrs.props.height = height
  }

  /**
   * 获取矩形尺寸
   * @returns {Object} 包含width和height的对象
   */
  getSize() {
    if (!this.rect) {
      return { width: 0, height: 0 }
    }
    return {
      width: this.rect.width(),
      height: this.rect.height()
    }
  }
}

// 设置类名并注册
CustomSquare.prototype.className = 'CustomSquare'
Konva['CustomSquare'] = CustomSquare

export { CustomSquare }
