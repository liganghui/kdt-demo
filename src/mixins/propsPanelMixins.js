export default {
    data() {
        return {
            isEvent: false,
            lastFormData: {},
            formData: {},
            isFormDataLoaded: false // Indicates formData Whether it has been loaded Avoid triggering during initialization watch
        }
    },
    props: {
        node: {
            type: Object,
            default: null
        },
        initData: {
            type: [Object, String],
            default: null
        }
    },

    watch: {
        /**
         * Listen to formData Changes of，And update node.attrs.props
         */
        formData: {
            handler(newVal) {
                if (this.isFormDataLoaded && this.node) {
                    if (this.$attrs['onUpdate']) {
                        this.isEvent = true
                        this.$emit('update', newVal)
                    } else if (this.node && this.node.updateParams) {
                        this.isEvent = false
                        if (JSON.stringify(newVal) !== JSON.stringify(this.lastFormData) && JSON.stringify(newVal) !== JSON.stringify(this.node.attrs.props)) {
                            this.lastFormData = JSON.parse(JSON.stringify(newVal))
                            this.node.updateParams(newVal)
                        }
                    } else if (this.node) {
                        this.isEvent = false
                        this.node.attrs.props = { ...this.node.attrs.props, ...newVal }
                    } else {
                        this.isEvent = false
                        console.warn('failed to update component properties，node doesnt exist', this)
                    }
                }
            },
            deep: true
        }
    },
    created() {
        this.loadNodeProps()
    },
    methods: {
        /**
         * Load node properties or initialize data
         */
        loadNodeProps() {
            let retryCount = 0;
            const maxRetries = 30; // Total30Times
            const tryLoad = () => {
                const objKeyNum= this.initData? Object.keys(this.initData).length:0;
                if (this.node && !this.isEmpty(this.initData)&&(objKeyNum>5||retryCount>15)) {
                    try {
                        this.formData = {
                            ...this.formData,
                            ...this.initData
                        };
                        // Mark formData Has been loaded completely
                        this.isFormDataLoaded = true;
                    } catch (error) {
                        console.error('property panel failed to load node properties', error);
                    }
                } else {
                    if (retryCount < maxRetries) {
                        retryCount++;
                        setTimeout(tryLoad, 25);
                    } else {
                        console.error('property panel failed to load node properties：no data obtained');
                    }
                }
            };
            tryLoad();
        },
        isEmpty(obj) {
            if (!obj) {
                return true
            }
            // Get all property names of the object
            const keys = Object.keys(obj);
            const findData = keys.findIndex((key) => {
                return key === 'data'
            })
            // If there are no properties，It is empty
            if (keys.length === 0) return true;
            if (keys.length < 2 && findData === -1) return true;
            return false;
        },
        /**
         * Manually update node properties
         */
        updateNode() {
            if (this.$attrs['onUpdate']) {
                this.$emit('update', this.formData)
            } else if (this.node && this.node.updateParams) {
                this.node.updateParams(this.formData)
            }

        }
    }
}
