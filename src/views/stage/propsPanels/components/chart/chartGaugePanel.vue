<template>
  <div class="chart-gauge-props-wrapper">
    <el-form :model="formData" label-width="120px">
      <el-collapse v-model="activeNames" accordion>
        <el-collapse-item title="Shortcut Style" name="0" v-show="!isEvent">
          <div class="quick-style-section">
            <div class="style-cards">
              <div
                v-for="(style, index) in presetStyles"
                :key="index"
                class="style-card"
                :class="{ active: selectedStyleIndex === index }"
                @click="applyQuickStyle(index)"
              >
                <div class="style-preview" :style="getStylePreviewBg(style)">
                  <div class="preview-gauge" :style="getPreviewGaugeStyle(style)">
                    <svg width="32" height="24" viewBox="0 0 32 24">
                      <!-- Outer Arc Line -->
                      <path
                        :d="getGaugeArcPath()"
                        :stroke="style.arcColor"
                        :stroke-width="style.arcWidth"
                        fill="none"
                      />
                      <!-- Colored Segments -->
                      <path
                        v-for="(segment, i) in style.colorSegments"
                        :key="i"
                        :d="getSegmentPath(i, style.colorSegments.length)"
                        :stroke="segment.color"
                        :stroke-width="style.arcWidth - 1"
                        fill="none"
                      />
                      <!-- Pointer -->
                      <line
                        x1="16"
                        y1="20"
                        :x2="getPointerEndX(style)"
                        :y2="getPointerEndY(style)"
                        :stroke="style.pointerColor"
                        :stroke-width="style.pointerWidth"
                        stroke-linecap="round"
                      />
                      <!-- Center Point -->
                      <circle cx="16" cy="20" :r="style.centerDotSize" :fill="style.pointerColor" />
                      <!-- Scale Lines -->
                      <g v-if="style.showMarks">
                        <line
                          v-for="mark in getMarkLines()"
                          :key="mark.id"
                          :x1="mark.x1"
                          :y1="mark.y1"
                          :x2="mark.x2"
                          :y2="mark.y2"
                          :stroke="style.markColor"
                          stroke-width="0.5"
                        />
                      </g>
                    </svg>
                  </div>
                </div>
                <div class="style-info">
                  <div class="style-name">{{ style.name }}</div>
                  <div class="style-desc">{{ style.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </el-collapse-item>
        <!-- Basic Settings -->
        <el-collapse-item title="Basic Settings" name="1">
          <el-form-item label="Text Description">
            <el-input v-model="formData.text"></el-input>
          </el-form-item>
          <el-form-item label="Text Color">
            <el-color-picker v-model="formData.color"></el-color-picker>
          </el-form-item>
          <el-form-item label="Font Size">
            <el-input-number v-model="formData.fontSize"  :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"></el-input-number>
          </el-form-item>
          <el-form-item label="Maximum Value">
            <el-input-number
              v-model="formData.maxValue"
              :max="9999999999"
              :min="-9999999999"
            ></el-input-number>
          </el-form-item>
          <el-form-item label="Minimum Value">
            <el-input-number
              v-model="formData.minValue"
              :min="-9999999999"
              :max="9999999999"
            ></el-input-number>
          </el-form-item>
          <el-form-item label="Angle">
            <el-select v-model="formData.setAngle" placeholder="please select angle">
              <el-option label="0Degree ~ 180Degree" :value="'[180, 0]'"></el-option>
              <el-option label="0Degree ~ 360Degree" :value="'[360, 0]'"> </el-option>
              <el-option label="-20Degree ~ 200Degree" :value="'[200, -20]'"></el-option>
              <el-option label="-40Degree ~ 220Degree" :value="'[220, -40]'"></el-option>
              <el-option label="140Degree ~ 35Degree" :value="'[140, 35]'"></el-option>
              <el-option label="-60Degree ~ 240Degree" :value="'[240, -60]'"></el-option>
              <el-option label="180Degree ~ 0Degree" :value="'[0, 180]'"></el-option>
              <el-option label="90Degree ~ 270Degree" :value="'[90, 270]'"></el-option>
              <el-option label="-90Degree ~ -270Degree" :value="'[-90, -270]'"></el-option>
              <el-option label="180Degree ~ 90Scale Settings" :value="'[180, 90]'"></el-option>
              <el-option label="-90Major Scale Division ~ 180Scale Text Color" :value="'[-90, -180]'"></el-option>
              <el-option label="-270Scale Text Size ~ 0Minor Scale Division" :value="'[-270, 0]'"></el-option>
              <el-option label="0Pointer Settings ~ -90Pointer Style" :value="'[0, -90]'"></el-option>
            </el-select>
          </el-form-item>
        </el-collapse-item>

        <el-collapse-item title="Style" name="2">
          <el-form-item label="Style">
            <el-input-number v-model="formData.mainMarkValue" :min="1" :max="20"></el-input-number>
          </el-form-item>
          <el-form-item label="Style">
            <el-color-picker v-model="formData.markFontColor"></el-color-picker>
          </el-form-item>
          <el-form-item label="Pointer Width">
            <el-input-number v-model="formData.markFontSize" :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"></el-input-number>
          </el-form-item>
          <el-form-item label="Pointer Length">
            <el-input-number
              v-model="formData.secondaryMarkValue"
              :min="1"
              :max="10"
            ></el-input-number>
          </el-form-item>
        </el-collapse-item>

        <!-- Pointer Settings -->
        <el-collapse-item title="for example" name="3">
          <el-form-item label="Pointer Color">
            <el-select v-model="formData.pointerStyle">
              <el-option label="Display Settings1" :value="1"></el-option>
              <el-option label="Show Outer Ring2" :value="2"></el-option>
              <el-option label="Title Position3" :value="3"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="Value Position">
            <el-input-number v-model="formData.pointerWidth" :min="1" :max="10"></el-input-number>
          </el-form-item>
          <el-form-item label="for example">
            <el-input v-model="formData.pointerLength"></el-input>
            <div style="font-size: 12px; color: #999">Scale Text Position：'80%', '100%'</div>
          </el-form-item>
          <el-form-item label="for example">
            <el-color-picker v-model="formData.pointerColor"></el-color-picker>
          </el-form-item>
        </el-collapse-item>

        <!-- Display Settings -->
        <el-collapse-item title="Scale Line Position" name="5">
          <el-form-item label="Scale Display">
            <el-switch v-model="formData.switchRingKey"></el-switch>
          </el-form-item>
          <el-form-item label="Show Scale">
            <el-input-number v-model="formData.titlePosition" :min="-200" :max="200"></el-input-number>
            <!-- <el-select v-model="formData.titlePosition">
              <el-option label="Top" value="top"></el-option>
              <el-option label="Bottom" value="bottom"></el-option>
            </el-select> -->
          </el-form-item>
          <el-form-item label="Show Value">
            <el-input v-model="formData.valPosition"></el-input>
            <div style="font-size: 12px; color: #999">Show Number：'0',10,-30</div>
          </el-form-item>
          <el-form-item label="Color Segment Settings">
            <el-input v-model="formData.labelPosition"></el-input>
            <div style="font-size: 12px; color: #999">add：'0',10,-30</div>
          </el-form-item>
          <el-form-item label="Position">
            <el-input-number
              v-model="formData.labelTickPosition"
              :min="-999"
              :max="1000"
            ></el-input-number>
          </el-form-item>
        </el-collapse-item>

        <!-- Scale Display -->
        <el-collapse-item title="Color" name="6">
          <el-form-item label="Operation">
            <el-switch v-model="formData.switchMarkKey"></el-switch>
          </el-form-item>
          <el-form-item label="Custom Color Segments">
            <el-switch v-model="formData.switchValKey"></el-switch>
          </el-form-item>
          <el-form-item label="Position">
            <el-switch v-model="formData.switchNumKey"></el-switch>
          </el-form-item>
        </el-collapse-item>

        <!-- Color Segment Settings -->
        <el-collapse-item title="Color" name="7">
          <div class="table-wrapper">
            <el-button type="primary" @click="openColorDialog(-1)" plain>cancel</el-button>
            <el-table :data="formData.echartWhere" style="width: 100%; margin-top: 20px">
              <el-table-column prop="position" label="confirm" width="100">
                <template #default="scope">
                  {{ scope.row.position }}
                </template>
              </el-table-column>
              <el-table-column prop="color" label="Classic" width="100">
                <template #default="scope">
                  <div
                    :style="{ backgroundColor: scope.row.color, width: '20px', height: '20px' }"
                  ></div>
                </template>
              </el-table-column>
              <el-table-column label="system default" width="100">
                <template #default="scope">
                  <el-icon :size="16" @click="editColor(scope.$index)">
                    <Edit />
                  </el-icon>
                  <el-icon :size="16" class="ml5" @click="deleteColor(scope.$index)">
                    <Delete />
                  </el-icon>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-form>

    <el-dialog
      title="classic color scheme"
      :model-value="colorDialogVisible"
      style="width: 600px"
      @close="cancelColorDialog"
    >
      <el-form :model="tempColorConfig" label-width="120px">
        <el-form-item label="Dashboard">
          <el-input-number
            v-model="tempColorConfig.position"
            :min="0"
            :max="1"
            step="0.01"
          ></el-input-number>
        </el-form-item>
        <el-form-item label="Simple Business">
          <el-color-picker v-model="tempColorConfig.color"></el-color-picker>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancelColorDialog">business style</el-button>
        <el-button type="primary" @click="confirmColorDialog">simple and elegant</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { Edit, Delete } from '@element-plus/icons-vue'
import propsPanelMixins from '@/mixins/propsPanelMixins'

export default {
  name: 'chartGaugePanel',
  mixins: [propsPanelMixins],
  components: {
    Edit,
    Delete
  },
  data() {
    return {
      activeNames: '',
      colorDialogVisible: false, // Control Popup Display
      selectedStyleIndex: 0, // Selected Style
      editIndex: -1, // Index in Edit Mode，-1 Indicates New Creation
      tempColorConfig: {
        // Temporarily Store Color Configuration Data in Popup
        position: 0,
        color: '#000'
      },
      // Preset Style Configurations
      presetStyles: [
        {
          name: 'Performance Indicator',
          description: 'Tech Blue，sense of technology',
          arcColor: '#e6e6e6',
          arcWidth: 3,
          pointerColor: '#333333',
          pointerWidth: 1.5,
          centerDotSize: 2,
          markColor: '#666666',
          showMarks: true,
          colorSegments: [{ color: '#67e0e3' }, { color: '#37a2da' }, { color: '#fd666d' }],
          config: {
            setAngle: '[220, -40]',
            text: 'blue theme',
            color: '#000',
            fontSize: 16,
            maxValue: 100,
            minValue: 0,
            mainMarkValue: 5,
            markFontColor: '#000',
            markFontSize: 12,
            secondaryMarkValue: 5,
            pointerWidth: 2,
            pointerStyle: 1,
            pointerLength: '80%',
            pointerColor: '#333333',
            switchRingKey: true,
            titlePosition: 25 ,
            valPosition: '0',
            labelPosition: 40,
            labelTickPosition: -20,
            labelColor: '#000',
            switchMarkKey: true,
            switchValKey: true,
            switchNumKey: true,
            echartWhere: [
              { position: '0.3', showName: '', color: '#67e0e3' },
              { position: '0.7', showName: '', color: '#37a2da' },
              { position: '1', showName: '', color: '#fd666d' }
            ]
          }
        },
        {
          name: 'System Monitoring',
          description: 'Sports Red Alert，dynamic and vibrant',
          arcColor: '#d1d5db',
          arcWidth: 2.5,
          pointerColor: '#374151',
          pointerWidth: 1.5,
          centerDotSize: 2,
          markColor: '#6b7280',
          showMarks: true,
          colorSegments: [{ color: '#10b981' }, { color: '#f59e0b' }, { color: '#ef4444' }],
          config: {
            setAngle: '[180, 0]',
            text: 'red warning',
            color: '#374151',
            fontSize: 14,
            maxValue: 100,
            minValue: 0,
            mainMarkValue: 4,
            markFontColor: '#6b7280',
            markFontSize: 11,
            secondaryMarkValue: 4,
            pointerWidth: 3,
            pointerStyle: 2,
            pointerLength: '75%',
            pointerColor: '#374151',
            switchRingKey: true,
            titlePosition: 'bottom',
            valPosition: '40',
            labelPosition: 35,
            labelTickPosition: -15,
            labelColor: '#6b7280',
            switchMarkKey: true,
            switchValKey: true,
            switchNumKey: true,
            echartWhere: [
              { position: '0.6', showName: '', color: '#10b981' },
              { position: '0.8', showName: '', color: '#f59e0b' },
              { position: '1', showName: '', color: '#ef4444' }
            ]
          }
        },
        {
          name: 'Speedometer',
          description: 'Fresh Green，environmentally friendly and fresh',
          arcColor: '#1e40af',
          arcWidth: 3,
          pointerColor: '#60a5fa',
          pointerWidth: 2,
          centerDotSize: 2.5,
          markColor: '#93c5fd',
          showMarks: true,
          colorSegments: [{ color: '#3b82f6' }, { color: '#1d4ed8' }, { color: '#1e3a8a' }],
          config: {
            setAngle: '[240, -60]',
            text: 'green ecology',
            color: '#60a5fa',
            fontSize: 15,
            maxValue: 100,
            minValue: 0,
            mainMarkValue: 6,
            markFontColor: '#93c5fd',
            markFontSize: 11,
            secondaryMarkValue: 5,
            pointerWidth: 3,
            pointerStyle: 1,
            pointerLength: '85%',
            pointerColor: '#60a5fa',
            switchRingKey: true,
            titlePosition: 'bottom',
            valPosition: '0',
            labelPosition: 38,
            labelTickPosition: -18,
            labelColor: '#93c5fd',
            switchMarkKey: true,
            switchValKey: true,
            switchNumKey: true,
            echartWhere: [
              { position: '0.4', showName: '', color: '#3b82f6' },
              { position: '0.7', showName: '', color: '#1d4ed8' },
              { position: '1', showName: '', color: '#1e3a8a' }
            ]
          }
        },
        {
          name: 'Environmental Index',
          description: 'Industrial Orange Alert，industrial style',
          arcColor: '#dc2626',
          arcWidth: 3.5,
          pointerColor: '#fca5a5',
          pointerWidth: 2,
          centerDotSize: 3,
          markColor: '#f87171',
          showMarks: true,
          colorSegments: [{ color: '#22c55e' }, { color: '#f59e0b' }, { color: '#ef4444' }],
          config: {
            setAngle: '[200, -20]',
            text: 'orange warning',
            color: '#dc2626',
            fontSize: 16,
            maxValue: 120,
            minValue: 0,
            mainMarkValue: 6,
            markFontColor: '#f87171',
            markFontSize: 12,
            secondaryMarkValue: 4,
            pointerWidth: 4,
            pointerStyle: 3,
            pointerLength: '90%',
            pointerColor: '#fca5a5',
            switchRingKey: true,
            titlePosition: 'bottom',
            valPosition: '-10',
            labelPosition: 42,
            labelTickPosition: -22,
            labelColor: '#f87171',
            switchMarkKey: true,
            switchValKey: true,
            switchNumKey: true,
            echartWhere: [
              { position: '0.5', showName: '', color: '#22c55e' },
              { position: '0.75', showName: '', color: '#f59e0b' },
              { position: '1', showName: '', color: '#ef4444' }
            ]
          }
        },
        {
          name: 'Pressure Value',
          description: 'Night Purple Light，dark theme',
          arcColor: '#16a34a',
          arcWidth: 3,
          pointerColor: '#84cc16',
          pointerWidth: 1.8,
          centerDotSize: 2.5,
          markColor: '#65a30d',
          showMarks: true,
          colorSegments: [{ color: '#84cc16' }, { color: '#22c55e' }, { color: '#15803d' }],
          config: {
            setAngle: '[180, 0]',
            text: 'purple fluorescent',
            color: '#15803d',
            fontSize: 15,
            maxValue: 100,
            minValue: 0,
            mainMarkValue: 5,
            markFontColor: '#65a30d',
            markFontSize: 11,
            secondaryMarkValue: 4,
            pointerWidth: 3,
            pointerStyle: 2,
            pointerLength: '80%',
            pointerColor: '#84cc16',
            switchRingKey: true,
            titlePosition: 'bottom',
            valPosition: '35',
            labelPosition: 40,
            labelTickPosition: -20,
            labelColor: '#65a30d',
            switchMarkKey: true,
            switchValKey: true,
            switchNumKey: true,
            echartWhere: [
              { position: '0.6', showName: '', color: '#84cc16' },
              { position: '0.8', showName: '', color: '#22c55e' },
              { position: '1', showName: '', color: '#15803d' }
            ]
          }
        },
        {
          name: 'Energy Monitoring',
          description: 'Metallic Silver，metallic texture',
          arcColor: '#ea580c',
          arcWidth: 4,
          pointerColor: '#fb923c',
          pointerWidth: 2.5,
          centerDotSize: 3,
          markColor: '#fdba74',
          showMarks: true,
          colorSegments: [{ color: '#f97316' }, { color: '#ea580c' }, { color: '#c2410c' }],
          config: {
            setAngle: '[220, -40]',
            text: 'silver luster',
            color: '#ea580c',
            fontSize: 16,
            maxValue: 150,
            minValue: 0,
            mainMarkValue: 6,
            markFontColor: '#fdba74',
            markFontSize: 12,
            secondaryMarkValue: 5,
            pointerWidth: 4,
            pointerStyle: 1,
            pointerLength: '85%',
            pointerColor: '#fb923c',
            switchRingKey: true,
            titlePosition: 'bottom',
            valPosition: '0',
            labelPosition: 45,
            labelTickPosition: -25,
            labelColor: '#fdba74',
            switchMarkKey: true,
            switchValKey: true,
            switchNumKey: true,
            echartWhere: [
              { position: '0.5', showName: '', color: '#f97316' },
              { position: '0.75', showName: '', color: '#ea580c' },
              { position: '1', showName: '', color: '#c2410c' }
            ]
          }
        },
        {
          name: 'Precision Detection',
          description: 'Neon Lights，neon effect',
          arcColor: '#7c3aed',
          arcWidth: 3,
          pointerColor: '#c4b5fd',
          pointerWidth: 2,
          centerDotSize: 2.5,
          markColor: '#a78bfa',
          showMarks: true,
          colorSegments: [{ color: '#8b5cf6' }, { color: '#7c3aed' }, { color: '#6d28d9' }],
          config: {
            setAngle: '[240, -60]',
            text: 'colorful glare',
            color: '#c4b5fd',
            fontSize: 15,
            maxValue: 100,
            minValue: 0,
            mainMarkValue: 5,
            markFontColor: '#a78bfa',
            markFontSize: 11,
            secondaryMarkValue: 4,
            pointerWidth: 3,
            pointerStyle: 2,
            pointerLength: '82%',
            pointerColor: '#c4b5fd',
            switchRingKey: true,
            titlePosition: 'bottom',
            valPosition: '0',
            labelPosition: 38,
            labelTickPosition: -18,
            labelColor: '#a78bfa',
            switchMarkKey: true,
            switchValKey: true,
            switchNumKey: true,
            echartWhere: [
              { position: '0.4', showName: '', color: '#8b5cf6' },
              { position: '0.7', showName: '', color: '#7c3aed' },
              { position: '1', showName: '', color: '#6d28d9' }
            ]
          }
        },
        {
          name: 'Spectral Analysis',
          description: 'Minimalist White，minimalist style',
          arcColor: '#64748b',
          arcWidth: 3,
          pointerColor: '#94a3b8',
          pointerWidth: 2,
          centerDotSize: 2.5,
          markColor: '#cbd5e1',
          showMarks: true,
          colorSegments: [{ color: '#94a3b8' }, { color: '#64748b' }, { color: '#475569' }],
          config: {
            setAngle: '[180, 0]',
            text: 'pure white',
            color: '#475569',
            fontSize: 14,
            maxValue: 100,
            minValue: 0,
            mainMarkValue: 4,
            markFontColor: '#cbd5e1',
            markFontSize: 11,
            secondaryMarkValue: 4,
            pointerWidth: 3,
            pointerStyle: 1,
            pointerLength: '78%',
            pointerColor: '#94a3b8',
            switchRingKey: true,
            titlePosition: 'bottom',
            valPosition: '35',
            labelPosition: 38,
            labelTickPosition: -18,
            labelColor: '#cbd5e1',
            switchMarkKey: true,
            switchValKey: true,
            switchNumKey: true,
            echartWhere: [
              { position: '0.6', showName: '', color: '#94a3b8' },
              { position: '0.8', showName: '', color: '#64748b' },
              { position: '1', showName: '', color: '#475569' }
            ]
          }
        },
        {
          name: 'Data Monitoring',
          description: 'are you sure you want to delete this color segment?，Prompt',
          arcColor: '#06b6d4',
          arcWidth: 3.5,
          pointerColor: '#f0f9ff',
          pointerWidth: 2,
          centerDotSize: 3,
          markColor: '#67e8f9',
          showMarks: true,
          colorSegments: [{ color: '#06b6d4' }, { color: '#8b5cf6' }, { color: '#ec4899' }],
          config: {
            setAngle: '[220, -40]',
            text: 'confirm',
            color: '#67e8f9',
            fontSize: 16,
            maxValue: 100,
            minValue: 0,
            mainMarkValue: 6,
            markFontColor: '#67e8f9',
            markFontSize: 12,
            secondaryMarkValue: 5,
            pointerWidth: 3,
            pointerStyle: 3,
            pointerLength: '88%',
            pointerColor: '#f0f9ff',
            switchRingKey: true,
            titlePosition: 'bottom',
            valPosition: '0',
            labelPosition: 42,
            labelTickPosition: -22,
            labelColor: '#67e8f9',
            switchMarkKey: true,
            switchValKey: true,
            switchNumKey: true,
            echartWhere: [
              { position: '0.4', showName: '', color: '#06b6d4' },
              { position: '0.7', showName: '', color: '#8b5cf6' },
              { position: '1', showName: '', color: '#ec4899' }
            ]
          }
        },
        {
          name: 'cancel',
          description: 'applied，style',
          arcColor: '#e5e7eb',
          arcWidth: 2,
          pointerColor: '#374151',
          pointerWidth: 1.5,
          centerDotSize: 2,
          markColor: '#9ca3af',
          showMarks: true,
          colorSegments: [{ color: '#d1d5db' }, { color: '#9ca3af' }, { color: '#6b7280' }],
          config: {
            setAngle: '[180, 0]',
            text: 'Data Monitoring',
            color: '#374151',
            fontSize: 14,
            maxValue: 100,
            minValue: 0,
            mainMarkValue: 4,
            markFontColor: '#9ca3af',
            markFontSize: 10,
            secondaryMarkValue: 4,
            pointerWidth: 2,
            pointerStyle: 2,
            pointerLength: '75%',
            pointerColor: '#374151',
            switchRingKey: true,
            titlePosition: 'bottom',
            valPosition: '35',
            labelPosition: 35,
            labelTickPosition: -15,
            labelColor: '#9ca3af',
            switchMarkKey: true,
            switchValKey: true,
            switchNumKey: true,
            echartWhere: [
              { position: '0.6', showName: '', color: '#d1d5db' },
              { position: '0.8', showName: '', color: '#9ca3af' },
              { position: '1', showName: '', color: '#6b7280' }
            ]
          }
        }
      ]
    }
  },

  methods: {
    // Open Popup for Adding or Editing Color
    openColorDialog(editIndex = -1) {
      this.editIndex = editIndex
      if (editIndex === -1) {
        // New Mode，Reset Temporary Data
        this.tempColorConfig = { position: 0, color: '#000' }
      } else {
        // Edit Mode，Load Existing Data
        this.tempColorConfig = { ...this.formData.echartWhere[editIndex] }
      }
      this.colorDialogVisible = true
    },
    // Cancel Popup
    cancelColorDialog() {
      this.colorDialogVisible = false
    },
    // Confirm Popup
    confirmColorDialog() {
      if (this.editIndex === -1) {
        // New Mode，Add New Data
        this.formData.echartWhere.push({ ...this.tempColorConfig })
      } else {
        // Edit Mode，Update Existing Data
        this.formData.echartWhere[this.editIndex] = { ...this.tempColorConfig }
      }
      this.formData = { ...this.formData }
      // Trigger Update
      this.updateParams()
      this.colorDialogVisible = false
    },
    // Edit Color
    editColor(index) {
      this.editIndex = index
      this.openColorDialog(index)
    },
    // Delete Color
    deleteColor(index) {
      this.$confirm('confirm delete this color segment？', 'Tip', {
        confirmButtonText: 'confirm',
        cancelButtonText: 'cancel',
        type: 'warning'
      })
        .then(() => {
          this.formData.echartWhere.splice(index, 1)
          this.updateParams() // Update Chart
        })
        .catch(() => {})
    },
    // Apply Quick Style
    applyQuickStyle(index) {
      this.selectedStyleIndex = index
      const style = this.presetStyles[index]
      // Apply Style Configuration toformData
      Object.assign(this.formData, style.config)
      // Prompt User
      this.$message.success(`applied ${style.name} style`)
    },

    // Get Style Preview Background
    getStylePreviewBg(style) {
      return {
        background: '#f8fafc',
        borderRadius: '8px',
        position: 'relative',
        overflow: 'hidden'
      }
    },

    // Get Preview Gauge Style
    getPreviewGaugeStyle(style) {
      return {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
      }
    },

    // Get Gauge Outer Arc Path
    getGaugeArcPath() {
      // Semicircle Arc Path，From Bottom Left to Bottom Right
      return 'M 4 20 A 12 12 0 0 1 28 20'
    },

    // Get Color Segment Path
    getSegmentPath(index, totalSegments) {
      const startAngle = (index / totalSegments) * 180
      const endAngle = ((index + 1) / totalSegments) * 180

      const radius = 12
      const centerX = 16
      const centerY = 20

      const startX = centerX - radius * Math.cos((startAngle * Math.PI) / 180)
      const startY = centerY - radius * Math.sin((startAngle * Math.PI) / 180)
      const endX = centerX - radius * Math.cos((endAngle * Math.PI) / 180)
      const endY = centerY - radius * Math.sin((endAngle * Math.PI) / 180)

      return `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`
    },

    // Get Pointer End PointXCoordinate
    getPointerEndX(style) {
      const angle = 45 // 4545-degree Angle Demonstration
      const length = 10
      return 16 + length * Math.cos((angle * Math.PI) / 180)
    },

    // Get Pointer End PointYCoordinate
    getPointerEndY(style) {
      const angle = 45 // 4545-degree Angle Demonstration
      const length = 10
      return 20 - length * Math.sin((angle * Math.PI) / 180)
    },

    // Get Scale Lines
    getMarkLines() {
      const marks = []
      for (let i = 0; i <= 6; i++) {
        const angle = (i / 6) * 180
        const innerRadius = 11
        const outerRadius = 13
        const centerX = 16
        const centerY = 20

        const x1 = centerX - innerRadius * Math.cos((angle * Math.PI) / 180)
        const y1 = centerY - innerRadius * Math.sin((angle * Math.PI) / 180)
        const x2 = centerX - outerRadius * Math.cos((angle * Math.PI) / 180)
        const y2 = centerY - outerRadius * Math.sin((angle * Math.PI) / 180)

        marks.push({
          id: i,
          x1,
          y1,
          x2,
          y2
        })
      }
      return marks
    }
  }
}
</script>

<style scoped lang="scss">
.chart-gauge-props-wrapper {
  padding: 20px 10px;
}

.table-wrapper {
  padding: 4px;
}

.dialog-footer {
  text-align: right;
}
// Quick Style Related Styles
.quick-style-section {
  margin-bottom: 20px;

  .style-cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-top: 16px;
  }

  .style-card {
    border: 2px solid var(--panel-border-out-color);
    border-radius: 12px;
    padding: 10px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: var(--panel-light-bg-color);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      transition: left 0.5s;
    }

    &:hover {
      border-color: #1890ff;
      box-shadow: 0 4px 16px rgba(24, 144, 255, 0.15);
      transform: translateY(-2px);

      &::before {
        left: 100%;
      }

      .style-preview {
        transform: scale(1.05);
      }

      .preview-gauge {
        svg {
          transform: rotate(5deg);
          transition: transform 0.3s ease;
        }
      }
    }

    &.active {
      border-color: #1890ff;
      background: linear-gradient(135deg, #f0f8ff, #e6f4ff);
      box-shadow: 0 6px 20px rgba(24, 144, 255, 0.25);
      transform: translateY(-1px);

      .style-name {
        color: #1890ff !important;
        font-weight: 600;
      }
    }

    .style-preview {
      width: 100%;
      height: 40px;
      border-radius: 8px;
      margin-bottom: 10px;
      position: relative;
      transition: transform 0.3s ease;
    }

    .preview-gauge {
      svg {
        transition: transform 0.3s ease;
      }
    }

    .style-info {
      .style-name {
        font-size: 13px;
        font-weight: 500;
        color: var(--primary-text-color);
        margin-bottom: 3px;
        transition: color 0.3s ease;
      }

      .style-desc {
        font-size: 11px;
        color: var(--sub-text-color);
        line-height: 1.4;
      }
    }
  }
}

</style>
