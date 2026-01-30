<template>
    <div class="chart-pie-props-wrapper">
        <el-form :model="formData" label-width="120px">

            <el-collapse v-model="activeNames" accordion>
                <!-- Pie Chart Settings -->
                <el-collapse-item title="Pie Chart Settings" name="1">
                    <el-form-item label="Chart Type">
                        <el-select v-model="formData.pieType">
                            <el-option label="Normal Pie Chart" value="normal"></el-option>
                            <el-option label="Ring Chart" value="ring"></el-option>
                            <el-option label="Nightingale Rose Chart" value="rose"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="Inner Radius" v-if="formData.pieType === 'ring'">
                        <el-input v-model="formData.innerRadius"></el-input>
                    </el-form-item>
                    <el-form-item label="Rose Chart Type" v-if="formData.pieType === 'rose'">
                        <el-select v-model="formData.roseType">
                            <el-option label="Radius Mode" value="radius"></el-option>
                            <el-option label="Area Mode" value="area"></el-option>
                        </el-select>
                    </el-form-item>
                </el-collapse-item>

                <!-- Title Settings -->
                <el-collapse-item title="Title Settings" name="2">
                    <el-form-item label="Show Title">
                        <el-switch v-model="formData.showTitle"></el-switch>
                    </el-form-item>
                    <el-form-item label="Title Text" v-if="formData.showTitle">
                        <el-input v-model="formData.titleText"></el-input>
                    </el-form-item>
                    <el-form-item label="Title Color" v-if="formData.showTitle">
                        <el-color-picker v-model="formData.titleColor"></el-color-picker>
                    </el-form-item>
                    <el-form-item label="Font Size" v-if="formData.showTitle">
                        <el-input-number v-model="formData.titleFontSize"  :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"></el-input-number>
                    </el-form-item>
                    <el-form-item label="Font Position" v-if="formData.showTitle">
                        <el-select v-model="formData.titlePosition">
                            <el-option label="Left" value="left"></el-option>
                            <el-option label="Center" value="center"></el-option>
                            <el-option label="Right" value="right"></el-option>
                        </el-select>
                    </el-form-item>
                </el-collapse-item>

                <!-- Value Display -->
                <el-collapse-item title="Value Display" name="3">
                    <el-form-item label="Show Values">
                        <el-switch v-model="formData.showValues"></el-switch>
                    </el-form-item>
                    <el-form-item label="Font Size" v-if="formData.showValues">
                        <el-input-number v-model="formData.valueFontSize"  :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"></el-input-number>
                    </el-form-item>
                    <el-form-item label="Font Color" v-if="formData.showValues">
                        <el-color-picker v-model="formData.valueFontColor"></el-color-picker>
                    </el-form-item>
                    <el-form-item label="Font Weight" v-if="formData.showValues">
                        <el-select v-model="formData.fontWeight">
                            <el-option label="Normal" value="normal"></el-option>
                            <el-option label="Bold" value="bold"></el-option>
                            <el-option label="Lighter" value="lighter"></el-option>
                        </el-select>
                    </el-form-item>
                </el-collapse-item>

                <!-- Tooltip Settings -->
                <el-collapse-item title="Tooltip Settings" name="4">
                    <el-form-item label="Show Tooltip">
                        <el-switch v-model="formData.showTooltip"></el-switch>
                    </el-form-item>
                    <el-form-item label="Font Size" v-if="formData.showTooltip">
                        <el-input-number v-model="formData.tooltipFontSize"   :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"></el-input-number>
                    </el-form-item>
                    <el-form-item label="Font Color" v-if="formData.showTooltip">
                        <el-color-picker v-model="formData.tooltipFontColor"></el-color-picker>
                    </el-form-item>
                    <el-form-item label="Background Color" v-if="formData.showTooltip">
                        <el-color-picker v-model="formData.tooltipBackgroundColor"></el-color-picker>
                    </el-form-item>
                </el-collapse-item>

                <!-- Legend Settings -->
                <el-collapse-item title="Legend Settings" name="5">
                    <el-form-item label="Show Legend">
                        <el-switch v-model="formData.showLegend"></el-switch>
                    </el-form-item>
                    <el-form-item label="Position" v-if="formData.showLegend">
                        <el-select v-model="formData.legendPosition">
                            <el-option label="Left" value="left"></el-option>
                            <el-option label="Center" value="center"></el-option>
                            <el-option label="Right" value="right"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="Layout Orientation" v-if="formData.showLegend">
                        <el-select v-model="formData.legendOrientation">
                            <el-option label="Horizontal" value="horizontal"></el-option>
                            <el-option label="Vertical" value="vertical"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="Font Size" v-if="formData.showLegend">
                        <el-input-number v-model="formData.legendFontSize"  :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"></el-input-number>
                    </el-form-item>
                    <el-form-item label="Font Color" v-if="formData.showLegend">
                        <el-color-picker v-model="formData.legendFontColor"></el-color-picker>
                    </el-form-item>
                </el-collapse-item>


                <!-- Custom Color Matching -->
                <el-collapse-item title="Custom Color Scheme" name="7">
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
                            <el-table-column label="Action" width="80">
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

        <el-dialog title="Custom Color Scheme" :model-value="colorDialogVisible" width="600px" @close="cancelColorDialog">
            <el-form :model="tempColorConfig" label-width="120px">
                <el-row>
                    <el-col :span="12">
                        <el-form-item label="Color">
                            <el-color-picker v-model="tempColorConfig.color1"></el-color-picker>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="Gradient Color">
                            <el-color-picker v-model="tempColorConfig.gradientColor"></el-color-picker>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="cancelColorDialog">cancel</el-button>
                <el-button type="primary" @click="confirmColorDialog">confirm</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import propsPanelMixins from '@/mixins/propsPanelMixins';
