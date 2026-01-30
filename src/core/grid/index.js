/**
 * @module GridDrawer
 * @name Grid
 * @description  Used to Konva.js Draw and manage grid lines on the stage
 */

export default class GridDrawer {
  constructor(state, stateManage, config) {
    this.config = config
    this.stateManage = stateManage
    this.state = state
  }

  /**
   * Remove previously drawn grid lines。
   * This method will clear all on the current stage that start with `kd_grid_x_line` and `kd_grid_y_line` named grid lines。
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
   * Draw grid lines on the stage。
   * The color and size of grid lines can be specified through parameters，By default, the color and width from the configuration are used。
   * @param {string} [color=this.config.gridColor] - The color of grid lines
   * @param {number} [size=this.config.gridWidth] - The spacing size of grid lines
   */
  drawLinesSolution(color = this.config.gridColor, size = this.config.gridWidth) {
    if (!this.state.layers || this.state.layers.length < 1) {
      return
    }
    // Remove previous grid lines
    this.removeGridLines()
    const gridLayer = this.state.layers[0]
    const stepSize = size
    const stageWidth = this.state.stage.width()
    const stageHeight = this.state.stage.height()
    // Get the actual size and offset of the canvas
    const offsetX = this.state.stage.x() - this.state.stage.position().x
    const offsetY = this.state.stage.y() - this.state.stage.position().y
    const startX = Math.floor(offsetX / stepSize) * stepSize
    const startY = Math.floor(offsetY / stepSize) * stepSize
    const endX = startX + stageWidth - stepSize
    const endY = startY + stageHeight - stepSize
    const xSteps = Math.ceil((endX - startX) / stepSize)
    const ySteps = Math.ceil((endY - startY) / stepSize)
    // Draw vertical grid lines
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
    // Draw horizontal grid lines
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
   * Show grid lines。
   */
  showGrid() {
    const gridLayer =  this.state.layers[0]
    gridLayer.find('.kd_grid_x_line').forEach((line) => line.show())
    gridLayer.find('.kd_grid_y_line').forEach((line) => line.show())
    gridLayer.batchDraw()
  }

  /**
   * Hide grid lines。
   */
  hideGrid() {
    const gridLayer = this.state.layers[0]
    gridLayer.find('.kd_grid_x_line').forEach((line) => line.hide())
    gridLayer.find('.kd_grid_y_line').forEach((line) => line.hide())
    gridLayer.batchDraw()
  }
}
