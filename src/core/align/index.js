/**
 * @module AlignManage
 * @name 对齐管理器
 * @description 对齐管理器类，用于在舞台上对节点进行对齐和分布。
 */
export default class alignManage {
    /**
     * 禁用对齐的节点名称列表
     * @type {string[]}
     */
    disableAlignNames = ['kd_grid_x_line', 'kd_grid_y_line']

    /**
     * 创建一个对齐管理器实例
     * @param {Object} state - 全局状态对象
     * @param {Object} stateManage - 用于管理状态（数据、节点、图层等）的对象
     * @param {Object} config - 配置信息对象，例如对齐线偏移、颜色等
     */
    constructor(state, stateManage, config) {
        this.config = config
        this.stateManage = stateManage
        this.state = state
    }
    /**
    * 左对齐节点
    * @param {Object[]} nodes - 节点数组
    */
    alignLeft(nodes) {
        if (!Array.isArray(nodes) || nodes.length === 0) return

        if (nodes.length === 1) {
            // 单个节点，左对齐到画布
            const node = nodes[0]
            var boundingBox = node.getClientRect({ relativeTo: node.getStage() })
            var offsetX = boundingBox.x
            node.x(node.x() - offsetX)
            setTimeout(() => {
                if (!this.stateManage.class.transformer.isNodeVisible(node)) {
                    this.stateManage.class.node.focusNode(node)
                }
            })
        } else {
            // 多个节点，左对齐到第一个节点
            const firstNode = nodes[0]
            var firstBoundingBox = firstNode.getClientRect({ relativeTo: firstNode.getParent() })
            var firstLeftEdge = firstBoundingBox.x

            nodes.forEach((node) => {
                var boundingBox = node.getClientRect({ relativeTo: node.getParent() })
                var offsetX = boundingBox.x - firstLeftEdge
                node.x(node.x() - offsetX)
            })
        }
        this.stateManage.class.dom.updateDomPosition()
        this.stateManage.class.node.forceUpdate()
    }

    /**
     * 右对齐节点
     * @param {Object[]} nodes - 节点数组
     */
    alignRight(nodes) {
        if (!Array.isArray(nodes) || nodes.length === 0) return

        if (nodes.length === 1) {
            // 单个节点，右对齐到画布
            const node = nodes[0]
            var boundingBox = node.getClientRect({ relativeTo: node.getStage() })
            var offsetX = boundingBox.x + boundingBox.width
            node.x(node.x() + (this.state.stage.width() - offsetX))
            setTimeout(() => {
                if (!this.stateManage.class.transformer.isNodeVisible(node)) {
                    this.stateManage.class.node.focusNode(node)
                }
            })
        } else {
            // 多个节点，右对齐到第一个节点
            const firstNode = nodes[0]
            var firstBoundingBox = firstNode.getClientRect({ relativeTo: firstNode.getParent() })
            var firstRightEdge = firstBoundingBox.x + firstBoundingBox.width

            nodes.forEach((node) => {
                var boundingBox = node.getClientRect({ relativeTo: node.getParent() })
                var nodeRightEdge = boundingBox.x + boundingBox.width
                var offsetX = nodeRightEdge - firstRightEdge
                node.x(node.x() - offsetX)
            })
        }
        this.stateManage.class.dom.updateDomPosition()
        this.stateManage.class.node.forceUpdate()
    }

    /**
     * 顶部对齐节点
     * @param {Object[]} nodes - 节点数组
     */
    alignTop(nodes) {
        if (!Array.isArray(nodes) || nodes.length === 0) return

        if (nodes.length === 1) {
            // 单个节点，顶部对齐到画布
            const node = nodes[0]
            var boundingBox = node.getClientRect({ relativeTo: node.getStage() })
            var offsetY = boundingBox.y
            node.y(node.y() - offsetY)
            setTimeout(() => {
                if (!this.stateManage.class.transformer.isNodeVisible(node)) {
                    this.stateManage.class.node.focusNode(node)
                }
            })
        } else {
            // 多个节点，顶部对齐到第一个节点
            const firstNode = nodes[0]
            var firstBoundingBox = firstNode.getClientRect({ relativeTo: firstNode.getParent() })
            var firstTopEdge = firstBoundingBox.y

            nodes.forEach((node) => {
                var boundingBox = node.getClientRect({ relativeTo: node.getParent() })
                var offsetY = boundingBox.y - firstTopEdge
                node.y(node.y() - offsetY)
            })
        }
        this.stateManage.class.dom.updateDomPosition()
        this.stateManage.class.node.forceUpdate()
    }

