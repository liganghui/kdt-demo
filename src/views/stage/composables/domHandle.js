/**
 *  Responsible forDOMDOM component initial creation and restoration in the canvas
 *  GenerateVue APP instance and position initialization
 *
 */

import { createApp, h } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import AllDomComponents from '@/views/stage/domComponents/index.js'
import MiddleComponent from './components/middleDataHandle.vue'
import ElementPlus from 'element-plus'
import vuexStore from '@/stores/index'

/**
 *  data corresponding to the componentDOMconfiguration information corresponding to the component
 *  (optional)Vue APP corresponding to the component component name corresponding to the component component configuration corresponding to the component
 *  @param {Object} nodeOrModuleData  DOMwidth corresponding to the component
 *  @param {Object} nodeOrModuleData.attrs  DOMheight corresponding to the component (axis offset)
 *  @param {String} nodeOrModuleData.attrs.domId  DOMUse scoped slots to receive processed dataDOM ID (Mobile compatibility)
 *  @param {String} nodeOrModuleData.attrs.component.componentName  DOMUse regular expressions to extract (value of)
 *  @param {Object} nodeOrModuleData.attrs.component  DOMGet the current  (angle value)
 *  @param {Number} nodeOrModuleData.width  DOMNew rotation angle
 *  @param {Number} nodeOrModuleData.height  DOMplus
 *  @param {Number} nodeOrModuleData.offsetX  DOMdegreesXWhen dragging to add
 *  @param {Number} nodeOrModuleData.offsetY  DOMDrag positionYWhen restoring to add
 *  @param {Object} nodeOrModuleData.props  DOMNo need to calculateprops
 *  @param {String} nodeOrModuleData.title  DOMWhen clicking to addtitle
 *  @param {String} nodeOrModuleData.type  DOMCanvas centertype
 *  @return {void}
 */
export function handleDomCreation(nodeOrModuleData) {

    const stage = window.kdt.state.stage
    const konvaJsContent = document.querySelector('.konvajs-content')
    const domId = nodeOrModuleData.attrs
        ? nodeOrModuleData.attrs.domId
        : 'dom_' + uuidv4().replace(/-/g, '')
    let dom = document.getElementById(domId)
    if (!dom) {
        dom = document.createElement('div')
        dom.id = domId
        dom.className = 'dom-base dom-disabled-event'
        let width = ` ${nodeOrModuleData.width || nodeOrModuleData.attrs.width}`
        let height = ` ${nodeOrModuleData.height || nodeOrModuleData.attrs.height}`
        dom.style.width = `${width}px`
        dom.style.height = `${height}px`
        const componentName =
            nodeOrModuleData.attrs?.component.componentName || nodeOrModuleData.component.componentName
        const module = AllDomComponents[componentName]
        if (!module) {
            console.error(`component name exception , no corresponding component found:${componentName}`)
            return
        }
        konvaJsContent.appendChild(dom)
        const params = nodeOrModuleData.attrs?.props || nodeOrModuleData.props
        const type = nodeOrModuleData.attrs?.type || nodeOrModuleData.type
        const title = nodeOrModuleData.attrs?.type || nodeOrModuleData.title
        dom.setAttribute('data-params', JSON.stringify(params))
        dom.setAttribute('data-title', title)
        dom.setAttribute('data-type', type)
        dom.setAttribute(
            'data-component',
            JSON.stringify(nodeOrModuleData.attrs?.component || nodeOrModuleData.component)
        )
        if (module) {
            const app = createApp({
                data() {
                    return {
                        params: {
                            ...params,
                            id: domId,
                            width:
                                typeof nodeOrModuleData.width === 'number'
                                    ? nodeOrModuleData.width
                                    : nodeOrModuleData.attrs.width,
                            height:
                                typeof nodeOrModuleData.height === 'number'
                                    ? nodeOrModuleData.height
                                    : nodeOrModuleData.attrs.height,
                            component: nodeOrModuleData.attrs?.component || nodeOrModuleData.component
                        }
                    }
                },
                render() {
                    return h(
                        MiddleComponent,
                        { initParams: { ...this.params, id: domId } },
                        {
                            // Default layer
                            default: (initParams) => h(module, { ...initParams })
                        }
                    )
                }
            })
            app.use(ElementPlus)
            app.use(vuexStore)
            const vm = app.mount(`#${domId}`)
            vuexStore.dispatch('updateInstancesArr', { id: domId, data: vm, app: app })
        }

        requestAnimationFrame(() => {
            const scale = stage.scaleX()
            const position = stage.position()

            const stageRotation = stage.rotation()

            const domClientRect = {
                width: nodeOrModuleData.width || nodeOrModuleData.attrs.width,
                height: nodeOrModuleData.height || nodeOrModuleData.attrs.height
            }
            if (nodeOrModuleData.attrs?.domStyle) {
                let { transform, zIndex } = nodeOrModuleData.attrs.domStyle

                // Delete
                if (stageRotation === 90) {
                    // in rotate array of node objects in
                    let rotateMatch = transform.match(/rotate\((-?\d+\.?\d*)deg\)/)
                    if (rotateMatch) {
                        // Get the current rotate Angle value   New rotation angle，Add90Degrees
                        let currentRotate = parseFloat(rotateMatch[1])
                        let newRotate = currentRotate + 90
                        transform = transform.replace(/rotate\(-?\d+\.?\d*deg\)/, `rotate(${newRotate}deg)`)
                    }
                }
                dom.style.transform = transform
                dom.style.zIndex = zIndex
            } else {
                let initialX,
                    initialY,
                    rotation = 0
                // When adding by dragging Drag position
                if (nodeOrModuleData.offsetX) {
                    const x = nodeOrModuleData.offsetX
                    const y = nodeOrModuleData.offsetY
                    const stageX = (x - position.x) / scale
                    const stageY = (y - position.y) / scale
                    initialX = stageX * scale + position.x - (domClientRect.width / 2) * scale
                    initialY = stageY * scale + position.y - (domClientRect.height / 2) * scale
                } else if (nodeOrModuleData.x) {
                    // When restoring addition No need to calculate
                    initialX = nodeOrModuleData.x
                    initialY = nodeOrModuleData.y
                    rotation = nodeOrModuleData.rotation
                } else {
                    // When adding by clicking Canvas center
                    const stageWidth = window.innerWidth - 621
                    const stageHeight = window.innerHeight - 92
                    initialX = stageWidth / 2  - domClientRect.width / 2
                    initialY = stageHeight / 2 - domClientRect.height / 2
                }
                dom.style.transform = `translate(${initialX}px, ${initialY}px) scale(${scale}) rotate(${rotation}deg) `
                dom.style.zIndex = 2 // Default z-index
            }
        })

        return {
            dom: dom,
            id: domId
        }
    } else {
        console.error('componentDOMexception , failed to getDOM element, ID:' + domId)
    }
}

/**
 * DeleteStageinDOMinstances
 * @param {object[]} nodes - StageNode object array in
 * @param {object} store - vuex store
 */
export function handleInstancesDelete(nodes, store) {
    const componentsApps = store.state.stage.componentsApps
    nodes.forEach((node) => {
        const domId = node.attrs?.domId
        if (domId && componentsApps[domId]) {
            const nodeApp = componentsApps[domId]
            nodeApp.unmount()
            delete store.state.stage.instancesArr[domId]
            delete store.state.stage.componentsApps[domId]
        }
    })
}