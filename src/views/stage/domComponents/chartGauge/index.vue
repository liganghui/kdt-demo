<template>
    <div :id="chartId" ref="chart" :style="{ width: chartWidth + 'px', height: chartHeight + 'px' }"></div>
</template>

<script>
import { markRaw } from 'vue'; // 引入 markRaw，用于避免 Vue 对 ECharts 实例进行响应式处理


export default {
    name: 'chartGaugeModule',
    props: ['width', 'height', 'nodeData', 'params', 'node'],
    data() {
        return {
            // 默认配置项，可以通过 props 覆盖
            config: {
                setAngle: '[220, -40]',  // 仪表盘的起始和结束角度
                text: '仪表盘',  // 仪表盘的标题文本
                color: '#000',  // 标题颜色
                fontSize: 16,  // 标题字体大小
                maxValue: 100,  // 仪表盘的最大值
                minValue: 0,  // 仪表盘的最小值
                mainMarkValue: 5,  // 主刻度等分数
                markFontColor: '',  // 主刻度字体颜色
                markFontSize: 12,  // 主刻度字体大小
                secondaryMarkValue: 5,  // 次刻度等分数
                pointerWidth: 2,  // 指针宽度
                echartWhere: [  // 仪表盘颜色分段配置
                    { position: '0.3', showName: '', color: '#67e0e3' },
                    { position: '0.7', showName: '', color: '#37a2da' },
                    { position: '1', showName: '', color: '#fd666d' }
                ],
                switchRingKey: true,  // 是否显示环形轴线
                titlePosition: 25,  // 标题位置
                valPosition: '0',  // 数值显示位置
                labelPosition: 40,  // 标签位置
                labelTickPosition: -20,  // 刻度标签位置
                labelColor: '#000',  // 刻度标签颜色
                pointerStyle: 1,  // 指针样式（1: 默认，2: 其他样式）
                pointerLength: '80%',  // 指针长度
                switchMarkKey: true,  // 是否显示刻度
                switchValKey: true,  // 是否显示数值
                switchNumKey: true,  // 是否显示数字标签
                pointerColor: ''// 指针颜色
            },
            myChart: null,  // ECharts 实例
            chartWidth: 0,  // 图表宽度
            chartHeight: 0,  // 图表高度
            chartId: '',  // 图表唯一ID
        }
    },
    created() {
        // 生成唯一的图表ID
        this.chartId = 'chart-' + Math.random().toString(36).substr(2, 9);
    },
    mounted() {
        // 初始化图表宽高
        this.chartHeight = this.height;
        this.chartWidth = this.width;
        // 合并默认配置与传入的节点属性
        this.node.attrs.props = { ...this.config, ...this.node.attrs.props };
        this.$nextTick(() => {
            // 初始化图表并设置配置项
            this.initChart();
            this.setChartOptions();
        });
    },
    watch: {
        // 监听高度变化，更新图表高度并重新调整大小
        height(newVal) {
            this.chartHeight = newVal;
            this.$nextTick(() => {
                if (this.myChart) this.myChart.resize();
            })
        },
        // 监听宽度变化，更新图表宽度并重新调整大小
        width(newVal) {
            this.chartWidth = newVal;
            this.$nextTick(() => {
                if (this.myChart) this.myChart.resize();
            })
        },
        // 监听参数变化，重新设置图表配置
        params: {
            handler(newVal) {
                if (this.myChart) {
                    this.setChartOptions();
                }
            }
        },
        // 监听节点数据变化，重新设置图表配置
        nodeData: {
            handler(newVal) {
                if (this.myChart) {
                    this.setChartOptions();
                }
            }
        },
    },
    methods: {
        /**
         * 初始化 ECharts 实例，并绑定窗口大小调整事件
         */
        initChart() {
            this.myChart = markRaw(echarts.init(this.$refs.chart));  // 初始化 ECharts 实例并存储
            window.addEventListener('resize', this.resizeChart);  // 绑定窗口大小调整事件，确保图表自适应
        },
        /**
         * 调整图表大小的方法
         */
        resizeChart() {
            if (this.myChart) {
                this.myChart.resize();  // 调用 ECharts 的 resize 方法调整图表大小
            }
        },
        /**
         * 设置图表的配置项
         */
        setChartOptions() {
            // 解构节点属性中的配置
            const {
                setAngle, text, color, fontSize, maxValue, minValue, mainMarkValue,
                markFontColor, markFontSize, secondaryMarkValue, pointerWidth, echartWhere,
                switchRingKey, titlePosition, valPosition, labelPosition, labelTickPosition,
                labelColor, pointerStyle, pointerLength, switchMarkKey, switchValKey, switchNumKey, pointerColor,
                data
            } = this.node.attrs.props;

            // 解析起始和结束角度
            const angles = JSON.parse(setAngle);
            const startAngle = parseFloat(angles[0]);
            const endAngle = parseFloat(angles[1]);

            // 调整颜色分段数据的排序，并映射为 ECharts 需要的格式
            const colorArr = echartWhere
                .sort((a, b) => parseFloat(a.position) - parseFloat(b.position))
                .map(item => [parseFloat(item.position), item.color]);

            // 根据指针样式选择指针图标路径
            let pointerIcon = "";
            if (pointerStyle === 1) {
                pointerIcon = "path://M2090.36389,615.30999 L2090.36389,615.30999 C2091.48372,615.30999 2092.40383,616.194028 2092.44859,617.312956 L2096.90698,728.755929 C2097.05155,732.369577 2094.2393,735.416212 2090.62566,735.56078 C2090.53845,735.564269 2090.45117,735.566014 2090.36389,735.566014 L2090.36389,735.566014 C2086.74736,735.566014 2083.81557,732.63423 2083.81557,729.017692 C2083.81557,728.930412 2083.81732,728.84314 2083.82081,728.755929 L2088.2792,617.312956 C2088.32396,616.194028 2089.24407,615.30999 2090.36389,615.30999 Z";
            } else if (pointerStyle === 2) {
                pointerIcon = "path://M2.9,0.7L2.9,0.7c1.4,0,2.6,1.2,2.6,2.6v115c0,1.4-1.2,2.6-2.6,2.6l0,0c-1.4,0-2.6-1.2-2.6-2.6V3.3C0.3,1.9,1.4,0.7,2.9,0.7z";
            } else if (pointerStyle === 3) {
                pointerIcon = "path://M12.8,0.7l12,40.1H0.7L12.8,0.7z";
            }

            // 构建 ECharts 配置项
            const option = {
                series: [
                    {
                        name: "",
                        type: "gauge",  // 图表类型为仪表盘
                        min: parseFloat(minValue),  // 仪表盘最小值
                        max: parseFloat(maxValue),  // 仪表盘最大值
                        startAngle: startAngle,  // 仪表盘起始角度
                        endAngle: endAngle,  // 仪表盘结束角度
                        splitNumber: mainMarkValue,  // 主刻度等分数
                        detail: {
                            show: switchValKey,  // 是否显示数值
                            offsetCenter: [0, valPosition],  // 数值显示位置
                            fontSize: parseFloat(fontSize),  // 数值字体大小
                            formatter: function (data) {
                                return "\n\n\n" + parseFloat(data).toFixed(2);  // 数值格式化
                            },
                            color: color || "inherit",  // 数值颜色
                        },
                        axisLine: {
                            show: switchRingKey,  // 是否显示轴线
                            lineStyle: {
                                width: 20,  // 轴线宽度
                                shadowBlur: 0,  // 轴线阴影模糊度
                                color: colorArr,  // 轴线颜色分段
                            },
                        },
                        splitLine: {
                            show: switchMarkKey,  // 是否显示刻度线
                            distance: parseFloat(labelTickPosition),  // 刻度线距离
                            lineStyle: {
                                color: labelColor,  // 刻度线颜色
                            },
                        },
                        axisTick: {
                            show: switchMarkKey,  // 是否显示刻度
                            distance: parseFloat(labelTickPosition),  // 刻度距离
                            lineStyle: {
                                color: labelColor,  // 刻度颜色
                            },
                            splitNumber: secondaryMarkValue,  // 次刻度等分数
                        },
                        axisLabel: {
                            show: switchNumKey,  // 是否显示数字标签
                            color: markFontColor || "inherit",  // 数字标签颜色
                            fontSize: parseFloat(markFontSize),  // 数字标签字体大小
                            distance: parseFloat(labelPosition),  // 数字标签距离
                            formatter: function (v) {
                            // 根据最大值和最小值的范围动态决定小数位数
                            var range = parseFloat(maxValue) - parseFloat(minValue);
                            if (range <= 1) {
                            return v.toFixed(1); // 显示1位小数
                            } else if (range <= 10) {
                            return v.toFixed(1); // 显示1位小数
                            } else {
                            return v.toFixed(0); // 显示整数
                            }
                        }
                        },
                        pointer: {
                            icon: pointerIcon,  // 指针图标
                            length: pointerLength,  // 指针长度
                            itemStyle: {
                                color: pointerColor || "auto",  // 指针颜色
                            },
                            width: pointerWidth,  // 指针宽度
                        },
                        title: {
                            offsetCenter: [0, titlePosition ],  // 标题位置
                            color: color || "inherit",  // 标题颜色
                            fontSize: parseFloat(fontSize),  // 标题字体大小
                        },
                        data: [
                            {
                                value: parseFloat(data),  // 仪表盘当前值
                                name: text,  // 仪表盘名称
                            },
                        ],
                    },
                ],
            };
            // 设置 ECharts 配置项
            this.myChart.setOption(option);
        },
    }
}
</script>

<style scoped lang="scss"></style>
