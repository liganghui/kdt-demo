<template>
  <div class="stage-body" ref="stageRef">
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <div class="loading-text">缩略图保存中...</div>
      </div>
    </div>
    <!-- 标尺 -->
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
    <!-- 画布容器 -->
    <div id="konvaContainer" class="konva-Container" @dragover.prevent @drop="handleDrop" />
    <!-- 右击菜单 -->
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
// 标尺key 避免不更新
let SketchRuleKey = 0
// 两个侧边栏宽度加标尺宽度 (侧边栏宽度300 标尺宽度21)
const siderWidth = ref(621)
const toolHeight = ref(92)
// 标尺初始化配置
const SketchRuleConfig = reactive({
  scale: 1,
  startX: 0, // 标尺初始位置
  startY: 0,
  width: window.innerWidth - siderWidth.value,
  height: window.innerHeight - toolHeight.value,
  thick: 20,
  lines: { h: [], v: [] }, // 初始化标尺线
  isShowRuler: true, // 显示标尺
  isShowReferLine: true // 显示参考线
})

// 更新背景缩放偏移量
const updateBackground = (stage, newScale, newPosition) => {
  if (stageRef.value) {
    const baseGridSize = 15 // 基准网格尺寸
    let newGridSize = baseGridSize * newScale
    if (newGridSize < 3) newGridSize = 3
    // 更新背景大小
    stageRef.value.style.backgroundSize = `${newGridSize}px ${newGridSize}px`
    // 计算背景图的偏移量，减去一半的背景格宽度
    const offsetX = (newPosition.x % newGridSize) - newGridSize / 2
    const offsetY = (newPosition.y % newGridSize) - newGridSize / 2
    // 更新背景位置
    stageRef.value.style.backgroundPosition = `${offsetX}px ${offsetY}px`
  }
}
// 更新标尺信息
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

// 处理左侧面板节点拖拽到画布的事件
const handleDrop = (event) => {
  if (!event.dataTransfer.getData('application/json')) {
    return
  }
  if (kdt.value.getStageMode() !== 'edit') {
    ElMessage({
      message: '当前处于预览模式，无法添加',
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
// ** 初始化画布 ***
const { kdt, stage } = useKonvaStage(menuRef, updateSketchRuleConfig)
// 获取左侧栏面板数据
const activeLeftPanels = computed(() => store.state.system.activeLeftPanels)
// 获取右侧属性面板是否显示
const isPanelShow = computed(() => store.state.system.isPanelShow)

// 处理加载画布数据的函数
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
    console.error('加载画布数据失败:', err)
    ElMessage({
      message: fromUnsaved ? '恢复未保存数据失败' : '加载画布数据失败',
      type: 'error',
      duration: 3000
    })
    return false
  }
}

// 初始化画布数据
const initStageData = () => {
  const buildId = route.params.buildId
  if (buildId) {
    // 获取画布数据
    getStageData({ id: buildId })
      .then((res) => {
        if (res.code === 200) {
          console.log('获取画布数据成功:', res.data)
          const loadSuccess = loadStageData(res.data)
        } else {
          ElMessage({
            message: '获取画布数据异常',
            type: 'warning'
          })
        }
      })
      .catch((err) => {
        console.error('获取画布数据失败:', err)
        ElMessage({
          message: '获取画布数据失败',
          type: 'error'
        })
      })
  } else {
    initDraw()
    ElMessage({
      message: '画布参数异常',
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
    // 开发环境下不显示
    if (!import.meta.env.DEV) {
       //   checkUnsavedData()
    }
  }, 300)
}

// 页面离开提示
const handleBeforeUnload = (e) => {
  if (hasUnsavedChanges.value) {
    e.preventDefault()
    e.returnValue = '有未保存的更改，确定要离开吗？'
    return e.returnValue
  }
}

// 预览模式时 重新计算标尺
watch(isPanelShow, (newVal) => {
  if (newVal) {
    siderWidth.value = activeLeftPanels.value.length * 300 + 300 + 21
  } else {
    siderWidth.value = 21
  }
  updateSketchRuleConfig()
})
// 根据左侧面板数量计算标尺
watch(activeLeftPanels, (newVal) => {
  siderWidth.value = newVal.length * 300 + 300 + 21
  updateSketchRuleConfig()
})
//  监听画布缩放更新背景点的大小
watch(
  () => SketchRuleConfig.scale,
  (newScale) => {
    if (stageRef.value) {
      const baseGridSize = 15 // 默认背景格尺寸
      // 根据 stage 缩放比例计算新的背景尺寸
      let newGridSize = parseFloat(baseGridSize * newScale).toFixed(1)
      if (newGridSize < 3) {
        newGridSize = 3
      }
      stageRef.value.style.backgroundSize = `${newGridSize}px ${newGridSize}px`
    }
  }
)

// 监听 stage 的缩放和移动
onMounted(() => {
  initStageData()
  updateSketchRuleConfig()
  // 将isLoading暴露给全局，header和tool组件使用
  window.stageComponent = {
    get isLoading() {
      return isLoading.value
    },
    set isLoading(val) {
      isLoading.value = val
    }
  }

  // 添加页面离开事件监听
  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('resize', () => {
    updateSketchRuleConfig()
  })

  // 注册路由离开守卫
  const unregisterHook = router.beforeEach((to, from, next) => {
    const isViteDev = import.meta.env.DEV // 开发环境是不提示
    if (from.path.includes('/stage/') && hasUnsavedChanges.value && !isViteDev) {
      ElMessageBox.confirm('有未保存的更改，确定要离开吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
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

  // 保存路由守卫注销函数
  onBeforeUnmount(() => {
    unregisterHook() // 注销路由守卫
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
  // 这里要暴露ref给父组件 父组件才能获取到stageRef
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
