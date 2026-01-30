/**
 *  负责DOM组件在画布中初始化创建和还原
 *  生成Vue APP 实例 和 位置初始化
 *
 */

import { createApp, h } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import AllDomComponents from '@/views/stage/domComponents/index.js'
import MiddleComponent from './components/middleDataHandle.vue'
import ElementPlus from 'element-plus'
import vuexStore from '@/stores/index'

/**
 *  负责DOM组件在画布中初始化创建和还原
 *  生成Vue APP 实例 和 位置初始化
 *  @param {Object} nodeOrModuleData  DOM组件对应的数据
 *  @param {Object} nodeOrModuleData.attrs  DOM组件对应的配置信息 (可选)
 *  @param {String} nodeOrModuleData.attrs.domId  DOM组件对应的DOM ID (可选)
 *  @param {String} nodeOrModuleData.attrs.component.componentName  DOM组件对应的组件名称 (可选)
 *  @param {Object} nodeOrModuleData.attrs.component  DOM组件对应的组件配置  (可选)
 *  @param {Number} nodeOrModuleData.width  DOM组件对应的宽度
 *  @param {Number} nodeOrModuleData.height  DOM组件对应的高度
 *  @param {Number} nodeOrModuleData.offsetX  DOM组件对应的X轴偏移量
 *  @param {Number} nodeOrModuleData.offsetY  DOM组件对应的Y轴偏移量
 *  @param {Object} nodeOrModuleData.props  DOM组件对应的props
 *  @param {String} nodeOrModuleData.title  DOM组件对应的title
 *  @param {String} nodeOrModuleData.type  DOM组件对应的type
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
            console.error(`组件名称异常 , 没有找到对应的组件:${componentName}`)
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
                            // 使用作用域插槽接收处理后的数据
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

                // 手机端兼容
                if (stageRotation === 90) {
                    // 使用正则表达式提取 rotate 的值
                    let rotateMatch = transform.match(/rotate\((-?\d+\.?\d*)deg\)/)
                    if (rotateMatch) {
                        // 获取当前的 rotate 角度值   新的旋转角度，加上90度
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
                // 拖拽添加时 拖拽位置
                if (nodeOrModuleData.offsetX) {
                    const x = nodeOrModuleData.offsetX
                    const y = nodeOrModuleData.offsetY
                    const stageX = (x - position.x) / scale
                    const stageY = (y - position.y) / scale
                    initialX = stageX * scale + position.x - (domClientRect.width / 2) * scale
                    initialY = stageY * scale + position.y - (domClientRect.height / 2) * scale
                } else if (nodeOrModuleData.x) {
                    // 还原添加时 不需要计算
                    initialX = nodeOrModuleData.x
                    initialY = nodeOrModuleData.y
                    rotation = nodeOrModuleData.rotation
                } else {
                    // 点击添加时 画布中心
                    const stageWidth = window.innerWidth - 621
                    const stageHeight = window.innerHeight - 92
                    initialX = stageWidth / 2  - domClientRect.width / 2
                    initialY = stageHeight / 2 - domClientRect.height / 2
                }
                dom.style.transform = `translate(${initialX}px, ${initialY}px) scale(${scale}) rotate(${rotation}deg) `
                dom.style.zIndex = 2 // 默认层级
            }
        })

        return {
            dom: dom,
            id: domId
        }
    } else {
        console.error('组件DOM异常 , 无法获取DOM 元素, ID:' + domId)
    }
}

/**
 * 删除Stage中的DOM实例
 * @param {object[]} nodes - Stage中的节点对象数组
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