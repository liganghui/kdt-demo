<!-- 用于处理DOM数据参数更新的中间组件 -->
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
        return zhCn
      }
    }
  },
  created() {},
  mounted() {
    // 初始化组件的宽高 取配置参数的宽度和高度
    this.width = this.initParams.width
    this.height = this.initParams.height
    // 初始化参数
    this.params = this.initParams?.props || {}
    // 初始化数据
    this.nodeData = this.initParams?.props?.data || {}
    this.rawData = this.initParams?.props?.data || {}
    this.$nextTick(() => {
      const domId = this.initParams.id
      let data = JSON.parse(JSON.stringify(this.initParams))
      delete data.id
      delete data.width
      delete data.height
      const time = setInterval(() => {
        // 根据 domId 查找对应的 DOM 节点
        const nodeId = domId.split('_').length > 0 ? domId.split('_')[1] : null
        // console.log( window.kdt.getNodeById(nodeId),123321)
        this.node = window.kdt.getNodeById(nodeId)
        if (this.node) {
          // 给DOM节点对应konva元素赋值初始化参数
          this.node.attrs.props = { ...this.node.attrs.props, ...data }
          // 记录初始化参数
          this.params = this.node.attrs.props
          clearInterval(time)
        }
      }, 50)
      setTimeout(() => {
        if (!this.node && time) {
          console.error('Dom节点渲染异常，请检查Dom节点是否存在')
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
