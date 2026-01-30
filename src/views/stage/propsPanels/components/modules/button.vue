<template>
  <div>
    <el-form-item label="快捷样式" label-width="90px" v-show="!isEvent">
      <div class="quick-styles-wrapper">
        <div
          v-for="(style, index) in quickStyles"
          :key="index"
          class="quick-style-btn"
          @click="applyQuickStyle(style)"
          :title="style.name"
        >
          <div class="style-preview" :style="getQuickStylePreview(style)"></div>
          <span class="style-name">{{ style.name }}</span>
        </div>
      </div>
    </el-form-item>
    <el-form label-width="120px">
      <el-form-item label="文本" v-if="!isEvent">
        <el-input v-model="formData.data" @input="updateNode" />
      </el-form-item>
      <el-form-item label="小数位">
        <el-input-number
          v-model="formData.decimalPlaces"
          :min="0"
          :max="10"
          placeholder="默认不处理"
          controls-position="right"
          clearable
        />
      </el-form-item>
      <el-form-item label="文字字体">
        <el-select v-model="formData.fontFamily" placeholder="选择字体">
          <el-option
            v-for="item in fonts"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          >
            <span :style="'font-family:' + item.value">{{ item.label }}</span>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="文字颜色">
        <el-color-picker v-model="formData.textColor" />
      </el-form-item>
      <el-form-item label="字体大小">
        <el-input-number v-model="formData.fontSize"  :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"/>
      </el-form-item>
      <el-form-item label="字体粗细">
        <el-select v-model="formData.fontWeight">
          <el-option label="正常" value="normal"></el-option>
          <el-option label="加粗" value="bold"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="背景类型">
        <el-select v-model="formData.backgroundType">
          <el-option label="单色" value="solid"></el-option>
          <el-option label="渐变" value="gradient"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="背景颜色" v-if="formData.backgroundType !== 'gradient'">
        <el-color-picker v-model="formData.backgroundColor" />
      </el-form-item>
      <el-form-item label="渐变颜色" v-if="formData.backgroundType === 'gradient'">
        <div class="tags-wrapper">
          <el-tag
            v-for="(colorConfig, index) in formData.gradientColors"
            :key="index"
            :closable="true"
            @close="removeGradientColor(index)"
            :style="getTagStyle(colorConfig)"
            class="gradient-tag"
          >
            <i class="el-icon-rank drag-handle" style="margin-right: 5px; cursor: move"></i>
            {{ `${colorConfig.color.toUpperCase()}` }}
          </el-tag>
        </div>
        <!-- 配置按钮，用于打开颜色管理弹窗 -->
        <el-button
          type="primary"
          size="small"
          @click="openColorDialog()"
          class="config-button mt10"
        >
          配置渐变颜色
        </el-button>
      </el-form-item>
      <el-form-item label="渐变方向" v-if="formData.backgroundType === 'gradient'">
        <el-select v-model="formData.gradientDirection">
          <el-option label="水平" value="horizontal"></el-option>
          <el-option label="垂直" value="vertical"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="边框颜色">
        <el-color-picker v-model="formData.borderColor" />
      </el-form-item>
      <el-form-item label="边框粗细">
        <el-input-number v-model="formData.borderWidth" :min="0" :max="100" />
      </el-form-item>
      <el-form-item label="圆角">
        <el-input-number v-model="formData.borderRadius" :min="0" :max="100" />
      </el-form-item>
      <el-form-item label="内边距">
        <el-input-number v-model="formData.padding" :min="0" :max="50" />
      </el-form-item>
      <el-form-item label="对齐方式">
        <el-select v-model="formData.textAlign">
          <el-option label="居中" value="center"></el-option>
          <el-option label="左对齐" value="left"></el-option>
          <el-option label="右对齐" value="right"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="禁用">
        <el-switch v-model="formData.disabled"></el-switch>
      </el-form-item>
    </el-form>
    <!-- 颜色管理弹窗 -->
    <el-dialog
      title="管理渐变颜色"
      :model-value="colorDialogVisible"
      width="500px"
      @close="cancelColorDialog"
    >
      <el-button type="primary" @click="openAddDialog" plain>添加颜色</el-button>
      <el-table :data="formData.gradientColors" style="width: 100%">
        <el-table-column prop="color" label="颜色">
          <template #default="scope">
            <el-color-picker v-model="scope.row.color" />
          </template>
        </el-table-column>
        <el-table-column prop="offset" label="偏移值">
          <template #default="scope">
            <el-input-number
              v-model="scope.row.offset"
              :min="0"
              :max="1"
              :step="0.1"
              :precision="1"
              placeholder="偏移值 (0-1)"
              style="width: 100%"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="scope">
            <el-button link @click="removeGradientColor(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="cancelColorDialog">关闭</el-button>
      </div>
    </el-dialog>

    <!-- 弹窗新增/编辑颜色的对话框 -->
    <el-dialog
      title="编辑渐变颜色"
      :model-value="editColorDialogVisible"
      width="400px"
      @close="cancelEditColorDialog"
    >
      <el-form :model="tempColorConfig" label-width="100px">
        <el-form-item label="颜色">
          <el-color-picker v-model="tempColorConfig.color"></el-color-picker>
        </el-form-item>
        <el-form-item label="偏移值">
          <el-slider
            v-model="tempColorConfig.offset"
            :step="0.1"
            :min="0"
            :max="1"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancelEditColorDialog">取消</el-button>
        <el-button type="primary" @click="confirmEditColorDialog">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import propsPanelMixins from '@/mixins/propsPanelMixins'
