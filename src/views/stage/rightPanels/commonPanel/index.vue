<template>
  <div class="common-panel-container">
    <el-tabs v-model="activeTabName" class="setting-tabs" :stretch="true">
      <el-tab-pane label="Style" name="style">
        <el-scrollbar
          :height="panelHeight"
          v-if="activeTabName === 'style'"
          :noresize="true"
          ref="styleScrollBar"
        >
          <el-form :model="formData" class="form-wrapper">
            <el-form-item label="Name">
              <el-input
                v-model="formData.name"
                type="text"
                :maxlength="20"
                class="w190"
                show-word-limit
                @input="updateNodeAttrs('name')"
              />
            </el-form-item>

            <el-form-item label="Basic">
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
                  <el-tooltip content="horizontal flip">
                    <el-button link @click="toggleHorizontalFlip" class="ml5">
                      <svg-icon
                        name="chuizhifanzhuan"
                        :size="14"
                        :class="{ highlight: isHorizontalFlipped }"
                      ></svg-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="vertical flip">
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
                  <span class="ft12 sub-text-color">Opacity</span>
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
            <el-form-item label="Alignment" style="margin-bottom: 5px">
              <el-row class="flex-j-b" style="width: 100%">
                <el-tooltip content="left align">
                  <el-button link @click="handleNodeAlign('left')">
                    <svg-icon name="zuoduiqi" :size="16"></svg-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="right align">
                  <el-button link @click="handleNodeAlign('right')">
                    <svg-icon name="youduiqi" :size="16"></svg-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="bottom align">
                  <el-button link @click="handleNodeAlign('bottom')">
                    <svg-icon name="dibuduiqi" :size="16"></svg-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="top align">
                  <el-button link @click="handleNodeAlign('top')">
                    <svg-icon name="dingbuduiqi" :size="16"></svg-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="center align">
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
      <el-tab-pane label="Data" name="dataSource" v-if="isDataSourceVisible">
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
      isGroup: false, // Whether the current node is a group
      activeTabName: 'style', // The name of the currently active tab
      currentNode: {}, // Current node object
      panelHeight: 0, // Panel height
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
      // Whether to display the data source panel
      return this.currentNode && this.currentNode.attrs.component?.isDataPanelVisible !== false
    },
    isHorizontalFlipped() {
      // Whether to flip horizontally
      return this.currentNode && this.currentNode.scaleX() < 0
    },
    isVerticalFlipped() {
      // Whether to flip vertically
      return this.currentNode && this.currentNode.scaleY() < 0
    }
  },

  watch: {
    activeNode: {
      handler(newValue) {
        this.currentNode = newValue

        if (this.currentNode) {
          this.activeTabName = 'style'
          // Use nextTick Ensure DOM Change after update key
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
    // Set panel height
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
    // Update node attributes
    updateNodeAttrs(key) {
      if (this.currentNode) {
        // Limit configuration
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
    // Toggle horizontal flip state
    toggleHorizontalFlip() {
      if (this.currentNode) {
        const isCurrentlyFlipped = this.currentNode.scaleX() < 0
        this.setHorizontalFlip(!isCurrentlyFlipped)
      }
    },
    // Toggle vertical flip state
    toggleVerticalFlip() {
      if (this.currentNode) {
        const isCurrentlyFlipped = this.currentNode.scaleY() < 0
        this.setVerticalFlip(!isCurrentlyFlipped)
      }
    },
    /**
     * Set vertical flip state
     * @param {boolean} isFlipped - Whether to flip
     */
    setVerticalFlip(isFlipped) {
      if (!this.currentNode) return

      const node = this.currentNode
      const currentScaleY = node.scaleY()
      const absScaleY = Math.abs(currentScaleY)

      // Check current flip state，If it is already the same as the target state, no action will be taken
      const isCurrentlyFlipped = currentScaleY < 0
      if (isFlipped === isCurrentlyFlipped) return

      const nodeHeight = this.formData.height
      const hasOffset = node.offsetY() !== undefined && node.offsetY() !== 0
      // If there is nooffset，Need to calculate position compensation
      if (!hasOffset) {
        const currentY = this.formData.y
        if (isFlipped) {
          // From not flipped to flipped：Move down node height
          node.y(currentY + nodeHeight)
        } else {
          // From flipped to not flipped：Move up node height
          node.y(currentY - nodeHeight)
        }
      }

      // Apply flip
      node.scaleY(isFlipped ? -absScaleY : absScaleY)

      // Update view
      setTimeout(() => {
        window.kdt.updateDomPosition()
        window.kdt.forceUpdate()
        this.getNodeAttrs()
      })
    },
    /**
     * Set horizontal flip state
     * @param {boolean} isFlipped - Check current flip state
     */
    setHorizontalFlip(isFlipped) {
      if (!this.currentNode) return

      const node = this.currentNode
      const currentScaleX = node.scaleX()
      const absScaleX = Math.abs(currentScaleX)

      // If it is already the same as the target state, no action will be taken，If there is no
      const isCurrentlyFlipped = currentScaleX < 0
      if (isFlipped === isCurrentlyFlipped) return

      const nodeWidth = this.formData.width
      const hasOffset = node.offsetX() !== undefined && node.offsetX() !== 0

      // Need to calculate position compensationoffset，From not flipped to flipped
      if (!hasOffset) {
        const currentX = this.formData.x

        if (isFlipped) {
          // Move right node width：From flipped to not flipped
          node.x(currentX + nodeWidth)
        } else {
          // Move left node width：Apply flip
          node.x(currentX - nodeWidth)
        }
      }

      // Get node attributes
      node.scaleX(isFlipped ? -absScaleX : absScaleX)

      setTimeout(() => {
        window.kdt.updateDomPosition()
        window.kdt.forceUpdate()
        this.getNodeAttrs()
      })
    },
    // Get top - left coordinates
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

      // Handle alignment
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
    // Copy text
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
    // Use
    copyText(text) {
      return new Promise((resolve, reject) => {
        if (!text) {
          reject('no text to copy')
          return
        }
        // Copy text Clipboard API Copy
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
    // Copy ID
    copyId() {
      if (this.currentNode) {
        this.copyText(this.currentNode.attrs.id).then(() => {
          this.$message.success('copy successful')
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