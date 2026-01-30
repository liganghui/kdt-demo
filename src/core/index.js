/**
 * @overview
 * @classdesc
 * # KDT Library
 *
 * KDT Is a library based onKonvajs，Used to implement on the canvasDOMAndCanvasA class library for co-interaction management of nodes。The library also integrates and encapsulates canvas、Layers、Events、grid and other functions。
 *
 * ## Feature Modules
 * - **Canvas Management**：Easily create and manage canvas-related operations。
 * - **Layer Handling**：Manage multiple layers，Support layer addition、deletion, and sorting。
 * - **Event Management**：Convenient event subscription and cancellation mechanisms。
 * - **Grid System**：Support grid line drawing and customization。
 * - **DOM Operations**：With DOM integration and manipulation of elements。
 * - **Alignment Tools**：Provide multiple alignment and distribution options。
 * - **Shortcut Key Support**：Built-in hotkey management，Improve development efficiency。
 * - **Node Management**：Convenient node addition、Copying、Cutting、pasting, and deleting operations。
 * - **State Management**：Centralized management of state synchronization and sharing between modules，Ensure data consistency。
 * - **History Tracking**：Support undo and redo operations，Improve user experience。
 *
 * ## Quick Start
 * To start using KDT，Simply instantiate `KDT` class and pass inKonvacanvas object and optional configuration parameters。
 *
 * ```javascript
 * import KDT from 'path-to-kdt';
 *
 * const stage = new Stage(); // Assuming you have a Stage Class
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
 * @property {string} [mode='edit'] - Mode，Can be 'edit'（Edit mode）Or 'preview'（Preview mode）。
 * @property {string} [color='red'] - Default Color。
 * @property {boolean} [grid=true] - Whether to Display Grid。
 * @property {number} [gridLineOffset=10] - Grid Line Offset。
 * @property {number} [gridSize=20] - Grid Size。
 * @property {boolean} [dev=true] - Development Mode Switch。
 * @property {Array<string>} [layerNames=['background', 'bottom', 'middle', 'top', 'animation']] - Layer Name List。
 */

/**
 * This is KDT entry module of the class，used to receive initialization parameters and export various module methods。
 * @class
 * @name KDT
 * @param {Object} stage - Stage Object。
 * @param {Config} [config={}] - User-defined Configuration Parameters，Defaulting to {@link Config}。
 * @constructor
 */
export default class KDT {
  /**
   * Default Configuration Parameters
   * @type {Config}
   */
  defaultConfig = {
    mode: 'edit', // By default is 'edit'（Can be set to），Configuration for Whether to Allow Rotation on Mobile Devices 'preview'（Node Property Limits for Mobile Layer Performance Optimization）
    color: 'red',
    grid: true,
    gridLineOffset: 10,
    gridSize: 20,
    dev: true,
    allowMobileRotation: true, // Cache Node Enable Count Limit for Transform Box
    layerNames: ['background', 'bottom', 'middle', 'top', 'animation'],
    // Node Count Threshold for Enabling Drag Optimization 
    tempLayerNodeLimit:12,
    // Canvas Object
    cacheEnableCount:12,
     // Default Values of Initialization Variables
    dragOptimizationThreshold: 50,
  }

  initState = {
    isEdit: true,
    // Layer Collection
    stage: null,
    // Event Listener Collection Object
    transformer: null,
    // Selected Nodes
    layers: [],
    // Clipboard Data
    listeners: [],
    // Edit State Indicator
    selectedNodes: [],
    // History Records
    clipBoard: [],
    // Whether to Disable Added Nodes
    isEdit: true,
    // Auto-selection of Transform Box
    history: [],
    // According to judge whether it is edit mode
    disableAutoAddTransformer: false
  }

  state = null
  constructor(stage, config = {}) {
    this.config = { ...this.defaultConfig, ...config }
    this.stateManage = new StateManage(this.initState)
    this.state = this.stateManage.state
    // Set Stage Instance config.mode Configuration Parameters
    this.state.isEdit = this.config.mode === 'edit'
    this.state.stage = stage // Initialize Various Sub-modules
    this.state.config = this.config // and pass in parameters
    // Bind other first Finally bind the canvas object
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
    // Subscribe to Eventclass  Event Type
    this.stateManage.class.stage = new StageManage(this.state, this.stateManage, this.config)
  }

