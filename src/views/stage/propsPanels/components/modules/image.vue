<template>
    <div class="image-panel">
        <el-form label-width="100px" class="image-form">
            <el-form-item label="Select Image">
                <div class="image-container">
                    <el-image :src="formData.data" class="image-preview" fit="contain" @click="dialogVisible = true"
                        @load="handleImageLoad" @error="handleImageError">
                        <template #error>
                            <div class="image-slot">
                                <svg-icon name="icon-err" :size="50" class="sub-text-color mt20" />
                                <p class="ft12 sub-text-color">image failed to load</p>
                            </div>
                        </template>
                    </el-image>
                    <div class="image-overlay" @click="dialogVisible = true">
                        <svg-icon name="edit" :size="26" class="white-color" />
                    </div>
                </div>
            </el-form-item>

            <el-form-item label="Image Address" v-if="showUrl">
                <el-input v-model="formData.data" placeholder="enter imageURL" type="textarea" :maxlength="$store.state.globalVariable.textareaMaxSize"
                    :autosize="{ minRows: 3, maxRows: 8 }" />
                <p v-if="notice" class="notice-text" @click="handleNoticeClick">{{ notice }}</p>
            </el-form-item>

            <el-form-item label="Filter Settings">
                <el-switch v-model="formData.filtersEnabled" @change="updateNode" :disabled="isGif || isCrossOrigin">
                    Enable Filter
                </el-switch>
                <p v-if="isGif || isCrossOrigin" class="notice-text w100">{{ switchNotice }}</p>
            </el-form-item>
            <el-form-item label="Rendering Method" v-if="formData.filtersEnabled && isSvg">
                <el-radio-group v-model="formData.svgRenderMode"  size="small">
                    <el-radio-button label="colorReplace">Color Replacement</el-radio-button>
                    <el-radio-button label="konvaFilter" class="ml4">Filter Processing</el-radio-button>
                </el-radio-group>
                 <el-tooltip content="color replacement：direct modificationSVGcolor，accurate effect but only applicable to simple icons；filter processing：using canvas filter，suitable for complex icons" >
                    <svg-icon name="help" size="18" class="ml8 text-color"></svg-icon>
                </el-tooltip>
            </el-form-item>
            <el-form-item label="Brightness" v-if="formData.filtersEnabled">
                <el-slider v-model="formData.brightness" :min="-1" :max="1" :step="0.01" @input="updateNode" />
            </el-form-item>

            <el-form-item label="Contrast" v-if="formData.filtersEnabled">
                <el-slider v-model="formData.contrast" :min="-100" :max="100" :step="0.01" @input="updateNode" />
            </el-form-item>

            <el-form-item label="Blur" v-if="formData.filtersEnabled">
                <el-slider v-model="formData.blur" :min="0" :max="10" :step="0.1" @input="updateNode" />
            </el-form-item>

            <el-form-item label="Color Filter" v-if="formData.filtersEnabled">
                <div class="color-filter-container">
                    <el-color-picker 
                        v-model="colorValue" 
                        @change="handleColorChange"
                        show-alpha
                        size="default"
                        class="color-picker"
                    />
                    <el-button 
                        @click="resetColor" 
                        size="small" 
                        link
                        class="reset-btn"
                    >
                        reset
                    </el-button>
                </div>
                <p class="color-tip">select image color，white means no filter effect</p>
            </el-form-item>
        </el-form>
        <el-dialog title="Select Image" width="800px" :model-value="dialogVisible" @close="dialogVisible = false">
            <el-scrollbar height="400">
                <UserImgList :select="true" ref="userImgListRef" :showOverlay="false" ></UserImgList>
            </el-scrollbar>
            <template #footer>
                <div class="dialog-footer">
                    <el-button  @click="dialogVisible = false">cancel cancel</el-button>
                    <el-button  type="primary" @click="handleImgConfirm">confirm confirm</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>
<script>
import UserImgList from '@/components/UserImgList.vue'
import { mapState } from 'vuex'
import propsPanelMixins from '@/mixins/propsPanelMixins';

