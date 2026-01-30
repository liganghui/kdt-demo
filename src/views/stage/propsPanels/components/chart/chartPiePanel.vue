<template>
    <div class="chart-pie-props-wrapper">
        <el-form :model="formData" label-width="120px">

            <el-collapse v-model="activeNames" accordion>
                <!-- 饼图设置 -->
                <el-collapse-item title="饼图设置" name="1">
                    <el-form-item label="图表类型">
                        <el-select v-model="formData.pieType">
                            <el-option label="普通饼图" value="normal"></el-option>
                            <el-option label="圆环图" value="ring"></el-option>
                            <el-option label="南丁格尔玫瑰图" value="rose"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="内半径" v-if="formData.pieType === 'ring'">
                        <el-input v-model="formData.innerRadius"></el-input>
                    </el-form-item>
                    <el-form-item label="玫瑰图类型" v-if="formData.pieType === 'rose'">
                        <el-select v-model="formData.roseType">
                            <el-option label="半径模式" value="radius"></el-option>
                            <el-option label="面积模式" value="area"></el-option>
                        </el-select>
                    </el-form-item>
                </el-collapse-item>

                <!-- 标题设置 -->
                <el-collapse-item title="标题设置" name="2">
                    <el-form-item label="显示标题">
                        <el-switch v-model="formData.showTitle"></el-switch>
                    </el-form-item>
                    <el-form-item label="标题文本" v-if="formData.showTitle">
                        <el-input v-model="formData.titleText"></el-input>
                    </el-form-item>
                    <el-form-item label="标题颜色" v-if="formData.showTitle">
                        <el-color-picker v-model="formData.titleColor"></el-color-picker>
                    </el-form-item>
                    <el-form-item label="字体大小" v-if="formData.showTitle">
                        <el-input-number v-model="formData.titleFontSize"  :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"></el-input-number>
                    </el-form-item>
                    <el-form-item label="字体位置" v-if="formData.showTitle">
                        <el-select v-model="formData.titlePosition">
                            <el-option label="左" value="left"></el-option>
                            <el-option label="中" value="center"></el-option>
                            <el-option label="右" value="right"></el-option>
                        </el-select>
                    </el-form-item>
                </el-collapse-item>

                <!-- 数值显示 -->
                <el-collapse-item title="数值显示" name="3">
                    <el-form-item label="显示数值">
                        <el-switch v-model="formData.showValues"></el-switch>
                    </el-form-item>
                    <el-form-item label="字体大小" v-if="formData.showValues">
                        <el-input-number v-model="formData.valueFontSize"  :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"></el-input-number>
                    </el-form-item>
                    <el-form-item label="字体颜色" v-if="formData.showValues">
                        <el-color-picker v-model="formData.valueFontColor"></el-color-picker>
                    </el-form-item>
                    <el-form-item label="字体粗细" v-if="formData.showValues">
                        <el-select v-model="formData.fontWeight">
                            <el-option label="正常" value="normal"></el-option>
                            <el-option label="粗体" value="bold"></el-option>
                            <el-option label="轻体" value="lighter"></el-option>
                        </el-select>
                    </el-form-item>
                </el-collapse-item>

                <!-- 提示框设置 -->
                <el-collapse-item title="提示框设置" name="4">
                    <el-form-item label="显示提示框">
                        <el-switch v-model="formData.showTooltip"></el-switch>
                    </el-form-item>
                    <el-form-item label="字体大小" v-if="formData.showTooltip">
                        <el-input-number v-model="formData.tooltipFontSize"   :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"></el-input-number>
                    </el-form-item>
                    <el-form-item label="字体颜色" v-if="formData.showTooltip">
                        <el-color-picker v-model="formData.tooltipFontColor"></el-color-picker>
                    </el-form-item>
                    <el-form-item label="背景颜色" v-if="formData.showTooltip">
                        <el-color-picker v-model="formData.tooltipBackgroundColor"></el-color-picker>
                    </el-form-item>
                </el-collapse-item>

                <!-- 图例设置 -->
                <el-collapse-item title="图例设置" name="5">
                    <el-form-item label="显示图例">
                        <el-switch v-model="formData.showLegend"></el-switch>
                    </el-form-item>
                    <el-form-item label="位置" v-if="formData.showLegend">
                        <el-select v-model="formData.legendPosition">
                            <el-option label="左" value="left"></el-option>
                            <el-option label="居中" value="center"></el-option>
                            <el-option label="右" value="right"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="布局朝向" v-if="formData.showLegend">
                        <el-select v-model="formData.legendOrientation">
                            <el-option label="水平" value="horizontal"></el-option>
                            <el-option label="垂直" value="vertical"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="字体大小" v-if="formData.showLegend">
                        <el-input-number v-model="formData.legendFontSize"  :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"></el-input-number>
                    </el-form-item>
                    <el-form-item label="字体颜色" v-if="formData.showLegend">
                        <el-color-picker v-model="formData.legendFontColor"></el-color-picker>
                    </el-form-item>
                </el-collapse-item>


                <!-- 自定义配色 -->
                <el-collapse-item title="自定义配色" name="7">
                    <div class="table-wrapper">
                        <el-button type="primary" @click="openColorDialog(-1)" plain>新增</el-button>
                        <el-table :data="formData.customColors" style="width: 100%; margin-top: 20px;">
                            <el-table-column prop="color1" label="颜色" width="60">
                                <template #default="scope">
                                    <div :style="{ backgroundColor: scope.row.color1, width: '20px', height: '20px' }">
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column prop="gradientColor" label="渐变色" width="70">
                                <template #default="scope">
                                    <div
                                        :style="{ backgroundColor: scope.row.gradientColor, width: '20px', height: '20px' }">
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="80">
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

        <el-dialog title="自定义配色" :model-value="colorDialogVisible" width="600px" @close="cancelColorDialog">
            <el-form :model="tempColorConfig" label-width="120px">
                <el-row>
                    <el-col :span="12">
                        <el-form-item label="颜色">
                            <el-color-picker v-model="tempColorConfig.color1"></el-color-picker>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="渐变色">
                            <el-color-picker v-model="tempColorConfig.gradientColor"></el-color-picker>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="cancelColorDialog">取消</el-button>
                <el-button type="primary" @click="confirmColorDialog">确定</el-button>
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
            colorDialogVisible: false, // 控制弹窗显示
            editIndex: -1, // 编辑模式下的索引，-1 表示新建
            tempColorConfig: { // 临时存储弹窗中配置的颜色数据
                color1: '#000',
                gradientColor: '#fff',
            }
        }
    },
    methods: {
        // 打开新增或编辑颜色的弹窗
        openColorDialog(editIndex = -1) {
            this.editIndex = editIndex;
            if (editIndex === -1) {
                // 新建模式，重置临时数据
                this.tempColorConfig = { color1: '#000', gradientColor: '#fff' };
            } else {
                // 编辑模式，加载现有数据
                this.tempColorConfig = { ...this.formData.customColors[editIndex] };
            }
            this.colorDialogVisible = true;
        },
        // 取消弹窗
        cancelColorDialog() {
            this.colorDialogVisible = false;
        },
        // 确认弹窗
        confirmColorDialog() {
            if (this.editIndex === -1) {
                // 新建模式，添加新数据
                this.formData.customColors.push({ ...this.tempColorConfig });
            } else {
                // 编辑模式，更新现有数据
                this.formData.customColors[this.editIndex] = { ...this.tempColorConfig };
            }
            this.formData = { ...this.formData }
            this.colorDialogVisible = false;
            this.updateParams();
        },
        // 编辑颜色
        editColor(index) {
            this.editIndex = index;
            this.openColorDialog(index);
        },
        // 删除颜色
        deleteColor(index) {
            this.$confirm('确定删除此配色？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                this.formData.customColors.splice(index, 1);
                this.updateParams(); // 更新图表
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