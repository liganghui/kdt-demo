<template>
  <div class="component-props-wrapper">
    <component
      v-if="currentComponent"
      :key="currentMoudleName"
      :is="currentComponent"
      :node="currentNode"
      :initData="currentInitData"
      v-on="childListeners"
    >
    </component>
  </div>
</template>

<script>
import { defineAsyncComponent, markRaw } from 'vue'
import { mapState, mapActions } from 'vuex'

export default {
  name: 'DynamicComponentLoader',
  data() {
    return {
      currentComponent: null, // 当前加载的组件
      currentNode: null, // 当前节点数据
      componentCache: {} // 添加组件缓存对象
    }
  },
  props: ['moudleName', 'node', 'initData'],
  computed: {
    ...mapState({
      activeNode: (state) => state.system.activeNode,
      componentsData: (state) => state.system.componentsData
    }),
    childListeners() {
      const hasUpdate = !!this.$attrs['onUpdate']
      return hasUpdate ? { update: this.update } : {}
    },
    currentInitData() {
      // 根据 currentNode 提供 initData，确保每个组件实例的 initData 独立
      if (!this.currentNode || !this.currentNode.attrs) {
        return this.initData || {}
      }
      return this.initData
        ? { ...(this.currentNode.attrs.props || {}), ...this.initData }
        : this.currentNode.attrs.props || {} // 添加空对象作为默认值
    },
    currentMoudleName() {
      if (!this.moudleName && !this.activeNode?.attrs?.component) {
        return null
      }
      return this.moudleName || this.activeNode?.attrs?.component?.panelName
    }
  },
  watch: {
    activeNode(newValue) {
      if (newValue && !this.moudleName) {
        this.initModule(newValue?.attrs?.component?.panelName)
      }
    },
    moudleName(newValue) {
      if (newValue) {
        this.currentNode = this.node
        this.initModule(newValue)
      }
    }
  },
  async mounted() {
    this.currentNode = this.node || this.activeNode
    if (this.currentMoudleName) {
      await this.initModule(this.currentMoudleName)
    }
  },
  methods: {
    ...mapActions(['setComponentsData']),

    /**
     * 获取组件数据，优先从 Vuex Store 中获取。
     * 如果 Store 中没有，动态导入所有组件并存储组件名称到路径的映射。
     */
    async getComponentsData() {
      if (Object.keys(this.componentsData).length === 0) {
        // 使用更精确的路径
        const modules = import.meta.glob('../propsPanels/components/*/*.vue')
        const components = {}

        // 预加载组件信息，获取名称
        for (const path in modules) {
          try {
            const module = await modules[path]()
            const componentName = module.default.name
            if (componentName) {
              components[componentName] = { path, module: modules[path] }
            }
          } catch (error) {
            console.error(`组件信息加载失败: ${path}`, error)
          }
        }
        this.setComponentsData(components)
      }
      return this.componentsData
    },

    /**
     * 初始化并加载指定名称的组件。
     * @param {String} componentName - 组件名称
     */
    async initModule(componentName) {
      if (!componentName) {
        this.currentComponent = null
        return
      }

      try {
        // 检查缓存
        if (this.componentCache[componentName]) {
          this.currentComponent = this.componentCache[componentName]
          return
        }

        const components = await this.getComponentsData()
        const componentInfo = components[componentName]

        if (componentInfo && componentInfo.module) {
          // 直接使用存储的模块加载函数而不是路径字符串
          const asyncComponent = markRaw(
            defineAsyncComponent({
              loader: componentInfo.module,
              onError: (error) => {
                console.error(`组件加载错误: ${componentName}`, error)
                this.currentComponent = null
              }
            })
          )
          this.componentCache[componentName] = asyncComponent
          this.currentComponent = asyncComponent
        } else {
          console.error(`组件属性栏名称错误 "${componentName}" 未找到对应组件`)
          this.currentComponent = null
        }
      } catch (err) {
        console.error('模块初始化失败:', err)
        this.currentComponent = null
      }
    },

    /**
     * 处理子组件的更新事件
     * @param {Object} data - 更新的数据
     */
    update(data) {
      this.$emit('update', data)
    }
  }
}
</script>

<style lang="scss" scoped>
.component-props-wrapper {
  padding-right: 4px;
  width: 100%;
  overflow: hidden;
  background-color: var(--panel-light-bg-color);
}

</style>
