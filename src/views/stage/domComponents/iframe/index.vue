<template>
    <iframe :key="iframeKey" :src="params.data" style="width: 100%; height: 100%;"></iframe>
</template>
<script>
export default {
    name: 'iframeDom',
    data() {
        return {
            iframeKey: Date.now()
        }
    },
    props: ['width', 'height', 'params', 'node', 'nodeData'],
    watch: {
        'params.data': {
            handler(val) {
                // 使用时间戳强制 iframe 重新加载
                this.iframeKey = Date.now();
                // 更新节点数据
                window.kdt.updateNodeData({
                    id: this.node.attrs.id,
                    data: val,
                    type: 'component'
                });
            },
            immediate: true
        }
    },
    mounted() {
        this.node.attrs.props = { ...this.config, ...this.node.attrs.props };
    }
}
</script>
<style lang="scss" scoped></style>