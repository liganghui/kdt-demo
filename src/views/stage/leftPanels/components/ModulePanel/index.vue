<template>
    <div class="modulePanel-wrapper">
        <el-row class="panel-header">
            <el-col :span="16">
                <el-input v-model="panelSearchVal" placeholder="search widget name" @input="handleSearch" />
            </el-col>
            <el-col :span="6" class="text-r primary-text-color flex-a-c " :offset="2">
                <!-- Fixed Button -->
                <svg-icon name="pin" size="14" class="pointer mr15 " :class="{ 'primary-color': isFixed }"
                    @click="handleFixed"></svg-icon>
                <!-- Close Button -->
                <svg-icon name="close" size="14" class="pointer  mr4 primary-text-color"
                    @click="handleClose"></svg-icon>
            </el-col>
        </el-row>
        <el-row class="panel-body">
            <el-col :span="6" class="border-r-1 text-c no-select">
                <div v-for="(item, index) in filteredMenuData" :key="index" @click="selectFirstLevel(index)"
                    class="primary-text-color mb15" :class="{ selected: index === selectedFirstLevel }">
                    <svg-icon :name="item.icon" size="16" :class="index === 0 ? 'mt12' : 'mt6'"
                        v-if="item.icon"></svg-icon>
                    <p class="ft13">{{ item.title}}</p>
                </div>
            </el-col>
            <!-- Right Content Area，Display Subitems of the Selected First-Level Menu Item -->
            <el-col :span="18" class="light-panel-bg pd-v4" style="overflow: hidden">
                <el-scrollbar :height="scrollbarMaxHeight" :noresize="true">
                    <!-- If There Is Only One Subitem Under the Current First-Level Menu，Directly Display Its Sublevel -->
                    <template v-if="filteredMenuData[selectedFirstLevel]?.children.length === 1">
                        <div class="panel-node-wrapper">
                            <div v-for="child in filteredMenuData[selectedFirstLevel]?.children[0]?.children"
                                :key="child.id" draggable="true" @click="handleModuleClick($event, child)"
                                @dragstart="handleDragStart($event, child)"
                                class="pointer mb6 primary-text-color node-item">
                                <!-- First-Level Menu Item Icon and Name -->
                                <p class="ft12 no-select node-title">{{ child.title }}</p>
                                <el-image :src="child.path" class="node-img" loading="lazy">
                                    <template #error>
                                        <div class="image-slot">
                                            <el-icon><icon-picture /></el-icon>
                                        </div>
                                    </template>
                                </el-image>
                            </div>
                        </div>
                    </template>
                    <!-- Otherwise Use a Collapse Panel to Display Multiple Contents -->
                    <template v-else>
                        <el-collapse v-model="activeNames">
                            <el-collapse-item :name="index"
                                v-for="(item, index) in filteredMenuData[selectedFirstLevel]?.children" :key="item.id">
                                <template #title>
                                    <p class="ft12 mb6 ml10 no-select">{{ t( item.title) }}</p>
                                </template>
                                <div class="panel-node-wrapper">
                                    <div v-for="child in item.children" :key="child.id"
                                        @click="handleModuleClick($event, child)" draggable=" true"
                                        @dragstart="handleDragStart($event, child)"
                                        class="pointer mb6 primary-text-color node-item">
                                        <el-image :src="child.path" class="node-img" loading="lazy">
                                            <template #error>
                                                <div class="image-slot">
                                                    <el-icon><icon-picture /></el-icon>
                                                </div>
                                            </template>
                                        </el-image>
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
import { onMounted, onBeforeUnmount, onUpdated } from 'vue'
import { getMoudleData } from '@/config/menu.js'
import { ref, computed, getCurrentInstance, watch } from 'vue'
import { handleDomCreation } from '../../../composables/domHandle'
const { proxy } = getCurrentInstance()
import { useStore } from 'vuex'
import { Picture as IconPicture } from '@element-plus/icons-vue'

