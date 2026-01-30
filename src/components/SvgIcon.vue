<script>
import { defineAsyncComponent } from 'vue'
export default {
    name: 'SvgIcon',
    props: {
        name: {
            type: String,
            required: true,
            validator: function (value) {
                // 确保图标名称是非空字符串
                return typeof value === 'string' && value.trim().length > 0
            }
        },
        size: {
            type: [String, Number],
            default: '24', // 设置默认size值
            validator: function (value) {
                // 检查是否为有效的数字字符串
                return /^\d+$/.test(value)
            }
        },
        width: {
           type: [String,Number],
            default: '' // 默认宽度
        },
        height: {
            type: [String,Number],
            default: '' // 默认高度
        },
        color: {
            type: String,
            default: 'currentColor', // 默认继承父组件的字体颜色
        },
        opacity:{
            type: Number,
            default: 1
        }
    },

    data() {
        return {
            icons: import.meta.glob(`@/assets/icons/*.svg`)
        }
    },

    computed: {
        icon() {
            return defineAsyncComponent(async () => {
                try {
                    const path = `/src/assets/icons/${this.name}.svg`;
                    if (this.icons[path]) {
                        return await this.icons[path]();
                    } else {
                        throw new Error(`未找到图标: ${this.name}`);
                    }
                } catch (error) {
                    console.error(`加载图标时出错: ${error.message}`);
                    return ''; // 当图标加载失败时返回空
                }
            })

        },
        actualWidth() {
            return this.width || parseFloat(this.size)
        },
        actualHeight() {
            return this.height || parseFloat(this.size)
        }
    }
}
</script>
<template>
    <div style="display:inline-flex;vertical-align: top;">
        <el-icon v-if="!icon">
            <!-- <QuestionFilled /> -->
        </el-icon>
        <component 
            v-else 
            :is="icon" 
            :style="{
                width: actualWidth + 'px',
                height: actualHeight + 'px',
                fill: color,
                verticalAlign: 'top'
            }"
            :width="actualWidth"
            :height="actualHeight"
            preserveAspectRatio="none" />
    </div>
</template>