import { fontsData } from '@/config/fonts'

export default {
  name: 'buttonPanel',
  mixins: [propsPanelMixins],
  data() {
    return {
      fonts: fontsData,
      formData: {},
      colorDialogVisible: false, // 控制渐变颜色管理弹窗显示
      editColorDialogVisible: false, // 控制编辑/新增颜色弹窗显示
      editIndex: -1, // 编辑模式下的索引，-1 表示新建
      tempColorConfig: {
        // 临时存储弹窗中配置的颜色数据
        color: '#409EFE',
        offset: 0.5
      },
      quickStyles: [
        {
          name: '主要',
          props: {
            backgroundColor: '#409EFE',
            backgroundType: 'solid',
            textColor: '#ffffff',
            borderColor: '#409EFE',
            borderWidth: 1,
            borderRadius: 6
          }
        },
        {
          name: '成功',
          props: {
            backgroundColor: '#67C23A',
            backgroundType: 'solid',
            textColor: '#ffffff',
            borderColor: '#67C23A',
            borderWidth: 1,
            borderRadius: 6
          }
        },
        {
          name: '警告',
          props: {
            backgroundColor: '#E6A23C',
            backgroundType: 'solid',
            textColor: '#ffffff',
            borderColor: '#E6A23C',
            borderWidth: 1,
            borderRadius: 6
          }
        },
        {
          name: '危险',
          props: {
            backgroundColor: '#F56C6C',
            backgroundType: 'solid',
            textColor: '#ffffff',
            borderColor: '#F56C6C',
            borderWidth: 1,
            borderRadius: 6
          }
        },
        {
          name: '次要',
          props: {
            backgroundColor: '#ffffff',
            backgroundType: 'solid',
            textColor: '#606266',
            borderColor: '#DCDFE6',
            borderWidth: 1,
            borderRadius: 6
          }
        },
        {
          name: '文本',
          props: {
            backgroundColor: 'transparent',
            backgroundType: 'solid',
            textColor: '#409EFE',
            borderColor: 'transparent',
            borderWidth: 0,
            borderRadius: 6
          }
        },
        {
          name: '渐变',
          props: {
            backgroundType: 'gradient',
            gradientColors: [
              { color: '#409EFE', offset: 0 },
              { color: '#67aef7', offset: 1 }
            ],
            gradientDirection: 'horizontal',
            textColor: '#ffffff',
            borderColor: 'transparent',
            borderWidth: 0,
            borderRadius: 8
          }
        },
        {
          name: '圆形',
          props: {
            backgroundColor: '#409EFE',
            backgroundType: 'solid',
            textColor: '#ffffff',
            borderColor: '#409EFE',
            borderWidth: 1,
            borderRadius: 25
          }
        }
      ]
    }
  },
  methods: {
    // 打开渐变颜色管理弹窗
    openColorDialog() {
      this.colorDialogVisible = true
    },
    // 关闭渐变颜色管理弹窗
    cancelColorDialog() {
      this.colorDialogVisible = false
    },
    // 打开新增颜色弹窗
    openAddDialog() {
      this.editIndex = -1
      this.tempColorConfig = { color: '#409EFE', offset: 0.5 }
      this.editColorDialogVisible = true
    },
    // 打开编辑颜色弹窗
    editColor(index) {
      this.editIndex = index
      this.tempColorConfig = { ...this.formData.gradientColors[index] }
      this.editColorDialogVisible = true
    },
    // 取消编辑颜色弹窗
    cancelEditColorDialog() {
      this.editColorDialogVisible = false
    },
    // 确认编辑或新增颜色
    confirmEditColorDialog() {
      const { color, offset } = this.tempColorConfig
      // 数据验证
      if (!color) {
        this.$message.error('请选择颜色')
        return
      }
      if (offset < 0 || offset > 1) {
        this.$message.error('偏移值必须在 0 到 1 之间')
        return
      }

      if (this.editIndex === -1) {
        // 新建模式，添加新数据
        this.formData.gradientColors.push({ color, offset })
      } else {
        // 编辑模式，更新现有数据
        this.formData.gradientColors[this.editIndex] = { color, offset }
      }
      this.editColorDialogVisible = false
      this.colorDialogVisible = true
      this.$forceUpdate()
      this.updateNode() // 更新节点
    },
    // 应用快捷样式
    applyQuickStyle(style) {
      // Vue3中直接赋值
      Object.keys(style.props).forEach((key) => {
        this.formData[key] = style.props[key]
      })

      // 触发节点更新
      this.updateNode()

      // 显示成功提示
      this.$message.success(`已应用"${style.name}"样式`)
    },

    // 获取快捷样式预览样式
    getQuickStylePreview(style) {
      const props = style.props
      let background = props.backgroundColor

      // 如果是渐变背景
      if (props.backgroundType === 'gradient' && props.gradientColors) {
        const direction = props.gradientDirection === 'vertical' ? '180deg' : '90deg'
        const colorStops = props.gradientColors
          .map((item) => `${item.color} ${item.offset * 100}%`)
          .join(', ')
        background = `linear-gradient(${direction}, ${colorStops})`
      }

      return {
        background: props.backgroundType === 'gradient' ? background : props.backgroundColor,
        border: `${props.borderWidth || 1}px solid ${props.borderColor}`,
        borderRadius: `${props.borderRadius || 6}px`
      }
    },
    // 删除颜色
    removeGradientColor(index) {
      this.$confirm('确定删除此配色？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          this.formData.gradientColors.splice(index, 1)
          this.updateNode() // 更新节点
        })
        .catch(() => {})
    },
    // 拖拽排序结束时的处理
    onDragEnd() {
      this.updateNode()
    },
    // 生成标签的背景样式
    getTagStyle(colorConfig) {
      const direction = this.formData.gradientDirection === 'vertical' ? '180deg' : '90deg'
      return {
        background: `linear-gradient(${direction}, ${colorConfig.color} ${(colorConfig.offset * 100).toFixed(0)}%, #ffffff)`,
        color:
          colorConfig.color === '#fff' ||
          colorConfig.color === '#FFFFFF' ||
          colorConfig.color === 'rgba(255, 255, 255, 1)' ||
          colorConfig.color === 'RGBA(255, 255, 255, 1)'
            ? '#000'
            : '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.quick-styles-wrapper {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-bottom: 8px;
  margin-top: 5px;
}

.quick-style-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 4px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  background: #f8f9fa;
  border: 1px solid #e9ecef;

  &:hover {
    background: #e9ecef;
    border-color: #409efe;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

.style-preview {
  width: 32px;
  height: 16px;
  border-radius: 4px;
  margin-bottom: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.style-name {
  font-size: 10px;
  color: #606266;
  text-align: center;
  line-height: 1;
  white-space: nowrap;
}

.tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.gradient-tag {
  display: flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
  white-space: nowrap;
}

.config-button {
  margin-left: 8px;
  color: #fff;
  font-size: 12px;
}

.drag-handle {
  cursor: move;
  margin-right: 10px;
}

.dialog-footer {
  text-align: right;
  margin-top: 20px;
}
</style>
