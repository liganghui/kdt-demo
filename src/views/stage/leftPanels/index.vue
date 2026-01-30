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
const { proxy } = getCurrentInstance()  // Get the proxy object of the current instance，Used for event listening


// Import each panel component
import DesignPanel from './components/DesignPanel/index.vue'
import LayersPanel from './components/LayersPanel/index.vue'
import ModulePanel from './components/ModulePanel/index.vue'
import HistoryPanel from './components/HistoryPanel/index.vue'


// Define the left panel container's ref，Used to expose to the parent component for operation DOM
const leftPanelContaninerRef = ref(null)
// Get vuex 's store Instance
const store = useStore()
// Currently active menu item index，Default to 0（Which means the control panel is displayed by default）
const activeIndex = ref(0)
// Store an array of panel information for fixed display，Each element contains { index, isFixed } Properties
const fixedPanels = ref([])
// Menu item array，Contains name and corresponding icon
const menuItems = [
 { name: 'Component', icon: 'moudle-two' },
  { name: 'Material', icon: 'design' },
  { name: 'Layer', icon: 'layers' },
  { name: 'History', icon: 'history' },
]
// Logic executed after component mounting is completed
onMounted(() => {
  // Set the default active panel during initialization
  store.dispatch('setActiveLeftPanels', ['Component'])
  // Listen for events related to panels，Such as close and fix operations
  handleEventListen()
})

/**
 * Set the active menu item
 * @param {Number} index - Clicked menu item index
 */
const setActive = (index) => {
  if (index === activeIndex.value) {
    // If the already active menu is clicked，Then cancel the active state，and remove the fixed state
    activeIndex.value = ''
    fixedPanels.value = fixedPanels.value.filter((item) => item.index !== index)
  } else if (isFixed(index)) {
    // If the current menu item is in a fixed state，Then cancel the fixed state
    fixedPanels.value = fixedPanels.value.filter((item) => item.index !== index)
  } else {
    // Otherwise, set the menu item to active state
    activeIndex.value = index
  }
  // Update vuex Active panel list stored in
  updateActiveLeftPanels()
}

/**
 * Check if the panel at the specified index is in a fixed state
 * @param {Number} index - Menu item index
 * @returns {Boolean} Whether it is fixed
 */
const isFixed = (index) => {
  return fixedPanels.value.some((panel) => panel.index === index && panel.isFixed)
}

/**
 * Listen for events on the proxy instance（including panel close and fix events）
 */
const handleEventListen = () => {
  // Listen for left panel close events
  proxy.$onEvent('leftPanelClosed', (index) => {
    // Remove the corresponding panel from the fixed panel array
    fixedPanels.value = fixedPanels.value.filter((item) => item.index !== index)
    // If the closed panel is currently active，Then clear the active state
    if (index === activeIndex.value) {
      activeIndex.value = ''
    }
    // Update vuex Active panel list stored in
    updateActiveLeftPanels()
  })
  // Listen for left panel fixed state change events
  proxy.$onEvent('leftPanelFixed', (value) => {
    // Find if the panel already exists in the fixed array
    const existingPanel = fixedPanels.value.find((item) => item.index === value.index)
    if (existingPanel) {
      // Update the fixed state of the panel
      existingPanel.isFixed = value.isFixed
    } else {
      // If it does not exist, add new fixed panel information
      fixedPanels.value.push(value)
    }
    // Update vuex Active panel list stored in
    updateActiveLeftPanels()
  })
}

/**
 * Update vuex Active left panel list stored in
 */
const updateActiveLeftPanels = () => {
  // Filter out panel items that are active or in a fixed state
  const activePanels = menuItems.filter(
    (item, index) => index === activeIndex.value || isFixed(index)
  )
  store.dispatch('setActiveLeftPanels', activePanels)
}

defineExpose({
  // Need to expose hererefto the parent component so that the parent component can obtainleftPanelContaninerRef
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

