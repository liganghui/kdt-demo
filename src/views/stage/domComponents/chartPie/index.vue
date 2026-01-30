<template>
  <div
    :id="chartId"
    ref="chart"
    :style="{ width: chartWidth + 'px', height: chartHeight + 'px' }"
  ></div>
</template>
<script>
import { markRaw } from 'vue'

export default {
  name: 'chartPie', // 组件名称
  props: [
    'width', // 图表宽度
    'height', // 图表高度
    'nodeData', // 节点数据，用于存储图表的数据
    'params', // 参数
    'node', // 节点对象，包含组件的属性配置
    'rawData' // 原始数据，实时更新的数据源
  ],
  data() {
    return {
      // 默认配置项，可通过 props 覆盖
      config: {
        showTitle: true, // 是否显示标题
        titleText: '', // 标题文本
        titleColor: '#000', // 标题颜色
        titleFontSize: 16, // 标题字体大小
        titlePosition: 'left', // 标题位置（left, center, right）
        showValues: false, // 是否显示数值标签
        valueFontSize: 12, // 数值标签字体大小
        valueFontColor: '#000', // 数值标签字体颜色
        fontWeight: 'normal', // 字体粗细
        showTooltip: true, // 是否显示提示框
        tooltipFontSize: 12, // 提示框字体大小
        tooltipFontColor: '#000', // 提示框字体颜色
        tooltipBackgroundColor: '#fff', // 提示框背景颜色
        showLegend: true, // 是否显示图例
        legendPosition: 'center', // 图例位置（left, center, right）
        legendOrientation: 'horizontal', // 图例布局（horizontal, vertical）
        legendFontSize: 12, // 图例字体大小
        legendFontColor: '#000', // 图例字体颜色
        customColors: [
          // 自定义颜色配置
          {
            color1: '#3089F5',
            gradientColor: '#0073FF'
          },
          {
            color1: '#FF6B6B',
            gradientColor: '#F44336'
          },
          {
            color1: '#6BCB77',
            gradientColor: '#009688'
          },
          {
            color1: '#FFD93D',
            gradientColor: '#FF9800'
          }
        ],
        pieType: 'normal', // 饼图类型：'normal'（普通饼图），'ring'（圆环图），'rose'（南丁格尔玫瑰图）
        innerRadius: '50%', // 内半径（仅在 pieType 为 'ring' 时生效）
        roseType: false // 玫瑰图类型（仅在 pieType 为 'rose' 时生效，可选值：'radius' 或 'area'）
      },
      lastDataUpdateType: '', // 上一次数据更新的类型
      myChart: null, // ECharts 实例
      chartWidth: 0, // 图表宽度，动态绑定
      chartHeight: 0, // 图表高度，动态绑定
      chartId: '' // 图表的唯一 ID
    }
  },
  created() {
    // 生成唯一的图表 ID，防止多个图表实例冲突
    this.chartId = 'chart-' + Math.random().toString(36).substr(2, 9)
  },
  mounted() {
    // 初始化图表的宽度和高度
    this.chartHeight = this.height
    this.chartWidth = this.width
    // 合并默认配置和传入的节点属性，优先使用传入的属性
    this.node.attrs.props = { ...this.config, ...this.node.attrs.props }
    // 等待下一个 DOM 更新周期后初始化图表并设置配置项
    this.$nextTick(() => {
      this.initChart() // 初始化 ECharts 实例
      this.setChartOptions() // 设置图表的配置选项
    })
  },
  watch: {
    // 监听高度变化，更新图表高度并调整大小
    height(newVal) {
      this.chartHeight = newVal
      this.$nextTick(() => {
        if (this.myChart) this.myChart.resize()
      })
    },
    // 监听宽度变化，更新图表宽度并调整大小
    width(newVal) {
      this.chartWidth = newVal
      this.$nextTick(() => {
        if (this.myChart) this.myChart.resize()
      })
    },
    // 监听参数变化，更新图表配置
    params(newVal) {
      if (this.myChart) {
        this.setChartOptions()
      }
    },
    // 监听原始数据的变化，处理实时数据更新
    rawData(newVal) {
      if (this.myChart) {
        const newDataType = this.params._lastDataUpdateType // 获取新数据类型
        // 检查数据类型是否变化
        if (this.lastDataUpdateType !== newDataType) {
          // 数据类型不同，清空图表数据
          window.kdt.updateNodeData({
            id: this.node.attrs.id,
            data: [],
            type: newDataType,
            isForceUpdateData: true
          })
          this.myChart.clear()
          this.lastDataUpdateType = newDataType
        }
        // 其他类型的数据更新，强制更新数据
        window.kdt.updateNodeData({
          id: this.node.attrs.id,
          data: newVal,
          type: newDataType,
          isForceUpdateData: true
        })
      }
    }
  },
  methods: {
    /**
     * 初始化 ECharts 实例
     */
    initChart() {
      this.myChart = markRaw(echarts.init(this.$refs.chart))
    },

    /**
     * 设置并更新 ECharts 的配置选项
     */
    setChartOptions() {
      const {
        data = [], // 饼图数据
        showTitle,
        titleText,
        titleColor,
        titleFontSize,
        titlePosition,
        showValues,
        valueFontSize,
        valueFontColor,
        fontWeight,
        showTooltip,
        tooltipFontSize,
        tooltipFontColor,
        tooltipBackgroundColor,
        showLegend,
        legendPosition,
        legendOrientation,
        legendFontSize,
        legendFontColor,
        customColors,
        pieType,
        innerRadius,
        roseType
      } = this.node.attrs.props

      // 生成自定义颜色列表，支持线性渐变
      const colorList = customColors
        ? customColors.map((colorConfig) => {
            return {
              type: 'linear',
              x: 0,
              y: 0,
              colorStops: [
                { offset: 0, color: colorConfig.color1 },
                { offset: 1, color: colorConfig.gradientColor || colorConfig.color1 }
              ]
            }
          })
        : null

      // 根据 pieType 设置相应的参数
      let radius = '70%' // 饼图半径
      let innerRadiusValue = '0%' // 内半径
      let roseTypeValue = false // 玫瑰图类型

      if (pieType === 'ring') {
        innerRadiusValue = innerRadius || '50%'
      }

      if (pieType === 'rose') {
        roseTypeValue = roseType || 'radius'
      }

      const option = {
        color: colorList && colorList.length > 0 ? colorList : undefined, // 使用自定义配色，若无自定义则使用默认颜色
        title: {
          text: showTitle ? titleText : '',
          left: titlePosition,
          textStyle: {
            color: titleColor,
            fontSize: titleFontSize
          }
        },
        tooltip: {
          trigger: 'item',
          show: showTooltip,
          textStyle: {
            fontSize: tooltipFontSize,
            color: tooltipFontColor
          },
          backgroundColor: tooltipBackgroundColor
        },
        legend: {
          orient: legendOrientation,
          left: legendPosition,
          show: showLegend,
          textStyle: {
            fontSize: legendFontSize,
            color: legendFontColor
          }
        },
        series: [
          {
            name: titleText,
            type: 'pie',
            radius: [innerRadiusValue, radius],
            roseType: roseTypeValue,
            label: showValues
              ? {
                  show: true,
                  fontSize: valueFontSize,
                  color: valueFontColor,
                  fontWeight: fontWeight
                }
              : {
                  show: false
                },
            data: data
          }
        ]
      }
      this.myChart.setOption(option)
    },
  }
}
</script>

<style lang="scss" scoped></style>
