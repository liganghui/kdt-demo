<template>
  <div class="data-source-panel">
    <el-form-item label="Data Source">
      <el-select
        placeholder="please select"
        v-model="formData.dataSourceConfig.dataSoureType"
      >
        <el-option
          v-for="item in baseDataSourceOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="Data Content">
      <el-row>
        <el-button @click="showCodeEdit">edit</el-button>
      </el-row>
    </el-form-item>
    <!-- Code Preview -->
    <CodeEdit
      ref="codeEditRef"
      class="codeEditRef"
      :language="dataType"
      :codeValue="dataValue"
      :height="codeEditHeight"
      :readonly="true"
      @edit="showCodeEdit"
    >
    </CodeEdit>
    <!-- Code Edit Dialog -->
    <el-dialog title="Edit Data" v-model="dataVisible" width="50%" draggable>
      <CodeEdit height="450px" :language="dataType" :codeValue="dataValue" ref="dataEditRef" />
      <div slot="footer" class="text-r mt15">
        <el-button @click="dataVisible = false">cancel</el-button>
        <el-button type="primary" @click="handleCodeEdit">confirm</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import CodeEdit from '@/components/CodeEdit/index.vue'
import { mapState, mapActions } from 'vuex'
import { isJSONString } from '@/core/utils'
export default {
  name: 'dataSourcePanel',
  components: { CodeEdit },
  data() {
    return {
      formData: {
        dataSourceConfig: {
          dataSoureType: 'static',
        }
      },
      dataVisible: false,
      dataSourceOptions: [
        { label: 'Static Data', value: 'static' },
      ],
      codeEditHeight: '0px'
    }
  },
  computed: {
    ...mapState({
      activeNode: (state) => state.system.activeNode,
    }),
    dataType() {
      if (this.activeNode && this.activeNode.attrs) {
        const isJson = isJSONString(this.activeNode.attrs.props.data)
        if (isJson) {
          return 'json'
        } else if (
          typeof this.activeNode.attrs.props.data === 'number' ||
          !isNaN(this.activeNode.attrs.props.data)
        ) {
          return 'number'
        } else if (typeof this.activeNode.attrs.props.data === 'object') {
          return 'json'
        } else {
          return 'text'
        }
      } else {
        return 'text'
      }
    },
    dataValue() {
      if (this.activeNode && this.activeNode.attrs) {
        if (typeof this.activeNode.attrs.props.data === 'object') {
          // Use JSON.stringify the second and third parameters to format the output
          return JSON.stringify(this.activeNode.attrs.props.data, null, 2)
        } else {
          return this.activeNode.attrs.props.data
        }
      }
      return ''
    },
    baseDataSourceOptions() {
      return this.dataSourceOptions.filter((item) => {
        return true
      })
    },
  },
  watch: {
    dataValue: {
      handler(newVal, oldVal) {
        if (newVal !== oldVal) {
          this.$nextTick(() => {
            if (this.$refs.codeEditRef) {
              this.$refs.codeEditRef.formatCode()
            }
          })
        }
      },
      immediate: false
    },

    // Listen to dataType Change，When the language type changes, it also needs to be re-formatted
    dataType: {
      handler(newVal, oldVal) {
        if (newVal !== oldVal) {
          this.$nextTick(() => {
            if (this.$refs.codeEditRef) {
              this.$refs.codeEditRef.formatCode()
            }
          })
        }
      },
      immediate: false
    },
    'formData.dataSourceConfig': {
      handler(newVal) {
        if (this.activeNode) {
          this.activeNode.attrs.dataSourceConfig = {
            ...this.activeNode.attrs.dataSourceConfig,
            ...newVal
          }
        }
      },
      deep: true
    }
  },
  mounted() {
    if (this.activeNode && this.activeNode.attrs.dataSourceConfig) {
      this.formData.dataSourceConfig = {
        ...this.formData.dataSourceConfig,
        ...this.activeNode.attrs.dataSourceConfig
      }
    }
    this.updateCodeEditHeight()
  },
  updated() {
    this.updateCodeEditHeight()
  },
  methods: {
    ...mapActions(['updateNodeData']),
    updateCodeEditHeight() {
      this.$nextTick(() => {
        const topHeight = this.$el.querySelector('.codeEditRef').offsetTop || 100
        const height = window.innerHeight - topHeight - 95
        if (height) {
          this.codeEditHeight = `${height}px`
          this.$refs.codeEditRef.formatCode()
        }
      })
    },
    handleCodeEdit() {
      if (this.$refs.dataEditRef.checkCodeForErrors()) {
        this.dataVisible = false
        this.updateNodeData({
          id: this.activeNode.attrs.id,
          data: this.$refs.dataEditRef.getValue() || '',
          type: 'dataPanel'
        })
      }
    },
    showCodeEdit() {
      this.dataVisible = true
      this.$nextTick(() => {
        this.$refs.dataEditRef.formatCode()
      })
    },
  }
}
</script>

<style lang="scss" scoped>
.dataSource-wrapper {
  position: relative;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid transparent;
  cursor: pointer;

  &:hover {
    border: 1px solid var(--primary-color);
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
  }
}

</style>
