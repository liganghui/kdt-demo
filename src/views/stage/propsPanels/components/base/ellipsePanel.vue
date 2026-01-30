<template>
    <div>
        <el-form label-width="120px">
            <el-form-item label="Fill Color">
                <el-color-picker v-model="formData.fill" />
            </el-form-item>
            <el-form-item label="Border Color">
                <el-color-picker v-model="formData.stroke" />
            </el-form-item>
            <el-form-item label="Border Thickness">
                <el-input-number v-model="formData.strokeWidth" :min="1" :max="20" />
            </el-form-item>
            <!-- <el-form-item label="Horizontal Radius">
                <el-input-number v-model="formData.radiusX" :min="1" :max="9999" />
            </el-form-item>
            <el-form-item label="Vertical Radius">
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
