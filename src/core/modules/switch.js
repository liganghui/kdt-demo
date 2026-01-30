// Import necessary modules

import { v4 as uuidv4 } from 'uuid'

class CustomSwitch extends Konva.Group {
  constructor(params, state, stateManage) {
    // Default parameters
    const defaultProps = {
      disabled: false,
      readonly: false,
      onPath: '',
      offPath: '',
      data: true
    }
    // Merge incoming parameters and default properties
    const props = { ...defaultProps, ...(params.props || {}) }
    // Call the parent class constructor
    super({
      x: params.x,
      y: params.y,
      id: params.id || uuidv4().split('-').join(''),
      title: params.title || 'Switch',
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
      // Initialize the switch
      this.initSwitch(params)
    } else {
      setTimeout(() => {
        this.onImage = this.children[0]
        this.offImage = this.children[1]
        // Load images
        this.loadSwitchImages()
        // Register events
        this.registerEvents()
      })
    }
  }

  initSwitch(params) {
    const props = this.attrs.props
    // Create image nodes for on and off states
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
    // Set the correct visibility state based on the initialdataSet the correct visibility state based on the initial data value
    this.updateVisibilityByData(props.data)
    this.add(this.onImage)
    this.add(this.offImage)
    // Add to layer
    const layer = params.layer || this.state.layers[2]
    layer.add(this)
    // Load images
    this.loadSwitchImages()
    // Register events
    this.registerEvents()
    // Trigger the node addition event
    this.stateManage.class.event.trigger('addNode', {
      type: 'canvas',
      name: 'switch',
      node: this
    })
  }
  /**
   * Update image visibility according todataUpdate image visibility according to data value
   * @param {*} data - Switch state data
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
      console.error('image failed to load when turned on:', props.onPath)
    }
    image2.onerror = () => {
      console.error('image failed to load when turned off:', props.offPath)
    }

    image1.src = props.onPath
    image2.src = props.offPath
  }

  registerEvents() {
    // Click event
    this.on('click', () => {
      // Do not handle in edit mode
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

    // Data update event
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
    // Merge new properties
    this.attrs.props = { ...this.attrs.props, ...newProps }
    if (newProps.disabled !== undefined) {
      if (newProps.disabled) {
        // When disabled，Reduce the opacity of the switch，Disable click events
        this.onImage.opacity(0.5)
        this.offImage.opacity(0.5)
      } else {
        // Restore opacity when enabled
        this.onImage.opacity(1)
        this.offImage.opacity(1)
      }
    }
    this.loadSwitchImages()
    this.stateManage.class.node.forceUpdate()
  }
  /**
   * Set switch width
   * @param {number} width - New width
   */
  setWidth(width) {
    if (!this.onImage || !this.offImage) return

    // Update the width of the on-state image
    this.onImage.width(width)

    // Update the width of the off-state image
    this.offImage.width(width)
  }

  /**
   * Set switch height
   * @param {number} height - New height
   */
  setHeight(height) {
    if (!this.onImage || !this.offImage) return

    // Update the height of the on-state image
    this.onImage.height(height)

    // Update the height of the off-state image
    this.offImage.height(height)
  }

  /**
   * Get switch size
   * @returns {Object} Object containingwidthandheightobject
   */
  getSize() {
    // SinceonImageandoffImagehave the same size，use the visible one to get the size
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

// Set class name and register
CustomSwitch.prototype.className = 'kdtSwitch'
Konva['kdtSwitch'] = CustomSwitch

// Export custom switch class
export { CustomSwitch }
