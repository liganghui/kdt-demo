
import { defineAsyncComponent } from 'vue';

const requireComponent = import.meta.glob('./*/*.vue', { eager: true });
const asyncRequireComponent = import.meta.glob('./*/*.vue');

const components = {};

Object.keys(requireComponent).forEach(fileName => {
    if (fileName.includes('index.vue')) {
        const module = requireComponent[fileName];
        const componentName = module.default.name;
        
        if (componentName) {
            components[componentName] = defineAsyncComponent({
                loader: () => asyncRequireComponent[fileName](),
                loadingComponent: { template: '<div>Loading...</div>' },
                errorComponent: { template: '<div>Component Loading Error</div>' },
                delay: 200,
                timeout: 3000
            });
        }
    }
});

export default components;