<template>
  <div class="designPanel-wrapper">
    <el-row class="panel-header">
      <el-col :span="16">
        <el-input v-model="panelSearchVal" placeholder="search image materials" @input="handleSearch" />
      </el-col>
      <el-col :span="6" class="text-r primary-text-color flex-a-c " :offset="2">
        <svg-icon
          name="pin"
          size="14"
          class="pointer mr15 "
          :class="{ 'primary-color': isFixed }"
          @click="handleFixed"
        ></svg-icon>
        <svg-icon
          name="close"
          size="14"
          class="pointer  mr4 primary-text-color"
          @click="handleClose"
        ></svg-icon>
      </el-col>
    </el-row>
    <el-row class="panel-body">
      <el-col :span="6" class="border-r-1 text-c no-select">
        <div
          v-for="(item, index) in filteredMenuData"
          :key="index"
          @click="selectFirstLevel(index)"
          class="primary-text-color mb15"
          :class="{ selected: index === selectedFirstLevel }"
        >
          <svg-icon
            :name="item.icon"
            size="16"
            :class="index === 0 ? 'mt12' : 'mt6'"
            v-if="item.icon"
          ></svg-icon>
          <p class="ft13">{{item.title}}</p>
        </div>
      </el-col>
      <el-col :span="18" class="light-panel-bg pd-v4" style="overflow: hidden">
        <el-scrollbar :max-height="815">
          <!-- Single Level Submenu -->
          <template v-if="filteredMenuData[selectedFirstLevel]?.children.length === 1">
            <div
              class="panel-node-wrapper"
              :style="{
                'grid-template-columns': `repeat(${
                  filteredMenuData[selectedFirstLevel]?.columns || 2
                }, 1fr)`
              }"
            >
              <div
                v-for="child in filteredMenuData[selectedFirstLevel]?.children[0]?.children"
                :key="child.id"
                draggable="true"
                @click="handleModuleClick($event, child)"
                @dragstart="handleDragStart($event, child)"
                @mousedown="handleMouseDown($event, child)"
                @mouseup="handleMouseUp"
                @mouseleave="handleMouseUp"
                class="pointer mb6 primary-text-color node-item"
              >
                <!-- Add Tooltip Wrap -->
                <el-tooltip
                  placement="right"
                  effect="light"
                  :hide-after="0"
                  :disabled="disableTooltip"
                  popper-class="image-preview-tooltip"
                >
                  <template #content>
                    <el-image :src="child.props.data" loading="lazy" class="node-preview-img" />
                  </template>
                  <el-image :src="child.props.data" class="node-img" loading="lazy" fit="contain">
                    <template #error>
                      <div class="image-slot">
                        <el-icon><icon-picture /></el-icon>
                      </div>
                    </template>
                  </el-image>
                </el-tooltip>
                <p class="ft12 no-select">{{ child.title }}</p>
              </div>
            </div>
          </template>

          <!-- Multi Level Submenu -->
          <template v-else>
            <el-collapse v-model="activeNames" accordion class="panel-collapse">
              <el-collapse-item
                :name="index"
                v-for="(item, index) in filteredMenuData[selectedFirstLevel]?.children"
                :key="item.id"
              >
                <template #title>
                  <p class="ft12 mb6 ml10 no-select">{{ item.title }}</p>
                </template>
                <div
                  class="panel-node-wrapper"
                  :style="{
                    'grid-template-columns': `repeat(${
                      filteredMenuData[selectedFirstLevel]?.columns || 2
                    }, 1fr)`
                  }"
                >
                  <div
                    v-for="child in item.children"
                    :key="child.id"
                    draggable="true"
                    @click="handleModuleClick($event, child)"
                    @dragstart="handleDragStart($event, child)"
                    @mousedown="handleMouseDown($event, child)"
                    @mouseup="handleMouseUp"
                    @mouseleave="handleMouseUp"
                    class="pointer mb6 primary-text-color node-item"
                  >
                    <!-- Also Add Tooltip Wrap -->
                    <el-tooltip
                      placement="right"
                      effect="light"
                      :hide-after="0"
                      :disabled="disableTooltip"
                      popper-class="image-preview-tooltip"
                    >
                      <template #content>
                        <el-image :src="child.props.data" class="node-preview-img" />
                      </template>
                      <el-image
                        :src="child.props.data"
                        class="node-img"
                        loading="lazy"
                        fit="contain"
                      >
                        <template #error>
                          <div class="image-slot">
                            <el-icon><icon-picture /></el-icon>
                          </div>
                        </template>
                      </el-image>
                    </el-tooltip>
                    <p class="ft12 no-select">{{ child.title }}</p>
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </template>
        </el-scrollbar>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { getMoudleData } from '@/config/menu.js'
import { ref, computed, getCurrentInstance, watch, onUnmounted } from 'vue'
const { proxy } = getCurrentInstance() // Get Current Component Instance
import { Picture as IconPicture } from '@element-plus/icons-vue' // Import Icon Component

const panelSearchVal = ref('') // Value of Search Input Box
const selectedFirstLevel = ref(0) // Record the Index of Selected First-Level Menu
const activeNames = ref([]) // Record Currently Active Collapsed Items
const isFixed = ref(false) // Whether to Fix the Panel
const disableTooltip = ref(false) // Control tooltip Whether to Hide
const longPressTimer = ref(null)
const longPressDelay = 150 // Long Press Delay Time（Milliseconds）
onUnmounted(() => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
  }
})
// Hide tooltip Method of
const hideTooltipTemporarily = () => {
  disableTooltip.value = true
  setTimeout(() => {
    disableTooltip.value = false
  }, 300)
}

