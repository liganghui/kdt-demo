<template>
    <div class="layersPanel-wrapper">
      <el-row class="panel-header">
        <el-col :span="16">
          <span class="ft14">历史记录</span>
        </el-col>
        <el-col :span="6" class="primary-text-color text-r" :offset="2">
          <svg-icon name="close" size="14" class="pointer mt4 mr4" @click="handleClose"></svg-icon>
        </el-col>
      </el-row>
      <div class="panel-body">
        <template v-if="historyList.length > 0">
          <div class="history-list">
            <!-- 历史记录第一项不显示 回退的提示 -->
            <template v-for="(item, index) in historyList">
              <el-tooltip
                v-if="index !== 0"
                class="box-item"
                effect="dark"
                content="回退到该操作"
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
          <div class="no-data">暂无历史记录</div>
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
       * @description  初始化历史记录
       * @param {Array} [newVal=[]] -  historyChange 事件的回调函数，用于更新历史记录
       * @return {void}
       */
      initHistoryList() {
        this.historyList = Object.assign(this.historyList, window.kdt.state.history) //
        this.$forceUpdate()
        window.kdt.on('historyChange', (newVal) => {
          this.historyList = newVal
        })
      },
      // 关闭面板
      handleClose() {
        this.$emitEvent('leftPanelClosed', 5)
      },
      /**
       * @description  还原到历史记录的某一步
       * @param {number} index - 要还原到的历史记录索引
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