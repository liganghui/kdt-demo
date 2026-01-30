<template>
    <div class="chart-scatter-props-wrapper">
        <el-form :model="formData" label-width="120px">

            <el-collapse v-model="activeNames" accordion>
                <!-- Scatter Settings -->
                <el-collapse-item title="Scatter Settings" name="1">
                    <el-form-item label="Scatter Shape">
                        <el-select v-model="formData.symbolShape">
                            <el-option label="circle" value="circle"></el-option>
                            <el-option label="rect" value="rect"></el-option>
                            <el-option label="round rect" value="roundRect"></el-option>
                            <el-option label="triangle" value="triangle"></el-option>
                            <el-option label="diamond" value="diamond"></el-option>
                            <el-option label="pin" value="pin"></el-option>
                            <el-option label="arrow" value="arrow"></el-option>
                            <el-option label="none" value="none"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="Scatter Size">
                        <el-slider v-model="formData.symbolSize" :min="1" :max="20"></el-slider>
                    </el-form-item>
                </el-collapse-item>

                <!-- Title Settings -->
                <el-collapse-item title="Title Settings" name="2">
                    <el-form-item label="Show Title">
                        <el-switch v-model="formData.showTitle"></el-switch>
                    </el-form-item>
                    <el-form-item label="Title Text">
                        <el-input v-model="formData.titleText"></el-input>
                    </el-form-item>
                    <el-form-item label="Title Color">
                        <el-color-picker v-model="formData.titleColor"></el-color-picker>
                    </el-form-item>
                    <el-form-item label="Font Size">
                        <el-input-number v-model="formData.titleFontSize"  :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"></el-input-number>
                    </el-form-item>
                    <el-form-item label="Font Position">
                        <el-select v-model="formData.titlePosition">
                            <el-option label="left" value="left"></el-option>
                            <el-option label="center" value="center"></el-option>
                            <el-option label="right" value="right"></el-option>
                        </el-select>
                    </el-form-item>
                </el-collapse-item>

                <!-- XAxis Settings -->
                <el-collapse-item title="XX-axis Settings" name="3">
                    <el-form-item label="Name">
                        <el-input v-model="formData.xAxisName"></el-input>
                    </el-form-item>
                    <el-form-item label="Show">
                        <el-switch v-model="formData.showXAxis"></el-switch>
                    </el-form-item>
                    <el-form-item label="Show Grid Lines">
                        <el-switch v-model="formData.showXAxisGrid"></el-switch>
                    </el-form-item>
                    <el-form-item label="Label Spacing">
                        <el-input-number v-model="formData.xAxisLabelGap" :min="0" :max="10"></el-input-number>
                    </el-form-item>
                    <el-form-item label="Text Angle">
                        <el-input-number v-model="formData.xAxisLabelRotate" :min="0" :max="90"></el-input-number>
                    </el-form-item>
                    <el-form-item label="Axis Inversion">
                        <el-switch v-model="formData.xAxisInverse"></el-switch>
                    </el-form-item>
                    <el-form-item label="Text Size">
                        <el-input-number v-model="formData.xAxisLabelFontSize" :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"></el-input-number>
                    </el-form-item>
                    <el-form-item label="Text Color">
                        <el-color-picker v-model="formData.xAxisLabelColor"></el-color-picker>
                    </el-form-item>
                    <el-form-item label="Axis Line Color">
                        <el-color-picker v-model="formData.xAxisLineColor"></el-color-picker>
                    </el-form-item>
                </el-collapse-item>

                <!-- YAxis Settings -->
                <el-collapse-item title="YY-axis Settings" name="4">
                    <el-form-item label="Name">
                        <el-input v-model="formData.yAxisName"></el-input>
                    </el-form-item>
                    <el-form-item label="Show">
                        <el-switch v-model="formData.showYAxis"></el-switch>
                    </el-form-item>
                    <el-form-item label="Show Grid Lines">
                        <el-switch v-model="formData.showYAxisGrid"></el-switch>
                    </el-form-item>
                    <el-form-item label="Axis Inversion">
                        <el-switch v-model="formData.yAxisInverse"></el-switch>
                    </el-form-item>
                    <el-form-item label="Text Size">
                        <el-input-number v-model="formData.yAxisLabelFontSize"  :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"></el-input-number>
                    </el-form-item>
                    <el-form-item label="Text Color">
                        <el-color-picker v-model="formData.yAxisLabelColor"></el-color-picker>
                    </el-form-item>
                    <el-form-item label="Axis Line Color">
                        <el-color-picker v-model="formData.yAxisLineColor"></el-color-picker>
                    </el-form-item>
                </el-collapse-item>

                <!-- Value Display -->
                <el-collapse-item title="Value Display" name="5">
                    <el-form-item label="Show">
                        <el-switch v-model="formData.showValues"></el-switch>
                    </el-form-item>
                    <el-form-item label="Font Size">
                        <el-input-number v-model="formData.valueFontSize"  :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"></el-input-number>
                    </el-form-item>
                    <el-form-item label="Font Color">
                        <el-color-picker v-model="formData.valueFontColor"></el-color-picker>
                    </el-form-item>
                    <el-form-item label="Font Weight">
                        <el-select v-model="formData.fontWeight">
                            <el-option label="normal" value="normal"></el-option>
                            <el-option label="bold" value="bold"></el-option>
                            <el-option label="lighter" value="lighter"></el-option>
                        </el-select>
                    </el-form-item>
                </el-collapse-item>

                <!-- Tooltip Settings -->
                <el-collapse-item title="Tooltip Settings" name="6">
                    <el-form-item label="Show">
                        <el-switch v-model="formData.showTooltip"></el-switch>
                    </el-form-item>
                    <el-form-item label="Font Size">
                        <el-input-number v-model="formData.tooltipFontSize"  :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"></el-input-number>
                    </el-form-item>
                    <el-form-item label="Font Color">
                        <el-color-picker v-model="formData.tooltipFontColor"></el-color-picker>
                    </el-form-item>
                    <el-form-item label="Background Color">
                        <el-color-picker v-model="formData.tooltipBackgroundColor"></el-color-picker>
                    </el-form-item>
                </el-collapse-item>

                <!-- Axis Margin Settings -->
                <el-collapse-item title="Axis Margin Settings" name="7">
                    <el-form-item label="Left Margin">
                        <el-slider v-model="formData.leftMargin" :min="0" :max="500"></el-slider>
                    </el-form-item>
                    <el-form-item label="Right Margin">
                        <el-slider v-model="formData.rightMargin" :min="0" :max="500"></el-slider>
                    </el-form-item>
                    <el-form-item label="Top Margin">
                        <el-slider v-model="formData.topMargin" :min="0" :max="500"></el-slider>
                    </el-form-item>
                    <el-form-item label="Bottom Margin">
                        <el-slider v-model="formData.bottomMargin" :min="0" :max="500"></el-slider>
                    </el-form-item>
                </el-collapse-item>

                <!-- Legend Operation -->
                <el-collapse-item title="Legend Operation" name="8">
                    <el-form-item label="Show">
                        <el-switch v-model="formData.showLegend"></el-switch>
                    </el-form-item>
                    <el-form-item label="Position">
                        <el-select v-model="formData.legendPosition">
                            <el-option label="center" value="center"></el-option>
                            <el-option label="left" value="left"></el-option>
                            <el-option label="right" value="right"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="Layout Orientation">
                        <el-select v-model="formData.legendOrientation">
                            <el-option label="horizontal" value="horizontal"></el-option>
                            <el-option label="vertical" value="vertical"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="Font Size">
                        <el-input-number v-model="formData.legendFontSize"  :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"></el-input-number>
                    </el-form-item>
                    <el-form-item label="Font Color">
                        <el-color-picker v-model="formData.legendFontColor"></el-color-picker>
                    </el-form-item>
                </el-collapse-item>

                <!-- Custom Color Configuration -->
                <el-collapse-item title="Custom Color Scheme" name="9">
                    <div class="table-wrapper">
                        <el-button type="primary" @click="openColorDialog(-1)" plain>add</el-button>
                        <el-table :data="formData.customColors" style="width: 100%; margin-top: 20px;">
                            <el-table-column prop="color1" label="Color" width="60">
                                <template #default="scope">
                                    <div :style="{ backgroundColor: scope.row.color1, width: '20px', height: '20px' }">
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column prop="gradientColor" label="Gradient Color" width="70">
                                <template #default="scope">
                                    <div
                                        :style="{ backgroundColor: scope.row.gradientColor, width: '20px', height: '20px' }">
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column prop="angle" label="Angle" width="60"></el-table-column>
                            <el-table-column label="Operation" width="80">
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

        <!-- Custom Color Configuration Dialog -->
        <el-dialog title="Custom Color Scheme" :model-value="colorDialogVisible" style="width:600px" @close="cancelColorDialog">
            <el-form :model="tempColorConfig" label-width="120px">
                <el-row>
                    <el-col :span="12">
                        <el-form-item label="Color 11">
                            <el-color-picker v-model="tempColorConfig.color1"></el-color-picker>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="Gradient Color">
                            <el-color-picker v-model="tempColorConfig.gradientColor"></el-color-picker>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item label="Angle">
                    <el-slider v-model="tempColorConfig.angle" :min="0" :max="360"></el-slider>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="cancelColorDialog">cancel</el-button>
                <el-button type="primary" @click="confirmColorDialog">confirm</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import { Edit, Delete } from '@element-plus/icons-vue';
