<template>
  <div class="layersPanel-wrapper">
    <el-row class="panel-header">
      <el-col :span="16">
        <span class="ft14">图层管理</span>
      </el-col>
      <el-col :span="6" class="primary-text-color text-r flex-a-c" :offset="2">
        <svg-icon
          name="pin"
          size="14"
          class="pointer mr15 "
          @click="handleFixed"
          :class="{ 'primary-color': isFixed }"
        ></svg-icon>
        <svg-icon name="close" size="14" class="pointer  mr4" @click="handleClose"></svg-icon>
      </el-col>
    </el-row>
    <div class="panel-body">
      <el-tree-v2
        :data="treeData"
        :props="defaultProps"
        :height="treeHeight"
        ref="tree"
        icon=""
        :default-expand-all="false"
      >
        <template #default="{ data, node }">
          <div class="custom-tree-node" @click.stop="handleNodeClick(data, $event, node)">
            <div>
              <svg-icon
                name="folder"
                size="18"
                v-if="data.attrs.name === 'group'"
                :class="[
                  selectedKeys.includes(data.key) && !editStatus[data.key] ? 'primary-color' : '',
                  'mr5'
                ]"
              ></svg-icon>
              <svg-icon
                name="layersTwo"
                size="18"
                v-else
                :class="[
                  selectedKeys.includes(data.key) && !editStatus[data.key] ? 'primary-color' : '',
                  'mr5'
                ]"
              ></svg-icon>
              <input
                class="node-title-input"
                v-if="editStatus[data.key]"
                v-model="data.title"
                :maxlength="50"
                :ref="'nodeinput' + data.key"
                @blur.stop="handleEditConfirm(data, data.title)"
                @keyup.enter="handleEditConfirm(data, data.title)"
              />
              <span
                v-else
                :class="['node-title', selectedKeys.includes(data.key) ? 'primary-color' : '']"
                >{{ data.title }}</span
              >
            </div>
            <div class="node-operate" v-show="!data.isChild">
              <svg-icon
                name="edit"
                size="18"
                class="mr5"
                @click.stop="handleEditClick(data, node)"
                v-if="!editStatus[data.key]"
              ></svg-icon>
              <svg-icon
                v-else
                name="sure"
                size="18"
                class="mr10"
                @click.stop="handleEditConfirm(data, data.title)"
              ></svg-icon>
              <svg-icon
                name="lock"
                size="18"
                class="mr5 primary-color"
                @click.stop="switchNodeLock(data.key, false)"
                v-if="!editStatus[data.key] && data.attrs.lock"
              ></svg-icon>
              <svg-icon
                name="unlock"
                size="18"
                class="mr5"
                @click.stop="switchNodeLock(data.key, true)"
                v-if="!editStatus[data.key] && !data.attrs.lock"
              ></svg-icon>

              <svg-icon
                name="eye-show"
                size="18"
                class="mr5"
                @click.stop="switchNodeVisible(data.key, false)"
                v-if="
                  !editStatus[data.key] && (data.attrs.visible || data.attrs.visible === undefined)
                "
              ></svg-icon>
              <svg-icon
                name="eye-hide"
                size="18"
                class="mr5 primary-color"
                @click.stop="switchNodeVisible(data.key, true)"
                v-else-if="!editStatus[data.key]"
              ></svg-icon>
            </div>
          </div>
        </template>
      </el-tree-v2>
    </div>
  </div>
</template>

<script>
import { onBeforeUnmount, nextTick, getCurrentInstance } from 'vue'