    /**
     * 底部对齐节点
     * @param {Object[]} nodes - 节点数组
     */
    alignBottom(nodes) {
        if (!Array.isArray(nodes) || nodes.length === 0) return

        if (nodes.length === 1) {
            // 单个节点，底部对齐到画布
            const node = nodes[0]
            var boundingBox = node.getClientRect({ relativeTo: node.getStage() })
            var offsetY = boundingBox.y + boundingBox.height
            node.y(node.y() + (this.state.stage.height() - offsetY))
            setTimeout(() => {
                if (!this.stateManage.class.transformer.isNodeVisible(node)) {
                    this.stateManage.class.node.focusNode(node)
                }
            })
        } else {
            // 多个节点，底部对齐到第一个节点
            const firstNode = nodes[0]
            var firstBoundingBox = firstNode.getClientRect({ relativeTo: firstNode.getParent() })
            var firstBottomEdge = firstBoundingBox.y + firstBoundingBox.height

            nodes.forEach((node) => {
                var boundingBox = node.getClientRect({ relativeTo: node.getParent() })
                var nodeBottomEdge = boundingBox.y + boundingBox.height
                var offsetY = nodeBottomEdge - firstBottomEdge
                node.y(node.y() - offsetY)
            })
        }
        this.stateManage.class.dom.updateDomPosition()
        this.stateManage.class.node.forceUpdate()
    }

    /**
     * 水平居中对齐节点
     * @param {Object[]} nodes - 节点数组
     */
    alignHorizontalCenter(nodes) {
        if (!Array.isArray(nodes) || nodes.length === 0) return

        if (nodes.length === 1) {
            // 单个节点，水平居中对齐到画布
            const node = nodes[0]
            var boundingBox = node.getClientRect({ relativeTo: node.getStage() })
            var offsetX = boundingBox.x + boundingBox.width / 2
            node.x(node.x() + (this.state.stage.width() / 2 - offsetX))
            setTimeout(() => {
                if (!this.stateManage.class.transformer.isNodeVisible(node)) {
                    this.stateManage.class.node.focusNode(node)
                }
            })
        } else {
            // 多个节点，水平居中对齐到第一个节点
            const firstNode = nodes[0]
            var firstBoundingBox = firstNode.getClientRect({ relativeTo: firstNode.getParent() })
            var firstCenterX = firstBoundingBox.x + firstBoundingBox.width / 2

            nodes.forEach((node) => {
                var boundingBox = node.getClientRect({ relativeTo: node.getParent() })
                var nodeCenterX = boundingBox.x + boundingBox.width / 2
                var offsetX = nodeCenterX - firstCenterX
                node.x(node.x() - offsetX)
            })
        }
        this.stateManage.class.dom.updateDomPosition()
        this.stateManage.class.node.forceUpdate()
    }

    /**
     * 垂直居中对齐节点
     * @param {Object[]} nodes - 节点数组
     */
    alignVerticalCenter(nodes) {
        if (!Array.isArray(nodes) || nodes.length === 0) return

        if (nodes.length === 1) {
            // 单个节点，垂直居中对齐到画布
            const node = nodes[0]
            var boundingBox = node.getClientRect({ relativeTo: node.getStage() })
            var offsetY = boundingBox.y + boundingBox.height / 2
            node.y(node.y() + (this.state.stage.height() / 2 - offsetY))
            setTimeout(() => {
                if (!this.stateManage.class.transformer.isNodeVisible(node)) {
                    this.stateManage.class.node.focusNode(node)
                }
            })
        } else {
            // 多个节点，垂直居中对齐到第一个节点
            const firstNode = nodes[0]
            var firstBoundingBox = firstNode.getClientRect({ relativeTo: firstNode.getParent() })
            var firstCenterY = firstBoundingBox.y + firstBoundingBox.height / 2

            nodes.forEach((node) => {
                var boundingBox = node.getClientRect({ relativeTo: node.getParent() })
                var nodeCenterY = boundingBox.y + boundingBox.height / 2
                var offsetY = nodeCenterY - firstCenterY
                node.y(node.y() - offsetY)
            })
        }
        this.stateManage.class.dom.updateDomPosition()
        this.stateManage.class.node.forceUpdate()
    }

