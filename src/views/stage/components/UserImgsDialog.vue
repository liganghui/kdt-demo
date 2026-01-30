<template>
    <el-dialog :model-value="visible" width="40%" @close="handleClose" title="My Materials" draggable>
        <el-scrollbar height="400px">
            <UserImgList ref="userImgList"></UserImgList>
        </el-scrollbar>
        <div class="mt20 text-r">
            <el-button @click="handleClose">close</el-button>
        </div>
    </el-dialog>

</template>
<script>
import UserImgList from '../../../components/UserImgList.vue'
export default {
    components: { UserImgList },
    data() {
        return {}
    },
    props: {
        visible: {
            type: Boolean,
            default: false,
        },
    },
    watch: {  
        visible(value) {
            if (value) {
                this.$nextTick(() => {
                    this.$refs.userImgList.getImgList()
                })
            }
        }
    },
    methods: {
        handleClose() {
            this.$emit('close', false);
        }
    }
}
</script>
<style lang="scss" scoped></style>