<template>
  <div class="align-panel-container">
    <div class="panel-content">
      <!-- Multiple Selection Alignment Area -->
      <div class="align-section">
        <h4 class="group-title">Multi-Select Alignment</h4>
        <el-row class="flex-j-b mt25" justify="space-around">
          <el-tooltip content="left align">
            <el-button link @click="handleNodeAlign('left')">
              <svg-icon name="zuoduiqi" :size="20"></svg-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="right align">
            <el-button link @click="handleNodeAlign('right')">
              <svg-icon name="youduiqi" :size="20"></svg-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="bottom align">
            <el-button link @click="handleNodeAlign('bottom')">
              <svg-icon name="dibuduiqi" :size="20"></svg-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="top align">
            <el-button link @click="handleNodeAlign('top')">
              <svg-icon name="dingbuduiqi" :size="20"></svg-icon>
            </el-button>
          </el-tooltip>
        </el-row>
        <el-row class="mt15" justify="space-around">
          <el-tooltip content="horizontal align">
            <el-button link @click="handleNodeAlign('horizontalCenter')">
              <svg-icon name="shuxiangjuzhongduiqi" :size="20"></svg-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="vertical align">
            <el-button link @click="handleNodeAlign('verticalCenter')">
              <svg-icon name="hengxiangjuzhongduiqi" :size="20"></svg-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="horizontal equal distribution">
            <el-button link @click="handleNodeAlign('distributeHorizontally')">
              <svg-icon name="hengxiangfenbu" :size="20"></svg-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="vertical equal distribution">
            <el-button link @click="handleNodeAlign('distributeVertically')">
              <svg-icon name="shuxiangfenbu" :size="20"></svg-icon>
            </el-button>
          </el-tooltip>
        </el-row>
        <el-text class="panel-notice">
          <span class="ft12 ml10">align with first selected node</span>
        </el-text>
      </div> 
      <!-- Text Style Properties -->
       <!-- This is a common text attribute，Only contains text -->
       <div v-if="isText"  class="property-group"> 
        <div class="property-item"> 
          <label>Text</label>
          <el-input v-model="formData.data" type="textarea"   @change="handleBatchUpdate('data', $event)"  :maxlength="$store.state.globalVariable.textareaMaxSize" />
        </div>
        <div class="property-item"> 
          <label>Decimal Places</label>
          <el-input-number 
            v-model="formData.decimalPlaces" 
            :min="0" 
            :max="10"
            placeholder="default not processed"
            controls-position="right"
            clearable
            @change="handleBatchUpdate('decimalPlaces', $event)"
          />
        </div>
        <div class="property-item"> 
          <label>Font</label>
          <el-select v-model="formData.fontFamily" placeholder="select font" @change="handleBatchUpdate('fontFamily', $event)">
            <el-option v-for="item in fonts" :key="item.value" :label="item.label"
                :value="item.value">
                <span :style="'font-family:' + item.value">{{ item.label }}</span>
            </el-option>
          </el-select>
        </div>
        <div class="property-item"> 
          <label>Color</label>
          <el-color-picker v-model="formData.fill"   @change="handleBatchUpdate('fill', $event)"/> 
        </div>
        <div class="property-item"> 
          <label>Font Size</label>
          <el-input-number v-model="formData.fontSize"  :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"
          controls-position="right"  @change="handleBatchUpdate('fontSize', $event)" />
        </div>
        <div class="property-item"> 
          <label>Font Weight</label>
          <el-select v-model="formData.fontWeight" placeholder="select font weight"  @change="handleBatchUpdate('fontWeight', $event)" >
            <el-option label="normal" value="normal"></el-option>
            <el-option label="bold" value="bold"></el-option>
          </el-select>
        </div>
        <div class="property-item"> 
          <label>Padding</label>
          <el-input-number v-model="formData.padding" controls-position="right"  @change="handleBatchUpdate('padding', $event)"  />
        </div>
        <div class="property-item"> 
          <label>Horizontal Align</label>
          <el-select v-model="formData.textAlign" placeholder="select horizontal alignment" @change="handleBatchUpdate('textAlign', $event)">
                    <el-option label="left align" value="left"></el-option>
                    <el-option label="center align" value="center"></el-option>
                    <el-option label="right align" value="right"></el-option>
                </el-select>
        </div>
        <div class="property-item"> 
          <label>Vertical Align</label>
          <el-select v-model="formData.verticalAlign" placeholder="select vertical alignment" @change="handleBatchUpdate('verticalAlign', $event)">
                  <el-option label="top align" value="top"></el-option>
                  <el-option label="center align" value="middle"></el-option>
                  <el-option label="bottom align" value="bottom"></el-option>
              </el-select>
        </div>
        <div class="property-item"> 
          <label>Letter Spacing</label>
          <el-input-number v-model="formData.letterSpacing" controls-position="right" @change="handleBatchUpdate('letterSpacing', $event)" />
        </div>
        <div class="property-item"> 
          <label>Line Height</label>
          <el-input-number v-model="formData.lineHeight" controls-position="right"  @change="handleBatchUpdate('lineHeight', $event)" />
        </div>
        <div class="property-item"> 
          <label>Background Color</label>
          <el-color-picker v-model="formData.backgroundColor"   @change="handleBatchUpdate('backgroundColor', $event)" />
        </div>
        <template v-if="initialized"> 
          <div class="property-item"> 
          <label>Border Size</label>
          <el-input-number v-model="formData.borderSize" controls-position="right" @change="handleBatchUpdate('borderSize', $event)" />
        </div>
        <div class="property-item"> 
          <label>Border Color</label>
          <el-color-picker v-model="formData.borderColor" @change="handleBatchUpdate('borderColor', $event)" />
        </div>
        <div class="property-item"> 
          <label>Border Style</label>
          <el-select v-model="formData.borderStyle" placeholder="select border style"  @change="handleBatchUpdate('borderStyle', $event)">
            <el-option label="solid" value="solid"></el-option>
            <el-option label="dashed" value="dashed"></el-option>
            <el-option label="dotted" value="dotted"></el-option>
          </el-select>
        </div>
        </template>
       </div>
       <!-- This is a general property; there may be properties of other components -->
      <div v-if="!isText&&hasCommonTextProps" class="property-group">
        <!-- <div v-if="hasCommonTextProps" class="property-group">  -->
        <h4 class="group-title">Common Styles</h4>
        <!-- Font Size -->
        <div v-if="commonProps.fontSize !== null" class="property-item">
          <label>Font Size</label>
          <el-input-number
            v-model="commonProps.fontSize"
             :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"
            placeholder="please select font size"
            @change="handleBatchUpdate('fontSize', $event)"
          />
        </div>

        <!-- Font Color -->
        <div v-if="commonProps.fill !== null" class="property-item">
          <label>Font Color</label>
          <el-color-picker
            v-model="commonProps.fill"
            show-alpha
            @change="handleBatchUpdate('fill', $event)"
          />
        </div>

        <!-- Font Weight -->
        <div v-if="commonProps.fontWeight !== null" class="property-item">
          <label>Font Weight</label>
          <el-select
            v-model="commonProps.fontWeight"
            placeholder="please select font weight"
            @change="handleBatchUpdate('fontWeight', $event)"
          >
            <el-option label="normal" value="normal" />
            <el-option label="bold" value="bold" />
          </el-select>
        </div>
        <!-- Text Alignment -->
        <div v-if="commonProps.textAlign !== null" class="property-item">
          <label>Text Alignment</label>
          <el-select
            v-model="commonProps.textAlign"
            placeholder="please select alignment"
            @change="handleBatchUpdate('textAlign', $event)"
          >
            <el-option label="left align" value="left" />
            <el-option label="center align" value="center" />
            <el-option label="right align" value="right" />
          </el-select>
        </div>
      </div>

      <!-- Background Properties -->
      <div v-if="hasCommonBackgroundProps" class="property-group">
        <!-- Background Color -->
        <div v-if="commonProps.backgroundColor !== null" class="property-item">
          <label>Background Color</label>
          <el-color-picker
            v-model="commonProps.backgroundColor"
            show-alpha
            @change="handleBatchUpdate('backgroundColor', $event)"
          />
        </div>

        <!-- Label Fill Color -->
        <div v-if="commonProps.tagFill !== null" class="property-item">
          <label>Label Fill Color</label>
          <el-color-picker
            v-model="commonProps.tagFill"
            show-alpha
            @change="handleBatchUpdate('tagFill', $event)"
          />
        </div>
      </div>

      <!-- Position and Size -->
      <div class="property-group" v-if="hasCommonBackgroundProps">
        <!-- Width -->
        <div class="property-item">
          <label>Width</label>
          <el-input-number
            :model-value="getCommonSize().width"
            :min="1"
            placeholder="width"
            @change="handleBatchSizeUpdate('width', $event)"
          />
        </div>

        <!-- Height -->
        <div class="property-item" v-if="hasCommonBackgroundProps">
          <label>Height</label>
          <el-input-number
            :model-value="getCommonSize().height"
            :min="1"
            placeholder="height"
            @change="handleBatchSizeUpdate('height', $event)"
          />
        </div>

        <!-- Opacity -->
        <!-- <div class="property-item">
            <label>Opacity</label>
            <div class="opacity-wrapper">
              <el-slider
                :model-value="getCommonOpacity()"
                :min="0"
                :max="1"
                :step="0.01"
                @change="handleBatchOpacityUpdate"
              />
              <el-input-number
                :model-value="getCommonOpacity()"
                :min="0"
                :max="1"
                :step="0.01"
                :precision="2"
                :controls="false"
                @change="handleBatchOpacityUpdate"
                class="opacity-input"
              />
            </div>
          </div> -->
      </div>

      <!-- Quick Actions -->
      <div class="property-group">
        <h4 class="group-title">Quick Actions</h4>
        <div class="quick-actions">
          <el-button @click="handleBatchLock" type="primary"  plain>
            <svg-icon
              name="lock"
              size="14"
              class=" mr5"
              v-show="!isAllLocked"
            ></svg-icon>
            <svg-icon
              name="unlock"
              size="14"
              class=" mr5"
              v-show="isAllLocked"
            ></svg-icon>
            {{ isAllLocked ? 'unlock all' : 'lock all' }}
          </el-button>
          <el-button @click="handleBatchVisibility" type="primary"  plain>
            <svg-icon
              name="eye-show"
              size="14"
              class=" mr5"
              v-show="isAllVisible"
            ></svg-icon>
            <svg-icon
              name="eye-hide"
              size="14"
              class=" mr5"
              v-show="!isAllVisible"
            ></svg-icon>
            {{ isAllVisible ? 'hide all' : 'show all' }}
          </el-button>
          <el-button type="danger" @click="handleBatchDelete"  plain>
              <svg-icon
              name="delete"
              size="14"
              class="mr5"
            ></svg-icon>
            delete all
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { fontsData } from '@/config/fonts'
export default {
  name: 'AlignPanel',
  computed: {
    ...mapState({
      activeNodes: (state) => state.system.activeNodes
    }),

    // Check if there are common text properties
    hasCommonTextProps() {
      return (
        this.commonProps.fontSize !== null ||
        this.commonProps.fill !== null ||
        this.commonProps.fontWeight !== null ||
        this.commonProps.fontFamily !== null ||
        this.commonProps.textAlign !== null
      )
    },

    // Check if there are common background properties
    hasCommonBackgroundProps() {
      return this.commonProps.backgroundColor !== null || this.commonProps.tagFill !== null
    },

    // Check if all are locked
    isAllLocked() {
      return this.activeNodes.every((node) => node.attrs?.lock)
    },

    // Check if all are visible
    isAllVisible() {
      return this.activeNodes.every((node) => node.visible())
    },
    //Check if all are text
    isText(){
      if(this.activeNodes.every((node) => node.attrs.name=="text")){ 
        setTimeout(() => {
            // Delay initialization of some content to reduce rendering lag
            this.initialized = true;
        }, 350)
      }
      return this.activeNodes.every((node) => node.attrs.name=="text")
    },
  },

  data() {
    return {
      initialized: false,
      fonts: fontsData,
      formData:{ 
        decimalPlaces:null,
        data: '',
        fontFamily: ' ',
        fill: '',
        fontSize: 16,
        fontWeight: 'normal',
        padding: 0,
        textAlign: '',
        verticalAlign: '',
        letterSpacing: 0,
        lineHeight: 1,
        backgroundColor: '',
        borderSize: 0,
        borderColor: '',
        borderStyle: '',
      },
      commonProps: {
        // Text Properties - Default is empty
        fontSize: null,
        fill: null,
        fontWeight: null,
        fontFamily: null,
        textAlign: null,

        // Background Properties - Default is empty
        backgroundColor: null,
        tagFill: null
      }
    }
  },

  watch: {
    activeNodes: {
      handler: 'updateCommonProps',
      immediate: true
    }
  },
  activated() {
    this.resetFunc()
  },

  methods: {
    // Page reset method
    resetFunc(){
      this.formData={ 
        decimalPlaces:null,
        data: '',
        fontFamily: ' ',
        fill: '',
        fontSize: 16,
        fontWeight: 'normal',
        padding: 0,
        textAlign: '',
        verticalAlign: '',
        letterSpacing: 0,
        lineHeight: 1,
        backgroundColor: '',
        borderSize: 0,
        borderColor: '',
        borderStyle: '',
      }
    },
    // Alignment handling
    handleNodeAlign(type) {
      const nodes = this.activeNodes
      const kdt = window.kdt
      if (type === 'left') {
        kdt.alignLeft(nodes)
      } else if (type === 'right') {
        kdt.alignRight(nodes)
      } else if (type === 'bottom') {
        kdt.alignBottom(nodes)
      } else if (type === 'top') {
        kdt.alignTop(nodes)
      } else if (type === 'verticalCenter') {
        kdt.alignVerticalCenter(nodes)
      } else if (type === 'horizontalCenter') {
        kdt.alignHorizontalCenter(nodes)
      } else if (type === 'distributeHorizontally') {
        kdt.distributeHorizontally(nodes)
      } else if (type === 'distributeVertically') {
        kdt.distributeVertically(nodes)
      }
    },

    // Update common properties - Modification logic：Default is empty，Only display when completely identical
    updateCommonProps() {
      if (this.activeNodes.length <= 1) {
        // When single or no selection，All properties are empty
        this.commonProps = {
          fontSize: null,
          fill: null,
          fontWeight: null,
          fontFamily: null,
          textAlign: null,
          backgroundColor: null,
          tagFill: null
        }
        return
      }

      // Extract properties of all nodes
      const nodeProps = this.activeNodes.map((node) => node.attrs?.props || {})

      // Find common properties - Only display when all nodes have the same property value
      const propKeys = [
        'fontSize',
        'fill',
        'fontWeight',
        'fontFamily',
        'textAlign',
        'backgroundColor',
        'tagFill'
      ]

      propKeys.forEach((key) => {
        const values = nodeProps
          .map((props) => props[key])
          .filter((val) => val !== undefined && val !== null && val !== '')

        // Only when all nodes have this property and the values are exactly the same，Set as a common property
        if (values.length === nodeProps.length && values.every((val) => val === values[0])) {
          this.commonProps[key] = values[0]
        } else {
          // Otherwise set tonull（Empty）
          this.commonProps[key] = null
        }
      })
    },

    // Batch update properties
    handleBatchUpdate(propName, value) {
      this.activeNodes.forEach((node) => {
        if (node.updateParams && typeof node.updateParams === 'function') {
          node.updateParams({ [propName]: value })
        }
      })

      // Trigger history record
      if (window.kdt?.stateManage?.class?.history) {
        setTimeout(() => {
          window.kdt.stateManage.class.history.addHistory({ title: `batch modify${propName}` })
        }, 100)
      }
    },

    // Get common size
    getCommonSize() {
      if (this.activeNodes.length === 0) return { width: 0, height: 0 }

      const sizes = this.activeNodes.map((node) => {
        if (window.kdt?.stateManage?.class?.node?.getNodeSize) {
          return window.kdt?.stateManage?.class?.node?.getNodeSize(node)
        }
        const rect = node.getClientRect()
        const stageScale = window.kdt?.getStageScale?.()?.x || 1
        return {
          width: Math.round(rect.width / stageScale),
          height: Math.round(rect.height / stageScale)
        }
      })

      // Return the size of the first node
      const firstSize = sizes[0]
      return firstSize || { width: 0, height: 0 }
    },

    // Get common opacity - Keep opacity logic unchanged
    getCommonOpacity() {
      if (this.activeNodes.length === 0) return 1

      const opacities = this.activeNodes.map((node) => node.opacity() || 1)
      const firstOpacity = opacities[0]
      return firstOpacity
    },

    // Batch update size
    handleBatchSizeUpdate(dimension, value) {
      this.activeNodes.forEach((node) => {
        if (window.kdt?.stateManage?.class?.node) {
          if (dimension === 'width') {
            window.kdt.setNodeWidth(node, value)
          } else if (dimension === 'height') {
            window.kdt.setNodeHeight(node, value)
          }
        }
      })

      setTimeout(() => {
        window.kdt?.addHistory({ title: `batch modify${dimension === 'width' ? 'width' : 'height'}` })
      }, 100)
    },

    // Batch update opacity - Fix opacity issues
    handleBatchOpacityUpdate(value) {
      this.activeNodes.forEach((node) => {
        node.opacity(value)
      })

      // Force redraw all nodes and layers
      this.activeNodes.forEach((node) => {
        const layer = node.getLayer()
        if (layer) {
          layer.batchDraw()
        }
      })
      window.kdt?.forceUpdate()
      setTimeout(() => {
        window.kdt.addHistory({ title: 'batch modify opacity' })
      }, 50)
    },

    // Batch lock/Unlock
    handleBatchLock() {
      if (this.isAllLocked) {
        // Unlock all
        this.activeNodes.forEach((node) => {
          window.kdt.unlockNodes(node)
        })
      } else {
        // Lock all
        this.activeNodes.forEach((node) => {
          window.kdt.lockNodes(node)
        })
      }
    },

    // Batch display/Hide
    handleBatchVisibility() {
      if (this.isAllVisible) {
        // Hide all
        this.activeNodes.forEach((node) => {
          window.kdt.hideNodes(node)
        })
      } else {
        // Show all
        this.activeNodes.forEach((node) => {
          window.kdt.showNodes(node)
        })
      }
    },

    // Batch delete
    handleBatchDelete() {
      this.$confirm('are you sure you want to delete all selected nodes?？', 'confirm delete', {
        confirmButtonText: 'confirm',
        cancelButtonText: 'cancel',
        type: 'warning'
      })
        .then(() => {
          window.kdt.deleteNodes()
        })
        .catch(() => {
          // User cancels deletion
        })
    }
  }
}
</script>

