<template>
  <div class="common-panel-container">
    <el-tabs v-model="activeTabName" class="setting-tabs" :stretch="true">
      <el-tab-pane label="样式" name="style">
        <el-scrollbar
          :height="panelHeight"
          v-if="activeTabName === 'style'"
          :noresize="true"
          ref="styleScrollBar"
        >
          <el-form :model="formData" class="form-wrapper">
            <el-form-item label="名称">
              <el-input
                v-model="formData.name"
                type="text"
                :maxlength="20"
                class="w190"
                show-word-limit
                @input="updateNodeAttrs('name')"
              />
            </el-form-item>

            <el-form-item label="基础">
              <el-row>
                <div style="width: 33%">
                  <el-input
                    v-model.number="formData.x"
                    :min="1"
                    @input="updateNodeAttrs('x')"
                    class="ft12"
                    type="number"
                  >
                    <template #suffix>
                      <span class="ft12">X</span>
                    </template>
                  </el-input>
                </div>
                <div style="width: 33%; margin-left: 1.5%">
                  <el-input
                    v-model.number="formData.y"
                    :min="1"
                    @input="updateNodeAttrs('y')"
                    class="ft12"
                    type="number"
                  >
                    <template #suffix>
                      <span class="ft13">Y</span>
                    </template>
                  </el-input>
                </div>
                <div style="width: 30%; margin-left: 1.5%">
                  <el-input
                    v-model.number="formData.rotation"
                    @input="updateNodeAttrs('rotation')"
                    class="ft12"
                    type="number"
                  >
                    <template #suffix>
                      <span class="ft14">°</span>
                    </template>
                  </el-input>
                </div>
              </el-row>
              <el-row class="mt8" v-show="!isGroup">
                <div style="width: 33%">
                  <el-input
                    v-model.number="formData.width"
                    :min="1"
                    type="number"
                    @input="updateNodeAttrs('width')"
                    class="ft12"
                  >
                    <template #suffix>
                      <span class="ft11">W</span>
                    </template>
                  </el-input>
                </div>
                <div style="width: 33%; margin-left: 1.5%">
                  <el-input
                    v-model.number="formData.height"
                    :min="1"
                    type="number"
                    @input="updateNodeAttrs('height')"
                    class="ft12"
                  >
                    <template #suffix>
                      <span class="ft12">H</span>
                    </template>
                  </el-input>
                </div>
                <div style="width: 30%; margin-left: 1.5%">
                  <el-tooltip content="水平翻转">
                    <el-button link @click="toggleHorizontalFlip" class="ml5">
                      <svg-icon
                        name="chuizhifanzhuan"
                        :size="14"
                        :class="{ highlight: isHorizontalFlipped }"
                      ></svg-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="垂直翻转">
                    <el-button link @click="toggleVerticalFlip">
                      <svg-icon
                        name="shuipingfanzhuan"
                        :size="14"
                        :class="{ highlight: isVerticalFlipped }"
                      ></svg-icon>
                    </el-button>
                  </el-tooltip>
                </div>
              </el-row>
              <el-row class="mt8" style="width: 100%" :gutter="8">
                <el-col :span="6">
                  <span class="ft12 sub-text-color">透明度</span>
                </el-col>
                <el-col :span="10">
                  <el-slider
                    v-model="formData.opacity"
                    height="600px"
                    :min="0"
                    :max="1"
                    :step="0.01"
                    style="width: 100%"
                    @input="updateNodeAttrs('opacity')"
                  />
                </el-col>
                <el-col :span="8">
                  <el-input-number
                    size="small"
                    v-model.number="formData.opacity"
                    :controls="false"
                    :min="0"
                    :max="1"
                    :step="0.01"
                    :precision="2"
                    style="width: 100%"
                    class="ml6"
                    @input="updateNodeAttrs('opacity')"
                  />
                </el-col>
              </el-row>
            </el-form-item>
            <el-form-item label="对齐" style="margin-bottom: 5px">
              <el-row class="flex-j-b" style="width: 100%">
                <el-tooltip content="左对齐">
                  <el-button link @click="handleNodeAlign('left')">
                    <svg-icon name="zuoduiqi" :size="16"></svg-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="右对齐">
                  <el-button link @click="handleNodeAlign('right')">
                    <svg-icon name="youduiqi" :size="16"></svg-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="底部对齐">
                  <el-button link @click="handleNodeAlign('bottom')">
                    <svg-icon name="dibuduiqi" :size="16"></svg-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="顶部对齐">
                  <el-button link @click="handleNodeAlign('top')">
                    <svg-icon name="dingbuduiqi" :size="16"></svg-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="居中对齐">
                  <el-button link @click="handleNodeAlign('center')">
                    <svg-icon name="hengxiangjuzhongduiqi" :size="16"></svg-icon>
                  </el-button>
                </el-tooltip>
              </el-row>
            </el-form-item>
            <el-form-item label="ID">
              <p v-if="activeNode" class="ft12 id-text" @dblclick="copyId">
                {{ activeNode.attrs.id }}
              </p>
            </el-form-item>
          </el-form>
          <PropsPanels v-if="activeNode" :key="key"></PropsPanels>
        </el-scrollbar>
      </el-tab-pane>
      <el-tab-pane label="数据" name="dataSource" v-if="isDataSourceVisible">
        <DataSourcePanel v-if="activeTabName === 'dataSource'" :key="key"></DataSourcePanel>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { formatNumber, throttle } from '@/utils/fn'
