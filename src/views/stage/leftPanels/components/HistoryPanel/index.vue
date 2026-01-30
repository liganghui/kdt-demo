<template>
    <div class="layersPanel-wrapper">
      <el-row class="panel-header">
        <el-col :span="16">
          <span class="ft14">History</span>
        </el-col>
        <el-col :span="6" class="primary-text-color text-r" :offset="2">
          <svg-icon name="close" size="14" class="pointer mt4 mr4" @click="handleClose"></svg-icon>
        </el-col>
      </el-row>
      <div class="panel-body">
        <template v-if="historyList.length > 0">
          <div class="history-list">
            <!-- The first item of historical records is not displayed Backward prompt -->
            <template v-for="(item, index) in historyList">
              <el-tooltip
                v-if="index !== 0"
                class="box-item"
                effect="dark"
                content="roll back to this operation"
                placement="right-start"
                :key="index"
              >
                <div
                  class="history-item"
                  @click="restore(index)"
                  :style="item.invalid ? 'opacity:0.5' : 'opacity:1'"
                >
                  <span>
                    {{ item.title }}
                  </span>
                  <span class="history-time">
                    {{ formatTime(item.time) }}
                  </span>
                </div>
              </el-tooltip>
              <div
                v-else
                class="history-item"
                @click="restore(index)"
                :style="item.invalid ? 'opacity:0.5' : 'opacity:1'"
              >
                <span>
                  {{ item.title }}
                </span>
                <span class="history-time">
                  {{ formatTime(item.time) }}
                </span>
              </div>
            </template>
          </div>
        </template>
        <template v-else>
          <div class="no-data">no historical records available</div>
        </template>
      </div>
    </div>
  </template>
  <script>
  import dayjs from 'dayjs'
  export default {
    components: {},
    data() {
      return {
        historyList: []
      }
    },
    computed: {},
    mounted() {
      this.initHistoryList()
    },
    methods: {
      /**
       * @description  Initialize historical records
       * @param {Array} [newVal=[]] -  historyChange Callback function of the event，Used to update historical records
       * @return {void}
       */
      initHistoryList() {
        this.historyList = Object.assign(this.historyList, window.kdt.state.history) //
        this.$forceUpdate()
        window.kdt.on('historyChange', (newVal) => {
          this.historyList = newVal
        })
      },
      // Close the panel
      handleClose() {
        this.$emitEvent('leftPanelClosed', 5)
      },
      /**
       * @description  Restore to a certain step of historical records
       * @param {number} index - The index of historical records to restore to
       * @return {void}
       */
      restore(index) {
        window.kdt.restoreToHistory(index)
      },
      formatTime(time) {
        return dayjs(time).format('HH:mm:ss')
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
  
    .no-data {
      padding: 20px;
      text-align: center;
      color: var(--sub-text-color);
      font-size: 12px;
    }
  
    .history-list {
      padding: 4px;
  
      .history-item {
        cursor: pointer;
        border-radius: 2px;
        height: 30px;
        font-size: 12px;
        line-height: 30px;
        padding-left: 6px;
        border-bottom: 1px solid var(--panel-light-bg-color);
        opacity: 0.8;
        background-color: var(--panel-border-out-color);
      }
    }
    .history-time{
      float: right;
      margin-right: 4px;
      opacity: 0.5;
    }
  }
  </style>