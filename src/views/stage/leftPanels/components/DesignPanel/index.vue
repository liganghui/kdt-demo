<template>
  <div class="designPanel-wrapper">
    <el-row class="panel-header">
      <el-col :span="16">
        <el-input v-model="panelSearchVal" placeholder="搜索图像素材" @input="handleSearch" />
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
          <!-- 单层子菜单 -->
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
                <!-- 增加 Tooltip 包裹 -->
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

          <!-- 多层子菜单 -->
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
                    <!-- 同样增加 Tooltip 包裹 -->
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
const { proxy } = getCurrentInstance() // 获取当前组件实例
import { Picture as IconPicture } from '@element-plus/icons-vue' // 引入图标组件

const panelSearchVal = ref('') // 搜索输入框的值
const selectedFirstLevel = ref(0) // 记录选中的一级菜单索引
const activeNames = ref([]) // 记录当前激活的折叠项
const isFixed = ref(false) // 是否固定面板
const disableTooltip = ref(false) // 控制 tooltip 是否隐藏
const longPressTimer = ref(null)
const longPressDelay = 150 // 长按延迟时间（毫秒）
onUnmounted(() => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
  }
})
// 隐藏 tooltip 的方法
const hideTooltipTemporarily = () => {
  disableTooltip.value = true
  setTimeout(() => {
    disableTooltip.value = false
  }, 300)
}

// 处理搜索功能
const handleSearch = (value) => {
  panelSearchVal.value = value // 更新搜索输入框的值
}

// 选择一级菜单项
const selectFirstLevel = (index) => {
  selectedFirstLevel.value = index // 更新选中的一级菜单索引
  activeNames.value = [] // 重置二级折叠菜单项的展开状态
}

// 处理拖拽开始事件
const handleDragStart = (event, item) => {
  hideTooltipTemporarily()
  item.type = 'image' // 设置拖拽对象类型
  event.dataTransfer.setData('application/json', JSON.stringify(item)) // 设置拖拽传递的数据
}

// 处理鼠标按下事件
const handleMouseDown = (event, item) => {
  // 清除之前的定时器
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
  }

  // 设置长按定时器
  longPressTimer.value = setTimeout(() => {
    hideTooltipTemporarily()
  }, longPressDelay)
}

// 处理鼠标抬起或离开事件
const handleMouseUp = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

// 过滤子菜单，根据关键字筛选符合条件的子项
const filterChildren = (children, keyword) => {
  return children
    .map((child) => {
      const match = child.title.includes(keyword) // 判断是否匹配关键字
      const filteredChildren =
        child.children?.filter((grandchild) => grandchild.title.includes(keyword)) || [] // 筛选符合条件的子孙项
      return {
        ...child,
        children: filteredChildren.length > 0 ? filteredChildren : child.children, // 如果有符合条件的子孙项，则保留
        match: match || filteredChildren.length > 0 // 标记是否匹配当前关键字
      }
    })
    .filter((child) => child.match) // 只返回匹配的项
}

// 计算并返回过滤后的菜单数据
const filteredMenuData = computed(() => {
  const MenuData = getMoudleData('design') // 获取原始菜单数据
  if (!panelSearchVal.value) {
    return MenuData // 如果没有搜索关键字，直接返回原数据
  }
  return MenuData.map((menu) => ({
    ...menu,
    children: filterChildren(menu.children || [], panelSearchVal.value) // 根据搜索关键字过滤子菜单
  })).filter((menu) => menu.children && menu.children.length > 0) // 返回含有符合条件子项的菜单
})

// 监听菜单数据变化，重置一级菜单选择
watch(filteredMenuData, (newVal) => {
  if (newVal.length > 0) {
    selectedFirstLevel.value = 0 // 默认选择第一个一级菜单
  }
})

// 处理关闭面板事件
const handleClose = () => {
  proxy.$emitEvent('leftPanelClosed', 1) // 触发自定义事件，通知父组件面板已关闭
}

// 处理固定面板事件
const handleFixed = () => {
  isFixed.value = !isFixed.value // 切换固定状态
  proxy.$emitEvent('leftPanelFixed', {
    isFixed: isFixed.value,
    index: 1 // 传递当前面板索引
  })
}
// 处理模块点击事件，创建对应的 图片节点
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
    /* 每行显示两个图片 */
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
