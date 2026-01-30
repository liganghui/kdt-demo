/**
 * @module StateManage
 * @name   State Management
 * @description This class is used to manage the states of internal modules in the core library , It monitors changes in states through the observer pattern，And supports modular state management。
 */

export default class StateManage {
  constructor(initialState) {
    this.observers = {} // Use an object to store observers，The key is the variable name，The value is an array of observers
    this.class = {} // StoreclassClass object
    this.state = this.createStateProxy(initialState)
  }

  /**
   * Create a state proxy，Intercept read and write operations on states
   * @param {Object} state - Original state object
   * @returns {Proxy} - Returns a proxy object，Used to monitor state changes
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
   * Subscribe to changes in a specified state variable
   * @param {string} property - Name of the state variable to subscribe to
   * @param {Function} observerFunction - Callback function called when the state changes
   */
  sub(property, observerFunction) {
    if (!this.observers[property]) {
      this.observers[property] = []
    }
    this.observers[property].push(observerFunction)
  }

  /**
   * Notify all observers subscribed to changes in a specified state variable
   * @param {string} property - Name of the state variable that changed
   * @param {*} newValue - New value of the state
   */
  notifyObservers(property, newValue) {
    const observers = this.observers[property]
    if (observers && Array.isArray(observers)) {
        // Use slice() Create a copy，Avoid modifying the array during iteration
        const observersCopy = observers.slice()
        observersCopy.forEach((observerFunction) => {
        try {
            // Ensure the observer function exists and is a function type
            if (typeof observerFunction === 'function') {
            observerFunction(newValue)
            }
        } catch (error) {
            console.error(`subscription notification exception "${property}":`, error)
        }
      })
    }
  }

  /**
   * Get the value of a specified state property
   * @param {string} property - Name of the state variable
   * @returns {*} - Returns the current value of the state variable
   */ getState(property) {
    return this.state[property]
  }

  /**
   * Set a new value for a specified state property，And notify observers
   * @param {string} property - New value to be set
   * @param {*} value - Set initial state for a specified module
   */ setState(property, value) {
    if (this.state[property] !== value) {
      this.state[property] = value
      this.notifyObservers(property, value)
    }
  }

  /**
   * Module name
   * @param {string} moduleName - Initial state object of the module
   * @param {Object} moduleState - Unsubscribe a specific observer from a specified state variable
   */
  setModuleState(moduleName, moduleState) {
    if (!this.state[moduleName]) {
      this.state[moduleName] = this.createStateProxy(moduleState)
    } else {
      console.warn(`module ${moduleName} initialization data already exists.`)
    }
  }
  /**
   * Observer function to be removed
   * @param {string} property - Clear all observers
   * @param {Function} observerFunction - Clear all observers for a specified property
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
   * Reset the state manager
   */
  clearAllObservers() {
    this.observers = {}
  }

  /**
   * Clear all observers and states
   * @param {string} property - Destroy the state manager
   */
  clearObservers(property) {
    if (this.observers[property]) {
      delete this.observers[property]
    }
  }

  /**
   * Reset the state manager and clear all observers and states，Reset the state manager and clear all observers and states
   */
  reset() {
    this.clearAllObservers()
    this.class = {}
  }

  /**
   * Destroy the state manager
   */
  destroy() {
    this.clearAllObservers()
    this.class = {}
    this.state = null
  }
}