  /**
   * Callback Function
   * @param {string} eventType - Unsubscribe from Event
   * @param {Function} callback - Trigger Custom Event
   */
  on(eventType, callback) {
    this.stateManage.class.event.on(eventType, callback)
  }

  /**
   * Event Data
   * @param {string} eventType - Add Node to Specified Layer
   * @param {Function} callback - Event Object
   */
  off(eventType, callback) {
    this.stateManage.class.event.off(eventType, callback)
  }
  /**
   * contains node data
   *
   * @param  {string} eventType - Layer Object
   * @param  {any} data - Copy Selected Nodes
   *
   */
  trigger(eventType, data) {
    this.stateManage.class.event.trigger(eventType, data)
  }
  /**
   * array of selected nodes
   * @param {Object} event - Cut Selected Nodes，Paste Nodes from Clipboard to Stage
   * @param {Object} layer - node array
   */
  addNode(event, layer) {
    this.stateManage.class.node.addNode(event, layer)
  }

  /**
   * Delete Selected Nodes
   * @param {Object[]} nodes - array of nodes to delete
   */
  copyNodes(nodes) {
    this.stateManage.class.node.copyNodes(nodes)
  }

  /**
   * Move Selected Nodes to Bottom of Layer
   * @param {Object[]} nodes - Move Selected Nodes to Top of Layer
   */
  cutNodes(nodes) {
    this.stateManage.class.node.cutNodes(nodes)
  }

  /**
   * Move Selected Nodes Up One Layer
   * @param {Object[]} nodes - Move Selected Nodes Down One Layer
   */
  pasteNodes(nodes) {
    this.stateManage.class.node.pasteNodes(nodes)
  }

  /**
   * Group Selected Nodes into a Group
   * @param {Object[]} nodes - Ungroup Selected Group into Individual Nodes
   */
  deleteNodes(nodes) {
    this.stateManage.class.node.deleteNodes(nodes)
  }

  /**
   * Lock Selected Nodes
   * @param {Object[]} nodes - array of nodes to lock
   */
  moveToBottom(nodes) {
    this.stateManage.class.layer.moveToBottom(nodes)
  }

  /**
   * Unlock Selected Nodes
   * @param {Object[]} nodes - array of nodes to unlock
   */
  moveToTop(nodes) {
    this.stateManage.class.layer.moveToTop(nodes)
  }

  /**
   * Hide Selected Nodes
   * @param {Object[]} nodes - array of nodes to hide
   */
  moveUp(nodes) {
    this.stateManage.class.layer.moveUp(nodes)
  }

  /**
   * Animation Duration
   * @param {Object[]} nodes - in milliseconds
   */
  moveDown(nodes) {
    this.stateManage.class.layer.moveDown(nodes)
  }

  /**
   * Show Selected Nodes
   * @param {Object[]} nodes - array of nodes to show
   */
  groupNodes(nodes) {
    this.stateManage.class.node.groupNodes(nodes)
  }

  /**
   * Toggle Display State of Specified Nodes
   * @param {Object[]} nodes - array of nodes to toggle display state
   */
  ungroupNodes(nodes) {
    this.stateManage.class.node.ungroupNodes(nodes)
  }

  /**
   * Get Data from Clipboard
   * @param {Object[]} nodes - return node data from clipboard
   */
  lockNodes(nodes) {
    this.stateManage.class.node.lockNodes(nodes)
  }

  /**
   * Get All Nodes in All Layers
   * @param {Object[]} nodes - return an array of all eligible nodes
   */
  unlockNodes(nodes) {
    this.stateManage.class.node.unlockNodes(nodes)
  }

  /**
   * Add Node to Transform Box
   * @param {Object[]} nodes - node to add to transform box
   * @param {number} [duration=0] - transformer object，Add Multiple Nodes to Transform Box
   */
  hideNodes(nodes, duration = 0) {
    this.stateManage.class.node.hideNodes(nodes, duration)
  }

  /**
   * array of nodes to add to transform box
   * @param {Object[]} nodes - array of transformer objects
   * @param {number} [duration=0] - Remove Node from Transform Box，node to remove
   */
  showNodes(nodes, duration = 0) {
    this.stateManage.class.node.showNodes(nodes, duration)
  }

