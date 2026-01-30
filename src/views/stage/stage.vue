<template>
  <div class="stage-body" ref="stageRef">
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <div class="loading-text">thumbnails saving...</div>
      </div>
    </div>
    <!-- Ruler -->
    <SketchRule
      :key="SketchRuleKey"
      class="rule-wrapper"
      :thick="SketchRuleConfig.thick"
      :scale="SketchRuleConfig.scale"
      :width="SketchRuleConfig.width"
      :height="SketchRuleConfig.height"
      :startX="SketchRuleConfig.startX"
      :startY="SketchRuleConfig.startY"
      :lines="SketchRuleConfig.lines"
    >
    </SketchRule>
    <!-- Canvas Container -->
    <div id="konvaContainer" class="konva-Container" @dragover.prevent @drop="handleDrop" />
    <!-- Right-click Menu -->
    <ContextMenu ref="menuRef" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import SketchRule from 'vue3-sketch-ruler'
import 'vue3-sketch-ruler/lib/style.css'
import { getStageData } from '@/api/system'
import ContextMenu from '@/views/stage/contextMenu/index.vue'
import defaultStageConfig from "@/config/stage"
import { useKonvaStage } from './composables/useKonvaStage'
import { handleDomCreation } from './composables/domHandle'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const store = useStore()
const stageRef = ref(null)
const menuRef = ref()
const isLoading = ref(false)
const hasUnsavedChanges = computed(() => store.state.system.unsavedChanges)
const lastSavedTime = computed(() => store.state.system.lastSavedTime)
// Rulerkey Avoid not updating
let SketchRuleKey = 0
// Width of two sidebars plus ruler width (Sidebar width300 Ruler width21)
const siderWidth = ref(621)
const toolHeight = ref(92)
// Ruler initialization configuration
const SketchRuleConfig = reactive({
  scale: 1,
  startX: 0, // Initial position of ruler
  startY: 0,
  width: window.innerWidth - siderWidth.value,
  height: window.innerHeight - toolHeight.value,
  thick: 20,
  lines: { h: [], v: [] }, // Initialize ruler lines
  isShowRuler: true, // Show ruler
  isShowReferLine: true // Show reference lines
})

// Update background scaling offset
const updateBackground = (stage, newScale, newPosition) => {
  if (stageRef.value) {
    const baseGridSize = 15 // Base grid size
    let newGridSize = baseGridSize * newScale
    if (newGridSize < 3) newGridSize = 3
    // Update background size
    stageRef.value.style.backgroundSize = `${newGridSize}px ${newGridSize}px`
    // Calculate the offset of the background image，Subtract half the width of the background grid
    const offsetX = (newPosition.x % newGridSize) - newGridSize / 2
    const offsetY = (newPosition.y % newGridSize) - newGridSize / 2
    // Update background position
    stageRef.value.style.backgroundPosition = `${offsetX}px ${offsetY}px`
  }
}
// Update ruler information
const updateSketchRuleConfig = () => {
  const stage = window.kdt.state.stage
  if (stage&&window.kdt.getStageMode() === 'edit') {
    const newScale = stage.scaleX()
    const newPosition = stage.position()
    SketchRuleConfig.scale = newScale
    SketchRuleConfig.width = window.innerWidth - siderWidth.value
    SketchRuleConfig.height = window.innerHeight - toolHeight.value
    SketchRuleConfig.startX = -newPosition.x / newScale
    SketchRuleConfig.startY = -newPosition.y / newScale
    updateBackground(stage, newScale, newPosition)
  }
}

// Handle the event of dragging nodes from the left panel to the canvas
const handleDrop = (event) => {
  if (!event.dataTransfer.getData('application/json')) {
    return
  }
  if (kdt.value.getStageMode() !== 'edit') {
    ElMessage({
      message: 'currently in preview mode，cannot add',
      type: 'warning'
    })
    return
  }
  const moduleData = JSON.parse(event.dataTransfer.getData('application/json'))
  event.moduleData = moduleData
  if (moduleData?.component?.componentName) {
    moduleData.offsetX = event.offsetX
    moduleData.offsetY = event.offsetY
    const stage = window.kdt.state.stage
    handleDomCreation(moduleData, stage, store)
  } else {
    kdt.value.addNode(event)
  }
}
// ** Initialize canvas ***
const { kdt, stage } = useKonvaStage(menuRef, updateSketchRuleConfig)
// Get left sidebar panel data
const activeLeftPanels = computed(() => store.state.system.activeLeftPanels)
// Get whether the right property panel is displayed
const isPanelShow = computed(() => store.state.system.isPanelShow)

// Function to handle loading canvas data
const loadStageData = (stageData, options = {}) => {
  const { fromUnsaved = false } = options
  try {
    if (stageData?.stageJson && typeof stageData?.stageJson == 'string') {
      stageData.stageJson = JSON.parse(stageData?.stageJson)
    }
    let stageJSON = stageData?.stageJson ? stageData?.stageJson?.stage : stageData?.stage
    let systemConfig = stageData?.stageJson?.systemConfig || stageData?.systemConfig
    if (!systemConfig || Object.keys(systemConfig).length === 0) {
      systemConfig = { ...defaultStageConfig }
    } else {
      systemConfig = { ...defaultStageConfig, ...systemConfig }
    }
    store.dispatch('setSystemConfig', systemConfig)
    if (fromUnsaved) {
      store.dispatch('setLastSavedTime', new Date().getTime() - 1000)
    } else {
      const timestamp = stageData?.time || stageData?.stageJson?.time || null
      if (timestamp) {
        store.dispatch('setLastSavedTime', timestamp)
      }
    }
    initDraw(stageJSON)
    store.dispatch('setUnsavedChanges', fromUnsaved)

    if (fromUnsaved) {
      localStorage.removeItem('unsavedStageData')
    }
    return true
  } catch (err) {
    console.error('failed to load canvas data:', err)
    ElMessage({
      message: fromUnsaved ? 'failed to restore unsaved data' : 'failed to load canvas data',
      type: 'error',
      duration: 3000
    })
    return false
  }
}