    /**
     * 居中对齐节点（同时水平和垂直）
     * @param {Object[]} nodes - 节点数组
     */
    alignCenter(nodes) {
        if (!Array.isArray(nodes) || nodes.length === 0) return

        // 首先水平居中
        this.alignHorizontalCenter(nodes)
        // 然后垂直居中
        this.alignVerticalCenter(nodes)
    }

    /**
     * 竖向等距分布节点
     * @param {Object[]} nodes - 节点数组
     */
    distributeVertically(nodes) {
        if (!Array.isArray(nodes) || nodes.length <= 2) return

        // 按照节点的顶部边缘排序
        nodes.sort((a, b) => {
            var aBox = a.getClientRect({ relativeTo: a.getParent() })
            var bBox = b.getClientRect({ relativeTo: b.getParent() })
            return aBox.y - bBox.y
        })

        const firstNode = nodes[0]
        const lastNode = nodes[nodes.length - 1]

        var firstBox = firstNode.getClientRect({ relativeTo: firstNode.getParent() })
        var lastBox = lastNode.getClientRect({ relativeTo: lastNode.getParent() })

        const totalHeight = lastBox.y - firstBox.y + lastBox.height
        const nodesHeight = nodes.reduce((sum, node) => {
            var box = node.getClientRect({ relativeTo: node.getParent() })
            return sum + box.height
        }, 0)

        const gap = (totalHeight - nodesHeight) / (nodes.length - 1)

        let currentY = firstBox.y

        nodes.forEach((node, index) => {
            if (index === 0) {
                // 第一个节点已在正确位置
                return
            }
            var box = node.getClientRect({ relativeTo: node.getParent() })
            var offsetY =
                box.y -
                currentY -
                gap -
                nodes[index - 1].getClientRect({ relativeTo: nodes[index - 1].getParent() }).height
            node.y(node.y() - offsetY)
            currentY +=
                nodes[index - 1].getClientRect({ relativeTo: nodes[index - 1].getParent() }).height + gap
        })

        this.stateManage.class.dom.updateDomPosition()
        this.stateManage.class.node.forceUpdate()
    }

    /**
     * 横向等距分布节点
     * @param {Object[]} nodes - 节点数组
     */
    distributeHorizontally(nodes) {
        if (!Array.isArray(nodes) || nodes.length <= 2) return

        // 按照节点的左边缘排序
        nodes.sort((a, b) => {
            var aBox = a.getClientRect({ relativeTo: a.getParent() })
            var bBox = b.getClientRect({ relativeTo: b.getParent() })
            return aBox.x - bBox.x
        })

        const firstNode = nodes[0]
        const lastNode = nodes[nodes.length - 1]

        var firstBox = firstNode.getClientRect({ relativeTo: firstNode.getParent() })
        var lastBox = lastNode.getClientRect({ relativeTo: lastNode.getParent() })

        const totalWidth = lastBox.x - firstBox.x + lastBox.width
        const nodesWidth = nodes.reduce((sum, node) => {
            var box = node.getClientRect({ relativeTo: node.getParent() })
            return sum + box.width
        }, 0)

        const gap = (totalWidth - nodesWidth) / (nodes.length - 1)

        let currentX = firstBox.x

        nodes.forEach((node, index) => {
            if (index === 0) {
                // 第一个节点已在正确位置
                return
            }
            var box = node.getClientRect({ relativeTo: node.getParent() })
            var offsetX =
                box.x -
                currentX -
                gap -
                nodes[index - 1].getClientRect({ relativeTo: nodes[index - 1].getParent() }).width
            node.x(node.x() - offsetX)
            currentX +=
                nodes[index - 1].getClientRect({ relativeTo: nodes[index - 1].getParent() }).width + gap
        })

        this.stateManage.class.dom.updateDomPosition()
        this.stateManage.class.node.forceUpdate()
    }

