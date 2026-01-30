/**
 * @module ModulesManage
 * @name   Custom Components
 * @description Responsible for Konva.js Adding text on the stage、Button、Image、Flow Line、Switches and other module components。
 */
import { CustomSwitch } from './switch'
import { CustomImage } from './image'
import { CustomText } from './text'
import { CustomButton } from './button'
import { CustomCircle } from './basic/circle'
import { CustomStar } from './basic/star'
import { CustomSquare } from './basic/square'

export default class modulesManage {
  constructor(state, stateManage, config) {
    this.config = config
    this.stateManage = stateManage
    this.state = state
  }
  /**
   * Add custom text nodes to Konva Stage
   * @param {Object} params - Contains text properties、Position and other configuration parameters
   * @returns {CustomText} - Created text node instance
   */
  addText(params) {
    return new CustomText(params, this.state, this.stateManage)
  }

  /**
   * Add custom button nodes to Konva Stage
   * @param {Object} params - Contains button properties、Position and other configuration parameters
   * @returns {CustomButton} - Created button node instance
   */
  addButton(params) {
    return new CustomButton(params, this.state, this.stateManage)
  }
  /**
   * Add custom image nodes to Konva Stage
   * @param {Object} params - Contains image properties、Position and other configuration parameters
   * @returns {CustomImage} - Created image node instance
   */
  addImage(params) {
    return new CustomImage(params, this.state, this.stateManage)
  }

  /**
   * Add custom switch nodes to Konva Stage
   * @param {Object} params - Contains switch properties、Position and other configuration parameters
   * @returns {CustomSwitch} - Created switch node instance
   */
  addSwitch(params) {
    return new CustomSwitch(params, this.state, this.stateManage)
  }
  /**
   *
   * @param {Object} params - Contains status light properties、Position and other configuration parameters
   * @returns {CustomStatusLight} - Created status light node instance
   */
  addStatusLight(params) {
    return new CustomStatusLight(params, this.state, this.stateManage)
  }

  addCircle(params) {
    return new CustomCircle(params, this.state, this.stateManage)
  }
  addElipse(params) {
    return new CustomEllipse(params, this.state, this.stateManage)
  }
  addSquare(params) {
    return new CustomSquare(params, this.state, this.stateManage)
  }
  addStar(params) {
    return new CustomStar(params, this.state, this.stateManage)
  }
}