  /**
   * whether removal was successful。
   * @param {Object[]} nodes - Reset Nodes of Transform Box
   * @param {number} [duration=0] - array of nodes to reset，array of reset transformer nodes
   */
  toggleNodes(nodes, duration = 0) {
    this.stateManage.class.node.toggleNodes(nodes, duration)
  }

  /**
   * Update Properties of Selected Nodes
   * @returns {Object[]} - array of nodes to update
   */
  getClipBoardData() {
    return this.state.clipBoard
  }

  /**
   * new properties to set
   * @returns {Object[]} - Get Stage Scale
   */
  getAllLayersNodes() {
    return this.stateManage.class.node.getAllLayersNodes()
  }

  /**
   * stage scale
   * @param {Object} node - including
   * @returns {Object} - and
   */
  addNodeTransformer(node) {
    return this.stateManage.class.transformer.addNodeTransformer(node)
  }

  /**
   * Set Stage Scale
   * @param {Object[]} nodes - scale to set
   * @returns {Object[]} - whether to apply animation
   */
  addNodesTransformer(nodes) {
    return this.stateManage.class.transformer.addNodesTransformer(nodes)
  }

  /**
   * Auto-scale Stage
   * @param {Object} node - to fit the specified window size
   * @returns {boolean} - and adjust according to scale type
   */
  removeNodeTransformer(node) {
    return this.stateManage.class.transformer.removeNodeTransformer(node)
  }

  /**
   * Window Width
   * @param {Object[]} nodes - Window Height
   * @returns {Object[]} - Scale Type
   */
  resetTransformer(nodes) {
    return this.stateManage.class.transformer.resetTransformer(nodes)
  }

  /**
   * optional values are
   * @param {Object[]} nodes - fill the canvas
   * @param {Object} attrs - fit width
   */
  updateNodeAttrs(nodes, attrs) {
    return this.stateManage.class.node.updateNodeAttrs(nodes, attrs)
  }

  /**
   * fit height
   * @returns {Object} - whether to apply margin，when it is x time y
   */
  getStageScale() {
    return this.state.stage.scale()
  }

  /**
   * the calculated scale will subtract
   * @param {number} scale - whether to apply transition animation
   * @param {boolean} [animate=false] - axis and
   */
  setStageScale(scale, animate) {
    return this.stateManage.class.stage.setStageScale(scale, animate)
  }

  /**
   * axis scale，Remove Stage Background Color，Set Stage Background Color
   * @param {number} windowWidth - background color to set
   * @param {number} windowHeight - Remove Stage Background Image
   * @param {string} scaleType - Set Stage Background Image，including 'fill'（Draw Grid Lines）、'fitWidth'（grid line color）、'fitHeight'（grid line size）
   * @param {boolean} [isMargin=false] - Remove Grid Lines，Show Grid Lines true Hide Grid Lines，Align Selected Nodes Left 0.03
   * @param {boolean} [IsAnimate=true] - Align Selected Nodes Right
   * @returns {Object} - Align Selected Nodes Top x Array of selected nodes y Align selected nodes to bottom
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
   * Array of selected nodes
   */
  removeBackgroundColor() {
    this.stateManage.class.stage.removeBackgroundColor()
  }

  /**
   * Align selected nodes to horizontal center
   * @param {string} color - Array of selected nodes
   */
  setBackgroundColor(color) {
    this.stateManage.class.stage.setBackgroundColor(color)
  }

  /**
   * Align selected nodes to vertical center
   */
  removeBackgroundImage() {
    this.stateManage.class.stage.removeBackgroundImage()
  }

  /**
   * Array of selected nodes
   * @param {object} config - Distribute selected nodes horizontallyurl
   */
  setBackgroundImage(config) {
    this.stateManage.class.stage.setBackgroundImage(config)
  }

  /**
   * Array of selected nodes
   * @param {string} color - Distribute selected nodes vertically
   * @param {number} size - Array of selected nodes
   */
  drawLinesSolution(color, size) {
    this.stateManage.class.grid.drawLinesSolution(color, size)
  }

