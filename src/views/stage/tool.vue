<template>
  <el-row class="tool-container">
    <el-col :span="6"> </el-col>
    <el-col :span="12" class="text-c">
      <el-space :size="10">
        <el-tooltip class="box-item" effect="dark" content="undo" placement="bottom">
          <el-button size="small" link @click="undo" v-show="editMode">
            <svg-icon name="back" size="20"></svg-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip class="box-item" effect="dark" content="redo" placement="bottom">
          <el-button size="small" link @click="redo" v-show="editMode">
            <svg-icon name="next" size="20"></svg-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip class="box-item" effect="dark" content="hand" placement="bottom">
          <el-button size="small" link @click="handleMoveStateChange">
            <svg-icon
              name="hand"
              size="18"
              :class="!stageDrag ? 'primary-text-color' : 'primary-color'"
            ></svg-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip class="box-item" effect="dark" content="zoom in" placement="bottom">
          <el-button size="small" link @click="addRatio">
            <el-icon class="text-color" size="17">
              <CirclePlus />
            </el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip class="box-item" effect="dark" content="canvas scale" placement="bottom">
          <el-text class="no-select">{{ stageZoomRatio }}%</el-text>
        </el-tooltip>
        <el-tooltip class="box-item" effect="dark" content="zoom out" placement="bottom">
          <el-button size="small" link @click="reduceRatio">
            <el-icon class="text-color" size="17">
              <Remove />
            </el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip class="box-item" effect="dark" content="100%view" placement="bottom">
          <el-button size="small" link @click="resetRatio">
            <svg-icon name="refresh" size="18"></svg-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip class="box-item" effect="dark" content="window size" placement="bottom">
          <el-button size="small" link @click="autoRatio">
            <svg-icon name="window-size" size="16"></svg-icon>
          </el-button>
        </el-tooltip>
      </el-space>
    </el-col>
    <el-col :span="6" class="text-r">
      <el-tooltip class="box-item" effect="dark" content="my materials" placement="bottom">
        <el-button size="small" link @click="userImgsDialogVisible = true" :disabled="!editMode">
          <svg-icon name="userImg" size="18"></svg-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip
        class="box-item"
        effect="dark"
        :content="editMode ? 'switch to preview mode' : 'switch to edit mode'"
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
    // Check if there are selected nodes
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
      // Wait for canvas initialization to complete Get the current editing status
      this.editMode = window.kdt.getStageMode() === 'edit'
    })
  },
  watch: {
    editMode() {
      this.stageDrag = false
    }
  },
  methods: {
    // Listen for canvas scaling and dragging
    handleStageWheel() {
      // Canvas loading completion event
      this.$onEvent('stageRendered', () => {
        setTimeout(() => {
          this.autoRatio()
        }, 300)
        // Canvas scaling event
        window.kdt.on('wheel', (e) => {
          this.stageZoomRatio = parseFloat(window.kdt.getStageScale().x.toFixed(2) * 100).toFixed(0)
        })
        // Canvas dragging event
        window.kdt.on('stageDrag', (val) => {
          this.stageDrag = val
        })
      })
    },
    // Reset canvas to 100%100%
    resetRatio() {
      this.stageZoomRatio = 100
      window.kdt.setStageScale(1)
    },
    // Adapt canvas ratio based on window size
    autoRatio() {
      let siderWidth
      if (this.editMode) {
        // Width of left and right sidebars plus ruler width
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
    // Zoom in on canvas
    addRatio() {
      this.stageZoomRatio = parseFloat(this.stageZoomRatio) + 1
      window.kdt.setStageScale(this.stageZoomRatio / 100, true)
    },
    // Zoom out of canvas
    reduceRatio() {
      this.stageZoomRatio = parseFloat(this.stageZoomRatio) - 1
      if (this.stageZoomRatio <= 1) {
        this.stageZoomRatio = 1
      }
      window.kdt.setStageScale(this.stageZoomRatio / 100, true)
    },
    // Undo
    undo() {
      const cuurentIndex = window.kdt.undo()
      if (cuurentIndex === 0) {
        this.$message({
          message: 'already at the first step',
          type: 'warning'
        })
      }
    },
    //  Redo
    redo() {
      const cuurentIndex = window.kdt.redo()
      if (cuurentIndex === 0) {
        this.$message({
          message: 'already at the last step',
          type: 'warning'
        })
      }
    },
    /**
     *  Toggle canvas edit and preview states
     */
    switchEditMode() {
      if (this.editMode) {
        // Currently in edit state，Switch to preview
        // Backup data in edit state
        const backupData = getExportData(this.$store)
        this.$store.dispatch('setEditBackupData', backupData)
        // Switch to preview mode
        this.$store.dispatch('setPanelShow', false)
        window.kdt.setStageMode('preview')
        // Update local variables simultaneously
        this.editMode = false
        this.autoRatio()
      } else {
        // Currently in preview state，Switch to edit mode
        // Read backup data，Restore data if it exists
        const backupData = this.$store.state.system.editBackupData
          ? JSON.parse(this.$store.state.system.editBackupData)
          : null
        window.kdt.setStageMode('edit')
        if (backupData) {
          window.kdt.resetStageByJSON(backupData.stage)
        }
        // Switch to edit mode
        this.$store.dispatch('setPanelShow', true)
        this.editMode = true
        setTimeout(() => {
          // After canvas restoration Reset ratio
          this.autoRatio()
        }, 50)
      }
    },
    /**
     *  Toggle canvas toggle state
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