    /**
     * 处理对齐线绘制事件。该函数在用户拖拽（或变化）节点时，
     * 根据当前节点与其他节点或舞台边缘的距离，计算并绘制对齐参考线。
     * 
     * 主要流程：
     * 1. 判断当前事件目标节点是否需要跳过（若无父节点或正在使用变形器）。
     * 2. 从当前图层中清理掉之前所有绘制的辅助线（guide-group）。
     * 3. 获取当前节点可用的对齐线位置（lineGuideStops）以及节点自身可用对齐点（itemBounds）。
     * 4. 计算最优的对齐线（getGuides），若存在则调用 drawGuides 进行绘制。
     * 5. 根据计算结果校正目标节点的位置（绝对坐标）。
     * 
     * @param {Object} e - Konva 事件对象，通常在拖拽（dragmove）、变形（transform）时触发
     */
    handleAlignLineDraw(e) {
        // 检查是否处于画布拖拽模式，如果是则直接返回 ***
        if (this.state.isCanvasDragging) {
            return
        }
        // 仅编辑模式可用
        if(!this.state.isEdit){
            return
        }
        const layer = this.state.layers[this.state.layers.length - 1]
        // 清理现有的对齐线（guide-group）
        const guideGroup = layer.findOne('.guide-group')
        if (guideGroup) {
            guideGroup.destroy()
        }
        //  特殊处理 过滤掉管道节点
        if (e.target?.attrs?.name && e.target?.attrs?.name.indexOf('edit_') !== -1) return
        // 如果节点无父级或者当前有变形器在作用，则直接返回不处理
        if (!e.target.parent || (this.state.transformer && this.state.transformer.nodes().length > 0)) {
            return
        }
        // 获取可用于对齐的参考线位置
        var lineGuideStops = this.getLineGuideStops(e.target)
        // 获取当前节点可用于对齐的边缘
        var itemBounds = this.getObjectSnappingEdges(e.target)
        // 计算最合适的对齐线数据
        var guides = this.getGuides(lineGuideStops, itemBounds)
        if (!guides.length) {
            return
        }
        // 绘制对齐线
        this.drawGuides(guides, e.target)

        // 根据计算得到的 guides 调整节点最终的位置
        var absPos = e.target.absolutePosition()
        guides.forEach((lg) => {
            switch (lg.snap) {
                case 'start':
                    switch (lg.orientation) {
                        case 'V':
                            absPos.x = lg.lineGuide + lg.offset
                            break
                        case 'H':
                            absPos.y = lg.lineGuide + lg.offset
                            break
                    }
                    break
                case 'center':
                    switch (lg.orientation) {
                        case 'V':
                            absPos.x = lg.lineGuide + lg.offset
                            break
                        case 'H':
                            absPos.y = lg.lineGuide + lg.offset
                            break
                    }
                    break
                case 'end':
                    switch (lg.orientation) {
                        case 'V':
                            absPos.x = lg.lineGuide + lg.offset
                            break
                        case 'H':
                            absPos.y = lg.lineGuide + lg.offset
                            break
                    }
                    break
            }
        })
        e.target.absolutePosition(absPos)
        // 更新Dom节点位置
        this.stateManage.class.dom.updateDomPosition()
    }

    /**
     * 清除所有对齐线与距离线。
     * 通常在节点拖拽结束或其他需要清理辅助线的场景调用。
     */
    clearAlignLine() {
        const layer = this.state.layers[this.state.layers.length - 1]
        layer.find('.guid-line').forEach((l) => l.destroy())
        layer.find('.distance-line').forEach((l) => l.destroy())
        layer.find('.distance-text').forEach((l) => l.destroy())
        layer.find('.distance-bg').forEach((l) => l.destroy())

        // 清除竖线
        layer.find('.start-vertical-line').forEach((l) => l.destroy())
        layer.find('.end-vertical-line').forEach((l) => l.destroy())
    }