  /**
   * Distribute selected nodes horizontally
   */
  removeGridLines() {
    this.stateManage.class.grid.removeGridLines()
  }
  /**
   * Array of selected nodes
   */
  showGrid(){
    this.stateManage.class.grid.showGrid()
  }
  /**
   * Set the height of nodes
   */
  hideGrid(){
    this.stateManage.class.grid.hideGrid()
  }
  /**
   * Array of nodes to set height
   * @param {Object[]} nodes - New height to set
   */
  alignLeft(nodes) {
    this.stateManage.class.align.alignLeft(nodes)
  }

  /**
   * Set the width of nodes
   * @param {Object[]} nodes - Array of nodes to set width
   */
  alignRight(nodes) {
    this.stateManage.class.align.alignRight(nodes)
  }

  /**
   * New width to set
   * @param {Object[]} nodes - Force update the state of nodes
   */
  alignTop(nodes) {
    this.stateManage.class.align.alignTop(nodes)
  }

  /**
   * Update data of a specified node
   * @param {Object[]} nodes - Node's
   */
  alignBottom(nodes) {
    this.stateManage.class.align.alignBottom(nodes)
  }

  /**
   * Data to update
   * @param {Object[]} nodes - According to node
   */
  alignCenter(nodes) {
    this.stateManage.class.align.alignCenter(nodes)
  }

  /**
   * Get node
   * @param {Object[]} nodes - Node's
   */
  alignHorizontalCenter(nodes) {
    this.stateManage.class.align.alignHorizontalCenter(nodes)
  }

  /**
   * Return the found node object
   * @param {Object[]} nodes - If not found, return
   */
  alignVerticalCenter(nodes) {
    this.stateManage.class.align.alignVerticalCenter(nodes)
  }

  /**
   * Get selected nodes in the current transformer
   * @param {Object[]} nodes - Return the array of selected nodes in the transformer
   */
  distributeVertically(nodes) {
    this.stateManage.class.align.distributeVertically(nodes)
  }

  /**
   * Initialize the stage
   * @param {Object[]} nodes - Load layers and set background color
   */
  distributeHorizontally(nodes) {
    this.stateManage.class.align.distributeHorizontally(nodes)
  }

  /**
   * Support via
   * @param {Object[]} nodes - String to reset the stage
   * @param {number} height - Optional
   */
  setNodeHeight(nodes, height) {
    this.stateManage.class.node.setNodeHeight(nodes, height)
  }

  /**
   * String
   * @param {Object[]} nodes - Used to reset the stage from saved state
   * @param {number} width - Via
   */
  setNodeWidth(nodes, width) {
    this.stateManage.class.node.setNodeWidth(nodes, width)
  }

  /**
   * Data to reset the stage
   */
  forceUpdate() {
    this.stateManage.class.node.forceUpdate()
  }

  /**
   * Preserve the current stage's zoom and position
   * @param {string} id - Used to reset the stage ID
   * @param {any} data - Data
   */
  updateNodeData(obj) {
    this.stateManage.class.node.updateNodeData(obj)
  }
  /**
   * Undo the last operation ID Return the undone operation object
   * @param {string} id - If not found, return ID
   * @returns {Object|undefined} - Redo the last undone operation，Return the redone operation object undefined
   */
  getNodeById(id) {
    return this.stateManage.class.node.getNodeById(id)
  }

  /**
   * If not found, return
   * @returns {Object[]} - Add an operation record to history
   */
  getTransformerNodes() {
    return this.stateManage.class.transformer.getTransformerNodes()
  }
 
  /**
   * Parameters of the operation record，Get history records，Return the history records array JSON Restore to a specific step in history
   * @param {string} [jsonStr] - Index of the history step to restore to JSON Get the current edit mode，Current edit mode
   */
  initStage(jsonStr) {
    return this.stateManage.class.stage.initStage(jsonStr)
  }

  /**
   * or JSON Set edit mode or preview mode，Edit mode or preview mode
   * @param {string} jsonStr - or JSON Update
   */
  resetStageByJSON(jsonStr) {
    return this.stateManage.class.stage.resetStageByJSON(jsonStr)
  }
  
  /**
   * Element's zoom and position
   * @returns {Object|undefined} - According to，Synchronously update based on node's absolute position and rotation angle undefined
   */
  undo() {
    return this.stateManage.class.history.undo()
  }

  /**
   * Element's style
   * @returns {Object|undefined} - Update，Method to update element's zoom and position undefined
   */
  redo() {
    return this.stateManage.class.history.redo()
  }

