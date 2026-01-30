import { v4 as uuidv4 } from 'uuid'
import { enableTextEditing } from './common'
class CustomButton extends Konva.Group {
  constructor(params, state, stateManage) {
    // Default Parameters
    const defaultProps = {
      data: 'button',
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
    // Merge Incoming Parameters and Default Properties
    const props = { ...defaultProps, ...(params.props || {}) }
    // Call Parent Class Constructor
    super({
      x: params.x,
      y: params.y,
      title: params.title || 'button',
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

    // Create Button Rectangle
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

    // If it is a Gradient Background，Set Gradient Properties
    if (props.backgroundType === 'gradient' && props.gradientColors) {
      // According to gradientDirection Set Start and End Points of Gradient
      if (props.gradientDirection === 'vertical') {
        this.buttonRect.fillLinearGradientStartPoint({ x: 0, y: 0 })
        this.buttonRect.fillLinearGradientEndPoint({ x: 0, y: this.buttonRect.height() })
      } else {
        // Default Horizontal Direction
        this.buttonRect.fillLinearGradientStartPoint({ x: 0, y: 0 })
        this.buttonRect.fillLinearGradientEndPoint({ x: this.buttonRect.width(), y: 0 })
      }
      // Build Color Stop Array
      const colorStops = []
      props.gradientColors.forEach(({ offset, color }) => {
        colorStops.push(offset, color)
      })
      this.buttonRect.fillLinearGradientColorStops(colorStops)
    }

    // Create Button Text
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

    // Add Rectangle and Text to Group
    this.add(this.buttonRect)
    this.add(this.buttonText)

    // Enable Text Editing
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
    // If decimalPlaces Is Empty or null，Do Not Process
    if (decimalPlaces === null || decimalPlaces === undefined || decimalPlaces === '') {
      return value
    }
    // Check if It Is a Number or Can Be Converted to a Number
    const numValue = Number(value)
    if (isNaN(numValue)) {
      return value // If It Is Not a Number，Return Original Value
    }
    // Format to Specified Decimal Places
    return numValue.toFixed(parseInt(decimalPlaces))
  }
  getFormattedText(data, decimalPlaces) {
    if (typeof data === 'object') {
      return JSON.stringify(data)
    }
    return this.formatNumber(data, decimalPlaces)
  }
  registerEvents() {
    // Mouse Hover Event
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

    // Transform Event
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

    // Data Update Event
    window.kdt.on(`dataUpdate.${this.id()}`, (e) => { 
      if (e.id === this.id()) {
        const formattedText = this.getFormattedText(e.data, this.attrs.props.decimalPlaces)
        this.buttonText.text(formattedText)
        this.updateButtonSize()
      }
    })
  }
  // Custom updateParams Method
  updateParams(newProps) {
    // Update Button Text
    if (newProps.data !== undefined ) {
      const formattedText = this.getFormattedText(newProps.data, newProps.decimalPlaces)
      this.buttonText.text(formattedText)
      window.kdt.updateNodeData({ id: this.id(), data: newProps.data, type: 'component' })
    }
    // Merge New Properties
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

    // Update Button Rectangle
    this.buttonRect.fill(null)
    this.buttonRect.clearCache()
    if (props.backgroundType === 'gradient' && props.gradientColors) {
      // Reduce Opacity When Disabled gradientDirection Update Size
      if (props.gradientDirection === 'vertical') {
        this.buttonRect.fillLinearGradientStartPoint({ x: 0, y: 0 })
        this.buttonRect.fillLinearGradientEndPoint({ x: 0, y: this.buttonRect.height() })
      } else {
        // Construct a Temporary Text Instance
        this.buttonRect.fillLinearGradientStartPoint({ x: 0, y: 0 })
        this.buttonRect.fillLinearGradientEndPoint({ x: this.buttonRect.width(), y: 0 })
      }
      // Only for Measurement
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
        this.buttonRect.opacity(0.5) // Remove Text Editing Events
      } else {
        this.buttonRect.opacity(1)
      }
    }
    // Call Parent Class's
    this.updateButtonSize()
    this.stateManage.class.node.forceUpdate()
  }

  updateButtonSize() {
    const props = this.attrs.props
    // Set Button Width，New Width
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
    // Update Rectangle and Text Width
    if (this.buttonText) {
      const stageEventNamespace = `edit_stage_${this.id()}`
      window.kdt.off(`addNode.${stageEventNamespace}`)
      window.kdt.off(`paste.${stageEventNamespace}`)
      window.kdt.off(`stageMode.${stageEventNamespace}`)
      window.kdt.off(`dragmove.${stageEventNamespace}`)
      window.kdt.off(`wheel.${stageEventNamespace}`)
    }
    // Recalculate GradientdestroyIf Any
    super.destroy()
  }

  /**
   * Update
   * @param {number} width - Value in
   */
  setWidth(width) {
    if (!this.buttonRect || !this.buttonText) return

    // Set Button Height
    this.buttonRect.width(width)
    this.buttonText.width(width)

    // New Height（Update Rectangle and Text Height）
    if (this.attrs.props.backgroundType === 'gradient') {
      this.buttonRect.fillLinearGradientStartPoint({ x: 0, y: 0 })
      if (this.attrs.props.gradientDirection === 'horizontal') {
        this.buttonRect.fillLinearGradientEndPoint({ x: width, y: 0 })
      } else {
        this.buttonRect.fillLinearGradientEndPoint({ x: 0, y: this.buttonRect.height() })
      }
    }

    // Get Button SizepropsContaining
    this.attrs.props.width = width
  }

  /**
   * And
   * @param {number} height - Object
   */
  setHeight(height) {
    if (!this.buttonRect || !this.buttonText) return

    // Set Class Name and Register
    this.buttonRect.height(height)
    this.buttonText.height(height)

    // Export Custom Button Class（If any）
    if (this.attrs.props.backgroundType === 'gradient') {
      this.buttonRect.fillLinearGradientStartPoint({ x: 0, y: 0 })
      if (this.attrs.props.gradientDirection === 'vertical') {
        this.buttonRect.fillLinearGradientEndPoint({ x: 0, y: height })
      } else {
        this.buttonRect.fillLinearGradientEndPoint({ x: this.buttonRect.width(), y: 0 })
      }
    }

    // UpdatepropsThe values in
    this.attrs.props.height = height
  }

  /**
   * Get button size
   * @returns {Object} ContainswidthandheightThe object of
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

// Set class name and register
CustomButton.prototype.className = 'kdtButton'
Konva['kdtButton'] = CustomButton

// Export custom button class
export { CustomButton }
