<template>
  <div class="data-source-panel">
    <el-form-item label="数据源">
      <el-select
        placeholder="请选择"
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
    <el-form-item label="数据内容">
      <el-row>
        <el-button @click="showCodeEdit">编辑</el-button>
      </el-row>
    </el-form-item>
    <!-- 代码预览 -->
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
    <!-- 代码编辑弹窗 -->
    <el-dialog title="编辑数据" v-model="dataVisible" width="50%" draggable>
      <CodeEdit height="450px" :language="dataType" :codeValue="dataValue" ref="dataEditRef" />
      <div slot="footer" class="text-r mt15">
        <el-button @click="dataVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCodeEdit">确定</el-button>
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
        { label: '静态数据', value: 'static' },
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
          // 使用 JSON.stringify 的第二个和第三个参数来格式化输出
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

    // 监听 dataType 变化，语言类型改变时也需要重新格式化
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
