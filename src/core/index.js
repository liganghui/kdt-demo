/**
 * @overview
 * @classdesc
 * # KDT 库
 *
 * KDT 是一个基于Konvajs，用于画布上实现DOM和Canvas节点共同交互管理的类库。类库内同时集成封装了画布、图层、事件、网格等功能。
 *
 * ## 特性模块
 * - **画布管理**：轻松创建和管理画布的相关操作。
 * - **图层处理**：管理多个图层，支持图层的添加、删除和排序。
 * - **事件管理**：方便的事件订阅和取消机制。
 * - **网格系统**：支持网格线的绘制和自定义。
 * - **DOM 操作**：与 DOM 元素的集成和操作。
 * - **对齐工具**：提供多种对齐和分布选项。
 * - **快捷键支持**：内置热键管理，提升开发效率。
 * - **节点管理**：方便的节点添加、复制、剪切、粘贴和删除操作。
 * - **状态管理**：集中管理模块之间状态同步共享，确保数据一致性。
 * - **历史跟踪**：支持撤销和重做操作，提升用户体验。
 *
 * ## 快速入门
 * 要开始使用 KDT，只需实例化 `KDT` 类并传入Konva画布对象和可选的配置参数。
 *
 * ```javascript
 * import KDT from 'path-to-kdt';
 *
 * const stage = new Stage(); // 假设你有一个 Stage 类
 * const config = { mode: 'edit', color: 'blue' };
 * const kdt = new KDT(stage, config);
 * ```
 */
import StageManage from './stage/index'
import LayerManage from './layer/index'
import EventManage from './event/index'
import GridManage from './grid/index'
import DomManage from './dom/index'
import AlignManage from './align/index'
import HotKeyManage from './hotkey/index'
import NodeManage from './node/index'
import StateManage from './state/index'
import ModulesManage from './modules/index'
import HistoryManage from './history/index'
import transformerManage from './transformer/index'
import GroupManager from './group/index'

/**
 * @typedef {Object} Config
 * @property {string} [mode='edit'] - 模式，可以是 'edit'（编辑模式）或 'preview'（预览模式）。
 * @property {string} [color='red'] - 默认颜色。
 * @property {boolean} [grid=true] - 是否显示网格。
 * @property {number} [gridLineOffset=10] - 网格线偏移量。
 * @property {number} [gridSize=20] - 网格大小。
 * @property {boolean} [dev=true] - 开发模式开关。
 * @property {Array<string>} [layerNames=['background', 'bottom', 'middle', 'top', 'animation']] - 图层名称列表。
 */

/**
 * 这是 KDT 类的入口模块，用于接收初始化参数并导出各个模块方法。
 * @class
 * @name KDT
 * @param {Object} stage - 舞台对象。
 * @param {Config} [config={}] - 用户自定义的配置参数，默认为 {@link Config}。
 * @constructor
 */
export default class KDT {
  /**
   * 默认配置参数
   * @type {Config}
   */
  defaultConfig = {
    mode: 'edit', // 默认是 'edit'（编辑模式），可设置为 'preview'（预览模式）
    color: 'red',
    grid: true,
    gridLineOffset: 10,
    gridSize: 20,
    dev: true,
    allowMobileRotation: true, // 移动端是否允许旋转配置
    layerNames: ['background', 'bottom', 'middle', 'top', 'animation'],
    // 移动图层性能优化节点属性限制 
    tempLayerNodeLimit:12,
    // 变换框缓存节点启用数量限制
    cacheEnableCount:12,
     // 启用拖拽优化的节点数量阈值
    dragOptimizationThreshold: 50,
  }

  initState = {
    isEdit: true,
    // 画布对象
    stage: null,
    // 初始化变量默认值
    transformer: null,
    // 图层集合
    layers: [],
    // 事件监听集合对象
    listeners: [],
    // 选取的节点
    selectedNodes: [],
    // 剪切板数据
    clipBoard: [],
    // 编辑状态标识
    isEdit: true,
    // 历史记录
    history: [],
    // 是否禁用添加的节点 变换框自动选中
    disableAutoAddTransformer: false
  }

