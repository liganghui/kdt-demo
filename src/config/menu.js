import { getAssetPath } from '@/utils/utils';
const pathPrefix = getAssetPath('/assets/imgs/panel');
// Configure the Material Panel
const designPanels = [
    {
        folderName: 'design',
        moudleName: 'design',
        children: [
            {
                title: 'Industry',
                folderName: 'icon',
                icon: 'industry',
                children: [
                    {
                        folderName: 'anquanbiaozhi',
                        title:  'Safety Sign',
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
                        title:  'Sensor',
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
                title: 'Button',
                folderName: 'button',
                icon: 'button',
                children: [
                    {
                        folderName: '',
                        title: 'Button',
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
                title: 'Icon',
                folderName: 'other',
                icon: 'img',
                children: [
                    {
                        folderName: '',
                        title: 'Icon',
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
// Configure the Module Panel
const modulePanels = [
    {
        folderName: 'moudles',
        moudleName: 'moudles',
        children: [
            {
                title: 'Control',
                icon: 'moudleThree',
                children: [
                    {
                        title: 'All',
                        filePrefix: '',
                        source: [
                            {
                                width: 100,
                                height: 40,
                                type: 'text',
                                sourceType: 'component',
                                title: 'Text',
                                path: '/assets/imgs/panel/module/Text.png',
                                props: {
                                    data: 'Text'
                                },
                                component: {
                                    defaultValue: '##.##',
                                    panelName: 'textPanel'
                                }
                            },
                            {
                                width: 120,
                                height: 50,
                                title: 'Button',
                                type: 'button',
                                sourceType: 'component',
                                path: '/assets/imgs/panel/module/Button.png',
                                component: {
                                    defaultValue: '##.##',
                                    panelName: 'buttonPanel'
                                },
                                props: {
                                    data: 'Button',
                                    backgroundType: 'gradient',
                                    gradientStartColor: '#409EFE',
                                    gradientEndColor: 'red'
                                }
                            },
                            {
                                width: 80,
                                height: 40,
                                sourceType: 'component',
                                title: 'Switch',
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
                                title: 'Image',
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
                                title: 'Web Page',
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
                title: 'Chart',
                icon: 'chartLineTwo',
                children: [
                    {
                        title: 'All',
                        filePrefix: '',
                        source: [
                          
                            {
                                width: 400,
                                height: 300,
                                sourceType: 'component',
                                title: 'Dashboard',
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
                                title: 'Scatter Plot',
                                type: 'chartScatter',
                                path: '/assets/imgs/panel/module/ChartScatter.png',
                                props: {
                                    data: {
                                        categories: ['Apple', 'Samsung', 'Xiaomi', 'oppo', 'vivo'],
                                        series: [
                                            {
                                                name: 'Mobile Phone Brands',
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
                                title: 'Pie Chart',
                                type: 'chartPie',
                                path: '/assets/imgs/panel/module/ChartPie.png',
                                props: {
                                    data: [
                                        { value: 335, name: 'Direct Access' },
                                        { value: 310, name: 'Email Marketing' },
                                        { value: 274, name: 'Affiliate Advertising' },
                                        { value: 235, name: 'Video Advertising' }
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
                title: 'Shape',
                icon: 'graph',
                children: [
                    {
                        title: 'All',
                        filePrefix: '',
                        source: [
                        
                            {
                                width: 200,
                                height: 200,
                                sourceType: 'component',
                                title: 'Circle',
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
                                title: 'Ellipse',
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
                                title: 'Rectangle',
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
                                title: 'Star Shape',
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

// Generate Path
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

// Generate Paths Based on Sub-items
function generateSourcePaths(subChild, basePath, filePrefix, folderName) {
    return subChild.source
        .map((source) => {
            if (source.sourceType === 'component') {
                // Apply to Component Paths getAssetPath Process
                const processedPath = source.path ? getAssetPath(source.path) : source.path;
                let processedProps = { ...source.props };
                if (source.props) {
                    // Path Attributes Requiring Prefix Concatenation Processing
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