import { mapState } from 'vuex'
import PropsPanels from '@/views/stage/propsPanels/index.vue'
import DataSourcePanel from '@/views/stage/rightPanels/dataSourcePanel/index.vue'

export default {
  name: 'commonPanel',
  components: {
    PropsPanels,
    DataSourcePanel,
  },
  data() {
    return {
      isGroup: false, // 当前节点是否为组
      activeTabName: 'style', // 当前激活的标签页名称
      currentNode: {}, // 当前节点对象
      panelHeight: 0, // 面板高度
      key: new Date().getTime(),
      formData: {
        name: '',
        x: 0,
        y: 0,
        rotation: 0,
        width: 0,
        height: 0,
        opacity: 1
      }
    }
  },
  props: {},
  computed: {
    ...mapState({
      activeNodes: (state) => state.system.activeNodes,
      activeNode: (state) => state.system.activeNode
    }),
    isDataSourceVisible() {
      // 是否显示数据源面板
      return this.currentNode && this.currentNode.attrs.component?.isDataPanelVisible !== false
    },
    isHorizontalFlipped() {
      // 是否水平翻转
      return this.currentNode && this.currentNode.scaleX() < 0
    },
    isVerticalFlipped() {
      // 是否垂直翻转
      return this.currentNode && this.currentNode.scaleY() < 0
    }
  },

  watch: {
    activeNode: {
      handler(newValue) {
        this.currentNode = newValue

        if (this.currentNode) {
          this.activeTabName = 'style'
          // 使用 nextTick 确保 DOM 更新后再更改 key
          this.$nextTick(() => {
            this.key = this.currentNode.attrs.id || new Date().getTime()
          })
        }

        if (this.currentNode) {
          this.currentNode.on(
            'transform',
            throttle((e) => {
              this.getNodeAttrs()
            }),
            30
          )
          this.$nextTick(() => {
            this.getNodeAttrs()
          })
        }
      },
      immediate: true
    }
  },
  mounted() {
    // 设置面板高度
    this.panelHeight = window.innerHeight - 94
    this.listenStageEvent()
  },
  beforeUnmount() {
    if(window.kdt&&window.kdt.off){
        window.kdt.off('dragend.commonPanel')
    }
  },

  methods: {
    listenStageEvent(event) {
      window.kdt.on('dragend.commonPanel', (e) => {
        this.getNodeAttrs()
      })
    },
    // 更新节点属性
    updateNodeAttrs(key) {
      if (this.currentNode) {
        // 限制配置
        const limits = {
          x: { min: 0, max: 9999 },
          y: { min: 0, max: 9999 },
          rotation: { min: 0, max: 360 },
          width: { min: 1, max: 9999 },
          height: { min: 1, max: 9999 },
          opacity: { min: 0, max: 1 }
        }

        const cfg = limits[key]
        if (cfg && typeof this.formData[key] === 'number') {
          this.formData[key] = Math.min(Math.max(this.formData[key], cfg.min), cfg.max)
        }
        switch (key) {
          case 'name':
            this.currentNode.attrs.title = this.formData.name
            break
          case 'x':
            window.kdt.setNodePosition(this.currentNode, this.formData.x, this.currentNode.y())
            break
          case 'y':
            window.kdt.setNodePosition(this.currentNode, this.currentNode.x(), this.formData.y)
            break
          case 'rotation':
            this.currentNode.rotation(this.formData.rotation)
            break
          case 'opacity':
            this.currentNode.opacity(this.formData.opacity)
            break
          case 'width':
            if (this.formData.width < 1) {
              this.formData.width = 1
            }
            window.kdt.setNodeWidth(this.currentNode, this.formData.width)
            break
          case 'height':
            if (this.formData.height < 1) {
              this.formData.height = 1
            }
            window.kdt.setNodeHeight(this.currentNode, this.formData.height)
            break
          default:
            break
        }
        setTimeout(() => {
          window.kdt.updateDomPosition()
          window.kdt.forceUpdate()
        })
      }
    },
    // 切换水平翻转状态
    toggleHorizontalFlip() {
      if (this.currentNode) {
        const isCurrentlyFlipped = this.currentNode.scaleX() < 0
        this.setHorizontalFlip(!isCurrentlyFlipped)
      }
    },
    // 切换垂直翻转状态
    toggleVerticalFlip() {
      if (this.currentNode) {
        const isCurrentlyFlipped = this.currentNode.scaleY() < 0
        this.setVerticalFlip(!isCurrentlyFlipped)
      }
    },
    /**
     * 设置垂直翻转状态
     * @param {boolean} isFlipped - 是否翻转
     */
    setVerticalFlip(isFlipped) {
      if (!this.currentNode) return

      const node = this.currentNode
      const currentScaleY = node.scaleY()
      const absScaleY = Math.abs(currentScaleY)

      // 检查当前翻转状态，如果已经与目标状态相同则不执行操作
      const isCurrentlyFlipped = currentScaleY < 0
      if (isFlipped === isCurrentlyFlipped) return

      const nodeHeight = this.formData.height
      const hasOffset = node.offsetY() !== undefined && node.offsetY() !== 0
      // 如果没有offset，需要计算位置补偿
      if (!hasOffset) {
        const currentY = this.formData.y
        if (isFlipped) {
          // 从不翻转到翻转：向下移动节点高度
          node.y(currentY + nodeHeight)
        } else {
          // 从翻转到不翻转：向上移动节点高度
          node.y(currentY - nodeHeight)
        }
      }

      // 应用翻转
      node.scaleY(isFlipped ? -absScaleY : absScaleY)

      // 更新视图
      setTimeout(() => {
        window.kdt.updateDomPosition()
        window.kdt.forceUpdate()
        this.getNodeAttrs()
      })
    },
    /**
     * 设置水平翻转状态
     * @param {boolean} isFlipped - 是否翻转
     */
    setHorizontalFlip(isFlipped) {
      if (!this.currentNode) return

      const node = this.currentNode
      const currentScaleX = node.scaleX()
      const absScaleX = Math.abs(currentScaleX)

      // 检查当前翻转状态，如果已经与目标状态相同则不执行操作
      const isCurrentlyFlipped = currentScaleX < 0
      if (isFlipped === isCurrentlyFlipped) return

      const nodeWidth = this.formData.width
      const hasOffset = node.offsetX() !== undefined && node.offsetX() !== 0

      // 如果没有offset，需要计算位置补偿
      if (!hasOffset) {
        const currentX = this.formData.x

        if (isFlipped) {
          // 从不翻转到翻转：向右移动节点宽度
          node.x(currentX + nodeWidth)
        } else {
          // 从翻转到不翻转：向左移动节点宽度
          node.x(currentX - nodeWidth)
        }
      }

      // 应用翻转
      node.scaleX(isFlipped ? -absScaleX : absScaleX)

      setTimeout(() => {
        window.kdt.updateDomPosition()
        window.kdt.forceUpdate()
        this.getNodeAttrs()
      })
    },
    // 获取节点属性
    getNodeAttrs() {
      if (!this.currentNode) return
      this.isGroup = this.currentNode.attrs.name === 'group'
      const custom = this.currentNode.attrs._customDimensions || {}
      let width = custom.width
      let height = custom.height
      let rect
      try {
        rect =
          this.currentNode.getSize &&
          String(this.currentNode.getSize).indexOf('width: this.width()') == -1
            ? this.currentNode.getSize()
            : this.currentNode.getClientRect({
                skipShadow: true,
                skipTransform: true,
                skipStroke: true
              })
      } catch (error) {
        rect = this.currentNode.getClientRect({
          skipShadow: true,
          skipTransform: true,
          skipStroke: true
        })
      }

      const nodeScaleX = Math.abs(this.currentNode.scaleX())
      const nodescaleY = Math.abs(this.currentNode.scaleY())
      width = Math.round(rect.width * nodeScaleX)
      height = Math.round(rect.height * nodescaleY)

      // 获取左上角坐标
      const pos = window.kdt.getNodePosition(this.currentNode)

      this.formData = {
        name: this.currentNode.attrs.title || '',
        x: formatNumber(pos.x, 0) || 0,
        y: formatNumber(pos.y, 0) || 0,
        rotation: formatNumber(this.currentNode.rotation(), 1) || 0,
        width,
        height,
        opacity: this.currentNode.opacity() || 1
      }
    },
    // 处理对齐
    handleNodeAlign(type) {
      const nodes = this.$store.state.system.activeNodes
      if (type === 'left') {
        window.kdt.alignLeft(nodes)
      } else if (type === 'right') {
        window.kdt.alignRight(nodes)
      } else if (type === 'bottom') {
        window.kdt.alignBottom(nodes)
      } else if (type === 'top') {
        window.kdt.alignTop(nodes)
      } else if (type === 'center') {
        window.kdt.alignCenter(nodes)
      }
      setTimeout(() => {
        this.getNodeAttrs()
      }, 50)
    },
    // 复制文本
    copyText(text) {
      return new Promise((resolve, reject) => {
        if (!text) {
          reject('没有文本可以复制')
          return
        }
        // 使用 Clipboard API 复制文本
        navigator.clipboard
          .writeText(text)
          .then(() => {
            resolve()
          })
          .catch((err) => {
            reject(err)
          })
      })
    },
    // 复制 ID
    copyId() {
      if (this.currentNode) {
        this.copyText(this.currentNode.attrs.id).then(() => {
          this.$message.success('复制成功')
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.common-panel-container {
  height: 100%;
  background-color: var(--panel-light-bg-color);
  width: 300px;
  border-left: 1px solid var(--panel-border-out-color);

  .form-wrapper {
    width: 100%;
    overflow-x: hidden;
  }
}

:deep(.el-tabs__header) {
  margin: 0 0 15px;
}

:deep(.el-form-item__label) {
  padding-left: 10px;
  font-size: 14px;
  min-width: 80px;
  text-align: left;
  color: var(--primary-text-color);
  display: inline-block;
}

:deep(.el-form-item) {
  margin-right: 10px;
}

:deep(.el-slider__button) {
  width: 16px;
  height: 16px;
  background-color: #d1d1d1;
  border-color: var(--light-color);
}

:deep(.el-slider__bar) {
  background-color: var(--light-color);
}

.highlight {
  color: var(--primary-color);
}

.id-text {
  opacity: 0.65;
  color: var(--primary-text-color);
}
</style>