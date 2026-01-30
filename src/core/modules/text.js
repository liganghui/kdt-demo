import { v4 as uuidv4 } from 'uuid'
import { enableTextEditing } from './common'

class CustomText extends Konva.Label {
  constructor(params, state, stateManage) {
    // Define the default parameters of the text
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
      // Hyperlink properties
      hyperlinkEnabled: false,
      hyperlinkUrl: '',
      hyperlinkTarget: '_self', // or '_blank'
      decimalPlaces: null
    }
    // Merge the incoming parameters and default parameters
    const props = { ...defaultProps, ...(params.props || {}) }
    // Call the parent class constructor
    super({
      title: params.title || 'Text',
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
    this.isEditing = false // Initialize the editing state
    if (!params.id) {
      // Initialize the text node
      this.initText(params)
      // Initialize text events
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
    // Create the tag background
    this.tag = new Konva.Tag({
      fill: props.backgroundColor,
      stroke: props.borderColor,
      strokeWidth: props.borderSize,
      lineJoin: 'round',
      cornerRadius: props.cornerRadius,
      dash: props.borderStyle === 'dashed' ? [10, 5] : props.borderStyle === 'dotted' ? [2, 2] : []
    })

    // Create the text node
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

    // Add the tag and text to the tag group
    this.add(this.tag)
    this.add(this.textNode)
    const layer = params.layer || this.state.layers[2]
    layer.add(this)
    this.stateManage.class.event.trigger('addNode', {
      type: 'canvas',
      name: 'text',
      node: this
    })

    // If there is width and height Indicates that the size has been pre - calculated
    const hasPreCalculatedSize =
      params.width && params.height && params.width > 0 && params.height > 0
    if (!hasPreCalculatedSize) {
      setTimeout(() => {
        this.updateTextSize()
      })
    } else {
      // If there is a pre - calculated size，Directly apply to the tag
      this.tag.width(params.width)
      this.tag.height(params.height)
    }
    // Enable text editing
    enableTextEditing(this.textNode, this.tag, this.state, this.stateManage, this)
  }
  getFormattedText(data, decimalPlaces) {
    if (typeof data === 'object') {
      return JSON.stringify(data)
    }
    return this.formatNumber(data, decimalPlaces)
  }

  registerEvents() {
    // Transformation event
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

    // Data update event
    window.kdt.on(`dataUpdate.${this.id()}`, (e) => {
      if (e.id === this.id()) {
        const formattedText = this.getFormattedText(e.data, this.attrs.props.decimalPlaces)
        this.textNode.text(formattedText)
        this.updateTextSize()
      }
    })

    // Click event，Used to handle hyperlinks
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

    // Listen for changes in the text editing state
    this.textNode.on('editing', (isEditing) => {
      this.isEditing = isEditing
    })
  }
  formatNumber(value, decimalPlaces) {
    if (decimalPlaces === null || decimalPlaces === undefined || decimalPlaces === '') {
      return value
    }
    // Check if it is a number or can be converted to a number
    const numValue = Number(value)
    if (isNaN(numValue)) {
      return value // If it is not a number，Return the original value
    }
    // Format to the specified decimal places
    return numValue.toFixed(parseInt(decimalPlaces))
  }
  // Customized updateParams Method
  updateParams(newProps) {
    // Merge new properties
    // Update the text node
    if (newProps.data !== undefined && newProps.data !== this.attrs.props.data) {
      this.textNode.text(
        typeof newProps.data === 'object' ? JSON.stringify(newProps.data) : newProps.data
      )
      window.kdt.updateNodeData({ id: this.id(), data: newProps.data, type: 'component' })
    }
    // If the decimal places setting changes，Reformat the text
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

    // Update the tag background
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

    // Update hyperlink properties
    if (newProps.hyperlinkEnabled !== undefined) {
      props.hyperlinkEnabled = newProps.hyperlinkEnabled
    }
    if (newProps.hyperlinkUrl !== undefined) {
      props.hyperlinkUrl = newProps.hyperlinkUrl
    }
    if (newProps.hyperlinkTarget !== undefined) {
      props.hyperlinkTarget = newProps.hyperlinkTarget
    }

    // Update dimensions
    this.updateTextSize()

    // Redraw the layer
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
      //Remove the height limit
      // if (textHeight > this.textNode.height()) {
      //   this.textNode.height(textHeight)
      //   this.tag.height(textHeight)
      // }
    } else {
      // The original multi - line logic remains unchanged
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
      //Set width
      // if (textHeight > this.textNode.height()) {
      //   this.textNode.height(textHeight)
      //   this.tag.height(textHeight)
      // }
    }

    this.stateManage.class.node.forceUpdate()
  }
  // Update the width of the text and tag
  setWidth(width) {
    // Set height
    this.textNode.width(width)
    this.tag.width(width)
  }

  // Update the height of the text and tag
  setHeight(height) {
    // Remove the text editing event
    this.textNode.height(height)
    this.tag.height(height)
  }
  destroy() {
    // Set the class name and register
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

// Export the custom text class
CustomText.prototype.className = 'kdtText'
Konva['kdtText'] = CustomText

// Export the custom text class
export { CustomText }