import propsPanelMixins from '@/mixins/propsPanelMixins';

export default {
    name: 'chartScatterPanel',
    mixins: [propsPanelMixins],
    components: {
        Edit,
        Delete
    },
    data() {
        return {
            activeNames: '1',
            formData: {

            },
            colorDialogVisible: false, // Control Dialog Display
            editIndex: -1, // Index in Edit Mode，-1 Indicates New Creation
            tempColorConfig: { // Temporarily Store Color Configuration Data in the Dialog
                color1: '#000',
                gradientColor: '#fff',
                angle: 0
            }
        }
    },
    methods: {

        // Open the Dialog for Adding or Editing Colors
        openColorDialog(editIndex = -1) {
            this.editIndex = editIndex;
            if (editIndex === -1) {
                // New Creation Mode，Reset Temporary Data
                this.tempColorConfig = { color1: '#000', gradientColor: '#fff', angle: 0 };
            } else {
                // Edit Mode，Load Existing Data
                this.tempColorConfig = { ...this.formData.customColors[editIndex] };
            }
            this.colorDialogVisible = true;
        },
        // Cancel Dialog
        cancelColorDialog() {
            this.colorDialogVisible = false;
        },
        // Confirm Dialog
        confirmColorDialog() {
            if (this.editIndex === -1) {
                // New Creation Mode，Add New Data
                this.formData.customColors.push({ ...this.tempColorConfig });
            } else {
                // Edit Mode，Update Existing Data
                this.formData.customColors[this.editIndex] = { ...this.tempColorConfig };
            }
            this.formData = { ...this.formData }
            this.colorDialogVisible = false;
            this.updateParams();
        },
        // Edit Color
        editColor(index) {
            this.editIndex = index;
            this.openColorDialog(index);
        },
        // Delete Color
        deleteColor(index) {
            this.$confirm('are you sure you want to delete this color scheme?？', 'alert', {
                confirmButtonText: 'confirm',
                cancelButtonText: 'cancel',
                type: 'warning'
            }).then(() => {
                this.formData.customColors.splice(index, 1);
                this.updateParams(); // Update Chart
            }).catch(() => { });
        },
    }
}
</script>

<style scoped lang="scss">
.chart-scatter-props-wrapper {
    padding: 20px 10px;
}

.table-wrapper {
    padding: 4px;
}

.dialog-footer {
    text-align: right;
}

.ml5 {
    margin-left: 5px;
}
</style>