export default {
  data() {
    return {
      lastSelectedIndex: -1, // 用于范围选择
      selectedKeys: [], // 保存选中的节点key
      treeData: [],
      clickSelectDone: false,
      nodeKeyIndexMap: {},
      flatTreeData: [],
      treeHeight: 0,
      editStatus: {},
      isFixed: false,
      defaultProps: {
        children: 'chid', // 改命名避免和组件默认属性冲突
        label: 'title',
        value: 'id'
      }
    }
  },
  created() {
    this.getTreeHeight()
  },
  mounted() {
    this.getNodeTreeData()
    this.handleKDTEvent()
    this.initSelectKeys()
  },
  methods: {
    switchNodeVisible(key, visible) {
      if (visible) {
        window.kdt.showNodes(key)
      } else {
        window.kdt.hideNodes(key)
      }
      window.kdt.trigger('closeContextmenu')
    },
    switchNodeLock(key, value) {
      if (value) {
        window.kdt.lockNodes(key)
      } else {
        window.kdt.unlockNodes(key)
      }
      window.kdt.trigger('closeContextmenu')
    },
    getTreeHeight() {
      this.treeHeight = window.innerHeight - 90
    },
    initSelectKeys() {
      this.$nextTick(() => {
        this.selectedKeys = []
        window.kdt.state.selectedNodes.forEach((node) => {
          if (!this.selectedKeys.includes(node.attrs.id)) {
            this.selectedKeys.push(node.attrs.id)
          }
        })
      })
    },

    getNodeTreeData() {
      nextTick(() => {
        // 获取所有节点
        let allNodes = window.kdt.getAllLayersNodes().map((node) => {
          return {
            // 解除响应式 避免修改属性 影响画布节点
            ...node
          }
        })
        if (allNodes.length > 0) {
          let treeData = []
          allNodes.forEach((node, index) => {
            if (node.parent) {
              let item = {
                ...node,
                index,
                title: node.attrs.title,
                key: node.attrs.id,
                isChild: false
              }
              if (node.attrs.name === 'group' && node.children && node.children.length > 0) {
                item.chid = node.children.map((child) => ({
                  ...child,
                  title: child.attrs.title,
                  key: child.attrs.id,
                  isChild: true
                }))
              } else {
                item.chid = []
              }
              treeData.push(item)
            }
          })
          this.treeData = treeData
          this.updateNodeKeyIndexMap() // 更新映射
        } else {
          this.treeData = []
          this.updateNodeKeyIndexMap() // 更新映射
        }
      })
    },
    /**
     * 生成 nodeKeyIndexMap 和 flatTreeData
     */
    updateNodeKeyIndexMap() {
      this.nodeKeyIndexMap = {}
      this.flatTreeData = []
      let index = 0

      const traverse = (nodes) => {
        nodes.forEach((node) => {
          this.nodeKeyIndexMap[node.key] = index
          this.flatTreeData.push(node)
          index++
          if (node.chid && node.chid.length > 0) {
            traverse(node.chid)
          }
        })
      }
      traverse(this.treeData)
    },
    handleKDTEvent() {
      const onSelect = () => {
        setTimeout(() => {
          this.getNodeTreeData()
          this.initSelectKeys()
        }, 300)
      }
      const onNodeUpdate = () => {
        this.initSelectKeys()
      }
      nextTick(() => {
        window.kdt.on('select', onSelect)
        window.kdt.on('nodeUpdate', onNodeUpdate)
      })
      onBeforeUnmount(() => {
        window.kdt.off('select', onSelect)
        window.kdt.off('nodeUpdate', onNodeUpdate)
      })
    },
    /**
     * 节点双击事件处理方法
     * @param {Object} nodeData - 选中的节点数据
     * @param {Object} nodeBase - 节点在tree组件中的代理对象
     */
    handleDoubleClick(nodeData, nodeBase) {
      if (nodeBase.level !== 1) {
        return
      }
      this.editStatus[nodeData.key] = true
      this.$nextTick(() => {
        // 确保输入框聚焦
        const inputElement = this.$refs['nodeinput' + nodeData.key]
        if (inputElement) inputElement.focus()
      })
    },
    /**
     * 节点编辑事件处理方法
     * @param {Object} nodeData - 选中的节点数据
     * @param {Object} nodeBase - 节点在tree组件中的代理对象
     */
    handleEditClick(nodeData, nodeBase) {
      if (nodeBase.level !== 1) {
        return
      }
      window.kdt.trigger('closeContextmenu')
      this.handleDoubleClick(nodeData, nodeBase)
    },

    handleEditConfirm(node, newTitle) {
      if (newTitle !== node.attrs.title) {
        this.updateTreeData(node.key, {
          title: newTitle
        })
      }
     
      this.editStatus[node.key] = false
    },
    /**
     * 更新treeData中的节点数据
     * @param {string} key - 节点的key
     * @param {Object} attrs - 要更新的节点数据
     */
    updateTreeData(key, attrs) {
      // 更新节点数据
      window.kdt.updateNodeAttrs(key, { ...attrs })
    },
    /**
     * 节点点击事件处理方法
     * @param {Object} nodeData - 选中的节点数据
     * @param {Object} event - 事件对象
     * @param {Object} nodeBase - 节点在tree组件中的代理对象
     */
    handleNodeClick(nodeData, event, nodeBase) {
      // 如果节点处于编辑状态，则不处理点击事件
      if (this.editStatus[nodeData.key]) {
        return
      }
      const currentIndex = this.nodeKeyIndexMap[nodeData.key]
      if (event.shiftKey && this.lastSelectedIndex !== -1) {
        const start = Math.min(this.lastSelectedIndex, currentIndex)
        const end = Math.max(this.lastSelectedIndex, currentIndex)
        for (let i = start; i <= end; i++) {
          const key = this.flatTreeData[i].key
          if (!this.selectedKeys.includes(key)) {
            this.selectedKeys.push(key)
          }
        }
      } else if (event.ctrlKey) {
        const index = this.selectedKeys.indexOf(nodeData.key)
        if (index === -1) {
          this.selectedKeys.push(nodeData.key)
        } else {
          this.selectedKeys.splice(index, 1)
        }
      } else if (nodeBase.level === 1) {
        // 确保仅在一级节点时触发
        const index = this.selectedKeys.indexOf(nodeData.key)
        if (index === -1) {
          this.selectedKeys = [nodeData.key]
          this.expandNode(nodeBase)
        } else {
          this.selectedKeys = []
          this.collapseNode(nodeBase)
        }
      }
      window.kdt.addNodesTransformer(this.selectedKeys)
      if(this.selectedKeys.length === 1){
         window.kdt.focusNode(this.selectedKeys[0])
      }
      this.lastSelectedIndex = currentIndex // 更新最后选中的索引
    },
    // 展开节点
    expandNode(node) {
      const treeComponent = this.$refs.tree
      if (!node.isLeaf) {
        // 存在叶子节点时才展开
        treeComponent.expandNode(node)
      }
    },
    // 收起节点
    collapseNode(node) {
      const treeComponent = this.$refs.tree
      treeComponent.collapseNode(node)
    },
    handleClose() {
      this.$emitEvent('leftPanelClosed', 2)
    },
    handleFixed() {
      this.isFixed = !this.isFixed
      this.$emitEvent('leftPanelFixed', {
        isFixed: this.isFixed,
        index: 2
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.layersPanel-wrapper {
  background-color: var(--panel-bg-color);
  height: 100%;
  width: 240px;

  .panel-header {
    height: 50px;
    display: flex;
    opacity: 0.8;
    align-items: center;
    background-color: var(--panel-border-out-color);
    padding: 0 6px;
  }

  .panel-body {
    height: calc(100% - 20px);
  }

  .layers-tree {
    width: 100%;
  }

  :deep(.ant-tree) {
    width: 100%;
    background-color: var(--panel-light-bg-color);
  }

  .tree-row-wrapper {
    display: inline-flex;
    width: 85%;
    align-items: center;

    .btn {
      display: flex;
    }
  }

  .custom-tree-node {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;

    & > div {
      padding-left: 3%;
    }

    .node-title {
      max-width: 80%;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      display: inline-block;
      vertical-align: top;
      user-select: none;
    }

    .node-operate {
      display: flex;
    }

    .node-title-input {
      width: 90%;

      &:focus {
        outline: none;
      }
    }
  }

  .selected {
    color: #007bff;
  }
}
</style>
