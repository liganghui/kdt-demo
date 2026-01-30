import { ref } from 'vue';

// Event bus methods and arrays
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