// Initialize canvas data
const initStageData = () => {
  const buildId = route.params.buildId
  if (buildId) {
    // Get canvas data
    getStageData({ id: buildId })
      .then((res) => {
        if (res.code === 200) {
          console.log('successfully fetched canvas data:', res.data)
          const loadSuccess = loadStageData(res.data)
        } else {
          ElMessage({
            message: 'abnormal canvas data fetch',
            type: 'warning'
          })
        }
      })
      .catch((err) => {
        console.error('failed to fetch canvas data:', err)
        ElMessage({
          message: 'failed to fetch canvas data',
          type: 'error'
        })
      })
  } else {
    initDraw()
    ElMessage({
      message: 'abnormal canvas parameters',
      type: 'warning'
    })
  }
}
const initDraw = (stageJSON) => {
     if (!stageJSON) {
    const systemConfig = {
      ...defaultStageConfig,
    }
    store.dispatch('setSystemConfig', systemConfig)
  }
  kdt.value.initStage(stageJSON)
  setTimeout(() => {
    window.kdt.setStageMode('edit')
    store.dispatch('setUnsavedChanges', false)
    // Not displayed in development environment
    if (!import.meta.env.DEV) {
       //   checkUnsavedData()
    }
  }, 300)
}

// Page leave prompt
const handleBeforeUnload = (e) => {
  if (hasUnsavedChanges.value) {
    e.preventDefault()
    e.returnValue = 'there are unsaved changes，are you sure you want to leave？'
    return e.returnValue
  }
}

// In preview mode Recalculate ruler
watch(isPanelShow, (newVal) => {
  if (newVal) {
    siderWidth.value = activeLeftPanels.value.length * 300 + 300 + 21
  } else {
    siderWidth.value = 21
  }
  updateSketchRuleConfig()
})
// Calculate ruler based on the number of left panels
watch(activeLeftPanels, (newVal) => {
  siderWidth.value = newVal.length * 300 + 300 + 21
  updateSketchRuleConfig()
})
//  Listen to canvas zoom to update the size of background points
watch(
  () => SketchRuleConfig.scale,
  (newScale) => {
    if (stageRef.value) {
      const baseGridSize = 15 // Default background grid size
      // According to stage Calculate new background size based on zoom ratio
      let newGridSize = parseFloat(baseGridSize * newScale).toFixed(1)
      if (newGridSize < 3) {
        newGridSize = 3
      }
      stageRef.value.style.backgroundSize = `${newGridSize}px ${newGridSize}px`
    }
  }
)

// Listen to stage Zoom and movement of
onMounted(() => {
  initStageData()
  updateSketchRuleConfig()
  // ExposeisLoadingExpose to global，headerAndtoolComponent use
  window.stageComponent = {
    get isLoading() {
      return isLoading.value
    },
    set isLoading(val) {
      isLoading.value = val
    }
  }

  // Add page leave event listener
  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('resize', () => {
    updateSketchRuleConfig()
  })

  // Register route leave guard
  const unregisterHook = router.beforeEach((to, from, next) => {
    const isViteDev = import.meta.env.DEV // No prompt in development environment
    if (from.path.includes('/stage/') && hasUnsavedChanges.value && !isViteDev) {
      ElMessageBox.confirm('there are unsaved changes，are you sure you want to leave？', 'prompt', {
        confirmButtonText: 'confirm',
        cancelButtonText: 'cancel',
        type: 'warning'
      })
        .then(() => {
          next()
        })
        .catch(() => {
          next(false)
        })
    } else {
      next()
    }
  })

  // Save route guard unregister function
  onBeforeUnmount(() => {
    unregisterHook() // Unregister route guard
  })
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateSketchRuleConfig)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  if (window.kdt) {
    window.kdt.destroy()
    window.kdt = null
  }
})
defineExpose({
  // Need to expose hererefTo parent component Parent component can getstageRef
  stageRef,
  isLoading
})
</script>

<style lang="scss" scoped>
.stage-body {
  position: relative;
  overflow: hidden;
  height: calc(100vh - 70px);
  background-color: var(--panel-bg-color);
  background-image:
    radial-gradient(#e7e7e7 10%, transparent 0), radial-gradient(#909090 10%, transparent 0);

  background-size: 15px 15px;
}
html.dark .stage-body {
  background-image:
    radial-gradient(#4e4e4e 10%, transparent 0), radial-gradient(#909090 10%, transparent 0);
}

.konva-Container {
  margin-left: 21px;
  margin-top: 21px;
  position: relative;
}

:deep(.rule-wrapper) {
  z-index: 999;

  .ruler,
  .corner {
    box-shadow: 0 0 8px -3px #757575;
    background-color: var(--panel-bg-color);
  }
  .corner {
    top: 20px;
    width: 20px !important;
    height: 20px !important;
    opacity: 0.9;
    background-size: 100% 100%;
  }

  .indicator .value {
    background-color: var(--panel-bg-color);
  }
}
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(243, 243, 243, 1);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

html.dark .loading-overlay {
  background-color: rgba(43, 43, 43, 1);
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid var(--panel-bg-color);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 15px;
  color: var(--primary-color);
  font-size: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