export default {
    name: 'imagePanel',
    mixins: [propsPanelMixins],
    components: { UserImgList },
    data() {
        return {
            dialogVisible: false,
            formData: {
             
            },
            notice: '',
            isGif: false, // Is it forGIFImage
            isCrossOrigin: false, // Is there any cross - origin issue
            switchNotice: '',
            colorValue: 'rgb(255, 255, 255)' // Value of color picker
        }
    },

    computed: {
        ...mapState({
            activeNode: (state) => state.system.activeNode,
            instancesArr: (state) => state.stage.instancesArr
        }),
        // Material image is not displayedURL Avoid users from random modification
        showUrl() {
            return this.formData.data.indexOf('/assets/imgs/panel/design/') == -1 
        },  
        // Judge whether it is referenced and displayed in the event panel
        isEventOrigin() {
            return this.$attrs?.onUpdate !== undefined
        },
         isSvg() {
            if (!this.formData.data) return false
            return (
                this.formData.data.toLowerCase().endsWith('.svg') ||
                this.formData.data.startsWith('data:image/svg+xml') ||
                this.formData.data.includes('<svg')
            )
        }
    },
    watch: {
        'formData.data'(newSrc) {
            this.isGif = newSrc && newSrc?.toLowerCase()?.endsWith('.gif')
        },
        // MonitorRGBValue change，Synchronously update the color picker
        'formData.red': {
            handler() {
                this.syncColorFromRgb()
            },
            immediate: false
        },
        'formData.green': {
            handler() {
                this.syncColorFromRgb()
            },
            immediate: false
        },
        'formData.blue': {
            handler() {
                this.syncColorFromRgb()
            },
            immediate: false
        }
    },
    mounted() {
        // Initialize the value of color picker
        this.syncColorFromRgb()
    },
    methods: {
        // Parse color string toRGBValue
        parseColorToRgb(colorStr) {
            if (!colorStr) return { r: 255, g: 255, b: 255 }
            
            // Process rgb(r, g, b) Or rgba(r, g, b, a) Format
            if (colorStr.startsWith('rgb')) {
                const match = colorStr.match(/rgb\(?(\d+),\s*(\d+),\s*(\d+)/)
                if (match) {
                    return {
                        r: parseInt(match[1]),
                        g: parseInt(match[2]),
                        b: parseInt(match[3])
                    }
                }
            }
            
            // Handle hexadecimal format #ffffff
            if (colorStr.startsWith('#')) {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colorStr)
                return result ? {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16)
                } : { r: 255, g: 255, b: 255 }
            }
            
            return { r: 255, g: 255, b: 255 }
        },
        
        // ConvertRGBValue to color string
        rgbToColorString(r, g, b) {
            return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
        },
        
        // Color picker change handling
        handleColorChange(color) {
            if (!color) {
                this.resetColor()
                return
            }
            
            const rgb = this.parseColorToRgb(color)
            // UpdateRGBValue，But do not triggerupdateNode（Avoid circular updates）
            this.formData.red = rgb.r
            this.formData.green = rgb.g
            this.formData.blue = rgb.b
            
            // Call manuallyupdateNode
            this.updateNode()
        },
        
        // FromRGBValue to synchronize color picker
        syncColorFromRgb() {
            if (this.formData.red !== undefined && 
                this.formData.green !== undefined && 
                this.formData.blue !== undefined) {
                const colorString = this.rgbToColorString(
                    this.formData.red, 
                    this.formData.green, 
                    this.formData.blue
                )
                // Avoid circular updates
                if (this.colorValue !== colorString) {
                    this.colorValue = colorString
                }
            }
        },
        
        // Reset color
        resetColor() {
            this.colorValue = 'rgb(255, 255, 255)'
            this.formData.red = 255
            this.formData.green = 255
            this.formData.blue = 255
            this.updateNode()
        },
        
        checkCrossOrigin() {
            try {
                // If it isbase64Image or relative path，Not considered cross - origin
                if (this.formData.data.startsWith('data:') || 
                    this.formData.data.startsWith('/') || 
                    this.formData.data.startsWith('./') || 
                    this.formData.data.startsWith('../')) {
                    this.isCrossOrigin = false
                    return Promise.resolve()
                }
                const imageUrl = new URL(this.formData.data)
                const currentOrigin = window.location.origin
                const imageOrigin = imageUrl.origin
                // Different domain names are considered cross - origin
                this.isCrossOrigin = imageOrigin !== currentOrigin
                
                return Promise.resolve()
            } catch (e) {
                this.isCrossOrigin = false
                return Promise.resolve()
            }
        },
        handleImageLoad() {
            // Image loading completed
            this.notice=''
            this.formData.lastSuccessfulSrc = this.formData.data
            // this.formData.data = this.formData.lastSuccessfulSrc

            this.isGif = this.formData.data.toLowerCase().endsWith('.gif')
            this.checkCrossOrigin().then(() => {
                if (this.isGif || this.isCrossOrigin) {
                    this.formData.filtersEnabled = false // Disable filters
                    if (this.isGif) {
                        this.switchNotice = 'GIF image does not support filter function'
                    } else if (this.isCrossOrigin) {
                        this.switchNotice = 'image address is inconsistent with current domain，filter has been disabled'
                    }
                } else {
                    this.switchNotice = ''
                }
                this.updateNode()
            })
        },
        handleImgConfirm() {
            this.dialogVisible = false
            const img = this.$refs.userImgListRef.getSelectImg()
            if (!img) {
                this.$message.warning('please select an image first')
                return
            }
            this.formData.data = img
        },
        handleImageError() {
            this.$message.warning('image failed to load，please check the image address')
            if (this.formData.lastSuccessfulSrc) {
                this.notice = 'loading failed，click to restore last successful address';
            }

        },
        handleNoticeClick() {
            this.formData.data = this.formData.lastSuccessfulSrc
        }
    }
}
</script>

<style lang="scss" scoped>
.notice-text {
    font-size: 12px;
    color: #f56c6c;
    margin-top: 5px;
    line-height: 1.5;
    cursor: pointer;
}

.image-container {
    position: relative;
    display: inline-block;
    overflow: hidden;
}

.image-preview {
    cursor: pointer;
    height: 100px;
    transition: all 0.3s ease;
}

.image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: white;
    opacity: 0;
    cursor: pointer;
    transition: opacity 0.3s ease;
}

.image-overlay i {
    font-size: 24px;
    margin-bottom: 5px;
}

.image-container:hover .image-overlay {
    opacity: 1;
}

.color-filter-container {
    display: flex;
    align-items: center;
    gap: 10px;
}

.color-picker {
    flex-shrink: 0;
}

.reset-btn {
    padding: 4px 8px;
    font-size: 12px;
}

.color-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 5px;
    line-height: 1.4;
}
</style>