  state = null
  constructor(stage, config = {}) {
    this.config = { ...this.defaultConfig, ...config }
    this.stateManage = new StateManage(this.initState)
    this.state = this.stateManage.state
    // 根据 config.mode 判断是否是编辑模式
    this.state.isEdit = this.config.mode === 'edit'
    this.state.stage = stage // 设定舞台实例
    this.state.config = this.config // 配置参数
    // 初始化各种子模块 并传入参数
    this.stateManage.class.layer = new LayerManage(this.state, this.stateManage, this.config)
    this.stateManage.class.event = new EventManage(this.state, this.stateManage, this.config)
    this.stateManage.class.grid = new GridManage(this.state, this.stateManage, this.config)
    this.stateManage.class.dom = new DomManage(this.state, this.stateManage, this.config)
    this.stateManage.class.align = new AlignManage(this.state, this.stateManage, this.config)
    this.stateManage.class.hotkey = new HotKeyManage(this.state, this.stateManage, this.config)
    this.stateManage.class.node = new NodeManage(this.state, this.stateManage, this.config)
    this.stateManage.class.modules = new ModulesManage(this.state, this.stateManage, this.config)
    this.stateManage.class.history = new HistoryManage(this.state, this.stateManage, this.config)
    this.stateManage.class.group = new GroupManager(this.state, this.stateManage, this.config)
    this.stateManage.class.transformer = new transformerManage(
      this.state,
      this.stateManage,
      this.config
    )
    // 先绑定其他class  最后绑定画布对象
    this.stateManage.class.stage = new StageManage(this.state, this.stateManage, this.config)
  }

  /**
   * 订阅事件
   * @param {string} eventType - 事件类型
   * @param {Function} callback - 回调函数
   */
  on(eventType, callback) {
    this.stateManage.class.event.on(eventType, callback)
  }

  /**
   * 取消订阅事件
   * @param {string} eventType - 事件类型
   * @param {Function} callback - 回调函数
   */
  off(eventType, callback) {
    this.stateManage.class.event.off(eventType, callback)
  }
  /**
   * 触发自定义事件
   *
   * @param  {string} eventType - 事件类型
   * @param  {any} data - 事件数据
   *
   */
  trigger(eventType, data) {
    this.stateManage.class.event.trigger(eventType, data)
  }
  /**
   * 添加节点到指定图层
   * @param {Object} event - 事件对象，包含节点数据
   * @param {Object} layer - 图层对象
   */
  addNode(event, layer) {
    this.stateManage.class.node.addNode(event, layer)
  }

  /**
   * 复制选中的节点
   * @param {Object[]} nodes - 选中的节点数组
   */
  copyNodes(nodes) {
    this.stateManage.class.node.copyNodes(nodes)
  }

  /**
   * 剪切选中的节点
   * @param {Object[]} nodes - 选中的节点数组
   */
  cutNodes(nodes) {
    this.stateManage.class.node.cutNodes(nodes)
  }

  /**
   * 粘贴剪贴板中的节点到舞台
   * @param {Object[]} nodes - 节点数组
   */
  pasteNodes(nodes) {
    this.stateManage.class.node.pasteNodes(nodes)
  }

  /**
   * 删除选中的节点
   * @param {Object[]} nodes - 要删除的节点数组
   */
  deleteNodes(nodes) {
    this.stateManage.class.node.deleteNodes(nodes)
  }

  /**
   * 将选中的节点移动到图层底部
   * @param {Object[]} nodes - 选中的节点数组
   */
  moveToBottom(nodes) {
    this.stateManage.class.layer.moveToBottom(nodes)
  }

  /**
   * 将选中的节点移动到图层顶部
   * @param {Object[]} nodes - 选中的节点数组
   */
  moveToTop(nodes) {
    this.stateManage.class.layer.moveToTop(nodes)
  }

  /**
   * 将选中的节点向上移动一层
   * @param {Object[]} nodes - 选中的节点数组
   */
  moveUp(nodes) {
    this.stateManage.class.layer.moveUp(nodes)
  }

  /**
   * 将选中的节点向下移动一层
   * @param {Object[]} nodes - 选中的节点数组
   */
  moveDown(nodes) {
    this.stateManage.class.layer.moveDown(nodes)
  }

