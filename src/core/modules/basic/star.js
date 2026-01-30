// 星型
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
      title: params.title || '星形',
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

    // 创建星形
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

    // 将星形添加到组
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
   * 设置星形宽度
   * @param {number} width - 新的宽度
   */
  setWidth(width) {
    if (!this.star) return

    const innerRadius = this.star.innerRadius()
    const outerRadius = this.star.outerRadius()
    const ratio = innerRadius / outerRadius // 保持内外半径比例

    // 根据宽度计算新的外半径
    const newOuterRadius = width / 2

    // 保持内外半径比例
    const newInnerRadius = newOuterRadius * ratio

    // 更新星形参数
    this.star.outerRadius(newOuterRadius)
    this.star.innerRadius(newInnerRadius)

    // 更新props中的值
    this.attrs.props.outerRadius = newOuterRadius
    this.attrs.props.innerRadius = newInnerRadius
  }

  /**
   * 设置星形高度
   * @param {number} height - 新的高度
   */
  setHeight(height) {
    if (!this.star) return

    const innerRadius = this.star.innerRadius()
    const outerRadius = this.star.outerRadius()
    const ratio = innerRadius / outerRadius // 保持内外半径比例

    // 根据高度计算新的外半径
    const newOuterRadius = height / 2

    // 保持内外半径比例
    const newInnerRadius = newOuterRadius * ratio

    // 更新星形参数
    this.star.outerRadius(newOuterRadius)
    this.star.innerRadius(newInnerRadius)

    // 更新props中的值
    this.attrs.props.outerRadius = newOuterRadius
    this.attrs.props.innerRadius = newInnerRadius
  }

  /**
   * 获取星形尺寸
   * @returns {Object} 包含width和height的对象
   */
  getSize() {
    if (!this.star) {
      return { width: 0, height: 0 }
    }

    const outerRadius = this.star.outerRadius()

    // 星形的宽度和高度由外半径决定
    return {
      width: outerRadius * 2,
      height: outerRadius * 2
    }
  }
}

// 设置类名并注册
CustomStar.prototype.className = 'CustomStar'
Konva['CustomStar'] = CustomStar

export { CustomStar }