// Handle Search Function
const handleSearch = (value) => {
  panelSearchVal.value = value // Update Value of Search Input Box
}

// Select First-Level Menu Item
const selectFirstLevel = (index) => {
  selectedFirstLevel.value = index // Update Index of Selected First-Level Menu
  activeNames.value = [] // Reset Expand State of Secondary Collapsible Menu Items
}

// Handle Drag Start Event
const handleDragStart = (event, item) => {
  hideTooltipTemporarily()
  item.type = 'image' // Set Drag Object Type
  event.dataTransfer.setData('application/json', JSON.stringify(item)) // Set Data Transferred by Drag
}

// Handle Mouse Down Event
const handleMouseDown = (event, item) => {
  // Clear Previous Timer
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
  }

  // Set Long Press Timer
  longPressTimer.value = setTimeout(() => {
    hideTooltipTemporarily()
  }, longPressDelay)
}

// Handle Mouse Up or Leave Event
const handleMouseUp = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

// Filter Submenus，Filter Qualified Subitems Based on Keywords
const filterChildren = (children, keyword) => {
  return children
    .map((child) => {
      const match = child.title.includes(keyword) // Check if Matches Keyword
      const filteredChildren =
        child.children?.filter((grandchild) => grandchild.title.includes(keyword)) || [] // Filter Qualified Descendant Items
      return {
        ...child,
        children: filteredChildren.length > 0 ? filteredChildren : child.children, // If There Are Qualified Descendant Items，Then Keep
        match: match || filteredChildren.length > 0 // Mark Whether Matches Current Keyword
      }
    })
    .filter((child) => child.match) // Only Return Matched Items
}

// Calculate and Return Filtered Menu Data
const filteredMenuData = computed(() => {
  const MenuData = getMoudleData('design') // Get Original Menu Data
  if (!panelSearchVal.value) {
    return MenuData // If There Are No Search Keywords，Directly Return Original Data
  }
  return MenuData.map((menu) => ({
    ...menu,
    children: filterChildren(menu.children || [], panelSearchVal.value) // Filter Submenus Based on Search Keywords
  })).filter((menu) => menu.children && menu.children.length > 0) // Return Menus with Qualified Subitems
})

// Listen for Menu Data Changes，Reset First-Level Menu Selection
watch(filteredMenuData, (newVal) => {
  if (newVal.length > 0) {
    selectedFirstLevel.value = 0 // Select First First-Level Menu by Default
  }
})

// Handle Panel Close Event
const handleClose = () => {
  proxy.$emitEvent('leftPanelClosed', 1) // Trigger Custom Event，Notify Parent Component that Panel is Closed
}

// Handle Panel Fix Event
const handleFixed = () => {
  isFixed.value = !isFixed.value // Toggle Fixed State
  proxy.$emitEvent('leftPanelFixed', {
    isFixed: isFixed.value,
    index: 1 // Pass Current Panel Index
  })
}
// Handle Module Click Event，Create Corresponding Image Node
const handleModuleClick = (event, moduleData) => {
  hideTooltipTemporarily()
  moduleData.type = 'image'
  event.moduleData = moduleData
  window.kdt.addNode(event)
}
</script>

<style lang="scss" scoped>
.node-preview-img {
  width: auto;
  height: auto;
  min-width: 150px;
  max-width: 300px;
  transition: 0.6s;
  -webkit-mask: linear-gradient(135deg, #000c 40%, #000, #000c 50%) 100% 100%/250% 250%;
  animation: maskAnimation 0.5s ease 0.3s forwards;
}
.tooltip-image-container {
  max-height: 500px;
  overflow-y: auto;
  display: flex;
  justify-content: center;
}
@keyframes maskAnimation {
  from {
    -webkit-mask-position: 100% 100%;
  }
  to {
    -webkit-mask-position: 0 0;
  }
}
.designPanel-wrapper {
  background-color: var(--panel-bg-color);
  height: 100%;
  width: 240px;

  .panel-header {
    height: 50px;
    display: flex;
    opacity: 0.8;
    align-items: center;
    background-color: var(--panel-border-out-color);
    padding: 0 6px;
  }

  .panel-body {
    height: calc(100% - 20px);

    .frist-active {
      color: #fff;
      background-color: #3f5c8c;
    }
  }

  .selected {
    color: var(--primary-color);
  }

  .light-panel-bg {
    .selected {
      background-color: rgba(var(--primary-color), 0.6);
      border-radius: 4px;
    }
  }

  .panel-node-wrapper {
    display: grid;
    /* Display Two Pictures per Row */
    gap: 5px;
    padding: 10px;
    overflow-y: auto;

    &::-webkit-scrollbar {
      display: none;
    }

    -ms-overflow-style: none;
    scrollbar-width: none;

    .node-item {
      display: flex;
      align-items: center;
      flex-direction: column;
      margin: 2px 0 5px;
      text-align: center;

      .node-img {
        margin-bottom: 6px;
        height: 60px;
        max-width: 90%;
        transition: 0.6s;
      }

      p {
        opacity: 0.8;
      }
    }
  }

  .scroll-tip {
    opacity: 0.4;
    text-align: center;
    padding: 10px;
    font-size: 12px;
    color: var(--primary-text-color);
  }

  .image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 60px;
    height: 60px;
    border-radius: 2px;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-secondary);
    font-size: 30px;

    .el-icon {
      font-size: 30px;
    }
  }
  .panel-collapse {
    border-top: none;
  }
}
</style>
