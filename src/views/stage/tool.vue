<template>
  <el-row class="tool-container">
    <el-col :span="6"> </el-col>
    <el-col :span="12" class="text-c">
      <el-space :size="10">
        <el-tooltip class="box-item" effect="dark" content="撤销" placement="bottom">
          <el-button size="small" link @click="undo" v-show="editMode">
            <svg-icon name="back" size="20"></svg-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip class="box-item" effect="dark" content="恢复" placement="bottom">
          <el-button size="small" link @click="redo" v-show="editMode">
            <svg-icon name="next" size="20"></svg-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip class="box-item" effect="dark" content="抓手" placement="bottom">
          <el-button size="small" link @click="handleMoveStateChange">
            <svg-icon
              name="hand"
              size="18"
              :class="!stageDrag ? 'primary-text-color' : 'primary-color'"
            ></svg-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip class="box-item" effect="dark" content="放大" placement="bottom">
          <el-button size="small" link @click="addRatio">
            <el-icon class="text-color" size="17">
              <CirclePlus />
            </el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip class="box-item" effect="dark" content="画布缩放比" placement="bottom">
          <el-text class="no-select">{{ stageZoomRatio }}%</el-text>
        </el-tooltip>
        <el-tooltip class="box-item" effect="dark" content="缩小" placement="bottom">
          <el-button size="small" link @click="reduceRatio">
            <el-icon class="text-color" size="17">
              <Remove />
            </el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip class="box-item" effect="dark" content="100%视图" placement="bottom">
          <el-button size="small" link @click="resetRatio">
            <svg-icon name="refresh" size="18"></svg-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip class="box-item" effect="dark" content="窗口大小" placement="bottom">
          <el-button size="small" link @click="autoRatio">
            <svg-icon name="window-size" size="16"></svg-icon>
          </el-button>
        </el-tooltip>
      </el-space>
    </el-col>
    <el-col :span="6" class="text-r">
      <el-tooltip class="box-item" effect="dark" content="我的素材" placement="bottom">
        <el-button size="small" link @click="userImgsDialogVisible = true" :disabled="!editMode">
          <svg-icon name="userImg" size="18"></svg-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip
        class="box-item"
        effect="dark"
        :content="editMode ? '切换到预览模式' : '切换到编辑模式'"
        placement="bottom"
      >
        <el-button size="small" link @click="switchEditMode">
          <svg-icon
            name="unlock"
            size="16"
            :class="editMode ? 'primary-text-color' : 'primary-color'"
          ></svg-icon>
        </el-button>
      </el-tooltip>
    </el-col>
    <UserImgsDialog
      :visible="userImgsDialogVisible"
      @close="userImgsDialogVisible = false"
    ></UserImgsDialog>
  </el-row>
</template>
<script>
import SvgIcon from '@/components/SvgIcon.vue'
import UserImgsDialog from './components/UserImgsDialog.vue'
import { mapState } from 'vuex'
import { getExportData } from '@/utils/utils'

