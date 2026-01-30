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
                <el-input-number v-model="formData.strokeWidth" :min="1" :max="500" />
            </el-form-item>
            <!-- <el-form-item label="半径">
                <el-input-number v-model="formData.radius" :min="1" :max="2000" />
            </el-form-item> -->
        </el-form>
    </div>
</template>

<script>
import propsPanelMixins from '@/mixins/propsPanelMixins';
export default {
    name: 'circlePanel',
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
