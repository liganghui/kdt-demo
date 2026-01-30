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
                // Force using timestamp iframe Reload
                this.iframeKey = Date.now();
                // Update node data
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