export default {
  components: { SvgIcon, UserImgsDialog },
  data() {
    return {
      stageZoomRatio: 100,
      editMode: true,
      stageDrag: false,
      userImgsDialogVisible: false,
    }
  },
  computed: {
    ...mapState({
      activeNodes: (state) => state.system.activeNodes
    }),
    // 检查是否有选中的节点
    hasSelectedNodes() {
      return (
        this.activeNodes &&
        this.activeNodes.length > 0 &&
        this.activeNodes.findIndex((node) => {
          return node.attrs?.name === 'group'
        }) == -1
      )
    }
  },

  mounted() {
    this.handleStageWheel()
    this.$onEvent('stageRendered', () => {
      // 等待画布初始化完成 获取当前编辑状态
      this.editMode = window.kdt.getStageMode() === 'edit'
    })
  },
  watch: {
    editMode() {
      this.stageDrag = false
    }
  },
  methods: {
    // 监听画布缩放和拖拽
    handleStageWheel() {
      // 画布加载完成事件
      this.$onEvent('stageRendered', () => {
        setTimeout(() => {
          this.autoRatio()
        }, 300)
        // 画布缩放事件
        window.kdt.on('wheel', (e) => {
          this.stageZoomRatio = parseFloat(window.kdt.getStageScale().x.toFixed(2) * 100).toFixed(0)
        })
        // 画布拖拽事件
        window.kdt.on('stageDrag', (val) => {
          this.stageDrag = val
        })
      })
    },
    // 重置画布100%
    resetRatio() {
      this.stageZoomRatio = 100
      window.kdt.setStageScale(1)
    },
    // 基于窗口大小自适应画布比例
    autoRatio() {
      let siderWidth
      if (this.editMode) {
        // 左右侧边栏宽度加标尺宽度
        siderWidth = this.$store.state.system.activeLeftPanels.length * 300 + 300 + 21
      } else {
        siderWidth = 21
      }
      window.kdt.autoStageScale(
        window.innerWidth - siderWidth,
        window.innerHeight - 92,
        'fitHeight',
        true,
        true,
        () => {
          this.stageZoomRatio = parseFloat(window.kdt.getStageScale().x.toFixed(2) * 100).toFixed(0)
        }
      )
    },
    // 放大画布
    addRatio() {
      this.stageZoomRatio = parseFloat(this.stageZoomRatio) + 1
      window.kdt.setStageScale(this.stageZoomRatio / 100, true)
    },
    // 缩小画布
    reduceRatio() {
      this.stageZoomRatio = parseFloat(this.stageZoomRatio) - 1
      if (this.stageZoomRatio <= 1) {
        this.stageZoomRatio = 1
      }
      window.kdt.setStageScale(this.stageZoomRatio / 100, true)
    },
    // 撤销
    undo() {
      const cuurentIndex = window.kdt.undo()
      if (cuurentIndex === 0) {
        this.$message({
          message: '已经是第一步了',
          type: 'warning'
        })
      }
    },
    //  恢复
    redo() {
      const cuurentIndex = window.kdt.redo()
      if (cuurentIndex === 0) {
        this.$message({
          message: '已经是最后一步了',
          type: 'warning'
        })
      }
    },
    /**
     *  切换画布编辑和预览状态
     */
    switchEditMode() {
      if (this.editMode) {
        // 当前为编辑状态，切换到预览
        // 备份编辑状态下的数据
        const backupData = getExportData(this.$store)
        this.$store.dispatch('setEditBackupData', backupData)
        // 切换为预览模式
        this.$store.dispatch('setPanelShow', false)
        window.kdt.setStageMode('preview')
        // 同时更新本地变量
        this.editMode = false
        this.autoRatio()
      } else {
        // 当前为预览状态，切换到编辑模式
        // 读取备份数据，如果存在则还原数据
        const backupData = this.$store.state.system.editBackupData
          ? JSON.parse(this.$store.state.system.editBackupData)
          : null
        window.kdt.setStageMode('edit')
        if (backupData) {
          window.kdt.resetStageByJSON(backupData.stage)
        }
        // 切换为编辑模式
        this.$store.dispatch('setPanelShow', true)
        this.editMode = true
        setTimeout(() => {
          // 画布恢复后 重置比例
          this.autoRatio()
        }, 50)
      }
    },
    /**
     *  切换画布切换状态
     */
    handleMoveStateChange() {
      const kdt = window.kdt
      if (kdt.getStageDrag()) {
        kdt.disableStageDrag()
        this.stageDrag = false
      } else {
        kdt.enableStageDrag()
        this.stageDrag = true
      }
    },
  }
}
</script>
<style lang="scss">
.tool-container {
  background-image: linear-gradient(45deg, #f6f6f6, #fcfcfc);
  height: 30px;
  padding: 0 18px 0 0;
}

.dark .tool-container {
  background-color: #323232;
  background-image: none;
}
.dialog-footer {
  .el-button + .el-button {
    margin-left: 10px;
  }
}
</style>
