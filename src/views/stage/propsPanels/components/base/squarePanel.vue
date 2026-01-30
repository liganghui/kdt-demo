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
                <el-input-number v-model="formData.strokeWidth" :min="1" :max="100" />
            </el-form-item>
            <el-form-item label="Border Radius">
                <el-input-number v-model="formData.cornerRadius" :min="0" :max="100" />
            </el-form-item>
        </el-form>
    </div>
</template>

<script>
import propsPanelMixins from '@/mixins/propsPanelMixins';
export default {
    name: 'squarePanel',
    mixins: [propsPanelMixins],
    data() {
        return {
            formData: {

            }
        }
    },
    created() {

    },
    watch: {

    },
    methods: {

    }
}
</script>

<style scoped></style>