export default {
    name: 'chartPiePanel',
    mixins: [propsPanelMixins],
    data() {
        return {
            activeNames: '1',
            app: null,
            colorDialogVisible: false, // Control pop-up display
            editIndex: -1, // Index in edit mode，-1 Indicates new creation
            tempColorConfig: { // Temporarily store color data configured in the pop-up
                color1: '#000',
                gradientColor: '#fff',
            }
        }
    },
    methods: {
        // Open the pop-up for adding or editing colors
        openColorDialog(editIndex = -1) {
            this.editIndex = editIndex;
            if (editIndex === -1) {
                // New creation mode，Reset temporary data
                this.tempColorConfig = { color1: '#000', gradientColor: '#fff' };
            } else {
                // Edit mode，Load existing data
                this.tempColorConfig = { ...this.formData.customColors[editIndex] };
            }
            this.colorDialogVisible = true;
        },
        // Cancel pop-up
        cancelColorDialog() {
            this.colorDialogVisible = false;
        },
        // Confirm pop-up
        confirmColorDialog() {
            if (this.editIndex === -1) {
                // New creation mode，Add new data
                this.formData.customColors.push({ ...this.tempColorConfig });
            } else {
                // Edit mode，Update existing data
                this.formData.customColors[this.editIndex] = { ...this.tempColorConfig };
            }
            this.formData = { ...this.formData }
            this.colorDialogVisible = false;
            this.updateParams();
        },
        // Edit color
        editColor(index) {
            this.editIndex = index;
            this.openColorDialog(index);
        },
        // Delete color
        deleteColor(index) {
            this.$confirm('confirm to delete this color scheme？', 'Prompt', {
                confirmButtonText: 'confirm',
                cancelButtonText: 'cancel',
                type: 'warning'
            }).then(() => {
                this.formData.customColors.splice(index, 1);
                this.updateParams(); // Update chart
            }).catch(() => { });
        },
    }
}
</script>

<style scoped lang="scss">
.chart-pie-props-wrapper {
    padding: 20px 10px;
}

.table-wrapper {
    padding: 4px;
}

.dialog-footer {
    text-align: right;
}
</style>