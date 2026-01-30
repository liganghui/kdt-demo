import { ref } from 'vue';

// 事件总线方法和数组
const eventBus = ref({});

export const onEvent = (event, callback) => {
  if (!eventBus.value[event]) {
    eventBus.value[event] = [];
  }
  eventBus.value[event].push(callback);
};

export const emitEvent = (event, payload) => {
  if (eventBus.value[event]) {
    eventBus.value[event].forEach(callback => callback(payload));
  }
};