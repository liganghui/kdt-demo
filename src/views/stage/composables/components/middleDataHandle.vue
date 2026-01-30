<!-- Used to handleDOMIntermediate component for updating data parameters -->
<template>
  <el-config-provider :locale="locale">
    <slot
      :width="width"
      :height="height"
      :params="params"
      :nodeData="nodeData"
      :node="node"
      :rawData="rawData"
      v-if="node"
    >
    </slot>
  </el-config-provider>
</template>

<script>
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import jp from 'element-plus/es/locale/lang/ja'

export default {
  name: 'MiddleComponent',
  props: {
    initParams: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      params: {},
      width: 0,
      height: 0,
      app: null,
      node: null,
      preVal: null,
      preData: null,
      nodeData: {},
      rawData: {},
      preSize: {}
    }
  },
  computed: {
    locale() {
      if (this.currentLanguage === 'zh') {
        return zhCn
      } else if (this.currentLanguage === 'en') {
        return en
      } else if (this.currentLanguage === 'jp') {
        return jp
      } else {
        return en
      }
    }
  },
  created() {},
  mounted() {
    // Initialize the width and height of the component Get the width and height from configuration parameters
    this.width = this.initParams.width
    this.height = this.initParams.height
    // Initialize parameters
    this.params = this.initParams?.props || {}
    // Initialize data
    this.nodeData = this.initParams?.props?.data || {}
    this.rawData = this.initParams?.props?.data || {}
    this.$nextTick(() => {
      const domId = this.initParams.id
      let data = JSON.parse(JSON.stringify(this.initParams))
      delete data.id
      delete data.width
      delete data.height
      const time = setInterval(() => {
        // According to domId Find the corresponding DOM Node
        const nodeId = domId.split('_').length > 0 ? domId.split('_')[1] : null
        // console.log( window.kdt.getNodeById(nodeId),123321)
        this.node = window.kdt.getNodeById(nodeId)
        if (this.node) {
          // Assign toDOMNode corresponding tokonvaAssign initial parameters to the element
          this.node.attrs.props = { ...this.node.attrs.props, ...data }
          // Record initial parameters
          this.params = this.node.attrs.props
          clearInterval(time)
        }
      }, 50)
      setTimeout(() => {
        if (!this.node && time) {
          console.error('Domnode rendering error，please checkDomwhether the node exists')
          clearInterval(time)
        }
      }, 1500)
    })
  },
  computed: {
    nodeAttrs() {
      return this.node ? this.node.attrs : null
    }
  },
  watch: {
    nodeAttrs: {
      handler(newVal) {
        if (newVal.width !== this.preSize?.width || newVal.height !== this.preSize?.height) {
          this.width = newVal.width
          this.height = newVal.height
          this.preSize = {
            width: newVal.width,
            height: newVal.height
          }
        }

        if (newVal.props && JSON.stringify(newVal.props) !== JSON.stringify(this.preData)) {
          this.preData = JSON.parse(JSON.stringify(newVal.props))
          this.params = { ...newVal.props }
          if (JSON.stringify(this.nodeData) !== JSON.stringify(newVal.props?.data)) {
            this.nodeData = newVal.props.data
          }
          if (JSON.stringify(this.rawData) !== JSON.stringify(newVal.props?._rawData)) {
            this.rawData = newVal.props._rawData
          }
        }
      },
      deep: true
    }
  },
  methods: {}
}
</script>
