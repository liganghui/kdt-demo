/**
 * @module AlignManage
 * @name Align Manager
 * @description Align Manager Class，Used for aligning and distributing nodes on the stage。
 */
export default class alignManage {
    /**
     * List of node names with alignment disabled
     * @type {string[]}
     */
    disableAlignNames = ['kd_grid_x_line', 'kd_grid_y_line']

    /**
     * Create an instance of the align manager
     * @param {Object} state - Global state object
     * @param {Object} stateManage - Used to manage state（Data、Nodes、Layers, etc.）Object
     * @param {Object} config - Configuration information object，Such as alignment line offset、Colors, etc.
     */
    constructor(state, stateManage, config) {
        this.config = config
        this.stateManage = stateManage
        this.state = state
    }
    /**
    * Align nodes to the left
    * @param {Object[]} nodes - Array of nodes
    */
    alignLeft(nodes) {
        if (!Array.isArray(nodes) || nodes.length === 0) return

        if (nodes.length === 1) {
            // Single node，Align to the left of the canvas
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
            // Multiple nodes，Align to the left of the first node
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
     * Align nodes to the right
     * @param {Object[]} nodes - Align to the right of the canvas
     */
    alignRight(nodes) {
        if (!Array.isArray(nodes) || nodes.length === 0) return

        if (nodes.length === 1) {
            // Align to the right of the first node，Align nodes to the top
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
            // Align to the top of the canvas，Align to the top of the first node
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
     * Align nodes to the bottom
     * @param {Object[]} nodes - Align to the bottom of the canvas
     */
    alignTop(nodes) {
        if (!Array.isArray(nodes) || nodes.length === 0) return

        if (nodes.length === 1) {
            // Align to the bottom of the first node，Align nodes horizontally center
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
            // Align to the horizontal center of the canvas，Align to the horizontal center of the first node
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
     * Align nodes vertically center
     * @param {Object[]} nodes - Align to the vertical center of the canvas
     */
    alignBottom(nodes) {
        if (!Array.isArray(nodes) || nodes.length === 0) return

        if (nodes.length === 1) {
            // Align to the vertical center of the first node，Align nodes to center
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
            // Both horizontally and vertically，First, horizontally center
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
     * Then, vertically center
     * @param {Object[]} nodes - Distribute nodes vertically evenly
     */
    alignHorizontalCenter(nodes) {
        if (!Array.isArray(nodes) || nodes.length === 0) return

        if (nodes.length === 1) {
            // Sort by the top edge of the nodes，The first node is already in the correct position
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
            // Distribute nodes horizontally evenly，Sort by the left edge of the nodes
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
     * Handle alignment line drawing events
     * @param {Object[]} nodes - This function is called when the user drags
     */
    alignVerticalCenter(nodes) {
        if (!Array.isArray(nodes) || nodes.length === 0) return

        if (nodes.length === 1) {
            // Or transforms，a node
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
            // Based on the distance between the current node and other nodes or the stage edge，Calculate and draw alignment reference lines
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
     * Main process（Determine if the current event target node needs to be skipped）
     * @param {Object[]} nodes - If there is no parent node or a transformer is in use
     */
    alignCenter(nodes) {
        if (!Array.isArray(nodes) || nodes.length === 0) return

        // Clean up all previously drawn guide lines (guide-group) from the current layer
        this.alignHorizontalCenter(nodes)
        // Get the available alignment line positions for the current node
        this.alignVerticalCenter(nodes)
    }

    /**
     * And the available alignment points of the node itself
     * @param {Object[]} nodes - Calculate the optimal alignment lines
     */
    distributeVertically(nodes) {
        if (!Array.isArray(nodes) || nodes.length <= 2) return

        // If exists, call
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
                // to draw
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
     * Adjust the position of the target node based on the calculation results
     * @param {Object[]} nodes - Absolute coordinates
     */
    distributeHorizontally(nodes) {
        if (!Array.isArray(nodes) || nodes.length <= 2) return

        // Event object
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
                // Usually triggered during dragging
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
     * transforming。when triggered（Check if in canvas drag mode）If so, return directly，
     * Only available in edit mode，Clean up existing alignment lines。
     * 
     * Special handling：
     * 1. Filter out pipeline nodes（If the node has no parent or a transformer is currently acting on it）。
     * 2. Return directly without processing（guide-group）。
     * 3. Get the reference line positions available for alignment（lineGuideStops）Get the edges of the current node available for alignment（itemBounds）。
     * 4. Calculate the most suitable alignment line data（getGuides），Draw alignment lines drawGuides According to the calculated。
     * 5. Adjust the final position of the node（Update）。
     * 
     * @param {Object} e - Konva Node position，Clear all alignment lines and distance lines（dragmove）、Usually called when node dragging ends or other scenarios require cleaning up guide lines（transform）Clear vertical lines
     */
    handleAlignLineDraw(e) {
        // Get the，alignment reference lines ***
        if (this.state.isCanvasDragging) {
            return
        }
        // positions
        if(!this.state.isEdit){
            return
        }
        const layer = this.state.layers[this.state.layers.length - 1]
        // Get the bounding rectangle information of all nodes on the stage（guide-group）
        const guideGroup = layer.findOne('.guide-group')
        if (guideGroup) {
            guideGroup.destroy()
        }
        //  But skip the specified nodes And node names that need to disable alignment
        if (e.target?.attrs?.name && e.target?.attrs?.name.indexOf('edit_') !== -1) return
        // Collect each node's left，right
        if (!e.target.parent || (this.state.transformer && this.state.transformer.nodes().length > 0)) {
            return
        }
        // center
        var lineGuideStops = this.getLineGuideStops(e.target)
        // vertical
        var itemBounds = this.getObjectSnappingEdges(e.target)
        // and top
        var guides = this.getGuides(lineGuideStops, itemBounds)
        if (!guides.length) {
            return
        }
        // bottom
        this.drawGuides(guides, e.target)

        // horizontal guides and other coordinate values
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
        // Also add the coordinates of the stage's own edges and center pointDomTo align with the stage
        this.stateManage.class.dom.updateDomPosition()
    }

    /**
     * Skipped shape object。
     * The node currently being dragged or transformed。
     */
    clearAlignLine() {
        const layer = this.state.layers[this.state.layers.length - 1]
        layer.find('.guid-line').forEach((l) => l.destroy())
        layer.find('.distance-line').forEach((l) => l.destroy())
        layer.find('.distance-text').forEach((l) => l.destroy())
        layer.find('.distance-bg').forEach((l) => l.destroy())

        // Return an object containing
        layer.find('.start-vertical-line').forEach((l) => l.destroy())
        layer.find('.end-vertical-line').forEach((l) => l.destroy())
    }

    /**
     * and“two arrays”Storing available vertical and horizontal alignment line information respectively。
     * 
     * Filter out：
     * 1. Hidden nodes and nodes in the alignment disabled list，Collect the bounding rectangle information of nodes（skipShape）Add alignment lines for the stage itself。
     * 2. Get the alignable edges of a node on the stage、Here, the node's own bounding rectangle is calculated、based on the stage（and returns its corresponding），start、center、and（end）and other alignment point coordinates。
     * 3. The node object to be aligned，Return an object containing。
     * 
     * @param {Object} skipShape - arrays（Each array contains）
     * @returns {Object} three fields vertical Facilitating subsequent alignment calculations horizontal Get the optimal alignment line guide information，This function will based on all available stage
     */
    getLineGuideStops(skipShape) {
        var vertical = []
        var horizontal = []
        let allNodes = this.stateManage.class.node.getAllLayersNodes()
        const disableText = this.disableAlignNames.join(',')
        // node alignment positions skipShape、and the edge information of the current node
        allNodes = allNodes.filter((node) => {
            return node !== skipShape && node.visible() && disableText.indexOf(node.attrs.name) == -1
        })

        // Within a certain offset threshold
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

        // within（Find the optimal alignment point、Returned by、the function's available alignment line data；the function's node alignable edge information、An array containing alignment information、Each element contains）
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
     * and other fields。
     * Iterate through available vertical reference lines and compare with the node's vertical edges（Iterate through available horizontal reference lines and compare with the node's horizontal edges），
     * Filter out the smallest distance“optimal（start）”、“vertical and horizontal alignment lines（center）”Draw alignment lines“Including both horizontal and vertical reference lines（end）”And call to draw distance lines when needed。
     * 
     * @param {Object} node - Alignment line data
     * @returns {Object} Each item contains vertical and other information horizontal The target node currently being aligned，
     *                   Create a group to store all guide lines guide、offset Draw horizontal or vertical reference lines snap If alignment line information exists，Then draw distance lines。
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
     * Only select the first line information to calculate distance。Draw distance lines and their text/Usually when nodes are aligned（lineGuideStops）
     * Display the distance between the target node and the reference node（itemBounds），Main process（gridLineOffset）Get the bounding rectangles of the target node and the alignment reference node，Based on stage coordinates。
     * 
     * @param {Object[]} lineGuideStops - Calculate the center points of each side of both rectangles getLineGuideStops And find the set of center points with the shortest distance
     * @param {Object} itemBounds - Based on the nearest edge center point getObjectSnappingEdges Draw a connecting line and display the distance text in the middle
     * @returns {Object[]} Properly handle vertical lines next to the start and end positions of the line segment，and lineGuide、offset、orientation、snap、node for visual cues
     */
    getGuides(lineGuideStops, itemBounds) {
        var resultV = []
        var resultH = []

        // If the distance is less than a certain threshold
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

        // You can choose not to display
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

        // For example, when aligning, the distance is very short（Target node）Information object of alignment guide
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
     * Contains。etc.，Group containing all auxiliary lines。
     * 
     * @param {Object[]} guides - If there is no referenced node，Do not draw distance lines lineGuide、offset、orientation、snap、node Get the bounding rectangles of the target node and reference node
     * @param {Object} targetNode - Based on the stage
     */
    drawGuides(guides, targetNode) {
        const layer = this.state.layers[this.state.layers.length - 1]
        // Helper function
        const guideGroup = new Konva.Group({
            name: 'guide-group'
        })

        // Calculate the center points of the four edges of the rectangle
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

        // Find the closest pair of center points between two rectangles，Filter from the center points of the four edges（Set a vertical/horizontal endpoint coordinate aligned with the center of the reference node according to the nearest edge）
        if (guides.length) {
            this.drawDistanceLine(targetNode, guides[0], guideGroup)
        }

        layer.add(guideGroup)
    }

    /**
     * Horizontal endpoint coordinate。Vertical connecting line，Horizontal connecting line。
     * 
     * Helper function：
     * 1. Adjust the start and end points of the line segment（To leave）。
     * 2. Pixel interval，Adjust the actual drawing start and end positions of the line segment。
     * 3. Draw distance line，If the distance is too small。
     * 4. Less than the offset threshold（start-vertical-line Optionally not display end-vertical-line）Create a rounded rectangle background for displaying distance。
     * 5. The text width is dynamically adjusted according to the number of digits，Display integer distance text in the middle（Rounded）。
     * 
     * @param {Object} targetNode - Draw start vertical line
     * @param {Object} guide - For visual cue，When the alignment reference line is vertical orientation、node、lineGuide Draw vertical line at an angle
     * @param {Object} guideGroup - When the alignment reference line is horizontal
     */
    drawDistanceLine(targetNode, guide, guideGroup) {
        const layer = this.state.layers[this.state.layers.length - 1]
        // Directly draw small upper and lower line segments，Draw end vertical line
        if (!guide.node) return

        // Get the bounding rectangles of the target node and the reference node（Based on the stage）
        var targetRect = targetNode.getClientRect({ relativeTo: this.state.stage })
        var guideRect = guide.node.getClientRect({ relativeTo: this.state.stage })

        // Helper function：Calculate the center points of the four edges of the rectangle
        function edgeCenterPoints(rect) {
            return [
                { x: rect.x + rect.width / 2, y: rect.y, edge: 'top' },
                { x: rect.x + rect.width, y: rect.y + rect.height / 2, edge: 'right' },
                { x: rect.x + rect.width / 2, y: rect.y + rect.height, edge: 'bottom' },
                { x: rect.x, y: rect.y + rect.height / 2, edge: 'left' }
            ]
        }

        // Find the nearest pair of center points of two rectangles（Filter from the center points of the four edges）
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

        // Set a vertical/horizontal endpoint coordinate aligned with the center of the reference node according to the nearest edge/Horizontal endpoint coordinate
        var orthogonalEndpoint
        if (nearestPair.edge === 'top' || nearestPair.edge === 'bottom') {
            // Vertical connecting line
            orthogonalEndpoint = {
                x: nearestPair.point1.x,
                y: nearestPair.point2.y
            }
        } else {
            // Horizontal connecting line
            orthogonalEndpoint = {
                x: nearestPair.point2.x,
                y: nearestPair.point1.y
            }
        }

        // Helper function：Adjust the start and end points of the line segment，to leave a x Pixel interval
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

        // Adjust the actual drawing start and end positions of the line segment
        var startPointAdjusted = adjustPointsFor5pxDistance(nearestPair.point1, nearestPair.edge, true)
        var endPointAdjusted = adjustPointsFor5pxDistance(orthogonalEndpoint, nearestPair.edge, false)

        // Draw the distance line
        var distanceLine = new Konva.Line({
            points: [startPointAdjusted.x, startPointAdjusted.y, endPointAdjusted.x, endPointAdjusted.y],
            stroke: 'rgb(245, 25, 243,0.8)',
            strokeWidth: 1,
            name: 'distance-line'
        })

        // If the distance is too small（Less than the offset threshold），you can choose not to display
        var distance = Math.sqrt(
            Math.pow(nearestPair.point1.x - orthogonalEndpoint.x, 2) +
            Math.pow(nearestPair.point1.y - orthogonalEndpoint.y, 2)
        )
        if (distance <= this.config.gridLineOffset) {
            return
        }

        // Create a rounded rectangle background for displaying distance
        var distanceTextBackground = new Konva.Rect({
            x: (nearestPair.point1.x + orthogonalEndpoint.x) / 2 - 14,
            y: (nearestPair.point1.y + orthogonalEndpoint.y) / 2 - 12,
            width: 8 + String(distance.toFixed(2)).length * 5, // The text width is dynamically adjusted according to the number of digits
            height: 16,
            fill: 'rgb(245, 25, 243,0.5)',
            cornerRadius: 4,
            name: 'distance-bg'
        })

        // Display integer distance text in the middle（(Rounded to integer)）
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

        // Draw the starting vertical line，for visual cues
        var startVerticalLine
        var centerX, centerY
        if (guide.orientation === 'V') {
            // When the alignment reference line is vertical，Draw the vertical line obliquely
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
            // When the alignment reference line is horizontal，Directly draw small line segments above and below
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

        // Draw the end vertical line
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