    /**
     * 获取其他可用节点或舞台的“对齐参考线”位置。
     * 
     * 主要流程：
     * 1. 获取舞台上所有节点的外包矩形信息，但跳过指定的节点（skipShape）和需禁用对齐的节点名称。
     * 2. 分别收集每个节点的左、右、中心（垂直），以及上、下、中心（水平）等坐标值。
     * 3. 同时加入舞台本身的边缘和舞台中心点坐标，以便对齐到舞台。
     * 
     * @param {Object} skipShape - 跳过的形状对象（当前正在拖拽或变形的节点）
     * @returns {Object} 返回包含 vertical 和 horizontal 两个数组的对象，分别存储可用的垂直和水平对齐线信息
     */
    getLineGuideStops(skipShape) {
        var vertical = []
        var horizontal = []
        let allNodes = this.stateManage.class.node.getAllLayersNodes()
        const disableText = this.disableAlignNames.join(',')
        // 过滤掉 skipShape、隐藏节点以及禁用对齐列表中的节点
        allNodes = allNodes.filter((node) => {
            return node !== skipShape && node.visible() && disableText.indexOf(node.attrs.name) == -1
        })

        // 收集节点的外包矩形信息
        allNodes.forEach((node) => {
            var box = node.getClientRect({
                relativeTo: this.state.stage
            })
            vertical.push({ guide: box.x, node: node })
            vertical.push({ guide: box.x + box.width, node: node })
            vertical.push({ guide: box.x + box.width / 2, node: node })
            horizontal.push({ guide: box.y, node: node })
            horizontal.push({ guide: box.y + box.height, node: node })
            horizontal.push({ guide: box.y + box.height / 2, node: node })
        })

        // 添加舞台自身的对齐线（左、右、中心；上、下、中心）
        vertical.push({ guide: 0 })
        vertical.push({ guide: this.state.stage.width() / 2 })
        vertical.push({ guide: this.state.stage.width() })
        horizontal.push({ guide: 0 })
        horizontal.push({ guide: this.state.stage.height() / 2 })
        horizontal.push({ guide: this.state.stage.height() })

        return {
            vertical: vertical,
            horizontal: horizontal
        }
    }

    /**
     * 获取某节点在舞台中的可对齐边缘。
     * 这里会计算节点自身外包矩形（以舞台为基准），
     * 并返回其对应的“开始（start）”、“中心（center）”和“结束（end）”等对齐点坐标。
     * 
     * @param {Object} node - 需要对齐的节点对象
     * @returns {Object} 返回包含 vertical 和 horizontal 数组的对象，
     *                   每个数组中含有 guide、offset 和 snap 三个字段，方便后续对齐计算。
     */
    getObjectSnappingEdges(node) {
        var box = node.getClientRect({
            relativeTo: this.state.stage
        })
        var absPos = node.absolutePosition()

        return {
            vertical: [
                {
                    guide: Math.round(box.x),
                    offset: Math.round(absPos.x - box.x),
                    snap: 'start'
                },
                {
                    guide: Math.round(box.x + box.width / 2),
                    offset: Math.round(absPos.x - box.x - box.width / 2),
                    snap: 'center'
                },
                {
                    guide: Math.round(box.x + box.width),
                    offset: Math.round(absPos.x - box.x - box.width),
                    snap: 'end'
                }
            ],
            horizontal: [
                {
                    guide: Math.round(box.y),
                    offset: Math.round(absPos.y - box.y),
                    snap: 'start'
                },
                {
                    guide: Math.round(box.y + box.height / 2),
                    offset: Math.round(absPos.y - box.y - box.height / 2),
                    snap: 'center'
                },
                {
                    guide: Math.round(box.y + box.height),
                    offset: Math.round(absPos.y - box.y - box.height),
                    snap: 'end'
                }
            ]
        }
    }

