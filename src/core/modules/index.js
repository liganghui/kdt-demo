/**
 * @module ModulesManage
 * @name   自定义组件
 * @description 负责在 Konva.js 舞台上添加文本、按钮、图片、流程线、开关等模块组件。
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
   * 添加自定义文本节点到 Konva 舞台
   * @param {Object} params - 包含文本属性、位置和其他配置参数
   * @returns {CustomText} - 创建的文本节点实例
   */
  addText(params) {
    return new CustomText(params, this.state, this.stateManage)
  }

  /**
   * 添加自定义按钮节点到 Konva 舞台
   * @param {Object} params - 包含按钮属性、位置和其他配置参数
   * @returns {CustomButton} - 创建的按钮节点实例
   */
  addButton(params) {
    return new CustomButton(params, this.state, this.stateManage)
  }
  /**
   * 添加自定义图片节点到 Konva 舞台
   * @param {Object} params - 包含图片属性、位置和其他配置参数
   * @returns {CustomImage} - 创建的图片节点实例
   */
  addImage(params) {
    return new CustomImage(params, this.state, this.stateManage)
  }

  /**
   * 添加自定义开关节点到 Konva 舞台
   * @param {Object} params - 包含开关属性、位置和其他配置参数
   * @returns {CustomSwitch} - 创建的开关节点实例
   */
  addSwitch(params) {
    return new CustomSwitch(params, this.state, this.stateManage)
  }
  /**
   *
   * @param {Object} params - 包含状态灯属性、位置和其他配置参数
   * @returns {CustomStatusLight} - 创建的状态灯节点实例
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
