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
  name: 'chartPie', // Component Name
  props: [
    'width', // Chart Width
    'height', // Chart Height
    'nodeData', // Node Data，Used to store chart data
    'params', // Parameters
    'node', // Node Object，Contains component property configurations
    'rawData' // Raw Data，Real-time updating data source
  ],
  data() {
    return {
      // Default configuration items，Can be overridden via props Override
      config: {
        showTitle: true, // Whether to show title
        titleText: '', // Title text
        titleColor: '#000', // Title color
        titleFontSize: 16, // Title font size
        titlePosition: 'left', // Title position（left, center, right）
        showValues: false, // Whether to show value labels
        valueFontSize: 12, // Value label font size
        valueFontColor: '#000', // Value label font color
        fontWeight: 'normal', // Font weight
        showTooltip: true, // Whether to show tooltip
        tooltipFontSize: 12, // Tooltip font size
        tooltipFontColor: '#000', // Tooltip font color
        tooltipBackgroundColor: '#fff', // Tooltip background color
        showLegend: true, // Whether to show legend
        legendPosition: 'center', // Legend position（left, center, right）
        legendOrientation: 'horizontal', // Legend layout（horizontal, vertical）
        legendFontSize: 12, // Legend font size
        legendFontColor: '#000', // Legend font color
        customColors: [
          // Custom color configurations
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
        pieType: 'normal', // Pie chart type：'normal'（Normal pie chart），'ring'（Ring pie chart），'rose'（Nightingale rose chart）
        innerRadius: '50%', // Inner radius（Only effective when pieType is 'ring' takes effect）
        roseType: false // Rose chart type（Only effective when pieType is 'rose' takes effect，Optional values：'radius' or 'area'）
      },
      lastDataUpdateType: '', // Type of last data update
      myChart: null, // ECharts Instance
      chartWidth: 0, // Chart width，Dynamically bound
      chartHeight: 0, // Chart height，Dynamically bound
      chartId: '' // Unique to the chart ID
    }
  },
  created() {
    // Generate a unique chart ID，Prevent conflicts between multiple chart instances
    this.chartId = 'chart-' + Math.random().toString(36).substr(2, 9)
  },
  mounted() {
    // Initialize chart width and height
    this.chartHeight = this.height
    this.chartWidth = this.width
    // Merge default configurations and passed node properties，Prioritize using passed properties
    this.node.attrs.props = { ...this.config, ...this.node.attrs.props }
    // Wait for the next DOM Update cycle to initialize the chart and set configuration items
    this.$nextTick(() => {
      this.initChart() // Initialize ECharts Instance
      this.setChartOptions() // Set chart configuration options
    })
  },
  watch: {
    // Listen for height changes，Update chart height and adjust size
    height(newVal) {
      this.chartHeight = newVal
      this.$nextTick(() => {
        if (this.myChart) this.myChart.resize()
      })
    },
    // Listen for width changes，Update chart width and adjust size
    width(newVal) {
      this.chartWidth = newVal
      this.$nextTick(() => {
        if (this.myChart) this.myChart.resize()
      })
    },
    // Listen for parameter changes，Update chart configuration
    params(newVal) {
      if (this.myChart) {
        this.setChartOptions()
      }
    },
    // Listen for changes in raw data，Handle real-time data updates
    rawData(newVal) {
      if (this.myChart) {
        const newDataType = this.params._lastDataUpdateType // Get new data type
        // Check if data type has changed
        if (this.lastDataUpdateType !== newDataType) {
          // Data types are different，Clear chart data
          window.kdt.updateNodeData({
            id: this.node.attrs.id,
            data: [],
            type: newDataType,
            isForceUpdateData: true
          })
          this.myChart.clear()
          this.lastDataUpdateType = newDataType
        }
        // Other types of data updates，Force data update
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
     * Initialize ECharts Instance
     */
    initChart() {
      this.myChart = markRaw(echarts.init(this.$refs.chart))
    },

    /**
     * Set and update ECharts Configuration options
     */
    setChartOptions() {
      const {
        data = [], // Pie chart data
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

      // Generate custom color list，Supports linear gradient
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

      // According to pieType Set corresponding parameters
      let radius = '70%' // Pie chart radius
      let innerRadiusValue = '0%' // Inner radius
      let roseTypeValue = false // Rose chart type

      if (pieType === 'ring') {
        innerRadiusValue = innerRadius || '50%'
      }

      if (pieType === 'rose') {
        roseTypeValue = roseType || 'radius'
      }

      const option = {
        color: colorList && colorList.length > 0 ? colorList : undefined, // Use custom color scheme，Use default colors if no custom colors
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
