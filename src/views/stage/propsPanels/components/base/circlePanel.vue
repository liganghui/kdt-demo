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
                <el-input-number v-model="formData.strokeWidth" :min="1" :max="500" />
            </el-form-item>
            <!-- <el-form-item label="Radius">
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