    /**
     * 获取最优的对齐线引导信息。该函数会根据所有可用的舞台/节点对齐位置（lineGuideStops）
     * 与当前节点的边缘信息（itemBounds），在一定偏移阈值（gridLineOffset）内，找出最优的对齐点。
     * 
     * @param {Object[]} lineGuideStops - 由 getLineGuideStops 函数返回的可用对齐线数据
     * @param {Object} itemBounds - 由 getObjectSnappingEdges 函数返回的节点可对齐边缘信息
     * @returns {Object[]} 一个包含对齐信息的数组，每个元素包含 lineGuide、offset、orientation、snap、node 等字段
     */
    getGuides(lineGuideStops, itemBounds) {
        var resultV = []
        var resultH = []

        // 遍历可用的垂直参考线并与节点的垂直边缘比对
        lineGuideStops.vertical.forEach((lineGuide) => {
            itemBounds.vertical.forEach((itemBound) => {
                var diff = Math.abs(lineGuide.guide - itemBound.guide)
                if (diff < this.config.gridLineOffset) {
                    resultV.push({
                        lineGuide: lineGuide.guide,
                        diff: diff,
                        snap: itemBound.snap,
                        offset: itemBound.offset,
                        node: lineGuide.node
                    })
                }
            })
        })

        // 遍历可用的水平参考线并与节点的水平边缘比对
        lineGuideStops.horizontal.forEach((lineGuide) => {
            itemBounds.horizontal.forEach((itemBound) => {
                var diff = Math.abs(lineGuide.guide - itemBound.guide)
                if (diff < this.config.gridLineOffset) {
                    resultH.push({
                        lineGuide: lineGuide.guide,
                        diff: diff,
                        snap: itemBound.snap,
                        offset: itemBound.offset,
                        node: lineGuide.node
                    })
                }
            })
        })

        // 筛选出距离最小（最优）的垂直与水平对齐线
        var guides = []
        var minV = resultV.sort((a, b) => a.diff - b.diff)[0]
        var minH = resultH.sort((a, b) => a.diff - b.diff)[0]
        if (minV) {
            guides.push({
                lineGuide: minV.lineGuide,
                offset: minV.offset,
                orientation: 'V',
                snap: minV.snap,
                node: minV.node
            })
        }
        if (minH) {
            guides.push({
                lineGuide: minH.lineGuide,
                offset: minH.offset,
                orientation: 'H',
                snap: minH.snap,
                node: minH.node
            })
        }
        return guides
    }

    /**
     * 绘制对齐线。包括水平和垂直两种参考线，并在需要时调用绘制距离线。
     * 
     * @param {Object[]} guides - 对齐线数据，每一项包含 lineGuide、offset、orientation、snap、node 等信息
     * @param {Object} targetNode - 当前正在对齐的目标节点
     */
    drawGuides(guides, targetNode) {
        const layer = this.state.layers[this.state.layers.length - 1]
        // 创建一个分组来存放所有辅助线
        const guideGroup = new Konva.Group({
            name: 'guide-group'
        })

        // 绘制水平或垂直参考线
        guides.forEach((lg) => {
            let line
            if (lg.orientation === 'H') {
                line = new Konva.Line({
                    points: [-6000, 0, 6000, 0],
                    stroke: 'rgb(245, 25, 243,0.8)',
                    strokeWidth: 1,
                    name: 'guid-line'
                })
                guideGroup.add(line)
                line.absolutePosition({
                    x: 0,
                    y: lg.lineGuide
                })
            } else if (lg.orientation === 'V') {
                line = new Konva.Line({
                    points: [0, -6000, 0, 6000],
                    stroke: 'rgb(245, 25, 243,0.8)',
                    strokeWidth: 1,
                    name: 'guid-line'
                })
                guideGroup.add(line)
                line.absolutePosition({
                    x: lg.lineGuide,
                    y: 0
                })
            }
        })

        // 如果存在对齐线信息，则绘制距离线（只选第一条线信息用来计算距离）
        if (guides.length) {
            this.drawDistanceLine(targetNode, guides[0], guideGroup)
        }

        layer.add(guideGroup)
    }

