<template>
  <div class="align-panel-container">
    <div class="panel-content">
      <!-- 多选对齐区域 -->
      <div class="align-section">
        <h4 class="group-title">多选对齐</h4>
        <el-row class="flex-j-b mt25" justify="space-around">
          <el-tooltip content="左对齐">
            <el-button link @click="handleNodeAlign('left')">
              <svg-icon name="zuoduiqi" :size="20"></svg-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="右对齐">
            <el-button link @click="handleNodeAlign('right')">
              <svg-icon name="youduiqi" :size="20"></svg-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="底部对齐">
            <el-button link @click="handleNodeAlign('bottom')">
              <svg-icon name="dibuduiqi" :size="20"></svg-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="顶部对齐">
            <el-button link @click="handleNodeAlign('top')">
              <svg-icon name="dingbuduiqi" :size="20"></svg-icon>
            </el-button>
          </el-tooltip>
        </el-row>
        <el-row class="mt15" justify="space-around">
          <el-tooltip content="水平对齐">
            <el-button link @click="handleNodeAlign('horizontalCenter')">
              <svg-icon name="shuxiangjuzhongduiqi" :size="20"></svg-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="垂直对齐">
            <el-button link @click="handleNodeAlign('verticalCenter')">
              <svg-icon name="hengxiangjuzhongduiqi" :size="20"></svg-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="水平等距分布">
            <el-button link @click="handleNodeAlign('distributeHorizontally')">
              <svg-icon name="hengxiangfenbu" :size="20"></svg-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="垂直等距分布">
            <el-button link @click="handleNodeAlign('distributeVertically')">
              <svg-icon name="shuxiangfenbu" :size="20"></svg-icon>
            </el-button>
          </el-tooltip>
        </el-row>
        <el-text class="panel-notice">
          <span class="ft12 ml10">对齐参照第一个选中的节点</span>
        </el-text>
      </div> 
      <!-- 文本样式属性 -->
       <!-- 这是文本通用属性，只包含文本的 -->
       <div v-if="isText"  class="property-group"> 
        <div class="property-item"> 
          <label>文本</label>
          <el-input v-model="formData.data" type="textarea"   @change="handleBatchUpdate('data', $event)"  :maxlength="$store.state.globalVariable.textareaMaxSize" />
        </div>
        <div class="property-item"> 
          <label>小数位</label>
          <el-input-number 
            v-model="formData.decimalPlaces" 
            :min="0" 
            :max="10"
            placeholder="默认不处理"
            controls-position="right"
            clearable
            @change="handleBatchUpdate('decimalPlaces', $event)"
          />
        </div>
        <div class="property-item"> 
          <label>字体</label>
          <el-select v-model="formData.fontFamily" placeholder="选择字体" @change="handleBatchUpdate('fontFamily', $event)">
            <el-option v-for="item in fonts" :key="item.value" :label="item.label"
                :value="item.value">
                <span :style="'font-family:' + item.value">{{ item.label }}</span>
            </el-option>
          </el-select>
        </div>
        <div class="property-item"> 
          <label>颜色</label>
          <el-color-picker v-model="formData.fill"   @change="handleBatchUpdate('fill', $event)"/> 
        </div>
        <div class="property-item"> 
          <label>字体大小</label>
          <el-input-number v-model="formData.fontSize"  :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"
          controls-position="right"  @change="handleBatchUpdate('fontSize', $event)" />
        </div>
        <div class="property-item"> 
          <label>字体粗细</label>
          <el-select v-model="formData.fontWeight" placeholder="选择字体粗细"  @change="handleBatchUpdate('fontWeight', $event)" >
            <el-option label="普通" value="normal"></el-option>
            <el-option label="粗体" value="bold"></el-option>
          </el-select>
        </div>
        <div class="property-item"> 
          <label>内边距</label>
          <el-input-number v-model="formData.padding" controls-position="right"  @change="handleBatchUpdate('padding', $event)"  />
        </div>
        <div class="property-item"> 
          <label>水平对齐</label>
          <el-select v-model="formData.textAlign" placeholder="选择水平对齐" @change="handleBatchUpdate('textAlign', $event)">
                    <el-option label="左对齐" value="left"></el-option>
                    <el-option label="居中" value="center"></el-option>
                    <el-option label="右对齐" value="right"></el-option>
                </el-select>
        </div>
        <div class="property-item"> 
          <label>垂直对齐</label>
          <el-select v-model="formData.verticalAlign" placeholder="选择垂直对齐" @change="handleBatchUpdate('verticalAlign', $event)">
                  <el-option label="顶部对齐" value="top"></el-option>
                  <el-option label="居中" value="middle"></el-option>
                  <el-option label="底部对齐" value="bottom"></el-option>
              </el-select>
        </div>
        <div class="property-item"> 
          <label>字间距</label>
          <el-input-number v-model="formData.letterSpacing" controls-position="right" @change="handleBatchUpdate('letterSpacing', $event)" />
        </div>
        <div class="property-item"> 
          <label>行高</label>
          <el-input-number v-model="formData.lineHeight" controls-position="right"  @change="handleBatchUpdate('lineHeight', $event)" />
        </div>
        <div class="property-item"> 
          <label>背景颜色</label>
          <el-color-picker v-model="formData.backgroundColor"   @change="handleBatchUpdate('backgroundColor', $event)" />
        </div>
        <template v-if="initialized"> 
          <div class="property-item"> 
          <label>边框大小</label>
          <el-input-number v-model="formData.borderSize" controls-position="right" @change="handleBatchUpdate('borderSize', $event)" />
        </div>
        <div class="property-item"> 
          <label>边框颜色</label>
          <el-color-picker v-model="formData.borderColor" @change="handleBatchUpdate('borderColor', $event)" />
        </div>
        <div class="property-item"> 
          <label>线条样式</label>
          <el-select v-model="formData.borderStyle" placeholder="选择线条样式"  @change="handleBatchUpdate('borderStyle', $event)">
            <el-option label="实线" value="solid"></el-option>
            <el-option label="虚线" value="dashed"></el-option>
            <el-option label="点线" value="dotted"></el-option>
          </el-select>
        </div>
        </template>
       </div>
       <!-- 这是通用属性可能有其他组件的属性 -->
      <div v-if="!isText&&hasCommonTextProps" class="property-group">
        <!-- <div v-if="hasCommonTextProps" class="property-group">  -->
        <h4 class="group-title">公共样式</h4>
        <!-- 字体大小 -->
        <div v-if="commonProps.fontSize !== null" class="property-item">
          <label>字体大小</label>
          <el-input-number
            v-model="commonProps.fontSize"
             :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"
            placeholder="请选择字体大小"
            @change="handleBatchUpdate('fontSize', $event)"
          />
        </div>

        <!-- 字体颜色 -->
        <div v-if="commonProps.fill !== null" class="property-item">
          <label>字体颜色</label>
          <el-color-picker
            v-model="commonProps.fill"
            show-alpha
            @change="handleBatchUpdate('fill', $event)"
          />
        </div>

        <!-- 字体粗细 -->
        <div v-if="commonProps.fontWeight !== null" class="property-item">
          <label>字体粗细</label>
          <el-select
            v-model="commonProps.fontWeight"
            placeholder="请选择字体粗细"
            @change="handleBatchUpdate('fontWeight', $event)"
          >
            <el-option label="正常" value="normal" />
            <el-option label="粗体" value="bold" />
          </el-select>
        </div>
        <!-- 文本对齐 -->
        <div v-if="commonProps.textAlign !== null" class="property-item">
          <label>文本对齐</label>
          <el-select
            v-model="commonProps.textAlign"
            placeholder="请选择对齐方式"
            @change="handleBatchUpdate('textAlign', $event)"
          >
            <el-option label="左对齐" value="left" />
            <el-option label="居中" value="center" />
            <el-option label="右对齐" value="right" />
          </el-select>
        </div>
      </div>

      <!-- 背景属性 -->
      <div v-if="hasCommonBackgroundProps" class="property-group">
        <!-- 背景颜色 -->
        <div v-if="commonProps.backgroundColor !== null" class="property-item">
          <label>背景颜色</label>
          <el-color-picker
            v-model="commonProps.backgroundColor"
            show-alpha
            @change="handleBatchUpdate('backgroundColor', $event)"
          />
        </div>

        <!-- 标签填充色 -->
        <div v-if="commonProps.tagFill !== null" class="property-item">
          <label>标签填充色</label>
          <el-color-picker
            v-model="commonProps.tagFill"
            show-alpha
            @change="handleBatchUpdate('tagFill', $event)"
          />
        </div>
      </div>

      <!-- 位置和尺寸 -->
      <div class="property-group" v-if="hasCommonBackgroundProps">
        <!-- 宽度 -->
        <div class="property-item">
          <label>宽度</label>
          <el-input-number
            :model-value="getCommonSize().width"
            :min="1"
            placeholder="宽度"
            @change="handleBatchSizeUpdate('width', $event)"
          />
        </div>

        <!-- 高度 -->
        <div class="property-item" v-if="hasCommonBackgroundProps">
          <label>高度</label>
          <el-input-number
            :model-value="getCommonSize().height"
            :min="1"
            placeholder="高度"
            @change="handleBatchSizeUpdate('height', $event)"
          />
        </div>

        <!-- 透明度 -->
        <!-- <div class="property-item">
            <label>透明度</label>
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

      <!-- 快捷操作 -->
      <div class="property-group">
        <h4 class="group-title">快捷操作</h4>
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
            {{ isAllLocked ? '解锁全部' : '锁定全部' }}
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
            {{ isAllVisible ? '隐藏全部' : '显示全部' }}
          </el-button>
          <el-button type="danger" @click="handleBatchDelete"  plain>
              <svg-icon
              name="delete"
              size="14"
              class="mr5"
            ></svg-icon>
            删除全部
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

    // 检查是否有通用的文本属性
    hasCommonTextProps() {
      return (
        this.commonProps.fontSize !== null ||
        this.commonProps.fill !== null ||
        this.commonProps.fontWeight !== null ||
        this.commonProps.fontFamily !== null ||
        this.commonProps.textAlign !== null
      )
    },

    // 检查是否有通用的背景属性
    hasCommonBackgroundProps() {
      return this.commonProps.backgroundColor !== null || this.commonProps.tagFill !== null
    },

    // 检查是否全部锁定
    isAllLocked() {
      return this.activeNodes.every((node) => node.attrs?.lock)
    },

    // 检查是否全部可见
    isAllVisible() {
      return this.activeNodes.every((node) => node.visible())
    },
    //检查是否全部都是文本
    isText(){
      if(this.activeNodes.every((node) => node.attrs.name=="text")){ 
        setTimeout(() => {
            // 延迟初始化部分内容减少渲染卡顿的问题
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
        // 文本属性 - 默认为空
        fontSize: null,
        fill: null,
        fontWeight: null,
        fontFamily: null,
        textAlign: null,

        // 背景属性 - 默认为空
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
    // 页面重置方法
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
    // 对齐处理
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

    // 更新共同属性 - 修改逻辑：默认为空，只有完全相同时才显示
    updateCommonProps() {
      if (this.activeNodes.length <= 1) {
        // 单个或无选择时，所有属性都为空
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

      // 提取所有节点的属性
      const nodeProps = this.activeNodes.map((node) => node.attrs?.props || {})

      // 找出共同属性 - 只有当所有节点都有相同属性值时才显示
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

        // 只有当所有节点都有这个属性且值完全相同时，才设置为共同属性
        if (values.length === nodeProps.length && values.every((val) => val === values[0])) {
          this.commonProps[key] = values[0]
        } else {
          // 否则设置为null（空）
          this.commonProps[key] = null
        }
      })
    },

    // 批量更新属性
    handleBatchUpdate(propName, value) {
      this.activeNodes.forEach((node) => {
        if (node.updateParams && typeof node.updateParams === 'function') {
          node.updateParams({ [propName]: value })
        }
      })

      // 触发历史记录
      if (window.kdt?.stateManage?.class?.history) {
        setTimeout(() => {
          window.kdt.stateManage.class.history.addHistory({ title: `批量修改${propName}` })
        }, 100)
      }
    },

    // 获取共同尺寸
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

      // 返回第一个节点的尺寸
      const firstSize = sizes[0]
      return firstSize || { width: 0, height: 0 }
    },

    // 获取共同透明度 - 保持透明度逻辑不变
    getCommonOpacity() {
      if (this.activeNodes.length === 0) return 1

      const opacities = this.activeNodes.map((node) => node.opacity() || 1)
      const firstOpacity = opacities[0]
      return firstOpacity
    },

    // 批量更新尺寸
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
        window.kdt?.addHistory({ title: `批量修改${dimension === 'width' ? '宽度' : '高度'}` })
      }, 100)
    },

    // 批量更新透明度 - 修复透明度问题
    handleBatchOpacityUpdate(value) {
      this.activeNodes.forEach((node) => {
        node.opacity(value)
      })

      // 强制重绘所有节点和图层
      this.activeNodes.forEach((node) => {
        const layer = node.getLayer()
        if (layer) {
          layer.batchDraw()
        }
      })
      window.kdt?.forceUpdate()
      setTimeout(() => {
        window.kdt.addHistory({ title: '批量修改透明度' })
      }, 50)
    },

    // 批量锁定/解锁
    handleBatchLock() {
      if (this.isAllLocked) {
        // 解锁全部
        this.activeNodes.forEach((node) => {
          window.kdt.unlockNodes(node)
        })
      } else {
        // 锁定全部
        this.activeNodes.forEach((node) => {
          window.kdt.lockNodes(node)
        })
      }
    },

    // 批量显示/隐藏
    handleBatchVisibility() {
      if (this.isAllVisible) {
        // 隐藏全部
        this.activeNodes.forEach((node) => {
          window.kdt.hideNodes(node)
        })
      } else {
        // 显示全部
        this.activeNodes.forEach((node) => {
          window.kdt.showNodes(node)
        })
      }
    },

    // 批量删除
    handleBatchDelete() {
      this.$confirm('确定要删除所有选中的节点吗？', '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          window.kdt.deleteNodes()
        })
        .catch(() => {
          // 用户取消删除
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

// Element UI 组件样式调整
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
