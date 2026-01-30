<template>
    <div class="chart-scatter-props-wrapper">
        <el-form :model="formData" label-width="120px">

            <el-collapse v-model="activeNames" accordion>
                <!-- 散点设置 -->
                <el-collapse-item title="散点设置" name="1">
                    <el-form-item label="散点形状">
                        <el-select v-model="formData.symbolShape">
                            <el-option label="圆形" value="circle"></el-option>
                            <el-option label="矩形" value="rect"></el-option>
                            <el-option label="圆角矩形" value="roundRect"></el-option>
                            <el-option label="三角形" value="triangle"></el-option>
                            <el-option label="菱形" value="diamond"></el-option>
                            <el-option label="别针" value="pin"></el-option>
                            <el-option label="箭头" value="arrow"></el-option>
                            <el-option label="无" value="none"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="散点大小">
                        <el-slider v-model="formData.symbolSize" :min="1" :max="20"></el-slider>
                    </el-form-item>
                </el-collapse-item>

                <!-- 标题设置 -->
                <el-collapse-item title="标题设置" name="2">
                    <el-form-item label="显示标题">
                        <el-switch v-model="formData.showTitle"></el-switch>
                    </el-form-item>
                    <el-form-item label="标题文本">
                        <el-input v-model="formData.titleText"></el-input>
                    </el-form-item>
                    <el-form-item label="标题颜色">
                        <el-color-picker v-model="formData.titleColor"></el-color-picker>
                    </el-form-item>
                    <el-form-item label="字体大小">
                        <el-input-number v-model="formData.titleFontSize"  :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"></el-input-number>
                    </el-form-item>
                    <el-form-item label="字体位置">
                        <el-select v-model="formData.titlePosition">
                            <el-option label="左" value="left"></el-option>
                            <el-option label="中" value="center"></el-option>
                            <el-option label="右" value="right"></el-option>
                        </el-select>
                    </el-form-item>
                </el-collapse-item>

                <!-- X轴设置 -->
                <el-collapse-item title="X轴设置" name="3">
                    <el-form-item label="名称">
                        <el-input v-model="formData.xAxisName"></el-input>
                    </el-form-item>
                    <el-form-item label="显示">
                        <el-switch v-model="formData.showXAxis"></el-switch>
                    </el-form-item>
                    <el-form-item label="显示网格线">
                        <el-switch v-model="formData.showXAxisGrid"></el-switch>
                    </el-form-item>
                    <el-form-item label="标签间距">
                        <el-input-number v-model="formData.xAxisLabelGap" :min="0" :max="10"></el-input-number>
                    </el-form-item>
                    <el-form-item label="文字角度">
                        <el-input-number v-model="formData.xAxisLabelRotate" :min="0" :max="90"></el-input-number>
                    </el-form-item>
                    <el-form-item label="轴反转">
                        <el-switch v-model="formData.xAxisInverse"></el-switch>
                    </el-form-item>
                    <el-form-item label="文字大小">
                        <el-input-number v-model="formData.xAxisLabelFontSize" :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"></el-input-number>
                    </el-form-item>
                    <el-form-item label="文字颜色">
                        <el-color-picker v-model="formData.xAxisLabelColor"></el-color-picker>
                    </el-form-item>
                    <el-form-item label="轴线颜色">
                        <el-color-picker v-model="formData.xAxisLineColor"></el-color-picker>
                    </el-form-item>
                </el-collapse-item>

                <!-- Y轴设置 -->
                <el-collapse-item title="Y轴设置" name="4">
                    <el-form-item label="名称">
                        <el-input v-model="formData.yAxisName"></el-input>
                    </el-form-item>
                    <el-form-item label="显示">
                        <el-switch v-model="formData.showYAxis"></el-switch>
                    </el-form-item>
                    <el-form-item label="显示网格线">
                        <el-switch v-model="formData.showYAxisGrid"></el-switch>
                    </el-form-item>
                    <el-form-item label="轴反转">
                        <el-switch v-model="formData.yAxisInverse"></el-switch>
                    </el-form-item>
                    <el-form-item label="文字大小">
                        <el-input-number v-model="formData.yAxisLabelFontSize"  :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"></el-input-number>
                    </el-form-item>
                    <el-form-item label="文字颜色">
                        <el-color-picker v-model="formData.yAxisLabelColor"></el-color-picker>
                    </el-form-item>
                    <el-form-item label="轴线颜色">
                        <el-color-picker v-model="formData.yAxisLineColor"></el-color-picker>
                    </el-form-item>
                </el-collapse-item>

                <!-- 数值显示 -->
                <el-collapse-item title="数值显示" name="5">
                    <el-form-item label="显示">
                        <el-switch v-model="formData.showValues"></el-switch>
                    </el-form-item>
                    <el-form-item label="字体大小">
                        <el-input-number v-model="formData.valueFontSize"  :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"></el-input-number>
                    </el-form-item>
                    <el-form-item label="字体颜色">
                        <el-color-picker v-model="formData.valueFontColor"></el-color-picker>
                    </el-form-item>
                    <el-form-item label="字体粗细">
                        <el-select v-model="formData.fontWeight">
                            <el-option label="正常" value="normal"></el-option>
                            <el-option label="粗体" value="bold"></el-option>
                            <el-option label="轻体" value="lighter"></el-option>
                        </el-select>
                    </el-form-item>
                </el-collapse-item>

                <!-- 提示框设置 -->
                <el-collapse-item title="提示框设置" name="6">
                    <el-form-item label="显示">
                        <el-switch v-model="formData.showTooltip"></el-switch>
                    </el-form-item>
                    <el-form-item label="字体大小">
                        <el-input-number v-model="formData.tooltipFontSize"  :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"></el-input-number>
                    </el-form-item>
                    <el-form-item label="字体颜色">
                        <el-color-picker v-model="formData.tooltipFontColor"></el-color-picker>
                    </el-form-item>
                    <el-form-item label="背景颜色">
                        <el-color-picker v-model="formData.tooltipBackgroundColor"></el-color-picker>
                    </el-form-item>
                </el-collapse-item>

                <!-- 坐标轴边距设置 -->
                <el-collapse-item title="坐标轴边距设置" name="7">
                    <el-form-item label="左边距">
                        <el-slider v-model="formData.leftMargin" :min="0" :max="500"></el-slider>
                    </el-form-item>
                    <el-form-item label="右边距">
                        <el-slider v-model="formData.rightMargin" :min="0" :max="500"></el-slider>
                    </el-form-item>
                    <el-form-item label="上边距">
                        <el-slider v-model="formData.topMargin" :min="0" :max="500"></el-slider>
                    </el-form-item>
                    <el-form-item label="下边距">
                        <el-slider v-model="formData.bottomMargin" :min="0" :max="500"></el-slider>
                    </el-form-item>
                </el-collapse-item>

                <!-- 图例操作 -->
                <el-collapse-item title="图例操作" name="8">
                    <el-form-item label="显示">
                        <el-switch v-model="formData.showLegend"></el-switch>
                    </el-form-item>
                    <el-form-item label="位置">
                        <el-select v-model="formData.legendPosition">
                            <el-option label="居中" value="center"></el-option>
                            <el-option label="左" value="left"></el-option>
                            <el-option label="右" value="right"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="布局朝向">
                        <el-select v-model="formData.legendOrientation">
                            <el-option label="水平" value="horizontal"></el-option>
                            <el-option label="垂直" value="vertical"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="字体大小">
                        <el-input-number v-model="formData.legendFontSize"  :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"></el-input-number>
                    </el-form-item>
                    <el-form-item label="字体颜色">
                        <el-color-picker v-model="formData.legendFontColor"></el-color-picker>
                    </el-form-item>
                </el-collapse-item>

                <!-- 自定义配色 -->
                <el-collapse-item title="自定义配色" name="9">
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
                            <el-table-column prop="angle" label="角度" width="60"></el-table-column>
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

        <!-- 自定义配色弹窗 -->
        <el-dialog title="自定义配色" :model-value="colorDialogVisible" style="width:600px" @close="cancelColorDialog">
            <el-form :model="tempColorConfig" label-width="120px">
                <el-row>
                    <el-col :span="12">
                        <el-form-item label="颜色1">
                            <el-color-picker v-model="tempColorConfig.color1"></el-color-picker>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="渐变色">
                            <el-color-picker v-model="tempColorConfig.gradientColor"></el-color-picker>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item label="角度">
                    <el-slider v-model="tempColorConfig.angle" :min="0" :max="360"></el-slider>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="cancelColorDialog">取消</el-button>
                <el-button type="primary" @click="confirmColorDialog">确定</el-button>
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
            colorDialogVisible: false, // 控制弹窗显示
            editIndex: -1, // 编辑模式下的索引，-1 表示新建
            tempColorConfig: { // 临时存储弹窗中配置的颜色数据
                color1: '#000',
                gradientColor: '#fff',
                angle: 0
            }
        }
    },
    methods: {

        // 打开新增或编辑颜色的弹窗
        openColorDialog(editIndex = -1) {
            this.editIndex = editIndex;
            if (editIndex === -1) {
                // 新建模式，重置临时数据
                this.tempColorConfig = { color1: '#000', gradientColor: '#fff', angle: 0 };
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
