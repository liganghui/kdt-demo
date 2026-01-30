<template>
    <div>
        <el-form label-width="120px">
            <el-form-item label="填充颜色">
                <el-color-picker v-model="formData.fill" />
            </el-form-item>
            <el-form-item label="边框颜色">
                <el-color-picker v-model="formData.stroke" />
            </el-form-item>
            <el-form-item label="边框粗细">
                <el-input-number v-model="formData.strokeWidth" :min="1" :max="20" />
            </el-form-item>
            <!-- <el-form-item label="横向半径">
                <el-input-number v-model="formData.radiusX" :min="1" :max="9999" />
            </el-form-item>
            <el-form-item label="纵向半径">
                <el-input-number v-model="formData.radiusY" :min="1" :max="9999" />
            </el-form-item> -->
        </el-form>
    </div>
</template>

<script>
import propsPanelMixins from '@/mixins/propsPanelMixins';
export default {
    name: 'elipsePanel',
    mixins: [propsPanelMixins],
    data() {
        return {
            formData: {

            }
        }
    },

}
</script>

<style scoped></style>
