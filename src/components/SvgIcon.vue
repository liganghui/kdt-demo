<script>
import { defineAsyncComponent } from 'vue'
export default {
    name: 'SvgIcon',
    props: {
        name: {
            type: String,
            required: true,
            validator: function (value) {
                // Ensure that the icon name is a non - empty string
                return typeof value === 'string' && value.trim().length > 0
            }
        },
        size: {
            type: [String, Number],
            default: '24', // Set defaultsizeValue
            validator: function (value) {
                // Check if it is a valid numeric string
                return /^\d+$/.test(value)
            }
        },
        width: {
           type: [String,Number],
            default: '' // Default width
        },
        height: {
            type: [String,Number],
            default: '' // Default height
        },
        color: {
            type: String,
            default: 'currentColor', // Default to inherit the font color of the parent component
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
                        throw new Error(`icon not found: ${this.name}`);
                    }
                } catch (error) {
                    console.error(`error loading icon: ${error.message}`);
                    return ''; // Return empty when icon fails to load
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