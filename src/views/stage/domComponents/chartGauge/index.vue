<template>
    <div :id="chartId" ref="chart" :style="{ width: chartWidth + 'px', height: chartHeight + 'px' }"></div>
</template>

<script>
import { markRaw } from 'vue'; // Import markRaw，Used to avoid Vue to ECharts The instance is responsive


export default {
    name: 'chartGaugeModule',
    props: ['width', 'height', 'nodeData', 'params', 'node'],
    data() {
        return {
            // Default configuration items，Can be overridden via props overridden
            config: {
                setAngle: '[220, -40]',  // The start and end angles of the dashboard
                text: 'Dashboard',  // The title text of the dashboard
                color: '#000',  // Title color
                fontSize: 16,  // Title font size
                maxValue: 100,  // The maximum value of the dashboard
                minValue: 0,  // The minimum value of the dashboard
                mainMarkValue: 5,  // Number of main scale divisions
                markFontColor: '',  // Main scale font color
                markFontSize: 12,  // Main scale font size
                secondaryMarkValue: 5,  // Number of secondary scale divisions
                pointerWidth: 2,  // Pointer width
                echartWhere: [  // Dashboard color segmentation configuration
                    { position: '0.3', showName: '', color: '#67e0e3' },
                    { position: '0.7', showName: '', color: '#37a2da' },
                    { position: '1', showName: '', color: '#fd666d' }
                ],
                switchRingKey: true,  // Whether to display the annular axis
                titlePosition: 25,  // Title position
                valPosition: '0',  // Value display position
                labelPosition: 40,  // Label position
                labelTickPosition: -20,  // Tick label position
                labelColor: '#000',  // Tick label color
                pointerStyle: 1,  // Pointer style（1: Default，2: Other styles）
                pointerLength: '80%',  // Pointer length
                switchMarkKey: true,  // Whether to display ticks
                switchValKey: true,  // Whether to display the value
                switchNumKey: true,  // Whether to display number labels
                pointerColor: ''// Pointer color
            },
            myChart: null,  // ECharts Instance
            chartWidth: 0,  // Chart width
            chartHeight: 0,  // Chart height
            chartId: '',  // Chart uniqueID
        }
    },
    created() {
        // Generate a unique chartID
        this.chartId = 'chart-' + Math.random().toString(36).substr(2, 9);
    },
    mounted() {
        // Initialize chart width and height
        this.chartHeight = this.height;
        this.chartWidth = this.width;
        // Merge default configuration with incoming node properties
        this.node.attrs.props = { ...this.config, ...this.node.attrs.props };
        this.$nextTick(() => {
            // Initialize the chart and set the configuration
            this.initChart();
            this.setChartOptions();
        });
    },
    watch: {
        // Listen for height changes，Update chart height and resize
        height(newVal) {
            this.chartHeight = newVal;
            this.$nextTick(() => {
                if (this.myChart) this.myChart.resize();
            })
        },
        // Listen for width changes，Update chart width and resize
        width(newVal) {
            this.chartWidth = newVal;
            this.$nextTick(() => {
                if (this.myChart) this.myChart.resize();
            })
        },
        // Listen for parameter changes，Reset chart configuration
        params: {
            handler(newVal) {
                if (this.myChart) {
                    this.setChartOptions();
                }
            }
        },
        // Listen for node data changes，Reset chart configuration
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
         * Initialize ECharts Instance，and bind the window resize event
         */
        initChart() {
            this.myChart = markRaw(echarts.init(this.$refs.chart));  // Initialize ECharts Instance and store
            window.addEventListener('resize', this.resizeChart);  // Bind the window resize event，Ensure the chart is adaptive
        },
        /**
         * Method to resize the chart
         */
        resizeChart() {
            if (this.myChart) {
                this.myChart.resize();  // Call ECharts of resize method to resize the chart
            }
        },
        /**
         * Set chart configuration
         */
        setChartOptions() {
            // Destructure configuration from node properties
            const {
                setAngle, text, color, fontSize, maxValue, minValue, mainMarkValue,
                markFontColor, markFontSize, secondaryMarkValue, pointerWidth, echartWhere,
                switchRingKey, titlePosition, valPosition, labelPosition, labelTickPosition,
                labelColor, pointerStyle, pointerLength, switchMarkKey, switchValKey, switchNumKey, pointerColor,
                data
            } = this.node.attrs.props;

            // Parse start and end angles
            const angles = JSON.parse(setAngle);
            const startAngle = parseFloat(angles[0]);
            const endAngle = parseFloat(angles[1]);

            // Adjust the sorting of color segmentation data，and map to ECharts the required format
            const colorArr = echartWhere
                .sort((a, b) => parseFloat(a.position) - parseFloat(b.position))
                .map(item => [parseFloat(item.position), item.color]);

            // Select the pointer icon path according to the pointer style
            let pointerIcon = "";
            if (pointerStyle === 1) {
                pointerIcon = "path://M2090.36389,615.30999 L2090.36389,615.30999 C2091.48372,615.30999 2092.40383,616.194028 2092.44859,617.312956 L2096.90698,728.755929 C2097.05155,732.369577 2094.2393,735.416212 2090.62566,735.56078 C2090.53845,735.564269 2090.45117,735.566014 2090.36389,735.566014 L2090.36389,735.566014 C2086.74736,735.566014 2083.81557,732.63423 2083.81557,729.017692 C2083.81557,728.930412 2083.81732,728.84314 2083.82081,728.755929 L2088.2792,617.312956 C2088.32396,616.194028 2089.24407,615.30999 2090.36389,615.30999 Z";
            } else if (pointerStyle === 2) {
                pointerIcon = "path://M2.9,0.7L2.9,0.7c1.4,0,2.6,1.2,2.6,2.6v115c0,1.4-1.2,2.6-2.6,2.6l0,0c-1.4,0-2.6-1.2-2.6-2.6V3.3C0.3,1.9,1.4,0.7,2.9,0.7z";
            } else if (pointerStyle === 3) {
                pointerIcon = "path://M12.8,0.7l12,40.1H0.7L12.8,0.7z";
            }

            // Build ECharts Configuration item
            const option = {
                series: [
                    {
                        name: "",
                        type: "gauge",  // Chart type is dashboard
                        min: parseFloat(minValue),  // Dashboard minimum value
                        max: parseFloat(maxValue),  // Dashboard maximum value
                        startAngle: startAngle,  // Dashboard start angle
                        endAngle: endAngle,  // Dashboard end angle
                        splitNumber: mainMarkValue,  // Number of main scale divisions
                        detail: {
                            show: switchValKey,  // Whether to display the value
                            offsetCenter: [0, valPosition],  // Value display position
                            fontSize: parseFloat(fontSize),  // Value font size
                            formatter: function (data) {
                                return "\n\n\n" + parseFloat(data).toFixed(2);  // Value formatting
                            },
                            color: color || "inherit",  // Value color
                        },
                        axisLine: {
                            show: switchRingKey,  // Whether to display the axis
                            lineStyle: {
                                width: 20,  // Axis width
                                shadowBlur: 0,  // Axis shadow blur
                                color: colorArr,  // Axis color segmentation
                            },
                        },
                        splitLine: {
                            show: switchMarkKey,  // Whether to display tick marks
                            distance: parseFloat(labelTickPosition),  // Tick mark distance
                            lineStyle: {
                                color: labelColor,  // Tick mark color
                            },
                        },
                        axisTick: {
                            show: switchMarkKey,  // Whether to display ticks
                            distance: parseFloat(labelTickPosition),  // Tick distance
                            lineStyle: {
                                color: labelColor,  // Tick color
                            },
                            splitNumber: secondaryMarkValue,  // Number of secondary scale divisions
                        },
                        axisLabel: {
                            show: switchNumKey,  // Whether to display number labels
                            color: markFontColor || "inherit",  // Number label color
                            fontSize: parseFloat(markFontSize),  // Number label font size
                            distance: parseFloat(labelPosition),  // Number label distance
                            formatter: function (v) {
                            // Dynamically determine the number of decimal places based on the range of maximum and minimum values
                            var range = parseFloat(maxValue) - parseFloat(minValue);
                            if (range <= 1) {
                            return v.toFixed(1); // Display1decimal places
                            } else if (range <= 10) {
                            return v.toFixed(1); // Display1decimal places
                            } else {
                            return v.toFixed(0); // Display integer
                            }
                        }
                        },
                        pointer: {
                            icon: pointerIcon,  // Pointer icon
                            length: pointerLength,  // Pointer length
                            itemStyle: {
                                color: pointerColor || "auto",  // Pointer color
                            },
                            width: pointerWidth,  // Pointer width
                        },
                        title: {
                            offsetCenter: [0, titlePosition ],  // Title position
                            color: color || "inherit",  // Title color
                            fontSize: parseFloat(fontSize),  // Title font size
                        },
                        data: [
                            {
                                value: parseFloat(data),  // Current value of the dashboard
                                name: text,  // Dashboard name
                            },
                        ],
                    },
                ],
            };
            // Set ECharts Configuration item
            this.myChart.setOption(option);
        },
    }
}
</script>

<style scoped lang="scss"></style>
