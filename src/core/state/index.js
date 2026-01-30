/**
 * @module StateManage
 * @name   状态管理
 * @description 类用于管理核心库内部模块的的状态 , 它通过观察者模式监控状态的变化，并支持模块化状态的管理。
 */

export default class StateManage {
  constructor(initialState) {
    this.observers = {} // 使用对象存储观察者，键为变量名称，值为观察者数组
    this.class = {} // 存储class类对象
    this.state = this.createStateProxy(initialState)
  }

  /**
   * 创建状态代理，拦截对状态的读写操作
   * @param {Object} state - 原始状态对象
   * @returns {Proxy} - 返回一个代理对象，用于监听状态变化
   */
  createStateProxy(state) {
    return new Proxy(state, {
      get: (target, property) => target[property],
      set: (target, property, value) => {
        if (target[property] !== value) {
          target[property] = value
          this.notifyObservers(property, value)
        }
        return true
      }
    })
  }

  /**
   * 订阅指定状态变量的变化
   * @param {string} property - 要订阅的状态变量名称
   * @param {Function} observerFunction - 当状态变化时调用的回调函数
   */
  sub(property, observerFunction) {
    if (!this.observers[property]) {
      this.observers[property] = []
    }
    this.observers[property].push(observerFunction)
  }

  /**
   * 通知所有订阅指定状态变量变化的观察者
   * @param {string} property - 发生变化的状态变量名称
   * @param {*} newValue - 该状态的新值
   */
  notifyObservers(property, newValue) {
    const observers = this.observers[property]
    if (observers && Array.isArray(observers)) {
        // 使用 slice() 创建副本，避免在迭代过程中数组被修改
        const observersCopy = observers.slice()
        observersCopy.forEach((observerFunction) => {
        try {
            // 确保观察者函数存在且是函数类型
            if (typeof observerFunction === 'function') {
            observerFunction(newValue)
            }
        } catch (error) {
            console.error(`订阅通知异常 "${property}":`, error)
        }
      })
    }
  }

  /**
   * 获取指定的状态属性值
   * @param {string} property - 状态变量的名称
   * @returns {*} - 返回状态变量的当前值
   */ getState(property) {
    return this.state[property]
  }

  /**
   * 设置指定状态属性的新值，并通知观察者
   * @param {string} property - 状态变量的名称
   * @param {*} value - 要设置的新值
   */ setState(property, value) {
    if (this.state[property] !== value) {
      this.state[property] = value
      this.notifyObservers(property, value)
    }
  }

  /**
   * 为指定模块设置初始状态
   * @param {string} moduleName - 模块名称
   * @param {Object} moduleState - 模块的初始状态对象
   */
  setModuleState(moduleName, moduleState) {
    if (!this.state[moduleName]) {
      this.state[moduleName] = this.createStateProxy(moduleState)
    } else {
      console.warn(`模块 ${moduleName} 的初始化数据已经存在.`)
    }
  }
  /**
   * 取消订阅指定状态变量的特定观察者
   * @param {string} property - 状态变量名称
   * @param {Function} observerFunction - 要移除的观察者函数
   */
  unsub(property, observerFunction) {
    if (this.observers[property]) {
      this.observers[property] = this.observers[property].filter(
        (observer) => observer !== observerFunction
      )
      if (this.observers[property].length === 0) {
        delete this.observers[property]
      }
    }
  }

  /**
   * 清理所有观察者
   */
  clearAllObservers() {
    this.observers = {}
  }

  /**
   * 清理指定属性的所有观察者
   * @param {string} property - 状态变量名称
   */
  clearObservers(property) {
    if (this.observers[property]) {
      delete this.observers[property]
    }
  }

  /**
   * 重置状态管理器，清理所有观察者和状态
   */
  reset() {
    this.clearAllObservers()
    this.class = {}
  }

  /**
   * 销毁状态管理器
   */
  destroy() {
    this.clearAllObservers()
    this.class = {}
    this.state = null
  }
}