  /**
   * 将选中的节点组合成一个组
   * @param {Object[]} nodes - 选中的节点数组
   */
  groupNodes(nodes) {
    this.stateManage.class.node.groupNodes(nodes)
  }

  /**
   * 将选中的组解散为独立节点
   * @param {Object[]} nodes - 选中的节点数组
   */
  ungroupNodes(nodes) {
    this.stateManage.class.node.ungroupNodes(nodes)
  }

  /**
   * 锁定选中的节点
   * @param {Object[]} nodes - 要锁定的节点数组
   */
  lockNodes(nodes) {
    this.stateManage.class.node.lockNodes(nodes)
  }

  /**
   * 解锁选中的节点
   * @param {Object[]} nodes - 要解锁的节点数组
   */
  unlockNodes(nodes) {
    this.stateManage.class.node.unlockNodes(nodes)
  }

  /**
   * 隐藏选中的节点
   * @param {Object[]} nodes - 要隐藏的节点数组
   * @param {number} [duration=0] - 动画持续时间，单位为毫秒
   */
  hideNodes(nodes, duration = 0) {
    this.stateManage.class.node.hideNodes(nodes, duration)
  }

  /**
   * 显示选中的节点
   * @param {Object[]} nodes - 要显示的节点数组
   * @param {number} [duration=0] - 动画持续时间，单位为毫秒
   */
  showNodes(nodes, duration = 0) {
    this.stateManage.class.node.showNodes(nodes, duration)
  }

  /**
   * 切换指定节点的显示状态。
   * @param {Object[]} nodes - 要切换显示状态的节点数组
   * @param {number} [duration=0] - 动画持续时间，单位为毫秒
   */
  toggleNodes(nodes, duration = 0) {
    this.stateManage.class.node.toggleNodes(nodes, duration)
  }

  /**
   * 获取剪贴板中的数据
   * @returns {Object[]} - 返回剪贴板中的节点数据
   */
  getClipBoardData() {
    return this.state.clipBoard
  }

  /**
   * 获取所有图层中的所有节点
   * @returns {Object[]} - 返回所有符合条件的节点数组
   */
  getAllLayersNodes() {
    return this.stateManage.class.node.getAllLayersNodes()
  }

  /**
   * 添加节点到变换框
   * @param {Object} node - 要添加到变换框的节点
   * @returns {Object} - 变换器对象
   */
  addNodeTransformer(node) {
    return this.stateManage.class.transformer.addNodeTransformer(node)
  }

  /**
   * 添加多个节点到变换框
   * @param {Object[]} nodes - 要添加到变换框的节点数组
   * @returns {Object[]} - 变换器对象数组
   */
  addNodesTransformer(nodes) {
    return this.stateManage.class.transformer.addNodesTransformer(nodes)
  }

  /**
   * 从变换框中移除节点
   * @param {Object} node - 要移除的节点
   * @returns {boolean} - 是否成功移除
   */
  removeNodeTransformer(node) {
    return this.stateManage.class.transformer.removeNodeTransformer(node)
  }

  /**
   * 重置变换框的节点
   * @param {Object[]} nodes - 要重置的节点数组
   * @returns {Object[]} - 重置后的变换器节点数组
   */
  resetTransformer(nodes) {
    return this.stateManage.class.transformer.resetTransformer(nodes)
  }

  /**
   * 更新选中的节点的属性
   * @param {Object[]} nodes - 要更新的节点数组
   * @param {Object} attrs - 要设置的新属性
   */
  updateNodeAttrs(nodes, attrs) {
    return this.stateManage.class.node.updateNodeAttrs(nodes, attrs)
  }

  /**
   * 获取舞台的缩放比例
   * @returns {Object} - 舞台的缩放比例，包含 x 和 y
   */
  getStageScale() {
    return this.state.stage.scale()
  }

  /**
   * 设置舞台的缩放比例
   * @param {number} scale - 要设置的缩放比例
   * @param {boolean} [animate=false] - 是否应用动画
   */
  setStageScale(scale, animate) {
    return this.stateManage.class.stage.setStageScale(scale, animate)
  }

