<template>
  <div v-loading.fullscreen.lock="loading" element-loading-text="正在加载...">
    <div class="canvas-header" v-show="!loading">
      <Header  ref="headerRef" />
    </div>
    <div class="canvas-container" v-show="!loading">
      <section class="sidebar" v-show="isPanelShow">
        <LeftPanels  ref="leftPanelsRef" />
      </section>
      <section class="canvas-body" :style="{ width: 'calc(100vw - ' + bodyWidth + 'px)' }">
        <Tool  ref="toolRef" />
        <Stage ref="stageRef"  />
      </section>
      <section class="sidebar" v-show="isPanelShow">
        <RightPanels " ref="rightPanelsRef" />
      </section>
    </div>
  </div>
</template>

<script setup>
import { useStore } from 'vuex'
import { computed, watch, ref, onMounted, onBeforeMount } from 'vue'
import LeftPanels from '@/views/stage/leftPanels/index.vue'
import RightPanels from '@/views/stage/rightPanels/index.vue'
import Stage from '@/views/stage/stage.vue'
import Header from '@/views/stage/header.vue'
import Tool from '@/views/stage/tool.vue'

// 获取路由
const store = useStore()
const activeLeftPanels = computed(() => store.state.system.activeLeftPanels)
const isPanelShow = computed(() => store.state.system.isPanelShow)
const bodyWidth = ref(621)
const loading = ref(true)

watch(activeLeftPanels, (newVal) => {
  if (isPanelShow.value) {
    bodyWidth.value = newVal.length * 300 + 300 + 21
  } else {
    bodyWidth.value = 21
  }
})

onBeforeMount(() => {
})

onMounted(() => {
  // 检查当前文档状态
  if (document.readyState === 'complete') {
    // 如果已经加载完成，直接关闭 loading
    loading.value = false
  } else {
    // 否则，添加事件监听器
    document.addEventListener('readystatechange', () => {
      if (document.readyState === 'complete') {
        loading.value = false
      }
    })
    // 添加备用超时机制，确保在极端情况下也能关闭加载状态
    setTimeout(() => {
      if (loading.value) {
        console.warn('加载超时，强制关闭加载状态')
        loading.value = false
      }
    }, 10000) // 10秒超时
  }
})
</script>

<style lang="scss" scoped>
.canvas-container {
  display: flex;
  overflow: hidden;
}

.sidebar {
  overflow: hidden;
}

.canvas-header {
  height: 40px;
}

.canvas-body {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: hidden;
}

.tour-wrapper {
  padding: 10px 20px;
  color: var(--sub-text-color);
  .tour-sub-title {
    color: var(--primary-color);
  }
}
</style>
