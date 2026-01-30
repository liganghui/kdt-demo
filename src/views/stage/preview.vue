<template>
  <div
    class="stage-body"
    v-loading.fullscreen.lock="loading"
    element-loading-text="正在加载画布..."
  >
    <div
      id="konvaContainer"
      class="konva-Container"
      @dragover.prevent
      @drop="handleDrop"
      v-show="!loading"
    />
    <!-- 缩放模式菜单  -->
    <transition name="menu-slide">
      <view v-if="showScaleMenu" :class="['zoom-menu', isMobile ? 'mobile-menu' : '']">
        <!-- 刷新按钮 -->
        <el-tooltip effect="dark" content="刷新页面" placement="right" :disabled="isMobile">
          <el-button link @click="refreshPage" class="mb5">
            <svg-icon name="refresh" size="18"></svg-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip effect="dark" content="自动铺满" placement="right" :disabled="isMobile">
          <el-button
            link
            @click="updateScale('fill')"
            :class="{ 'active-scale-button': currentScaleMode === 'fill' }"
          >
            <svg-icon name="auto-fill" size="18"></svg-icon>
          </el-button>
        </el-tooltip>

        <el-tooltip effect="dark" content="宽度铺满" placement="right" :disabled="isMobile">
          <el-button
            link
            @click="updateScale('fitWidth')"
            class="mt10"
            :class="{ 'active-scale-button': currentScaleMode === 'fitWidth' }"
          >
            <svg-icon name="width-fill" size="18"></svg-icon>
          </el-button>
        </el-tooltip>

        <el-tooltip effect="dark" content="高度铺满" placement="right" :disabled="isMobile">
          <el-button
            link
            @click="updateScale('fitHeight')"
            class="mt10"
            :class="{ 'active-scale-button': currentScaleMode === 'fitHeight' }"
          >
            <svg-icon name="height-fill" size="18"></svg-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip effect="dark" content="关闭菜单" placement="right" :disabled="isMobile">
          <el-button link @click="toggleMenu" class="mt10">
            <svg-icon name="hide-menu" size="18"></svg-icon>
          </el-button>
        </el-tooltip>
      </view>
    </transition>
    <div
      :class="['menu-toggle-bar', isMobile ? 'mobile-slide' : '']"
      v-if="!showScaleMenu"
      @click="toggleMenu"
    ></div>
  </div>
</template>
<script setup>
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { getStageData } from '@/api/system'
import { useKonvaStage } from './composables/useKonvaStage'
const store = useStore()
const route = useRoute()
// ** 初始化画布 **
const { kdt, stage } = useKonvaStage()
const showScaleMenu = ref(false)
const isMobile = ref(false)
const loading = ref(false)
const isFromEditor = ref(false)
const isDeployMode = import.meta.env.MODE === 'deploy'
const currentScaleMode = ref(store.state.stage.systemConfig?.scaleMethod || 'fill')
let params = ref({})
let query = ref({})
let isMobileRotation = ref(false)
window.kdt = kdt
// 初始化配置信息
const initConfig = (stageJson) => {
  store.dispatch('setSystemConfig', stageJson?.systemConfig ? stageJson.systemConfig : {})
  currentScaleMode.value = stageJson?.systemConfig?.scaleMethod || 'fill'
}

// 初始化绘制及预览模式设置
const initDraw = (stageJSON) => {
  setTimeout(() => {
    const allowMobileRotation = store.state.stage.systemConfig.allowMobileRotation !== false
    if (allowMobileRotation && isMobile.value) {
      document.body.classList.add('preview-mobile')
    } else {
      document.body.classList.remove('preview-mobile')
    }
    loading.value = true
    kdt.value.initStage(stageJSON)
    setTimeout(() => {
      if (isMobile.value) {
        setTimeout(() => {
          if (allowMobileRotation) {
            kdt.value.setMobileRotation(true)
            isMobileRotation.value = true
          } else {
            kdt.value.setMobileRotation(false)
            isMobileRotation.value = false
          }
          kdt.value.autoStageScale(
            window.innerWidth,
            window.innerHeight,
            store.state.stage.systemConfig.scaleMethod || 'fill',
            false,
            false
          )
        }, 250)
      }

      window.kdt.setStageMode('preview')
      if (store.state.stage.systemConfig.disableStageScale) {
        window.kdt.disableStageZoom()
      } else {
        window.kdt.enableStageZoom()
      }
      // 画布初始化完成后，触发事件
      setTimeout(() => {
        loading.value = false
        window.kdt.setStageMode('preview')
      }, 300)
    })
  }, 50)
}

