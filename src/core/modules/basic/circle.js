// Circle

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
      title: params.title || 'Circle',
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
    // Create circle
    this.circle = new Konva.Circle({
      radius: props.radius/2,
      fill: props.fill,
      stroke: props.stroke,
      strokeWidth: props.strokeWidth,
      opacity: props.opacity,
      offsetX: -props.radius - props.strokeWidth / 2,
      offsetY: -props.radius - props.strokeWidth / 2
    })

    // Add circle to group
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
    // Transform event
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
   * Set circle width (Also affects height to maintain circle shape)
   * @param {number} width - New width
   */
  setWidth(width) {
    if (!this.circle) return

    const newRadius = width / 2

    // Update circle radius
    this.circle.radius(newRadius)

    // UpdatepropsValue in
    this.attrs.props.radius = newRadius
  }

  /**
   * Set circle height (Also affects width to maintain circle shape)
   * @param {number} height - New height
   */
  setHeight(height) {
    if (!this.circle) return

    const newRadius = height / 2

    // Update circle radius
    this.circle.radius(newRadius)

    // UpdatepropsValue in
    this.attrs.props.radius = newRadius
  }

  /**
   * Get circle size
   * @returns {Object} Containswidthandheightobject
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

// Set class name and register
CustomCircle.prototype.className = 'CustomCircle'
Konva['CustomCircle'] = CustomCircle

export { CustomCircle }
