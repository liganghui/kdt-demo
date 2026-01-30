// Star
import { v4 as uuidv4 } from 'uuid'
class CustomStar extends Konva.Group {
  constructor(params, state, stateManage) {
    super({
      x: params.x || 0,
      y: params.y || 0,
      id: params.id || uuidv4().split('-').join(''),
      name: 'star',
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
      title: params.title || 'Star Shape',
      props: {
        fill: params.props?.fill || '',
        stroke: params.props?.stroke || '#000000',
        strokeWidth: params.props?.strokeWidth !== undefined ? params.props.strokeWidth : 1,
        opacity: params.props?.opacity !== undefined ? params.props.opacity : 1,
        innerRadius: params.props?.innerRadius || 20,
        outerRadius: params.props?.outerRadius || 40,
        numPoints: params.props?.numPoints || 5
      }
    })
    this.state = state || window.kdt.state
    this.stateManage = stateManage || window.kdt.stateManage
    if (!params.id) {
      this.initStar(params)
      this.registerEvents()
    } else {
      setTimeout(() => {
        this.star = this.children[0]
        this.registerEvents()
      })
    }
  }

  initStar(params) {
    const props = this.attrs.props

    // Create Star
    this.star = new Konva.Star({
      innerRadius: props.innerRadius,
      outerRadius: props.outerRadius,
      numPoints: props.numPoints,
      fill: props.fill,
      stroke: props.stroke,
      strokeWidth: props.strokeWidth,
      opacity: props.opacity,
      offsetX: 0,
      offsetY: 0
    })

    // Add Star to Group
    this.add(this.star)

    const layer = params.layer || this.state.layers[2]
    layer.add(this)

    this.stateManage.class.event.trigger('addNode', {
      type: 'canvas',
      name: 'star',
      node: this
    })
  }

  registerEvents() {}

  updateParams(newProps) {
    this.attrs.props = { ...this.attrs.props, ...newProps }
    const props = this.attrs.props

    if (newProps.fill !== undefined) {
      this.star.fill(newProps.fill)
    }
    if (newProps.stroke !== undefined) {
      this.star.stroke(newProps.stroke)
    }
    if (newProps.strokeWidth !== undefined) {
      this.star.strokeWidth(newProps.strokeWidth)
    }
    if (newProps.opacity !== undefined) {
      this.star.opacity(newProps.opacity)
    }
    if (newProps.innerRadius !== undefined) {
      this.star.innerRadius(newProps.innerRadius)
    }
    // if (newProps.outerRadius !== undefined) {
    //   this.star.outerRadius(newProps.outerRadius)
    // }
    if (newProps.numPoints !== undefined) {
      this.star.numPoints(newProps.numPoints)
    }
    this.stateManage.class.node.forceUpdate()
  }
  /**
   * Set Star Width
   * @param {number} width - New Width
   */
  setWidth(width) {
    if (!this.star) return

    const innerRadius = this.star.innerRadius()
    const outerRadius = this.star.outerRadius()
    const ratio = innerRadius / outerRadius // Maintain the Ratio of Inner and Outer Radii

    // Calculate New Outer Radius Based on Width
    const newOuterRadius = width / 2

    // Maintain the Ratio of Inner and Outer Radii
    const newInnerRadius = newOuterRadius * ratio

    // Update Star Parameters
    this.star.outerRadius(newOuterRadius)
    this.star.innerRadius(newInnerRadius)

    // UpdatepropsValues in
    this.attrs.props.outerRadius = newOuterRadius
    this.attrs.props.innerRadius = newInnerRadius
  }

  /**
   * Set Star Height
   * @param {number} height - New Height
   */
  setHeight(height) {
    if (!this.star) return

    const innerRadius = this.star.innerRadius()
    const outerRadius = this.star.outerRadius()
    const ratio = innerRadius / outerRadius // Maintain the Ratio of Inner and Outer Radii

    // Calculate New Outer Radius Based on Height
    const newOuterRadius = height / 2

    // Maintain the Ratio of Inner and Outer Radii
    const newInnerRadius = newOuterRadius * ratio

    // Update Star Parameters
    this.star.outerRadius(newOuterRadius)
    this.star.innerRadius(newInnerRadius)

    // UpdatepropsValues in
    this.attrs.props.outerRadius = newOuterRadius
    this.attrs.props.innerRadius = newInnerRadius
  }

  /**
   * Get Star Size
   * @returns {Object} ContainswidthAndheightObject
   */
  getSize() {
    if (!this.star) {
      return { width: 0, height: 0 }
    }

    const outerRadius = this.star.outerRadius()

    // The Width and Height of the Star are Determined by the Outer Radius
    return {
      width: outerRadius * 2,
      height: outerRadius * 2
    }
  }
}

// Set Class Name and Register
CustomStar.prototype.className = 'CustomStar'
Konva['CustomStar'] = CustomStar

export { CustomStar }
