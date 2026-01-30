<template>
  <div>
    <el-form-item label="Quick Style" label-width="90px" v-show="!isEvent">
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
      <el-form-item label="Text" v-if="!isEvent">
        <el-input v-model="formData.data" @input="updateNode" />
      </el-form-item>
      <el-form-item label="Decimal Places">
        <el-input-number
          v-model="formData.decimalPlaces"
          :min="0"
          :max="10"
          placeholder="default not handled"
          controls-position="right"
          clearable
        />
      </el-form-item>
      <el-form-item label="Text Font">
        <el-select v-model="formData.fontFamily" placeholder="select font">
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
      <el-form-item label="Text Color">
        <el-color-picker v-model="formData.textColor" />
      </el-form-item>
      <el-form-item label="Font Size">
        <el-input-number v-model="formData.fontSize"  :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"/>
      </el-form-item>
      <el-form-item label="Font Weight">
        <el-select v-model="formData.fontWeight">
          <el-option label="normal" value="normal"></el-option>
          <el-option label="bold" value="bold"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="Bg Type">
        <el-select v-model="formData.backgroundType">
          <el-option label="solid" value="solid"></el-option>
          <el-option label="gradient" value="gradient"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="Bg Color" v-if="formData.backgroundType !== 'gradient'">
        <el-color-picker v-model="formData.backgroundColor" />
      </el-form-item>
      <el-form-item label="Gradient Color" v-if="formData.backgroundType === 'gradient'">
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
        <!-- Configuration Button，Used to open the color management pop-up -->
        <el-button
          type="primary"
          size="small"
          @click="openColorDialog()"
          class="config-button mt10"
        >
          configure gradient color
        </el-button>
      </el-form-item>
      <el-form-item label="Gradient Direction" v-if="formData.backgroundType === 'gradient'">
        <el-select v-model="formData.gradientDirection">
          <el-option label="horizontal" value="horizontal"></el-option>
          <el-option label="vertical" value="vertical"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="Border Color">
        <el-color-picker v-model="formData.borderColor" />
      </el-form-item>
      <el-form-item label="Border Thickness">
        <el-input-number v-model="formData.borderWidth" :min="0" :max="100" />
      </el-form-item>
      <el-form-item label="Border Radius">
        <el-input-number v-model="formData.borderRadius" :min="0" :max="100" />
      </el-form-item>
      <el-form-item label="Padding">
        <el-input-number v-model="formData.padding" :min="0" :max="50" />
      </el-form-item>
      <el-form-item label="Alignment">
        <el-select v-model="formData.textAlign">
          <el-option label="center" value="center"></el-option>
          <el-option label="left" value="left"></el-option>
          <el-option label="right" value="right"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="Disabled">
        <el-switch v-model="formData.disabled"></el-switch>
      </el-form-item>
    </el-form>
    <!-- Color Management Pop-up -->
    <el-dialog
      title="Manage Gradient Colors"
      :model-value="colorDialogVisible"
      width="500px"
      @close="cancelColorDialog"
    >
      <el-button type="primary" @click="openAddDialog" plain>add color</el-button>
      <el-table :data="formData.gradientColors" style="width: 100%">
        <el-table-column prop="color" label="Color">
          <template #default="scope">
            <el-color-picker v-model="scope.row.color" />
          </template>
        </el-table-column>
        <el-table-column prop="offset" label="Offset">
          <template #default="scope">
            <el-input-number
              v-model="scope.row.offset"
              :min="0"
              :max="1"
              :step="0.1"
              :precision="1"
              placeholder="offset (0-1)"
              style="width: 100%"
            />
          </template>
        </el-table-column>
        <el-table-column label="Action" width="100">
          <template #default="scope">
            <el-button link @click="removeGradientColor(scope.$index)">delete</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="cancelColorDialog">close</el-button>
      </div>
    </el-dialog>

    <!-- Pop-up for Adding/Dialog for Editing Color -->
    <el-dialog
      title="Edit Gradient Color"
      :model-value="editColorDialogVisible"
      width="400px"
      @close="cancelEditColorDialog"
    >
      <el-form :model="tempColorConfig" label-width="100px">
        <el-form-item label="Color">
          <el-color-picker v-model="tempColorConfig.color"></el-color-picker>
        </el-form-item>
        <el-form-item label="Offset">
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
        <el-button @click="cancelEditColorDialog">cancel</el-button>
        <el-button type="primary" @click="confirmEditColorDialog">confirm</el-button>
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
      colorDialogVisible: false, // Control the display of gradient color management pop-up
      editColorDialogVisible: false, // Control Editing/Display of add color pop-up
      editIndex: -1, // Index in editing mode，-1 Indicates new creation
      tempColorConfig: {
        // Temporarily store color data configured in the pop-up
        color: '#409EFE',
        offset: 0.5
      },
      quickStyles: [
        {
          name: 'Primary',
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
          name: 'Success',
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
          name: 'Warning',
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
          name: 'Danger',
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
          name: 'Secondary',
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
          name: 'Text',
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
          name: 'Gradient',
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
          name: 'Circle',
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
    // Open gradient color management pop-up
    openColorDialog() {
      this.colorDialogVisible = true
    },
    // Close gradient color management pop-up
    cancelColorDialog() {
      this.colorDialogVisible = false
    },
    // Open add color pop-up
    openAddDialog() {
      this.editIndex = -1
      this.tempColorConfig = { color: '#409EFE', offset: 0.5 }
      this.editColorDialogVisible = true
    },
    // Open edit color pop-up
    editColor(index) {
      this.editIndex = index
      this.tempColorConfig = { ...this.formData.gradientColors[index] }
      this.editColorDialogVisible = true
    },
    // Cancel edit color pop-up
    cancelEditColorDialog() {
      this.editColorDialogVisible = false
    },
    // Confirm editing or adding color
    confirmEditColorDialog() {
      const { color, offset } = this.tempColorConfig
      // Data Validation
      if (!color) {
        this.$message.error('please select color')
        return
      }
      if (offset < 0 || offset > 1) {
        this.$message.error('offset must be between 0 and 1 offset must be between')
        return
      }

      if (this.editIndex === -1) {
        // New Creation Mode，Add New Data
        this.formData.gradientColors.push({ color, offset })
      } else {
        // Editing Mode，Update Existing Data
        this.formData.gradientColors[this.editIndex] = { color, offset }
      }
      this.editColorDialogVisible = false
      this.colorDialogVisible = true
      this.$forceUpdate()
      this.updateNode() // Update Node
    },
    // Apply Quick Style
    applyQuickStyle(style) {
      // Vue3Direct assignment in
      Object.keys(style.props).forEach((key) => {
        this.formData[key] = style.props[key]
      })

      // Trigger Node Update
      this.updateNode()

      // Show Success Message
      this.$message.success(`applied"${style.name}"style`)
    },

    // Get Quick Style Preview Style
    getQuickStylePreview(style) {
      const props = style.props
      let background = props.backgroundColor

      // If it is a gradient background
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
    // Delete Color
    removeGradientColor(index) {
      this.$confirm('confirm delete this color scheme？', 'prompt', {
        confirmButtonText: 'confirm',
        cancelButtonText: 'cancel',
        type: 'warning'
      })
        .then(() => {
          this.formData.gradientColors.splice(index, 1)
          this.updateNode() // Update Node
        })
        .catch(() => {})
    },
    // Handling when drag sorting ends
    onDragEnd() {
      this.updateNode()
    },
    // Generate Tag Background Style
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
  grid-template-columns: repeat(3, 1fr);
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
