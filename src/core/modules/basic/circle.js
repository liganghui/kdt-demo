// 圆形

import { v4 as uuidv4 } from 'uuid'

class CustomCircle extends Konva.Group {
  constructor(params, state, stateManage) {
    super({
      x: params.x,
      y: params.y,
      id: params.id || uuidv4().split('-').join(''),
      name: 'circle',
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
      title: params.title || '圆形',
      props: {
        fill: params.props?.fill || '',
        stroke: params.props?.stroke || '#000000',
        strokeWidth: params.props?.strokeWidth !== undefined ? params.props.strokeWidth : 1,
        opacity: params.props?.opacity !== undefined ? params.props.opacity : 1,
        radius: params.props?.radius || 50
      }
    })
    this.state = state || window.kdt.state
    this.stateManage = stateManage || window.kdt.stateManage
    if (!params.id) {
      this.initCircle(params)
      this.registerEvents()
    } else {
      setTimeout(() => {
        this.circle = this.children[0]
        this.registerEvents()
      })
    }
  }

  initCircle(params) {
    const props = this.attrs.props
    // 创建圆形
    this.circle = new Konva.Circle({
      radius: props.radius/2,
      fill: props.fill,
      stroke: props.stroke,
      strokeWidth: props.strokeWidth,
      opacity: props.opacity,
      offsetX: -props.radius - props.strokeWidth / 2,
      offsetY: -props.radius - props.strokeWidth / 2
    })

    // 将圆形添加到组
    this.add(this.circle)

    const layer = params.layer || this.state.layers[2]
    layer.add(this)

    this.stateManage.class.event.trigger('addNode', {
      type: 'canvas',
      name: 'circle',
      node: this
    })
  }

  registerEvents() {
    // 变换事件
  }

  updateParams(newProps) {
    this.attrs.props = { ...this.attrs.props, ...newProps }
    if (newProps.fill !== undefined) {
      this.circle.fill(newProps.fill)
    }
    if (newProps.stroke !== undefined) {
      this.circle.stroke(newProps.stroke)
    }
    if (newProps.strokeWidth !== undefined) {
      this.circle.strokeWidth(newProps.strokeWidth)
    }
    if (newProps.opacity !== undefined) {
      this.circle.opacity(newProps.opacity)
    }
    // if (newProps.radius !== undefined) {
    //   this.circle.radius(newProps.radius)
    // }

    this.stateManage.class.node.forceUpdate()
  }
  /**
   * 设置圆形宽度 (同时会影响高度以保持圆形)
   * @param {number} width - 新的宽度
   */
  setWidth(width) {
    if (!this.circle) return

    const newRadius = width / 2

    // 更新圆形半径
    this.circle.radius(newRadius)

    // 更新props中的值
    this.attrs.props.radius = newRadius
  }

  /**
   * 设置圆形高度 (同时会影响宽度以保持圆形)
   * @param {number} height - 新的高度
   */
  setHeight(height) {
    if (!this.circle) return

    const newRadius = height / 2

    // 更新圆形半径
    this.circle.radius(newRadius)

    // 更新props中的值
    this.attrs.props.radius = newRadius
  }

  /**
   * 获取圆形尺寸
   * @returns {Object} 包含width和height的对象
   */
  getSize() {
    if (!this.circle) {
      return { width: 0, height: 0 }
    }

    const radius = this.circle.radius()

    return {
      width: radius * 2,
      height: radius * 2
    }
  }
}

// 设置类名并注册
CustomCircle.prototype.className = 'CustomCircle'
Konva['CustomCircle'] = CustomCircle

export { CustomCircle }
