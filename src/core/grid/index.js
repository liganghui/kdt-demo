/**
 * @module GridDrawer
 * @name 网格
 * @description  用于在 Konva.js 舞台上绘制和管理网格线
 */

export default class GridDrawer {
  constructor(state, stateManage, config) {
    this.config = config
    this.stateManage = stateManage
    this.state = state
  }

  /**
   * 移除之前绘制的网格线。
   * 该方法会清除当前舞台上所有以 `kd_grid_x_line` 和 `kd_grid_y_line` 命名的网格线。
   */
  removeGridLines() {
    if (this.state.layers && this.state.layers.length > 0) {
      const gridLayer = this.state.layers[0]
      gridLayer.find('.kd_grid_x_line').forEach((line) => line.destroy())
      gridLayer.find('.kd_grid_y_line').forEach((line) => line.destroy())
      gridLayer.batchDraw()
    }
  }
  /**
   * 在舞台上绘制网格线。
   * 网格线的颜色和大小可以通过参数指定，默认使用配置中的颜色和宽度。
   * @param {string} [color=this.config.gridColor] - 网格线的颜色
   * @param {number} [size=this.config.gridWidth] - 网格线的间距大小
   */
  drawLinesSolution(color = this.config.gridColor, size = this.config.gridWidth) {
    if (!this.state.layers || this.state.layers.length < 1) {
      return
    }
    // 移除之前的网格线
    this.removeGridLines()
    const gridLayer = this.state.layers[0]
    const stepSize = size
    const stageWidth = this.state.stage.width()
    const stageHeight = this.state.stage.height()
    // 获取画布的实际尺寸和偏移量
    const offsetX = this.state.stage.x() - this.state.stage.position().x
    const offsetY = this.state.stage.y() - this.state.stage.position().y
    const startX = Math.floor(offsetX / stepSize) * stepSize
    const startY = Math.floor(offsetY / stepSize) * stepSize
    const endX = startX + stageWidth - stepSize
    const endY = startY + stageHeight - stepSize
    const xSteps = Math.ceil((endX - startX) / stepSize)
    const ySteps = Math.ceil((endY - startY) / stepSize)
    // 绘制垂直网格线
    for (let i = 0; i <= xSteps; i++) {
      const x = startX + i * stepSize
      const line = new Konva.Line({
        points: [x - offsetX, 0, x - offsetX, stageHeight],
        stroke: color,
        strokeWidth: 1,
        name: 'kd_grid_x_line'
      })
      gridLayer.add(line)
      line.moveToTop()
    }
    // 绘制水平网格线
    for (let i = 0; i <= ySteps; i++) {
      const y = startY + i * stepSize
      const line = new Konva.Line({
        points: [0, y - offsetY, stageWidth, y - offsetY],
        stroke: color,
        strokeWidth: 1,
        name: 'kd_grid_y_line'
      })
      gridLayer.add(line)
      line.moveToTop()
    }

    gridLayer.batchDraw()
  }
   /**
   * 显示网格线。
   */
  showGrid() {
    const gridLayer =  this.state.layers[0]
    gridLayer.find('.kd_grid_x_line').forEach((line) => line.show())
    gridLayer.find('.kd_grid_y_line').forEach((line) => line.show())
    gridLayer.batchDraw()
  }

  /**
   * 隐藏网格线。
   */
  hideGrid() {
    const gridLayer = this.state.layers[0]
    gridLayer.find('.kd_grid_x_line').forEach((line) => line.hide())
    gridLayer.find('.kd_grid_y_line').forEach((line) => line.hide())
    gridLayer.batchDraw()
  }
}
