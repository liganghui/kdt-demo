// 导入必要的模块

import { v4 as uuidv4 } from 'uuid'

class CustomSwitch extends Konva.Group {
  constructor(params, state, stateManage) {
    // 默认参数
    const defaultProps = {
      disabled: false,
      readonly: false,
      onPath: '',
      offPath: '',
      data: true
    }
    // 合并传入的参数和默认属性
    const props = { ...defaultProps, ...(params.props || {}) }
    // 调用父类构造函数
    super({
      x: params.x,
      y: params.y,
      id: params.id || uuidv4().split('-').join(''),
      title: params.title || '开关',
      name: 'switch',
      transformable: params.transformable !== undefined ? params.transformable:true,
      offsetX: 0,
      offsetY: 0,
      scaleX: params.scaleX || 1,
      scaleY: params.scaleY || 1,
      rotation: params.rotation || 0,
      draggable: params.draggable !== undefined ? params.draggable : !(params.transformable === false || params.props?._inGroup === true ||params?.lock === true),
      props: props,
      offsetX: 0,
      offsetY: 0,
      skewX:params.skewX||0,
      skewY:params.skewY||0,
      dataSourceConfig: params.dataSourceConfig || {},
      component: params.component
    })

    this.state = state || window.kdt.state
    this.stateManage = stateManage || window.kdt.stateManage
    if (!params.id) {
      // 初始化开关
      this.initSwitch(params)
    } else {
      setTimeout(() => {
        this.onImage = this.children[0]
        this.offImage = this.children[1]
        // 加载图片
        this.loadSwitchImages()
        // 注册事件
        this.registerEvents()
      })
    }
  }

  initSwitch(params) {
    const props = this.attrs.props
    // 创建开启和关闭的图片节点
    this.onImage = new Konva.Image({
      x: 0,
      y: 0,
      width: params.width || 100,
      height: params.height || 100,
      visible: true,  
      offsetX: 0,
      offsetY: 0,
      name: 'onImage'
    })

    this.offImage = new Konva.Image({
      x: 0,
      y: 0,
      width: params.width || 100,
      height: params.height || 100,
      visible: false, 
      offsetX: 0,
      offsetY: 0,
      name: 'offImage'
    })
    // 根据初始data值设置正确的可见状态
    this.updateVisibilityByData(props.data)
    this.add(this.onImage)
    this.add(this.offImage)
    // 添加到层
    const layer = params.layer || this.state.layers[2]
    layer.add(this)
    // 加载图片
    this.loadSwitchImages()
    // 注册事件
    this.registerEvents()
    // 触发添加节点事件
    this.stateManage.class.event.trigger('addNode', {
      type: 'canvas',
      name: 'switch',
      node: this
    })
  }
  /**
   * 根据data值更新图片可见性
   * @param {*} data - 开关状态数据
   */
  updateVisibilityByData(data) {
    if (!this.onImage || !this.offImage) return

    if (data === true || parseFloat(data) === 1 || data === '1') {
      this.onImage.visible(true)
      this.offImage.visible(false)
    } else if (data === false || parseFloat(data) === 0 || data === '0') {
      this.onImage.visible(false)
      this.offImage.visible(true)
    }
  }
  loadSwitchImages() {
    const props = this.attrs.props

    const image1 = new Image()
    const image2 = new Image()

    image1.onload = () => {
      this.onImage.image(image1)
      this.stateManage.class.node.forceUpdate()
    }
    image2.onload = () => {
      this.offImage.image(image2)
      this.stateManage.class.node.forceUpdate()
    }

    image1.onerror = () => {
      console.error('开启图片加载失败:', props.onPath)
    }
    image2.onerror = () => {
      console.error('关闭图片加载失败:', props.offPath)
    }

    image1.src = props.onPath
    image2.src = props.offPath
  }

  registerEvents() {
    // 点击事件
    this.on('click', () => {
      // 编辑模式下不处理
      if (this.state.isEdit || this.attrs.props.disabled || this.attrs.props.readonly) {
        return
      }
      this.onImage.visible(!this.onImage.visible())
      this.offImage.visible(!this.offImage.visible())
      let updateVal
      if (this.attrs.props.data === '1' || this.attrs.props.data === 1) {
        updateVal = 0
      } else if (this.attrs.props.data === 0 || this.attrs.props.data === '0') {
        updateVal = 1
      } else if (this.attrs.props.data == true) {
        updateVal = false
      } else {
        updateVal = true
      }
      window.kdt.updateNodeData({
        id: this.id(),
        data: updateVal,
        type: 'component'
      })
    })

    // 数据更新事件
    window.kdt.on(`dataUpdate.${this.id()}`, (e) => {
      if (e.id === this.id()) {
        if (e.data === true || parseFloat(e.data) === 1) {
          this.onImage.visible(true)
          this.offImage.visible(false)
        } else if (e.data === false || parseFloat(e.data) === 0) {
          this.onImage.visible(false)
          this.offImage.visible(true)
        }
      }
    })
  }

  updateParams(newProps) {
    console.log('updateParams', newProps) 
    // 合并新的属性
    this.attrs.props = { ...this.attrs.props, ...newProps }
    if (newProps.disabled !== undefined) {
      if (newProps.disabled) {
        // 禁用时，降低开关的透明度，禁用点击事件
        this.onImage.opacity(0.5)
        this.offImage.opacity(0.5)
      } else {
        // 启用时恢复透明度
        this.onImage.opacity(1)
        this.offImage.opacity(1)
      }
    }
    this.loadSwitchImages()
    this.stateManage.class.node.forceUpdate()
  }
  /**
   * 设置开关宽度
   * @param {number} width - 新的宽度
   */
  setWidth(width) {
    if (!this.onImage || !this.offImage) return

    // 更新开启状态图像的宽度
    this.onImage.width(width)

    // 更新关闭状态图像的宽度
    this.offImage.width(width)
  }

  /**
   * 设置开关高度
   * @param {number} height - 新的高度
   */
  setHeight(height) {
    if (!this.onImage || !this.offImage) return

    // 更新开启状态图像的高度
    this.onImage.height(height)

    // 更新关闭状态图像的高度
    this.offImage.height(height)
  }

  /**
   * 获取开关尺寸
   * @returns {Object} 包含width和height的对象
   */
  getSize() {
    // 由于onImage和offImage的尺寸相同，使用可见的那个进行尺寸获取
    const visibleImage = this.onImage.visible() ? this.onImage : this.offImage

    if (!visibleImage) {
      return { width: 0, height: 0 }
    }

    return {
      width: visibleImage.width(),
      height: visibleImage.height()
    }
  }
  destroy() {
    window.kdt.off(`dataUpdate.${this.id()}`)
    super.destroy()
  }
}

// 设置类名并注册
CustomSwitch.prototype.className = 'kdtSwitch'
Konva['kdtSwitch'] = CustomSwitch

// 导出自定义开关类
export { CustomSwitch }