  /**
   * 自动缩放舞台，使其适应指定窗口大小，并根据缩放类型进行调整
   * @param {number} windowWidth - 窗口宽度
   * @param {number} windowHeight - 窗口高度
   * @param {string} scaleType - 缩放类型，可选值为 'fill'（铺满画布）、'fitWidth'（宽度铺满）、'fitHeight'（高度铺满）
   * @param {boolean} [isMargin=false] - 是否应用边距，当为 true 时，计算出的缩放比例将减去 0.03
   * @param {boolean} [IsAnimate=true] - 是否应用过度动画
   * @returns {Object} - 包含 x 轴和 y 轴的缩放比例
   */
  autoStageScale(windowWidth, windowHeight, scaleType, isMargin, IsAnimate, fn) {
    this.stateManage.class.stage.autoStageScale(
      windowWidth,
      windowHeight,
      scaleType,
      isMargin,
      IsAnimate,
      fn
    )
  }

  /**
   * 移除舞台的背景颜色
   */
  removeBackgroundColor() {
    this.stateManage.class.stage.removeBackgroundColor()
  }

  /**
   * 设置舞台的背景颜色
   * @param {string} color - 要设置的背景颜色
   */
  setBackgroundColor(color) {
    this.stateManage.class.stage.setBackgroundColor(color)
  }

  /**
   * 移除舞台的背景图片
   */
  removeBackgroundImage() {
    this.stateManage.class.stage.removeBackgroundImage()
  }

  /**
   * 设置舞台的背景图片
   * @param {object} config - 包含url
   */
  setBackgroundImage(config) {
    this.stateManage.class.stage.setBackgroundImage(config)
  }

  /**
   * 绘制网格线
   * @param {string} color - 网格线的颜色
   * @param {number} size - 网格线的大小
   */
  drawLinesSolution(color, size) {
    this.stateManage.class.grid.drawLinesSolution(color, size)
  }

  /**
   * 移除网格线
   */
  removeGridLines() {
    this.stateManage.class.grid.removeGridLines()
  }
  /**
   * 显示网格线
   */
  showGrid(){
    this.stateManage.class.grid.showGrid()
  }
  /**
   * 隐藏网格线
   */
  hideGrid(){
    this.stateManage.class.grid.hideGrid()
  }
  /**
   * 左对齐选中的节点
   * @param {Object[]} nodes - 选中的节点数组
   */
  alignLeft(nodes) {
    this.stateManage.class.align.alignLeft(nodes)
  }

  /**
   * 右对齐选中的节点
   * @param {Object[]} nodes - 选中的节点数组
   */
  alignRight(nodes) {
    this.stateManage.class.align.alignRight(nodes)
  }

  /**
   * 顶部对齐选中的节点
   * @param {Object[]} nodes - 选中的节点数组
   */
  alignTop(nodes) {
    this.stateManage.class.align.alignTop(nodes)
  }

  /**
   * 底部对齐选中的节点
   * @param {Object[]} nodes - 选中的节点数组
   */
  alignBottom(nodes) {
    this.stateManage.class.align.alignBottom(nodes)
  }

  /**
   * 水平居中选中的节点
   * @param {Object[]} nodes - 选中的节点数组
   */
  alignCenter(nodes) {
    this.stateManage.class.align.alignCenter(nodes)
  }

  /**
   * 垂直居中选中的节点
   * @param {Object[]} nodes - 选中的节点数组
   */
  alignHorizontalCenter(nodes) {
    this.stateManage.class.align.alignHorizontalCenter(nodes)
  }

  /**
   * 水平分布选中的节点
   * @param {Object[]} nodes - 选中的节点数组
   */
  alignVerticalCenter(nodes) {
    this.stateManage.class.align.alignVerticalCenter(nodes)
  }

  /**
   * 垂直分布选中的节点
   * @param {Object[]} nodes - 选中的节点数组
   */
  distributeVertically(nodes) {
    this.stateManage.class.align.distributeVertically(nodes)
  }

  /**
   * 水平分布选中的节点
   * @param {Object[]} nodes - 选中的节点数组
   */
  distributeHorizontally(nodes) {
    this.stateManage.class.align.distributeHorizontally(nodes)
  }