  /**
   * Get the current stage drag status
   * @param {Object} params - Whether the stage can be dragged currently
   */
  addHistory(params) {
    return this.stateManage.class.history.addHistory(params)
  }

  /**
   * Enable stage drag
   * @returns {Array} - Disable stage drag
   */
  getHistory() {
    return this.stateManage.class.history.getHistory()
  }
  /**
   * Used to get the actual node of an event or child node
   * @param {number} index - Solve nested nodes
   */
  restoreToHistory(index) {
    return this.stateManage.class.history.restoreToHistory(index)
  }
  /**
   * Issue of events triggered on child nodes
   * @returns {string} - Event object，'edit' or 'preview'
   */
  getStageMode() {
    return this.stateManage.class.stage.getStageMode()
  }

  /**
   * A child node
   * @param {string} mode - Actual node 'edit' Modify the stage's width and height 'preview'
   */
  setStageMode(mode) {
    return this.stateManage.class.stage.setStageMode(mode)
  }
  /**
   *  Object containing new width and heightDomNew width
   *  New height Konva Disable stage zoom DOM Enable stage zoom
   *  Focus on a nodeDOMNode to focus on
   */
  updateDomPosition() {
    return this.stateManage.class.dom.updateDomPosition()
  }
  /**
   * Set whether mobile rotation is allowed
   * @returns {boolean} - Whether rotation is allowed
   */
  getStageDrag() {
    return this.stateManage.class.stage.getStageDrag()
  }
  /**
   * Get whether mobile rotation is allowed
   */
  enableStageDrag() {
    return this.stateManage.class.stage.enableStageDrag()
  }
  /**
   * Whether rotation is allowed
   */
  disableStageDrag() {
    return this.stateManage.class.stage.disableStageDrag()
  }
  /**
   *  Get shortcut data supported by the core library(Shortcut array data, Restore node offset center to top - left corner)
   *  @param {Object} eventOrNode - Node object Destroy Instance
   *  @return {Object} node - Clean up all resources
   *
   */
  getEventNode(eventOrNode) {
    return this.stateManage.class.node.getEventNode(eventOrNode)
  }
  /**
   * Get node coordinates
   * @param {Object} size - Consider offset
   * @param {number} size.width - Node object
   * @param {number} size.height - Node
   */
  setStageSize(size) {
    return this.stateManage.class.stage.setStageSize(size)
  }
  /**
   * and
   */
  disableStageZoom() {
    return this.stateManage.class.stage.disableStageZoom()
  }
  /**
   * Coordinate information
   */
  enableStageZoom() {
    return this.stateManage.class.stage.enableStageZoom()
  }
  /**
   *  Set node coordinates
   *  @param {Object} node - Consider offset
   */
  focusNode(node) {
    return this.stateManage.class.node.focusNode(node)
  }
  /**
   * Node object
   * @param {boolean} isAllow - Coordinate
   */
  setMobileRotation(isAllow) {
    this.stateManage.class.stage.setMobileRotation(isAllow)
  }
  /**
   * Coordinate
   * @returns {boolean} - Reset
   */
  getMobileRotation() {
    return this.stateManage.class.stage.getMobileRotation()
  }
  /**
   * Instance
   *
   * @return  {Array} Clean up existing resources and re - initialize 
   */
  getHotKeyList(){
   return  this.stateManage.class.hotkey.getHotKeyList()
  }
  /**
   * Restore node offset center to top - left corner
   * @return  {Object}  node - Node object
   */
  convertToTopLeftOrigin(node){
    this.stateManage.class.transformer.convertToTopLeftOrigin(node)
  }
  /**
   * Destroy KDT Instance，Clean up all resources
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
   * Get node coordinates (Taking offset into account)
   * @param   {Object}  node  Node object
   * @return  {Object}  NodexandyCoordinate information of
   */
  getNodePosition(node){
    return  this.stateManage.class.node.getNodePosition(node)
  }
  /**
   * Set node coordinates (Taking offset into account)
   *
   * @param   {Object}  node  Node object
   * @param   {Number}  x  xCoordinate
   * @param   {Number}  y  yCoordinate
   */
  setNodePosition(node,x,y){
    return  this.stateManage.class.node.setNodePosition(node,x,y)
  }
  /**
   * Reset KDT Instance，Clean up existing resources and reinitialize
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