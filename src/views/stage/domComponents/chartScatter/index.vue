<template>
    <div :id="chartId" ref="chart" :style="{ width: chartWidth + 'px', height: chartHeight + 'px' }"></div>
</template>

<script>
import { markRaw } from 'vue'; 
export default {
    name: 'chartScatter',
    props: ['width', 'height', 'nodeData', 'params', 'node', 'rawData'],
    data() {
        return {
            config: {
                // 散点图
                symbolShape: 'circle', // 散点形状，可选值：'circle', 'rect', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow', 'none'
                symbolSize: 10, // 散点大小
                // 通用配置参数（保留原有配置）
                showTitle: true,
                titleText: '默认标题',
                titleColor: '#000',
                titleFontSize: 16,
                titlePosition: 'left',
                xAxisName: '',
                showXAxis: true,
                showXAxisGrid: false,
                xAxisLabelGap: 0,
                xAxisLabelRotate: 0,
                xAxisInverse: false,
                xAxisLabelFontSize: 12,
                xAxisLabelColor: '#000',
                xAxisLineColor: '#000',
                yAxisName: '',
                showYAxis: true,
                showYAxisGrid: false,
                yAxisInverse: false,
                yAxisLabelFontSize: 12,
                yAxisLabelColor: '#000',
                yAxisLineColor: '#000',
                showValues: false,
                valueFontSize: 12,
                valueFontColor: '#000',
                fontWeight: 'normal',
                showTooltip: true,
                tooltipFontSize: 12,
                tooltipFontColor: '#000',
                tooltipBackgroundColor: '#fff',
                leftMargin: 40,
                rightMargin: 40,
                topMargin: 40,
                bottomMargin: 30,
                showLegend: true,
                legendPosition: 'center',
                legendOrientation: 'horizontal',
                legendFontSize: 12,
                legendFontColor: '#000',
                customColors: [{
                    color1: '#3089F5',
                    gradientColor: '#0073FF',
                    angle: 90
                }]
            },
            myChart: null,
            chartWidth: 0,
            chartHeight: 0,
            chartId: '',
        }
    },
    created() {
        this.chartId = 'chart-' + Math.random().toString(36).substr(2, 9)
    },
    mounted() {
        this.chartHeight = this.height
        this.chartWidth = this.width
        this.node.attrs.props = { ...this.config, ...this.node.attrs.props }
        this.$nextTick(() => {
            this.initChart()
            this.setChartOptions()
        });
    },
    watch: {
        height(newVal) {
            this.chartHeight = newVal
            this.$nextTick(() => {
                if (this.myChart) this.myChart.resize();
            })
        },
        width(newVal) {
            this.chartWidth = newVal
            this.$nextTick(() => {
                if (this.myChart) this.myChart.resize();
            })
        },
        params(newVal) {
            if (this.myChart) {
                this.setChartOptions()
            }
        },
    },
    methods: {
        initChart() {
            if (this.myChart) {
                this.myChart.dispose();
            }
            this.myChart = markRaw(echarts.init(this.$refs.chart));
            window.addEventListener('resize', this.resizeChart);
        },
        resizeChart() {
            if (this.myChart) {
                this.myChart.resize();
            }
        },
        setChartOptions() {
            const {
                symbolShape, symbolSize,
                showTitle, titleText, titleColor, titleFontSize, titlePosition,
                xAxisName, showXAxis, showXAxisGrid, xAxisLabelGap, xAxisLabelRotate, xAxisInverse, xAxisLabelFontSize, xAxisLabelColor, xAxisLineColor,
                yAxisName, showYAxis, showYAxisGrid, yAxisInverse, yAxisLabelFontSize, yAxisLabelColor, yAxisLineColor,
                showValues, valueFontSize, valueFontColor, fontWeight,
                showTooltip, tooltipFontSize, tooltipFontColor, tooltipBackgroundColor,
                leftMargin, rightMargin, topMargin, bottomMargin,
                showLegend, legendPosition, legendOrientation, legendFontSize, legendFontColor, customColors
            } = this.node.attrs.props;

            const { categories = [], series = [] } = this.node.attrs.props?.data || {};

            const colorList = customColors ? customColors.map((colorConfig) => {
                return {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: Math.cos(colorConfig.angle * Math.PI / 180),
                    y2: Math.sin(colorConfig.angle * Math.PI / 180),
                    colorStops: [
                        { offset: 0, color: colorConfig.color1 },
                        { offset: 1, color: colorConfig.gradientColor || colorConfig.color1 }
                    ]
                };
            }) : undefined;

            const option = {
                color: colorList,
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
                    backgroundColor: tooltipBackgroundColor,
                    formatter: function (params) {
                        return `${params.seriesName}<br/>X: ${params.value[0]}<br/>Y: ${params.value[1]}`
                    }
                },
                grid: {
                    left: leftMargin,
                    right: rightMargin,
                    top: topMargin,
                    bottom: bottomMargin
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
                xAxis: {
                    name: xAxisName,
                    show: showXAxis,
                    inverse: xAxisInverse,
                    axisLabel: {
                        show: true,
                        rotate: xAxisLabelRotate,
                        fontSize: xAxisLabelFontSize,
                        color: xAxisLabelColor,
                        interval: xAxisLabelGap > 0 ? xAxisLabelGap : 'auto'
                    },
                    axisLine: {
                        lineStyle: {
                            color: xAxisLineColor
                        }
                    },
                    splitLine: {
                        show: showXAxisGrid
                    },
                    type: 'value'
                },
                yAxis: {
                    name: yAxisName,
                    show: showYAxis,
                    inverse: yAxisInverse,
                    axisLabel: {
                        show: true,
                        fontSize: yAxisLabelFontSize,
                        color: yAxisLabelColor
                    },
                    axisLine: {
                        lineStyle: {
                            color: yAxisLineColor
                        }
                    },
                    splitLine: {
                        show: showYAxisGrid
                    },
                    type: 'value'
                },
                series: series.map(item => ({
                    name: item.name,
                    type: 'scatter',
                    symbol: symbolShape,
                    symbolSize: symbolSize,
                    label: showValues ? {
                        show: true,
                        position: 'top',
                        fontSize: valueFontSize,
                        color: valueFontColor,
                        fontWeight: fontWeight,
                        formatter: function (params) {
                            return `(${params.value[0]}, ${params.value[1]})`;
                        }
                    } : undefined,
                    data: item.data
                }))
            };

            this.myChart.setOption(option);
        },
    },
    beforeUnmount() {
        if (this.myChart) {
            this.myChart.dispose();
        }
        window.removeEventListener('resize', this.resizeChart);
    }
}
</script>

<style lang="scss" scoped></style>