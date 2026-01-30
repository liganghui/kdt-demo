<template>
  <div class="left-panel-contaniner" ref="leftPanelContaninerRef">
    <div class="menu-wrapper">
      <div
        class="menu-item no-select"
        v-for="(item, index) in menuItems"
        :key="index"
        :class="{ active: activeIndex === index || isFixed(index) }"
        @click="setActive(index)"
      >
        <svg-icon :name="item.icon" size="18"></svg-icon>
        <span>{{ item.name }}</span>
      </div>
    </div>
    <div v-show="activeIndex === 0 || isFixed(0)" class="panel">
      <ModulePanel />
    </div>
    <div v-show="activeIndex === 1 || isFixed(1)" class="panel">
      <DesignPanel />
    </div>
    <div v-if="activeIndex === 2 || isFixed(2)" class="panel">
      <LayersPanel />
    </div>
    <div v-if="activeIndex === 3 || isFixed(3)" class="panel">
      <HistoryPanel />
    </div>
  </div>
</template>

<script setup>
import { useStore } from 'vuex'
import { ref, onMounted, getCurrentInstance } from 'vue'
const { proxy } = getCurrentInstance()  // 获取当前实例的代理对象，用于事件监听


// 导入各个面板组件
import DesignPanel from './components/DesignPanel/index.vue'
import LayersPanel from './components/LayersPanel/index.vue'
import ModulePanel from './components/ModulePanel/index.vue'
import HistoryPanel from './components/HistoryPanel/index.vue'


// 定义左侧面板容器的 ref，用于暴露给父组件操作 DOM
const leftPanelContaninerRef = ref(null)
// 获取 vuex 的 store 实例
const store = useStore()
// 当前激活的菜单项索引，默认为 0（即默认显示控件面板）
const activeIndex = ref(0)
// 存储固定显示的面板信息数组，每个元素包含 { index, isFixed } 属性
const fixedPanels = ref([])
// 菜单项数组，包含名称和对应的图标
const menuItems = [
 { name: '控件', icon: 'moudle-two' },
  { name: '素材', icon: 'design' },
  { name: '图层', icon: 'layers' },
  { name: '历史记录', icon: 'history' },
]
// 组件挂载完成后执行的逻辑
onMounted(() => {
  // 初始化时将默认激活的面板
  store.dispatch('setActiveLeftPanels', ['控件'])
  // 监听面板相关的事件，如关闭和固定操作
  handleEventListen()
})

/**
 * 设置激活的菜单项
 * @param {Number} index - 点击的菜单项索引
 */
const setActive = (index) => {
  if (index === activeIndex.value) {
    // 如果点击已激活的菜单，则取消激活状态，并移除固定状态
    activeIndex.value = ''
    fixedPanels.value = fixedPanels.value.filter((item) => item.index !== index)
  } else if (isFixed(index)) {
    // 如果当前菜单项处于固定状态，则取消固定状态
    fixedPanels.value = fixedPanels.value.filter((item) => item.index !== index)
  } else {
    // 否则将该菜单项设置为激活状态
    activeIndex.value = index
  }
  // 更新 vuex 中存储的激活面板列表
  updateActiveLeftPanels()
}

/**
 * 检查指定索引的面板是否处于固定状态
 * @param {Number} index - 菜单项索引
 * @returns {Boolean} 是否固定
 */
const isFixed = (index) => {
  return fixedPanels.value.some((panel) => panel.index === index && panel.isFixed)
}

/**
 * 监听代理实例上的事件（包括面板关闭和固定事件）
 */
const handleEventListen = () => {
  // 监听左侧面板关闭事件
  proxy.$onEvent('leftPanelClosed', (index) => {
    // 从固定面板数组中移除对应的面板
    fixedPanels.value = fixedPanels.value.filter((item) => item.index !== index)
    // 如果关闭的面板正处于激活状态，则清空激活状态
    if (index === activeIndex.value) {
      activeIndex.value = ''
    }
    // 更新 vuex 中存储的激活面板列表
    updateActiveLeftPanels()
  })
  // 监听左侧面板固定状态变化事件
  proxy.$onEvent('leftPanelFixed', (value) => {
    // 查找该面板是否已存在于固定数组中
    const existingPanel = fixedPanels.value.find((item) => item.index === value.index)
    if (existingPanel) {
      // 更新该面板的固定状态
      existingPanel.isFixed = value.isFixed
    } else {
      // 不存在则添加新的固定面板信息
      fixedPanels.value.push(value)
    }
    // 更新 vuex 中存储的激活面板列表
    updateActiveLeftPanels()
  })
}

/**
 * 更新 vuex 中存储的激活左侧面板列表
 */
const updateActiveLeftPanels = () => {
  // 筛选出激活或处于固定状态的面板项
  const activePanels = menuItems.filter(
    (item, index) => index === activeIndex.value || isFixed(index)
  )
  store.dispatch('setActiveLeftPanels', activePanels)
}

defineExpose({
  // 这里要暴露ref给父组件 父组件才能获取到leftPanelContaninerRef
  leftPanelContaninerRef
})
</script>

<style lang="scss" scoped>
.left-panel-contaniner {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.menu-wrapper {
  display: flex;
  min-width: 60px;
  height: 100%;
  flex-direction: column;
  background-color: var(--panel-border-out-color);
  padding: 10px 2px 10px 0;
  position: relative;
  border-right: 1px solid var(--panel-border-color);
  .menu-item {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: var(--text-color);
    cursor: pointer;
    border-left: 1px solid transparent;
    margin-bottom: 30px;
    transition: all 0.25s;
    font-size: 13px;

    span {
      text-align: center;
      margin-top: 4px;
    }

    &.active {
      border-left: 1px solid var(--primary-color);
      color: var(--primary-color);
    }

    &:hover {
      border-left: 1px solid var(--primary-color);
      color: var(--primary-color);
    }
  }

  .help-wrapper {
    position: absolute;
    bottom: 0;
    color: var(--text-color);
    cursor: pointer;
    transition: all 0.25s;
    font-size: 13px;
    width: 100%;
    padding-bottom: 6px;
    opacity: 0.9;

    &.active {
      color: var(--primary-color);
    }

    &:hover {
      color: var(--primary-color);
    }
  }
}
</style>

