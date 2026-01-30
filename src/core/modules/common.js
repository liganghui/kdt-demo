/**
 * Enable the editing functionality of text nodes，Support double-clicking the text box for editing
 * @param {Konva.Text} textNode - Konva.Text instance
 * @param {Konva.Node} labelOrRect - Konva.Label or Konva.Rect instance
 * @param {Object} state - the state object to be applied
 * @param {Object} stateManage - state management object
 */
export function enableTextEditing(textNode, labelOrRect, state, stateManage) {
  // First, remove any existing double-click event handlers，to avoid duplicate additions
  textNode.off('dblclick dbltap')

  // Use the parent nodeIDCreate a unique event namespace
  const parentId = textNode.parent.attrs.id
  const eventNamespace = `edit_${parentId}`
  const stageEventNamespace = `edit_stage_${parentId}`

  // Bind events using the namespace，Ensure that the events of each component do not interfere with each other
  textNode.on(`dblclick.${eventNamespace} dbltap.${eventNamespace}`, () => {
    if (!state.isEdit || textNode.parent.attrs.lock) return
    if(textNode.parent?.parent?.attrs?.name== 'group' && textNode.parent?.parent?.attrs?.lock ===true){
        // When in a group Also return when locked
        return
    }
    state.transformer.nodes([])
    textNode.hide()

    const textPosition = textNode.getClientRect()
    const scale = state.stage.scaleX()

    // Create a temporaryTextnode to calculate the real height
    const tempText = new Konva.Text({
      text: textNode.text(),
      fontSize: textNode.fontSize(),
      fontFamily: textNode.fontFamily(),
      width: textNode.width(),
      padding: textNode.padding(),
      align: textNode.align(),
      verticalAlign: textNode.verticalAlign(),
      lineHeight: textNode.lineHeight()
    })

    const layer = textNode.getLayer()
    layer.add(tempText)
    const textHeight = tempText.height()
    const areaPosition = {
      x: textPosition.x - (labelOrRect.strokeWidth ? labelOrRect.strokeWidth() / 2 : 0),
      y:
        textPosition.y +
        textPosition.height / 2 -
        (textHeight / 2) * scale -
        1.2 * scale -
        textNode.padding()
    }
    tempText.destroy()

    const textarea = document.createElement('textarea')
    document.querySelector('#konvaContainer').appendChild(textarea)
    textarea.value = textNode.text()
    textarea.style.position = 'absolute'
    textarea.style.top = `${areaPosition.y}px`
    textarea.style.left = `${areaPosition.x}px`
    const rotation = labelOrRect.rotation()

    textarea.style.width = `${labelOrRect.getClientRect().width}px`
    textarea.style.height = `${labelOrRect.getClientRect().height}px`
    textarea.style.fontSize = `${textNode.fontSize() * scale * labelOrRect.scaleX()}px`
    textarea.style.border = 'none'
    textarea.style.margin = '0px'
    textarea.style.overflow = 'hidden'
    textarea.style.background = 'none'
    textarea.style.outline = 'none'
    textarea.style.padding = `${textNode.padding()}px`
    textarea.style.resize = 'none'
    textarea.style.lineHeight = `${textNode.lineHeight()}`
    textarea.style.fontFamily = textNode.fontFamily()
    textarea.style.transformOrigin = 'left top'
    textarea.style.textAlign = textNode.align()
    textarea.style.color = textNode.fill()
    textarea.style.zIndex = '999'

    let transform = ''
    if (rotation) {
      transform += `rotateZ(${rotation}deg)`
    }
    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox')
    if (isFirefox) {
      transform += `translateY(-${2 + Math.round(textNode.fontSize() / 20)}px)`
    }
    textarea.style.transform = transform
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight + 3}px`
    textarea.focus()

    const removeTextarea = () => {
      window.kdt.off(`addNode.${stageEventNamespace}`)
      window.kdt.off(`paste.${stageEventNamespace}`)
      window.kdt.off(`stageMode.${stageEventNamespace}`)
      window.kdt.off(`dragmove.${stageEventNamespace}`)
      window.kdt.off(`wheel.${stageEventNamespace}`)   
      if (textarea.parentNode) {
        textNode.text(textarea.value)

        // Update the size
        if (labelOrRect.name === 'text') {
          stateManage.updateTextSize(
            textNode,
            labelOrRect.findOne('Tag'),
            textNode.attrs.singleLine
          )
        } else if (labelOrRect.name === 'button') {
          stateManage.updateButtonSize(
            textNode,
            labelOrRect.findOne('Rect'),
            textNode.attrs.singleLine
          )
        }

        textarea.parentNode.removeChild(textarea)
        window.removeEventListener('click', handleOutsideClick)
        textNode.show()
        textNode.parent.attrs.props.data = textarea.value
        if (textNode.parent.updateParams) {
          textNode.parent.updateParams(textNode.parent.attrs.props)
        }
      }
    }

    const handleOutsideClick = (e) => {
      if (e.target !== textarea) {
        textNode.text(textarea.value)
        removeTextarea()
      }
    }

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        textNode.text(textarea.value)
        removeTextarea()
      }
      if (e.key === 'Escape') {
        removeTextarea()
      }
    })

    stateManage.class.event.on(`wheel.${stageEventNamespace}`, (e) => {
      textNode.text(textarea.value)
      removeTextarea()
    })

    stateManage.class.event.on(`dragmove.${stageEventNamespace}`, () => {
      textNode.text(textarea.value)
      removeTextarea()
    })

    setTimeout(() => {
      window.addEventListener('click', handleOutsideClick)
    })

    // Listen for stageMode events
    stateManage.class.event.on(`stageMode.${stageEventNamespace}`, (value) => {
      if (value === 'preview') {
        removeTextarea()
      }
    })
    // Listen for node addition
    stateManage.class.event.on(`addNode.${stageEventNamespace}`, (value) => {
       removeTextarea()
    })
    stateManage.class.event.on(`paste.${stageEventNamespace}`, (value) => {
       removeTextarea()
    })
  })
}
