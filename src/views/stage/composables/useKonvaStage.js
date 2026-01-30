/*
 * 画布初始化和画布事件绑定
 */

import { ref, onMounted, getCurrentInstance } from 'vue'
import { useStore } from 'vuex'

import KDT from '@/core/index'
import { useRoute } from 'vue-router'

import stageConfig from '@/config/stage.js'
import { handleDomCreation, handleInstancesDelete } from './domHandle'
import { safeDeepClone, safeStringify } from '@/utils/utils'

export function useKonvaStage(menuRef = null, updateSketchRuleConfig = () => {}) {
  const store = useStore()
  const route = useRoute()
  const kdt = ref(null)
  const stage = ref(null)

  const initKonvaStage = () => {
    const instance = getCurrentInstance()
    const proxy = instance?.proxy
    stage.value = new Konva.Stage({
      container: 'konvaContainer',
      width: stageConfig.stageWidth,
      height: stageConfig.stageHeight,
      draggable: false
    })

    kdt.value = new KDT(stage.value, {
      name: 'tesee',
      ...stageConfig
    })

    // 画布拖拽时
    kdt.value.on('dragmove', () => {
      if (menuRef) menuRef.value?.hideContextMenu()
      updateSketchRuleConfig()
    })

    // 鼠标中键按下移动
    kdt.value.on('mouseMiddleMove', () => {
      if (menuRef) menuRef.value?.hideContextMenu()
      updateSketchRuleConfig()
    })

    // 缩放画布
    kdt.value.on('wheel', () => {
        updateSketchRuleConfig()
        if (menuRef) menuRef.value?.hideContextMenu()
        // 获取当前缩放值
        const scale = kdt.value.state.stage.scale().x
        // 处理预览模式下接近100%缩放的自动调整
        handleAutoScaleAdjustment(scale)
    })

    // 选中节点
    kdt.value.on('select', (nodes) => {
      store.dispatch('setActiveNodes', nodes)
      updateSketchRuleConfig()
    })

    // 添加节点
    kdt.value.on('addNode', (nodes) => {
      // 添加节点时的处理逻辑
    })

    // 更新标尺
    kdt.value.on('updateSketchRule', () => {
      updateSketchRuleConfig()
    })

    // 删除节点
    kdt.value.on('deleteNodes', (nodes) => {
      // 处理DOM节点删除
      handleInstancesDelete(nodes, store)
    })

    // 画布点击事件
    kdt.value.on('click', (e) => {
      if (e.evt.button === 0 && menuRef) {
        if (menuRef) menuRef.value?.hideContextMenu()
      }
    })

    // 节点点击时的处理逻辑
    kdt.value.on('nodeClick', (node) => {
      // ...
    })

    // 节点离开时的处理逻辑
    kdt.value.on('nodeLeave', (node) => {
       // ...
    })

    // 节点鼠标按下时的处理逻辑
    kdt.value.on('mousedown', (node) => {
       // ...
    })

    // 节点鼠标松开时的处理逻辑
    kdt.value.on('mouseup', (node) => {
       // ...
    })

    // 节点鼠标进入时的处理逻辑
    kdt.value.on('nodeMouseenter', (node) => {
      document.body.style.cursor = 'default';
       // ...
    })
    
    // 节点鼠标离开时的处理逻辑
    kdt.value.on('nodeLeave', (node) => {
      document.body.style.cursor = 'default';
    })
    // 右击菜单显示事件
    kdt.value.on('contextmenu', (e) => {
      if (menuRef) menuRef.value.showContextMenu(e)
    })

    // 右击菜单关闭事件
    kdt.value.on('closeContextmenu', (e) => {
      if (menuRef) menuRef.value.hideContextMenu(e)
    })

    // 变换框拖拽事件
    kdt.value.on('transform', () => {
      updateSketchRuleConfig()
    })
    // Dom节点全部清理事件
    kdt.value.on('domClear', (nodeIds) => {
      nodeIds.forEach((id) => {
        const app = store.state.stage.componentsApps[id]
        if (app) {
          app.unmount()
          delete store.state.stage.instancesArr[id]
          delete store.state.stage.componentsApps[id]
        }
      })
    })

    // Dom节点重新创建事件
    kdt.value.on('domReset', (nodes) => {
      nodes.forEach((node) => {
        handleDomCreation(node, stage.value, store)
      })
    })

    // 数据更新
    kdt.value.on('dataUpdate', (event) => {
      // 数据更新时 检查节点条件是否触发事件需要更新
      const allNodes = window.kdt.getAllLayersNodes()
      allNodes.forEach((node) => {
        if (!node.attrs.event) return
        node.attrs.event.forEach((rule) => {
          if (
            rule.triggerType === 'condition' &&
            (rule.triggerCondition.bindDataType === 'component' ||
              rule.triggerCondition.bindDataType === 'triggerValue') &&
            rule.triggerCondition.bindComponentId === event.node.attrs.id
          ) {
            rule._isUpdate = true
          }
        })
      })
    })
    // 系统配置整体更新事件
    kdt.value.on('systemConfigUpdated', (systemConfig) => {
      if (systemConfig && typeof systemConfig === 'object') {
        try {
          // 使用深拷贝 避免JSON解析循环引用报错
          const newConfig = safeDeepClone(systemConfig)
          // 比较配置
          const currentConfig = store.state.stage.systemConfig
          const currentConfigStr = safeStringify(currentConfig)
          const newConfigStr = safeStringify(newConfig)
          if (currentConfigStr !== newConfigStr) {
            // 避免状态循环引用
            delete newConfig.state
            store.dispatch('setSystemConfig', newConfig)
          }
        } catch (error) {
          console.error('处理 systemConfig 时发生错误:', error)
        }
      }
    })
    // 系统配置下事件属性更新
    kdt.value.on('systemEventUpdated', (eventConfig) => {
      if (eventConfig && typeof eventConfig === 'object') {
        try {
          store.dispatch('updateSystemEvents', eventConfig)
        } catch (error) {
          console.error('处理系统配置更新时发生错误:', error)
        }
      }
    })
    // 历史记录发生变化
    kdt.value.on('historyChange', (event) => {
      // 避免初始化的历史记录添加到缓存中
      if (event && event.length > 1) {
        // 设置未保存状态
        store.dispatch('setUnsavedChanges', true)
      }
    })

    // 编辑和预览模式切换
    kdt.value.on('stageMode', (state) => {
      const elements = document.querySelectorAll('.dom-base')
      elements.forEach((element) => {
        if (state === 'edit') {
          element.classList.add('dom-disabled-event')
        } else if (state === 'preview') {
          element.classList.remove('dom-disabled-event')
          
        }
      })
    })

    window.kdt = kdt.value

    if (proxy && proxy.$emitEvent) {
      proxy.$emitEvent('stageRendered')
    } else {
      // 如果没有 proxy，使用全局事件
      console.log('触发画布初始化完成事件')
      if (window.$emitEvent) {
        window.$emitEvent('stageRendered')
      }
    }
  }

  onMounted(() => {
    initKonvaStage()
  })
  /**
 * 处理预览模式下的自动缩放调整
 * @param {number} currentScale - 当前缩放比例
 */
const handleAutoScaleAdjustment = (currentScale) => {
  // 只在预览模式下执行
  if (kdt.value.state.isEdit) {
    return
  }
  
  const TARGET_SCALE = 1.0
  const LOWER_THRESHOLD = 0.975
  const UPPER_THRESHOLD = 1.025
  
  // 检查当前缩放是否接近100%
  if (currentScale >= LOWER_THRESHOLD && currentScale <= UPPER_THRESHOLD && currentScale !== TARGET_SCALE) {
    // 获取系统配置中的缩放方法
    const systemConfig = store.state.stage.systemConfig
    const scaleMethod = systemConfig?.scaleMethod || 'fill' 
      // 获取当前容器尺寸
      const windowWidth =window.innerWidth
      const windowHeight =  window.innerHeight
      try {
        // 调用 autoStageScale 方法，使用系统配置的缩放方法
        kdt.value.autoStageScale(
          windowWidth,
          windowHeight,
          scaleMethod,
          false, // 不应用边距
          false,  // 不应用动画
          false,
          systemConfig // 传入系统配置
        )
      } catch (error) {
        console.warn('自动缩放调整失败:', error)
      }
  }
}
  return { kdt, stage }
}
