<template>
  <div v-loading.fullscreen.lock="loading" element-loading-text="loading...">
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

// Get the route
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
  // Check the current document status
  if (document.readyState === 'complete') {
    // If it has already loaded completely，Close directly loading
    loading.value = false
  } else {
    // Otherwise，Add event listener
    document.addEventListener('readystatechange', () => {
      if (document.readyState === 'complete') {
        loading.value = false
      }
    })
    // Add a fallback timeout mechanism，Ensure that the loading state can also be closed in extreme cases
    setTimeout(() => {
      if (loading.value) {
        console.warn('loading timeout，force close loading state')
        loading.value = false
      }
    }, 10000) // 10Seconds timeout
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
