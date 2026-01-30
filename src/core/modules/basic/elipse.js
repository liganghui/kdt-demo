//  椭圆组件

import { v4 as uuidv4 } from 'uuid'

class CustomEllipse extends Konva.Group {
  constructor(params, state, stateManage) {
    super({
      x: params.x,
      y: params.y,
      id: params.id || uuidv4().split('-').join(''),
      name: 'ellipse',
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
      title: params.title || '椭圆',
      props: {
        fill: params.props?.fill || '',
        stroke: params.props?.stroke || '#000000',
        strokeWidth: params.props?.strokeWidth !== undefined ? params.props.strokeWidth : 1,
        opacity: params.props?.opacity !== undefined ? params.props.opacity : 1,
        radiusX: params.props?.radiusX || 50,
        radiusY: params.props?.radiusY || 25
      }
    })
    this.state = state || window.kdt.state
    this.stateManage = stateManage || window.kdt.stateManage
    if (!params.id) {
      this.initEllipse(params)
      this.registerEvents()
    } else {
      setTimeout(() => {
        this.ellipse = this.children[0]
        this.registerEvents()
      })
    }
  }

  initEllipse(params) {
    const props = this.attrs.props

    // 创建椭圆
    this.ellipse = new Konva.Ellipse({
      radiusX: props.radiusX,
      radiusY: props.radiusY,
      fill: props.fill,
      stroke: props.stroke,
      strokeWidth: props.strokeWidth,
      opacity: props.opacity,
      offsetX: 0,
      offsetY: 0
    })

    // 将椭圆添加到组
    this.add(this.ellipse)

    const layer = params.layer || this.state.layers[2]
    layer.add(this)

    this.stateManage.class.event.trigger('addNode', {
      type: 'canvas',
      name: 'ellipse',
      node: this
    })
  }

  registerEvents() {}

  updateParams(newProps) {
    this.attrs.props = { ...this.attrs.props, ...newProps }
    const props = this.attrs.props

    if (newProps.fill !== undefined) {
      this.ellipse.fill(newProps.fill)
    }
    if (newProps.stroke !== undefined) {
      this.ellipse.stroke(newProps.stroke)
    }
    if (newProps.strokeWidth !== undefined) {
      this.ellipse.strokeWidth(newProps.strokeWidth)
    }
    if (newProps.opacity !== undefined) {
      this.ellipse.opacity(newProps.opacity)
    }
    // if (newProps.radiusX !== undefined) {
    //   this.ellipse.radiusX(newProps.radiusX)
    // }
    // if (newProps.radiusY !== undefined) {
    //   this.ellipse.radiusY(newProps.radiusY)
    // }
    this.stateManage.class.node.forceUpdate()
  }
  /**
   * 设置椭圆宽度
   * @param {number} width - 新的宽度
   */
  setWidth(width) {
    if (!this.ellipse) return

    const newRadiusX = width / 2

    // 更新椭圆X半径
    this.ellipse.radiusX(newRadiusX)

    // 更新props中的值
    this.attrs.props.radiusX = newRadiusX
  }

  /**
   * 设置椭圆高度
   * @param {number} height - 新的高度
   */
  setHeight(height) {
    if (!this.ellipse) return

    const newRadiusY = height / 2

    // 更新椭圆Y半径
    this.ellipse.radiusY(newRadiusY)

    // 更新props中的值
    this.attrs.props.radiusY = newRadiusY
  }

  /**
   * 获取椭圆尺寸
   * @returns {Object} 包含width和height的对象
   */
  getSize() {
    if (!this.ellipse) {
      return { width: 0, height: 0 }
    }

    return {
      width: this.ellipse.radiusX() * 2,
      height: this.ellipse.radiusY() * 2
    }
  }
}

// 设置类名并注册
CustomEllipse.prototype.className = 'CustomEllipse'
Konva['CustomEllipse'] = CustomEllipse

export { CustomEllipse }
