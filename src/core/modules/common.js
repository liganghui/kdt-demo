/**
 * 启用文本节点的编辑功能，支持双击文本框进行编辑
 * @param {Konva.Text} textNode - Konva.Text 实例
 * @param {Konva.Node} labelOrRect - Konva.Label 或 Konva.Rect 实例
 * @param {Object} state - 应用的状态对象
 * @param {Object} stateManage - 状态管理对象
 */
export function enableTextEditing(textNode, labelOrRect, state, stateManage) {
  // 先移除可能存在的双击事件处理程序，避免重复添加
  textNode.off('dblclick dbltap')

  // 使用父节点ID创建唯一的事件命名空间
  const parentId = textNode.parent.attrs.id
  const eventNamespace = `edit_${parentId}`
  const stageEventNamespace = `edit_stage_${parentId}`

  // 使用命名空间绑定事件，确保每个组件的事件互不干扰
  textNode.on(`dblclick.${eventNamespace} dbltap.${eventNamespace}`, () => {
    if (!state.isEdit || textNode.parent.attrs.lock) return
    if(textNode.parent?.parent?.attrs?.name== 'group' && textNode.parent?.parent?.attrs?.lock ===true){
        // 处于组合时 锁定的时候也要返回
        return
    }
    state.transformer.nodes([])
    textNode.hide()

    const textPosition = textNode.getClientRect()
    const scale = state.stage.scaleX()

    // 创建临时Text节点来计算真实高度
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

        // 更新尺寸
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

    // 监听 stageMode 事件
    stateManage.class.event.on(`stageMode.${stageEventNamespace}`, (value) => {
      if (value === 'preview') {
        removeTextarea()
      }
    })
    // 监听节点添加
    stateManage.class.event.on(`addNode.${stageEventNamespace}`, (value) => {
       removeTextarea()
    })
    stateManage.class.event.on(`paste.${stageEventNamespace}`, (value) => {
       removeTextarea()
    })
  })
}
