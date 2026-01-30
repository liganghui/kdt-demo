import { getAssetPath } from '@/utils/utils';
const pathPrefix = getAssetPath('/assets/imgs/panel');
// 素材面板的配置
const designPanels = [
    {
        folderName: 'design',
        moudleName: 'design',
        children: [
            {
                title: '工业',
                folderName: 'icon',
                icon: 'industry',
                children: [
                    {
                        folderName: 'anquanbiaozhi',
                        title:  '安全标志',
                        filePrefix: 'anquanbiaozhi',
                        source: [
                            {
                                sourceType: 'index',
                                start: 1,
                                end: 40,
                                format: 'svg'
                            }
                        ]
                    },
                    {
                        folderName: 'chuanganqi',
                        title:  '传感器',
                        filePrefix: 'chuanganqi',
                        source: [
                            {
                                sourceType: 'index',
                                start: 1,
                                end: 20,
                                format: 'svg'
                            }
                        ]
                    },
                ]
            },
            {
                title: '按钮',
                folderName: 'button',
                icon: 'button',
                children: [
                    {
                        folderName: '',
                        title: '按钮',
                        filePrefix: 'button',
                        source: [
                            {
                                sourceType: 'index',
                                start: 1,
                                end: 45,
                                format: 'png'
                            }
                        ]
                    },
                ]
            },
            {
                title: '图标',
                folderName: 'other',
                icon: 'img',
                children: [
                    {
                        folderName: '',
                        title: '图标',
                        filePrefix: 'icon',
                        source: [
                            {
                                sourceType: 'index',
                                start: 1,
                                end: 49,
                                format: 'png'
                            }
                        ]
                    },
                ]
            }
        ]
    }
]
// 模块面板的配置
const modulePanels = [
    {
        folderName: 'moudles',
        moudleName: 'moudles',
        children: [
            {
                title: '控件',
                icon: 'moudleThree',
                children: [
                    {
                        title: '全部',
                        filePrefix: '',
                        source: [
                            {
                                width: 100,
                                height: 40,
                                type: 'text',
                                sourceType: 'component',
                                title: '文本',
                                path: '/assets/imgs/panel/module/Text.png',
                                props: {
                                    data: '文本'
                                },
                                component: {
                                    defaultValue: '##.##',
                                    panelName: 'textPanel'
                                }
                            },
                            {
                                width: 120,
                                height: 50,
                                title: '按钮',
                                type: 'button',
                                sourceType: 'component',
                                path: '/assets/imgs/panel/module/Button.png',
                                component: {
                                    defaultValue: '##.##',
                                    panelName: 'buttonPanel'
                                },
                                props: {
                                    data: '按钮',
                                    backgroundType: 'gradient',
                                    gradientStartColor: '#409EFE',
                                    gradientEndColor: 'red'
                                }
                            },
                            {
                                width: 80,
                                height: 40,
                                sourceType: 'component',
                                title: '开关',
                                type: 'switch',
                                path: '/assets/imgs/panel/module/Switch.png',
                                props: {
                                    onPath: '/assets/imgs/module/switch/32_1.png',
                                    offPath: '/assets/imgs/module/switch/32_0.png',
                                    data: true
                                },
                                component: {
                                    defaultValue: false,
                                    panelName: 'switchPanel'
                                }
                            },

                            {
                                width: 100,
                                height: 100,
                                type: 'image',
                                sourceType: 'component',
                                title: '图片',
                                path: '/assets/imgs/panel/module/Image.png',
                                props: {
                                    data: '/assets/imgs/module/img.svg'
                                },
                                component: {
                                    panelName: 'imagePanel'
                                }
                            },
                            {
                                width: 400,
                                height: 300,
                                type: 'iframe',
                                sourceType: 'component',
                                title: '网页',
                                path: '/assets/imgs/panel/module/Iframe.png',
                                props: {
                                    data: 'https://react.dev/'
                                },
                                component: {
                                    componentName: 'iframeDom',
                                    panelName: 'iframePanel'
                                }
                            },
                        ]
                    }
                ]
            },
            {
                title: '图表',
                icon: 'chartLineTwo',
                children: [
                    {
                        title: '全部',
                        filePrefix: '',
                        source: [
                          
                            {
                                width: 400,
                                height: 300,
                                sourceType: 'component',
                                title: '仪表盘',
                                type: 'chartGauge',
                                path: '/assets/imgs/panel/module/ChartGauge.png',
                                props: {
                                    data: 45
                                },
                                component: {
                                    componentName: 'chartGaugeModule',
                                    panelName: 'chartGaugePanel'
                                }
                            },
                            {
                                width: 400,
                                height: 300,
                                sourceType: 'component',
                                title: '散点图',
                                type: 'chartScatter',
                                path: '/assets/imgs/panel/module/ChartScatter.png',
                                props: {
                                    data: {
                                        categories: ['苹果', '三星', '小米', 'oppo', 'vivo'],
                                        series: [
                                            {
                                                name: '手机品牌',
                                                data: [[500,600], [1000,700], [2000,800], [3000,900], [4000,1000]]
                                            }
                                        ]
                                    }
                                },
                                component: {
                                    componentName: 'chartScatter',
                                    panelName: 'chartScatterPanel'
                                }
                            },
                            {
                                width: 400,
                                height: 300,
                                sourceType: 'component',
                                title: '饼图',
                                type: 'chartPie',
                                path: '/assets/imgs/panel/module/ChartPie.png',
                                props: {
                                    data: [
                                        { value: 335, name: '直接访问' },
                                        { value: 310, name: '邮件营销' },
                                        { value: 274, name: '联盟广告' },
                                        { value: 235, name: '视频广告' }
                                    ]
                                },
                                component: {
                                    componentName: 'chartPie',
                                    panelName: 'chartPiePanel'
                                }
                            },
                        ]
                    }
                ]
            },
            {
                title: '图形',
                icon: 'graph',
                children: [
                    {
                        title: '全部',
                        filePrefix: '',
                        source: [
                        
                            {
                                width: 200,
                                height: 200,
                                sourceType: 'component',
                                title: '圆形',
                                path: '/assets/imgs/panel/module/circle.png',
                                props: {},
                                type: 'circle',
                                component: {
                                    isDataPanelVisible: false,
                                    panelName: 'circlePanel'
                                }
                            },
                            {
                                width: 200,
                                height: 200,
                                sourceType: 'component',
                                title: '椭圆',
                                path: '/assets/imgs/panel/module/elipse.png',
                                props: {},
                                type: 'elipse',
                                component: {
                                    isDataPanelVisible: false,
                                    panelName: 'elipsePanel'
                                }
                            },
                            {
                                width: 200,
                                height: 200,
                                sourceType: 'component',
                                title: '矩形',
                                path: '/assets/imgs/panel/module/square.png',
                                props: {},
                                type: 'square',
                                component: {
                                    isDataPanelVisible: false,
                                    panelName: 'squarePanel'
                                }
                            },
                            {
                                width: 200,
                                height: 200,
                                sourceType: 'component',
                                title: '星型',
                                path: '/assets/imgs/panel/module/star.png',
                                props: {},
                                type: 'star',
                                component: {
                                    isDataPanelVisible: false,
                                    panelName: 'starPanel'
                                }
                            },
                        ]
                    }
                ]
            },
        ]
    }
]

