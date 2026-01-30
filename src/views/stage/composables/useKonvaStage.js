/*
 * Initialize the canvas and bind canvas events
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

    // When the canvas is being dragged
    kdt.value.on('dragmove', () => {
      if (menuRef) menuRef.value?.hideContextMenu()
      updateSketchRuleConfig()
    })

    // Move when the middle mouse button is pressed
    kdt.value.on('mouseMiddleMove', () => {
      if (menuRef) menuRef.value?.hideContextMenu()
      updateSketchRuleConfig()
    })

    // Scale the canvas
    kdt.value.on('wheel', () => {
        updateSketchRuleConfig()
        if (menuRef) menuRef.value?.hideContextMenu()
        // Get the current scale value
        const scale = kdt.value.state.stage.scale().x
        // Handle the auto - adjustment when scale is close to 100% in preview mode100%Auto - adjustment of scale
        handleAutoScaleAdjustment(scale)
    })

    // Select nodes
    kdt.value.on('select', (nodes) => {
      store.dispatch('setActiveNodes', nodes)
      updateSketchRuleConfig()
    })

    // Add nodes
    kdt.value.on('addNode', (nodes) => {
      // Handling logic when adding nodes
    })

    // Update the ruler
    kdt.value.on('updateSketchRule', () => {
      updateSketchRuleConfig()
    })

    // Delete nodes
    kdt.value.on('deleteNodes', (nodes) => {
      // HandleDOMNode deletion
      handleInstancesDelete(nodes, store)
    })

    // Canvas click event
    kdt.value.on('click', (e) => {
      if (e.evt.button === 0 && menuRef) {
        if (menuRef) menuRef.value?.hideContextMenu()
      }
    })

    // Handling logic when a node is clicked
    kdt.value.on('nodeClick', (node) => {
      // ...
    })

    // Handling logic when a node is left
    kdt.value.on('nodeLeave', (node) => {
       // ...
    })

    // Handling logic when the mouse is pressed on a node
    kdt.value.on('mousedown', (node) => {
       // ...
    })

    // Handling logic when the mouse is released on a node
    kdt.value.on('mouseup', (node) => {
       // ...
    })

    // Handling logic when the mouse enters a node
    kdt.value.on('nodeMouseenter', (node) => {
      document.body.style.cursor = 'default';
       // ...
    })
    
    // Handling logic when the mouse leaves a node
    kdt.value.on('nodeLeave', (node) => {
      document.body.style.cursor = 'default';
    })
    // Right - click menu display event
    kdt.value.on('contextmenu', (e) => {
      if (menuRef) menuRef.value.showContextMenu(e)
    })

    // Right - click menu close event
    kdt.value.on('closeContextmenu', (e) => {
      if (menuRef) menuRef.value.hideContextMenu(e)
    })

    // Transform box drag event
    kdt.value.on('transform', () => {
      updateSketchRuleConfig()
    })
    // DomAll DOM nodes clear event
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

    // DomDOM nodes re - creation event
    kdt.value.on('domReset', (nodes) => {
      nodes.forEach((node) => {
        handleDomCreation(node, stage.value, store)
      })
    })

    // Data update
    kdt.value.on('dataUpdate', (event) => {
      // When data is updated Check if node conditions trigger events that need to be updated
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
    // System configuration overall update event
    kdt.value.on('systemConfigUpdated', (systemConfig) => {
      if (systemConfig && typeof systemConfig === 'object') {
        try {
          // Use deep copy AvoidJSONJSON parsing circular reference errors
          const newConfig = safeDeepClone(systemConfig)
          // Compare configurations
          const currentConfig = store.state.stage.systemConfig
          const currentConfigStr = safeStringify(currentConfig)
          const newConfigStr = safeStringify(newConfig)
          if (currentConfigStr !== newConfigStr) {
            // Avoid state circular references
            delete newConfig.state
            store.dispatch('setSystemConfig', newConfig)
          }
        } catch (error) {
          console.error('processing systemConfig when an error occurred:', error)
        }
      }
    })
    // Event properties update under system configuration
    kdt.value.on('systemEventUpdated', (eventConfig) => {
      if (eventConfig && typeof eventConfig === 'object') {
        try {
          store.dispatch('updateSystemEvents', eventConfig)
        } catch (error) {
          console.error('an error occurred while processing system configuration update:', error)
        }
      }
    })
    // History record has changed
    kdt.value.on('historyChange', (event) => {
      // Avoid adding initialized history records to the cache
      if (event && event.length > 1) {
        // Set unsaved state
        store.dispatch('setUnsavedChanges', true)
      }
    })

    // Edit and preview mode switch
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
      // If there is no proxy，Use global events
      console.log('trigger canvas initialization completion event')
      if (window.$emitEvent) {
        window.$emitEvent('stageRendered')
      }
    }
  }

  onMounted(() => {
    initKonvaStage()
  })
  /**
 * Handle the auto - adjustment of scale in preview mode
 * @param {number} currentScale - Current scale
 */
const handleAutoScaleAdjustment = (currentScale) => {
  // Only execute in preview mode
  if (kdt.value.state.isEdit) {
    return
  }
  
  const TARGET_SCALE = 1.0
  const LOWER_THRESHOLD = 0.975
  const UPPER_THRESHOLD = 1.025
  
  // Check if the current scale is close to 100%100%
  if (currentScale >= LOWER_THRESHOLD && currentScale <= UPPER_THRESHOLD && currentScale !== TARGET_SCALE) {
    // Get the scale method from system configuration
    const systemConfig = store.state.stage.systemConfig
    const scaleMethod = systemConfig?.scaleMethod || 'fill' 
      // Get the current container size
      const windowWidth =window.innerWidth
      const windowHeight =  window.innerHeight
      try {
        // Call autoStageScale Method，Use the scale method configured in the system
        kdt.value.autoStageScale(
          windowWidth,
          windowHeight,
          scaleMethod,
          false, // Do not apply margin
          false,  // Do not apply animation
          false,
          systemConfig // Pass in system configuration
        )
      } catch (error) {
        console.warn('automatic scaling adjustment failed:', error)
      }
  }
}
  return { kdt, stage }
}
