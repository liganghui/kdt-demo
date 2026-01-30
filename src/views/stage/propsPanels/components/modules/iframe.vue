<template>
    <div>
        <el-form-item label="网址">
            <el-input v-model="formData.data" type="textarea"  :maxlength="$store.state.globalVariable.textareaMaxSize"/>
        </el-form-item>
    </div>
</template>

<script>
import propsPanelMixins from '@/mixins/propsPanelMixins';

export default {
    name: 'iframePanel',
    mixins: [propsPanelMixins],
    data() {
        return {
            formData: {

            }
        }
    },
    computed: {

    },
   

    methods: {
      
    }
}
</script>

<style lang="scss" scoped></style>