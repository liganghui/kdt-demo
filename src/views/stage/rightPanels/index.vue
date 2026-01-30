<template>
    <div>
        <KeepAlive>
            <StagePanel v-if="activeNodeNum === 0"></StagePanel>
            <AlignPanel v-else-if="activeNodeNum > 1"></AlignPanel>
        </KeepAlive>
        <CommonPanel v-if="activeNodeNum === 1"></CommonPanel>
    </div>
</template>
<script>
import { mapState } from 'vuex';
import CommonPanel from './commonPanel/index.vue'
import StagePanel from './stagePanel/index.vue'
import AlignPanel from './alignPanel/index.vue'


export default {
    components: {
        CommonPanel,
        StagePanel,
        AlignPanel
    },
    computed: {
        ...mapState({
            activeNodes: state => state.system.activeNodes
        }),
        activeNodeNum() {
            return this.activeNodes?.length || 0
        }
    }
}

</script>
<style scoped></style>