  /**
   * 设置节点的高度
   * @param {Object[]} nodes - 要设置高度的节点数组
   * @param {number} height - 要设置的新高度
   */
  setNodeHeight(nodes, height) {
    this.stateManage.class.node.setNodeHeight(nodes, height)
  }

  /**
   * 设置节点的宽度
   * @param {Object[]} nodes - 要设置宽度的节点数组
   * @param {number} width - 要设置的新宽度
   */
  setNodeWidth(nodes, width) {
    this.stateManage.class.node.setNodeWidth(nodes, width)
  }

  /**
   * 强制更新节点的状态
   */
  forceUpdate() {
    this.stateManage.class.node.forceUpdate()
  }

  /**
   * 更新指定节点的数据
   * @param {string} id - 节点的 ID
   * @param {any} data - 要更新的数据
   */
  updateNodeData(obj) {
    this.stateManage.class.node.updateNodeData(obj)
  }
  /**
   * 根据节点 ID 获取节点
   * @param {string} id - 节点的 ID
   * @returns {Object|undefined} - 返回找到的节点对象，未找到则返回 undefined
   */
  getNodeById(id) {
    return this.stateManage.class.node.getNodeById(id)
  }

  /**
   * 获取当前变换器中选中的节点
   * @returns {Object[]} - 返回变换器中选中的节点数组
   */
  getTransformerNodes() {
    return this.stateManage.class.transformer.getTransformerNodes()
  }
 
  /**
   * 初始化舞台，加载图层并设置背景颜色，支持通过 JSON 字符串重置舞台
   * @param {string} [jsonStr] - 可选的 JSON 字符串，用于从保存的状态重置舞台
   */
  initStage(jsonStr) {
    return this.stateManage.class.stage.initStage(jsonStr)
  }

  /**
   * 通过 JSON 数据重置舞台，保留当前舞台的缩放和位置
   * @param {string} jsonStr - 用于重置舞台的 JSON 数据
   */
  resetStageByJSON(jsonStr) {
    return this.stateManage.class.stage.resetStageByJSON(jsonStr)
  }
  
  /**
   * 撤销最近的操作
   * @returns {Object|undefined} - 返回撤销的操作对象，未找到则返回 undefined
   */
  undo() {
    return this.stateManage.class.history.undo()
  }

  /**
   * 重做最近的撤销操作
   * @returns {Object|undefined} - 返回重做的操作对象，未找到则返回 undefined
   */
  redo() {
    return this.stateManage.class.history.redo()
  }

  /**
   * 添加一个操作记录到历史记录中
   * @param {Object} params - 操作记录的参数
   */
  addHistory(params) {
    return this.stateManage.class.history.addHistory(params)
  }

  /**
   * 获取历史记录
   * @returns {Array} - 返回历史记录数组
   */
  getHistory() {
    return this.stateManage.class.history.getHistory()
  }
  /**
   * 还原到历史记录的某一步
   * @param {number} index - 要还原到的历史记录索引
   */
  restoreToHistory(index) {
    return this.stateManage.class.history.restoreToHistory(index)
  }
  /**
   * 获取当前的编辑模式
   * @returns {string} - 当前的编辑模式，'edit' 或 'preview'
   */
  getStageMode() {
    return this.stateManage.class.stage.getStageMode()
  }