const AllLeftPanels = [...designPanels, ...modulePanels]

// 生成路径
function generatePath(baseInfo, prefix, parentFolderName = '') {
    return baseInfo.map((info) => ({
        folderName: info.folderName,
        children: info.children.map((child) => {
            let basePath
            if (!child.folderName) {
                basePath = `${prefix}`
            } else {
                basePath = `${prefix}/${parentFolderName}${info.folderName}/${child.folderName}`
            }
            return {
                title: child.title,
                icon: child.icon,
                columns: child?.columns || 2,
                children: child.children.map((subChild) => ({
                    title: subChild.title,
                    component: subChild.component,
                    children: generateSourcePaths(
                        subChild,
                        basePath,
                        subChild.filePrefix,
                        subChild.folderName
                    )
                }))
            }
        })
    }))
}

// 根据子项生成路径
function generateSourcePaths(subChild, basePath, filePrefix, folderName) {
    return subChild.source
        .map((source) => {
            if (source.sourceType === 'component') {
                // 对组件路径应用 getAssetPath 处理
                const processedPath = source.path ? getAssetPath(source.path) : source.path;
                let processedProps = { ...source.props };
                if (source.props) {
                    // 需要拼接前缀处理的路径属性
                    const pathProps = ['data', 'onPath', 'offPath'];
                    pathProps.forEach(propName => {
                        const propValue = source.props[propName];
                        if (propValue && typeof propValue === 'string' && propValue.startsWith('/assets/')) {
                            processedProps[propName] = getAssetPath(propValue);
                        }
                    });
                }
                return {
                    ...source,
                    title: source.title,
                    path: processedPath,
                    props: processedProps,
                    data: processedPath
                }
            } else if (source.sourceType === 'index') {
                const paths = []
                for (let i = source.start; i <= source.end; i++) {
                    const data = `${basePath}/${folderName}/${filePrefix}${i}.${source.format}`
                    paths.push({
                        ...subChild,
                        title: source.title || `${subChild.title}${i}`,
                        props: {
                            data
                        },
                        component: source.component
                            ? source.component
                            : {
                                panelName: 'imagePanel'
                            }
                    })
                }
                return paths
            }
        })
        .flat()
}
const allPath = generatePath(AllLeftPanels, pathPrefix)
const getMoudleData = (componentName) => {
    return allPath.find((item) => item.folderName === componentName)?.children
}

export { allPath, getMoudleData, modulePanels, designPanels }
