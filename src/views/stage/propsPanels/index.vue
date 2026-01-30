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
      currentComponent: null, // Currently Loaded Component
      currentNode: null, // Current Node Data
      componentCache: {} // Add Component Cache Object
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
      // Based on currentNode Provide initData，Ensure Each Component Instance's initData Independent
      if (!this.currentNode || !this.currentNode.attrs) {
        return this.initData || {}
      }
      return this.initData
        ? { ...(this.currentNode.attrs.props || {}), ...this.initData }
        : this.currentNode.attrs.props || {} // Add an empty object as the default value
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
     * Get Component Data，Prioritize from Vuex Store Obtain from。
     * If Store Not available in，Dynamically import all components and store the mapping of component names to paths。
     */
    async getComponentsData() {
      if (Object.keys(this.componentsData).length === 0) {
        // Use a more precise path
        const modules = import.meta.glob('../propsPanels/components/*/*.vue')
        const components = {}

        // Preload component information，Get the name
        for (const path in modules) {
          try {
            const module = await modules[path]()
            const componentName = module.default.name
            if (componentName) {
              components[componentName] = { path, module: modules[path] }
            }
          } catch (error) {
            console.error(`Component information loading failed: ${path}`, error)
          }
        }
        this.setComponentsData(components)
      }
      return this.componentsData
    },

    /**
     * Initialize and load the component with the specified name。
     * @param {String} componentName - Component Name
     */
    async initModule(componentName) {
      if (!componentName) {
        this.currentComponent = null
        return
      }

      try {
        // Check the cache
        if (this.componentCache[componentName]) {
          this.currentComponent = this.componentCache[componentName]
          return
        }

        const components = await this.getComponentsData()
        const componentInfo = components[componentName]

        if (componentInfo && componentInfo.module) {
          // Directly use the stored module loading function instead of the path string
          const asyncComponent = markRaw(
            defineAsyncComponent({
              loader: componentInfo.module,
              onError: (error) => {
                console.error(`component loading error: ${componentName}`, error)
                this.currentComponent = null
              }
            })
          )
          this.componentCache[componentName] = asyncComponent
          this.currentComponent = asyncComponent
        } else {
          console.error(`component property panel name error "${componentName}" corresponding component not found`)
          this.currentComponent = null
        }
      } catch (err) {
        console.error('module initialization failed:', err)
        this.currentComponent = null
      }
    },

    /**
     * Handle the update event of the child component
     * @param {Object} data - Updated data
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
