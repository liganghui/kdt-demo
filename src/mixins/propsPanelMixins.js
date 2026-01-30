export default {
    data() {
        return {
            isEvent: false,
            lastFormData: {},
            formData: {},
            isFormDataLoaded: false // 表示 formData 是否已加载 避免初始化时触发 watch
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
         * 监听 formData 的变化，并更新 node.attrs.props
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
                        console.warn('更新组件属性失败，node 不存在', this)
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
         * 加载节点属性或初始化数据
         */
        loadNodeProps() {
            let retryCount = 0;
            const maxRetries = 30; // 总共30次
            const tryLoad = () => {
                const objKeyNum= this.initData? Object.keys(this.initData).length:0;
                if (this.node && !this.isEmpty(this.initData)&&(objKeyNum>5||retryCount>15)) {
                    try {
                        this.formData = {
                            ...this.formData,
                            ...this.initData
                        };
                        // 标记 formData 已加载完成
                        this.isFormDataLoaded = true;
                    } catch (error) {
                        console.error('属性面板加载节点属性失败', error);
                    }
                } else {
                    if (retryCount < maxRetries) {
                        retryCount++;
                        setTimeout(tryLoad, 25);
                    } else {
                        console.error('属性面板加载节点属性失败：未获取到数据');
                    }
                }
            };
            tryLoad();
        },
        isEmpty(obj) {
            if (!obj) {
                return true
            }
            // 获取对象的所有属性名
            const keys = Object.keys(obj);
            const findData = keys.findIndex((key) => {
                return key === 'data'
            })
            // 如果没有属性，则为空
            if (keys.length === 0) return true;
            if (keys.length < 2 && findData === -1) return true;
            return false;
        },
        /**
         * 手动更新节点属性
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