// 更新缩放设置
const updateScale = (type) => {
    currentScaleMode.value = type // 更新当前缩放模式
    const scaleType =
      store.state.stage.systemConfig && store.state.stage.systemConfig.scaleMethod
        ? store.state.stage.systemConfig.scaleMethod
        : type
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    window.kdt.autoStageScale(windowWidth, windowHeight, type || scaleType,false, false,false,{...store.state.stage.systemConfig})
}
const init = async (isUnGetCanvasInfo) => {
  if (isMobileBrowser()) {
    isMobile.value = true
  }
  const isViteDev = import.meta.env.DEV
  try {
    window.kdt.setStageMode('preview')
    let stageJson

    if (isDeployMode) {
      stageJson = getStageJsonFromGlobalData()
    } else {
      stageJson = getStageJsonFromLocalStorage()
      if (!stageJson) {
        stageJson = await getStageJsonFromAPI()
      }
    }

    if (!stageJson) {
      throw new Error('无法获取画布数据')
    }
    initConfig(stageJson)
    initDraw(stageJson.stage)
    
    setTimeout(() => {
      window.kdt.setStageMode('preview')
      updateScale(currentScaleMode.value)
    }, 300)
  } catch (error) {
    console.error('预览解析报错', error)
    ElMessage({
      message: '画布数据解析异常',
      type: 'error'
    })
  }

  window.addEventListener('resize', (e) => {
    updateScale(currentScaleMode.value)
  })
  if (isFromEditor.value) {
    showScaleMenu.value = true
  } else {
    showScaleMenu.value = false
  }
}
onMounted(async () => {
  if (route.query.token && route.query.token !== "") {
    localStorage.setItem('Authorization', route.query.token);
    sessionStorage.setItem('Authorization', route.query.token);
  }
  params.value = route.params;
  query.value = route.query;
   init();
});
// 获取 GlobalData 中的画布数据
const getStageJsonFromGlobalData = () => {
  if (isDeployMode && window.GlobalData) {
    return window.GlobalData || null
  }
  return null
}

// 获取 localStorage 中的画布数据
const getStageJsonFromLocalStorage = () => {
  try {
    const rawData = localStorage.getItem('tmpStageData')
    if (!rawData) return null
    return rawData
  } catch (error) {
    console.error('读取本地数据失败:', error)
    // 清理损坏的数据
    localStorage.removeItem('tmpStageData')
    localStorage.removeItem('tmpStageData_compressed')
    return null
  }
}

// 获取 API 中的画布数据
const getStageJsonFromAPI = async () => {
  if (!params.value.previewId) {
    return null
  }

  try {
    const res = await getStageData({ id: params.value.previewId })
    if (res.code === 200) {
      const stageJson = res.data?.stageJson || null
      if (stageJson) {
        // 如果是从API获取到数据并且本地有数据，进行对比
        compareAndUpdateLocalData(res.data, stageJson)
      }
      return stageJson
    }
    ElMessage({
      message: '获取画布数据异常',
      type: 'warning'
    })
    return null
  } catch (error) {
    console.error('API 请求失败', error)
    ElMessage({
      message: '画布数据请求失败',
      type: 'error'
    })
    return null
  }
}

// 比较 API 数据和本地数据，更新本地存储
const compareAndUpdateLocalData = (apiData, stageJson) => {
  const localData = localStorage.getItem('tmpStageData')
    ? JSON.parse(localStorage.getItem('tmpStageData'))
    : null

  if (localData && apiData.time > localData.timestamp) {
    ElMessage({
      message: '服务器上有更新的版本，建议刷新页面',
      type: 'info',
      showClose: true
    })
    localStorage.removeItem('tmpStageData') // 删除过期的本地数据
  }
}

const isMobileBrowser = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera
  const mobileTest = /android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  const iPadTest =
    navigator.userAgent.match(/(iPad)/) ||
    (navigator.userAgent.match(/(Macintosh)/) && navigator.maxTouchPoints >= 1)
  return mobileTest || iPadTest
}
// 切换侧边菜单显示
const toggleMenu = () => {
  showScaleMenu.value = !showScaleMenu.value
}
// 刷新页面方法
const refreshPage = () => {
  window.location.reload()
}
</script>

<style lang="scss" scoped>
.stage-body {
  position: relative;
  overflow: hidden;
  width: 100vw;
  height: 100vh;
}

.konva-Container {
  position: relative;
}

.zoom-menu {
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 68vh;
  background-color: #706f6f;
  left: 4vh;
  box-shadow: 0 0 18px 1px rgba($color: #000000, $alpha: 0.1);
  border-radius: 6px;
  padding: 4px;
  z-index: 9999;
  .el-button {
    color: rgb(223, 222, 222);
  }
}

:deep(.el-button + .el-button) {
  margin-left: 0;
}

.menu-toggle-bar {
  position: fixed;
  top: 88vh;
  left: 0;
  width: 14px;
  height: 30px;
  z-index: 9999;
  border-left: 4px solid rgb(61, 61, 61);
  opacity: 0.5;
  cursor: pointer;
  transform: translateY(-50%);
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}
.active-scale-button {
  color: var(--primary-color) !important;
}
.menu-slide-enter-active,
.menu-slide-leave-active {
  transition: all 0.3s ease;
}

.menu-slide-enter-from,
.menu-slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.mobile-menu {
  transform: rotate(90deg);
  top: -3.6vh;
  left: 22vw;
}

.mobile-slide {
  transform: rotate(90deg);
  top: 0vh;
  left: 22vw;
}
.isMobileRotationTrue {
  position: absolute;
  top: calc(100% - 155px);
  right: calc(0% - 89px);
  // border: 1px solid green ;
  z-index: 9999;
  transform: rotate(90deg);
  transform-origin: center;
}

.isMobileRotationFalse {
  position: absolute;
  top: 20px;
  right: 20px;
  //  border: 1px solid red ;
  z-index: 9999;
}
</style>