const store = useStore()
const panelSearchVal = ref('') // Value Bound to the Search Box
const selectedFirstLevel = ref(0) // Record the Index of the Selected First-Level Menu Item
const activeNames = ref([]) // Control the Expanded Items of the Collapse Panel
const isFixed = ref(false) // Control Whether the Panel Is Fixed
const scrollbarMaxHeight = ref(600) // Maximum Height of the Scrollbar

// Search Box Input Event Handling
const handleSearch = (value) => {
    panelSearchVal.value = value
}

// Toggle the Selected First-Level Menu Item
const selectFirstLevel = (index) => {
    selectedFirstLevel.value = index
    activeNames.value = [] // Reset the Selection of Collapse Menu Items
}

// Drag Start Event Handling
const handleDragStart = (event, item) => {
    event.dataTransfer.setData('application/json', JSON.stringify(item)) // Set Drag Data
}

// Calculate the Maximum Height of the Scrollbar，Dynamically Adjust According to Window Height
const calculateMaxHeight = () => {
    const headerHeight = 100 // Header Height+Search Bar Height
    scrollbarMaxHeight.value = window.innerHeight - headerHeight
}

// Filter Menu Data According to Keywords
const filterChildren = (children, keyword) => {
    return children
        .map((child) => {
            const match = child.title.includes(keyword)
            const filteredChildren =
                child.children?.filter((grandchild) => grandchild.title.includes(keyword)) || []
            return {
                ...child,
                children: filteredChildren.length > 0 ? filteredChildren : child.children,
                match: match || filteredChildren.length > 0
            }
        })
        .filter((child) => child.match)
}

// Handle Module Click Events，Create the Corresponding DOM Elements or Nodes
const handleModuleClick = (event, moduleData) => {
    event.moduleData = moduleData
    if (moduleData?.component?.componentName) {
        handleDomCreation(moduleData, window.kdt.state.stage, store)
    } else {
        window.kdt.addNode(event)
    }
}

// Calculate Filtered Menu Data
const filteredMenuData = computed(() => {
    const MenuData = getMoudleData('moudles')
    if (!panelSearchVal.value) {
        return MenuData
    }
    return MenuData.map((menu) => ({
        ...menu,
        children: filterChildren(menu.children || [], panelSearchVal.value)
    })).filter((menu) => menu.children && menu.children.length > 0)
})

// Lifecycle Hook
onMounted(() => {
    calculateMaxHeight()
    window.addEventListener('resize', calculateMaxHeight)
})
onUpdated(() => {
    calculateMaxHeight()
})
onBeforeUnmount(() => {
    window.removeEventListener('resize', calculateMaxHeight)
})

// Listen to Filtered Menu Data，Reset the Selected Item When Data Is Updated
watch(filteredMenuData, (newVal) => {
    if (newVal.length > 0) {
        selectedFirstLevel.value = 0
    }
})

// Close Panel Handling
const handleClose = () => {
    proxy.$emitEvent('leftPanelClosed', 0)
}

// Fixed Panel Handling
const handleFixed = () => {
    isFixed.value = !isFixed.value
    proxy.$emitEvent('leftPanelFixed', {
        isFixed: isFixed.value,
        index: 0
    })
}
</script>

<style lang="scss" scoped>
.modulePanel-wrapper {
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
        grid-template-columns: repeat(1, 1fr);
        gap: 5px;
        padding: 5px 10px;
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
            background-color: #fff;
            border-radius: 4px;
            overflow: hidden;
            transition: .5s;
            border: 1px solid #e9e9e9;


            &:hover {
                transform: scale(1.05);

            }

            .node-title {
                background-color: var(--panel-border-out-color);
                height: 30px;
                width: 100%;
                line-height: 30px;
                text-indent: 6px;
                text-align: left;
                border-bottom: 1px solid var(--panel-light-bg-color);
            }

            .node-img {
                margin: 6px auto;
                height: 60px;
            }

            p {
                opacity: 0.8;
            }
        }


    }

    .scroll-tip {
        opacity: 0.4;
        text-align: center;
        padding: 5px 10px;
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
}

// Dark Theme
.dark .node-item {
    background-color: transparent !important;
    border: 1px solid #272727 !important;
}
</style>
