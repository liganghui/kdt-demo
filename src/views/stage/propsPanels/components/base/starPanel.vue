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
                <el-input-number v-model="formData.strokeWidth" :min="1" :max="200" />
            </el-form-item>
            <el-form-item label="Inner Radius">
                <el-input-number v-model="formData.innerRadius" :min="1" :max="9999" />
            </el-form-item>
            <!-- <el-form-item label="Outer radius">
                <el-input-number v-model="formData.outerRadius" :min="1" :max="9999" />
            </el-form-item> -->
            <el-form-item label="Number of Corners">
                <el-input-number v-model="formData.numPoints" :min="3" :max="12" />
            </el-form-item>
        </el-form>
    </div>
</template>

<script>
import propsPanelMixins from '@/mixins/propsPanelMixins';
export default {
    name: 'starPanel',
    mixins: [propsPanelMixins],
    props: {

    },
    data() {
        return {
            formData: {

            }
        }
    },

}
</script>

<style scoped></style>