<style lang="scss" scoped>
.align-panel-container {
  height: calc(100vh - 40px);
  background-color: var(--panel-bg-color);
  width: 300px;
  border-left: 1px solid var(--panel-border-out-color);
  overflow-y: auto;
}

.panel-content {
  padding: 20px 10px 0;
}

.align-section {
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--panel-border-out-color);
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 15px;
  color: var(--primary-text-color);
}

.panel-notice {
  opacity: 0.7;
  margin-top: 15px;
  display: flex;
  letter-spacing: 1px;
  align-items: center;
}

.property-group {
  margin-bottom: 25px;

  &:last-child {
    margin-bottom: 0;
  }
}

.group-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 15px;
  color: var(--primary-text-color);
  border-left: 3px solid #409efe;
  padding-left: 8px;
}

.property-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }

  label {
    font-size: 13px;
    color: var(--text-secondary-color);
    min-width: 80px;
    flex-shrink: 0;
  }

  .el-input-number,
  .el-select,
  .el-color-picker {
    width: 140px;
  }
}

.opacity-wrapper {
  display: flex;
  align-items: center;
  width: 140px;
  gap: 8px;

  .el-slider {
    flex: 1;
  }

  .opacity-input {
    width: 60px;
    flex-shrink: 0;
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding-top: 10px;
  .el-button{
    width: 90%;
    margin-bottom: 20px;
    margin-left: 0;
  }
}

// Element UI Component style adjustment
:deep(.el-input-number) {
  .el-input__inner {
    font-size: 12px;
  }
}

:deep(.el-select) {
  .el-input__inner {
    font-size: 12px;
  }
}

:deep(.el-slider__button) {
  width: 16px;
  height: 16px;
  background-color: #409efe;
  border-color: #409efe;
}

:deep(.el-slider__bar) {
  background-color: #409efe;
}
</style>