  /**
   * 设置编辑模式或预览模式
   * @param {string} mode - 编辑模式或预览模式 'edit' 或 'preview'
   */
  setStageMode(mode) {
    return this.stateManage.class.stage.setStageMode(mode)
  }
  /**
   *  更新Dom元素的缩放和位置
   *  根据 Konva 节点的绝对位置和旋转角度等信息同步更新 DOM 元素的样式
   *  更新DOM元素的缩放和位置的方法
   */
  updateDomPosition() {
    return this.stateManage.class.dom.updateDomPosition()
  }
  /**
   * 获取当前的舞台拖拽状态
   * @returns {boolean} - 舞台当前是否可以拖拽
   */
  getStageDrag() {
    return this.stateManage.class.stage.getStageDrag()
  }
  /**
   * 画布启用拖拽
   */
  enableStageDrag() {
    return this.stateManage.class.stage.enableStageDrag()
  }
  /**
   * 画布停用拖拽
   */
  disableStageDrag() {
    return this.stateManage.class.stage.disableStageDrag()
  }
  /**
   *  用于获取事件或者子节点的实际节点(解决嵌套节点, 事件在子节点触发的问题)
   *  @param {Object} eventOrNode - 事件对象 或者 某个子节点
   *  @return {Object} node - 实际的节点
   *
   */
  getEventNode(eventOrNode) {
    return this.stateManage.class.node.getEventNode(eventOrNode)
  }
  /**
   * 修改画布的宽度和高度
   * @param {Object} size - 包含新的宽度和高度的对象
   * @param {number} size.width - 新的宽度
   * @param {number} size.height - 新的高度
   */
  setStageSize(size) {
    return this.stateManage.class.stage.setStageSize(size)
  }
  /**
   * 禁用画布缩放
   */
  disableStageZoom() {
    return this.stateManage.class.stage.disableStageZoom()
  }
  /**
   * 启用画布缩放
   */
  enableStageZoom() {
    return this.stateManage.class.stage.enableStageZoom()
  }
  /**
   *  聚焦节点
   *  @param {Object} node - 要聚焦的节点
   */
  focusNode(node) {
    return this.stateManage.class.node.focusNode(node)
  }
  /**
   * 设置移动端是否允许旋转
   * @param {boolean} isAllow - 是否允许旋转
   */
  setMobileRotation(isAllow) {
    this.stateManage.class.stage.setMobileRotation(isAllow)
  }
  /**
   * 获取移动端是否允许旋转
   * @returns {boolean} - 是否允许旋转
   */
  getMobileRotation() {
    return this.stateManage.class.stage.getMobileRotation()
  }
  /**
   * 获取核心库支持的快捷键数据
   *
   * @return  {Array} 快捷键数组数据 
   */
  getHotKeyList(){
   return  this.stateManage.class.hotkey.getHotKeyList()
  }
  /**
   * 还原节点偏移中心到左上角
   * @return  {Object}  node - 节点对象
   */
  convertToTopLeftOrigin(node){
    this.stateManage.class.transformer.convertToTopLeftOrigin(node)
  }
  /**
   * 销毁 KDT 实例，清理所有资源
   */
  destroy() {
    this.stateManage.class.stage.cleanupBeforeReset()
    if (this.stateManage.class.event) {
      this.stateManage.class.event.destroy()
    }
    if (this.stateManage.class.dom) {
      this.stateManage.class.dom.destroy()
    }
    if (this.stateManage.class.transformer) {
      this.stateManage.class.transformer.resetTransformer([])
    }
    if (this.stateManage.class.hotkey) {
      this.stateManage.class.hotkey.unbindHotKeys()
    }
    if (this.state.stage) {
      this.state.stage.off()
      this.state.stage.destroy()
      this.state.stage = null
    }
    if (this.stateManage) {
      this.stateManage.destroy()
    }
    this.state.layers = []
    this.state.selectedNodes = []
    this.state.clipBoard = []
    this.state.listeners = {}
  }
  /**
   * 获取节点坐标 (考虑偏移)
   * @param   {Object}  node  节点对象
   * @return  {Object}  节点x和y的坐标信息
   */
  getNodePosition(node){
    return  this.stateManage.class.node.getNodePosition(node)
  }
  /**
   * 设置节点坐标 (考虑偏移)
   *
   * @param   {Object}  node  节点对象
   * @param   {Number}  x  x坐标
   * @param   {Number}  y  y坐标
   */
  setNodePosition(node,x,y){
    return  this.stateManage.class.node.setNodePosition(node,x,y)
  }
  /**
   * 重置 KDT 实例，清理现有资源并重新初始化
   */
  reset() {
    this.stateManage.class.event.unbindEvents()
    this.stateManage.class.dom.stopObservingDomElements()
    this.stateManage.clearAllObservers()
    
    this.state.selectedNodes = []
    this.state.clipBoard = []
    this.state.listeners = {}
    this.state.history = []
    this.state.transformer = null
  }
}