    /**
     * 绘制距离线及其文本。通常在节点对齐时，显示目标节点与参考节点之间的距离。
     * 
     * 主要流程：
     * 1. 获取目标节点与对齐参考节点的外包矩形（基于舞台坐标）。
     * 2. 计算双方矩形各边中心点，并找到距离最短的一组中心点。
     * 3. 根据最近边缘中心点，绘制连接线并在中间显示距离文本。
     * 4. 适当处理线段起止位置旁边的竖线（start-vertical-line 和 end-vertical-line）用于视觉提示。
     * 5. 若距离小于一定阈值，可选择不显示（例如在对齐时距离非常短）。
     * 
     * @param {Object} targetNode - 目标节点
     * @param {Object} guide - 对齐线的信息对象，包含 orientation、node、lineGuide 等
     * @param {Object} guideGroup - 存放所有辅助线的分组
     */
    drawDistanceLine(targetNode, guide, guideGroup) {
        const layer = this.state.layers[this.state.layers.length - 1]
        // 如果没有引用的节点，则不绘制距离线
        if (!guide.node) return

        // 获取目标节点与参考节点的外包矩形（基于舞台）
        var targetRect = targetNode.getClientRect({ relativeTo: this.state.stage })
        var guideRect = guide.node.getClientRect({ relativeTo: this.state.stage })

        // 辅助函数：计算矩形四条边的中心点
        function edgeCenterPoints(rect) {
            return [
                { x: rect.x + rect.width / 2, y: rect.y, edge: 'top' },
                { x: rect.x + rect.width, y: rect.y + rect.height / 2, edge: 'right' },
                { x: rect.x + rect.width / 2, y: rect.y + rect.height, edge: 'bottom' },
                { x: rect.x, y: rect.y + rect.height / 2, edge: 'left' }
            ]
        }

        // 查找两矩形最近的一对中心点（从四条边中心点里筛选）
        var minDistance = Infinity
        var nearestPair = { point1: null, point2: null, edge: null }

        var targetEdges = edgeCenterPoints(targetRect)
        var guideEdges = edgeCenterPoints(guideRect)

        targetEdges.forEach((point1) => {
            guideEdges.forEach((point2) => {
                var distance = Math.sqrt(
                    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
                )
                if (distance < minDistance) {
                    minDistance = distance
                    nearestPair = {
                        point1: point1,
                        point2: point2,
                        edge: point1.edge
                    }
                }
            })
        })

        // 根据最近边设置一个与参考节点中心对齐的垂直/水平终点坐标
        var orthogonalEndpoint
        if (nearestPair.edge === 'top' || nearestPair.edge === 'bottom') {
            // 垂直连接线
            orthogonalEndpoint = {
                x: nearestPair.point1.x,
                y: nearestPair.point2.y
            }
        } else {
            // 水平连接线
            orthogonalEndpoint = {
                x: nearestPair.point2.x,
                y: nearestPair.point1.y
            }
        }

        // 辅助函数：调整线段起点和终点，以便留出 x 像素间隔
        function adjustPointsFor5pxDistance(point, edge, isStartPoint) {
            const distance = 2
            let adjustedPoint = { x: point.x, y: point.y }
            switch (edge) {
                case 'top':
                    adjustedPoint.y -= isStartPoint ? distance : -distance
                    break
                case 'bottom':
                    adjustedPoint.y += isStartPoint ? distance : -distance
                    break
                case 'left':
                    adjustedPoint.x -= isStartPoint ? distance : -distance
                    break
                case 'right':
                    adjustedPoint.x += isStartPoint ? distance : -distance
                    break
            }
            return adjustedPoint
        }

        // 调整线段的实际绘制起止位置
        var startPointAdjusted = adjustPointsFor5pxDistance(nearestPair.point1, nearestPair.edge, true)
        var endPointAdjusted = adjustPointsFor5pxDistance(orthogonalEndpoint, nearestPair.edge, false)

        // 绘制距离线
        var distanceLine = new Konva.Line({
            points: [startPointAdjusted.x, startPointAdjusted.y, endPointAdjusted.x, endPointAdjusted.y],
            stroke: 'rgb(245, 25, 243,0.8)',
            strokeWidth: 1,
            name: 'distance-line'
        })

        // 如果距离过小（小于偏移阈值），可以选择不显示
        var distance = Math.sqrt(
            Math.pow(nearestPair.point1.x - orthogonalEndpoint.x, 2) +
            Math.pow(nearestPair.point1.y - orthogonalEndpoint.y, 2)
        )
        if (distance <= this.config.gridLineOffset) {
            return
        }

        // 创建显示距离的圆角矩形背景
        var distanceTextBackground = new Konva.Rect({
            x: (nearestPair.point1.x + orthogonalEndpoint.x) / 2 - 14,
            y: (nearestPair.point1.y + orthogonalEndpoint.y) / 2 - 12,
            width: 8 + String(distance.toFixed(2)).length * 5, // 文本宽度根据数字位数动态调整
            height: 16,
            fill: 'rgb(245, 25, 243,0.5)',
            cornerRadius: 4,
            name: 'distance-bg'
        })

        // 在中间显示整数距离文本（取整）
        var distanceText = new Konva.Text({
            x: (nearestPair.point1.x + orthogonalEndpoint.x) / 2 - 5,
            y: (nearestPair.point1.y + orthogonalEndpoint.y) / 2 - 8,
            text: parseInt(distance),
            fontSize: 12,
            fill: '#fff',
            name: 'distance-text'
        })

        guideGroup.add(distanceLine)
        guideGroup.add(distanceTextBackground)
        guideGroup.add(distanceText)

        // 绘制起点竖线，用于视觉提示
        var startVerticalLine
        var centerX, centerY
        if (guide.orientation === 'V') {
            // 当对齐参考线为垂直时，倾斜绘制竖线
            centerX = (startPointAdjusted.x + startPointAdjusted.x + 10) / 2
            centerY = (startPointAdjusted.y + startPointAdjusted.y - 10) / 2
            startVerticalLine = new Konva.Line({
                points: [
                    startPointAdjusted.x - centerX,
                    startPointAdjusted.y - centerY,
                    startPointAdjusted.x + 10 - centerX,
                    startPointAdjusted.y - 10 - centerY
                ],
                stroke: 'rgb(245, 25, 243,0.8)',
                strokeWidth: 1,
                name: 'start-vertical-line',
                rotation: 45,
                offsetX: -(startPointAdjusted.x + 6 - centerX),
                offsetY: -(startPointAdjusted.y + 2 - centerY),
                x: centerX,
                y: centerY
            })
        } else {
            // 当对齐参考线为水平时，直接画上下的小线段
            startVerticalLine = new Konva.Line({
                points: [
                    startPointAdjusted.x,
                    startPointAdjusted.y - 10,
                    startPointAdjusted.x,
                    startPointAdjusted.y + 10
                ],
                stroke: 'rgb(245, 25, 243,0.8)',
                strokeWidth: 1,
                name: 'start-vertical-line'
            })
        }

        // 绘制终点竖线
        var endVerticalLine
        if (guide.orientation === 'V') {
            centerX = (endPointAdjusted.x + endPointAdjusted.x + 10) / 2
            centerY = (endPointAdjusted.y + endPointAdjusted.y - 10) / 2
            endVerticalLine = new Konva.Line({
                points: [
                    endPointAdjusted.x - centerX,
                    endPointAdjusted.y - centerY,
                    endPointAdjusted.x + 10 - centerX,
                    endPointAdjusted.y - 10 - centerY
                ],
                stroke: 'rgb(245, 25, 243,0.8)',
                strokeWidth: 1,
                name: 'end-vertical-line',
                rotation: 45,
                offsetX: -(endPointAdjusted.x + 6 - centerX),
                offsetY: -(endPointAdjusted.y + 2 - centerY),
                x: centerX,
                y: centerY
            })
        } else {
            endVerticalLine = new Konva.Line({
                points: [
                    endPointAdjusted.x,
                    endPointAdjusted.y - 10,
                    endPointAdjusted.x,
                    endPointAdjusted.y + 10
                ],
                stroke: 'rgb(245, 25, 243,0.8)',
                strokeWidth: 1,
                name: 'end-vertical-line'
            })
        }

        guideGroup.add(startVerticalLine)
        guideGroup.add(endVerticalLine)
    }
}
