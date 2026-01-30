<template>
    <div class="image-panel">
        <el-form label-width="100px" class="image-form">
            <el-form-item label="选择图片">
                <div class="image-container">
                    <el-image :src="formData.data" class="image-preview" fit="contain" @click="dialogVisible = true"
                        @load="handleImageLoad" @error="handleImageError">
                        <template #error>
                            <div class="image-slot">
                                <svg-icon name="icon-err" :size="50" class="sub-text-color mt20" />
                                <p class="ft12 sub-text-color">图片加载失败</p>
                            </div>
                        </template>
                    </el-image>
                    <div class="image-overlay" @click="dialogVisible = true">
                        <svg-icon name="edit" :size="26" class="white-color" />
                    </div>
                </div>
            </el-form-item>

            <el-form-item label="图片地址" v-if="showUrl">
                <el-input v-model="formData.data" placeholder="输入图片URL" type="textarea" :maxlength="$store.state.globalVariable.textareaMaxSize"
                    :autosize="{ minRows: 3, maxRows: 8 }" />
                <p v-if="notice" class="notice-text" @click="handleNoticeClick">{{ notice }}</p>
            </el-form-item>

            <el-form-item label="滤镜设置">
                <el-switch v-model="formData.filtersEnabled" @change="updateNode" :disabled="isGif || isCrossOrigin">
                    启用滤镜
                </el-switch>
                <p v-if="isGif || isCrossOrigin" class="notice-text w100">{{ switchNotice }}</p>
            </el-form-item>
            <el-form-item label="渲染方式" v-if="formData.filtersEnabled && isSvg">
                <el-radio-group v-model="formData.svgRenderMode"  size="small">
                    <el-radio-button label="colorReplace">颜色替换</el-radio-button>
                    <el-radio-button label="konvaFilter" class="ml4">滤镜处理</el-radio-button>
                </el-radio-group>
                 <el-tooltip content="颜色替换：直接修改SVG颜色，效果精确但仅适用于简单图标；滤镜处理：使用画布滤镜，适合复杂图标" >
                    <svg-icon name="help" size="18" class="ml8 text-color"></svg-icon>
                </el-tooltip>
            </el-form-item>
            <el-form-item label="亮度" v-if="formData.filtersEnabled">
                <el-slider v-model="formData.brightness" :min="-1" :max="1" :step="0.01" @input="updateNode" />
            </el-form-item>

            <el-form-item label="对比度" v-if="formData.filtersEnabled">
                <el-slider v-model="formData.contrast" :min="-100" :max="100" :step="0.01" @input="updateNode" />
            </el-form-item>

            <el-form-item label="模糊" v-if="formData.filtersEnabled">
                <el-slider v-model="formData.blur" :min="0" :max="10" :step="0.1" @input="updateNode" />
            </el-form-item>

            <el-form-item label="颜色滤镜" v-if="formData.filtersEnabled">
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
                        重置
                    </el-button>
                </div>
                <p class="color-tip">选择图片颜色，白色为无滤镜效果</p>
            </el-form-item>
        </el-form>
        <el-dialog title="选择图片" width="800px" :model-value="dialogVisible" @close="dialogVisible = false">
            <el-scrollbar height="400">
                <UserImgList :select="true" ref="userImgListRef" :showOverlay="false" ></UserImgList>
            </el-scrollbar>
            <template #footer>
                <div class="dialog-footer">
                    <el-button  @click="dialogVisible = false">取 消</el-button>
                    <el-button  type="primary" @click="handleImgConfirm">确 定</el-button>
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
            isGif: false, // 是否为GIF图片
            isCrossOrigin: false, // 是否存在跨域问题
            switchNotice: '',
            colorValue: 'rgb(255, 255, 255)' // 颜色选择器的值
        }
    },

    computed: {
        ...mapState({
            activeNode: (state) => state.system.activeNode,
            instancesArr: (state) => state.stage.instancesArr
        }),
        // 素材图片不显示URL 避免用户瞎改
        showUrl() {
            return this.formData.data.indexOf('/assets/imgs/panel/design/') == -1 
        },  
        // 判断是否被事件面板引用显示
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
        // 监听RGB值变化，同步更新颜色选择器
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
        // 初始化颜色选择器的值
        this.syncColorFromRgb()
    },
    methods: {
        // 解析颜色字符串为RGB值
        parseColorToRgb(colorStr) {
            if (!colorStr) return { r: 255, g: 255, b: 255 }
            
            // 处理 rgb(r, g, b) 或 rgba(r, g, b, a) 格式
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
            
            // 处理十六进制格式 #ffffff
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
        
        // 将RGB值转换为颜色字符串
        rgbToColorString(r, g, b) {
            return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
        },
        
        // 颜色选择器变化处理
        handleColorChange(color) {
            if (!color) {
                this.resetColor()
                return
            }
            
            const rgb = this.parseColorToRgb(color)
            // 更新RGB值，但不触发updateNode（避免循环更新）
            this.formData.red = rgb.r
            this.formData.green = rgb.g
            this.formData.blue = rgb.b
            
            // 手动调用updateNode
            this.updateNode()
        },
        
        // 从RGB值同步颜色选择器
        syncColorFromRgb() {
            if (this.formData.red !== undefined && 
                this.formData.green !== undefined && 
                this.formData.blue !== undefined) {
                const colorString = this.rgbToColorString(
                    this.formData.red, 
                    this.formData.green, 
                    this.formData.blue
                )
                // 避免循环更新
                if (this.colorValue !== colorString) {
                    this.colorValue = colorString
                }
            }
        },
        
        // 重置颜色
        resetColor() {
            this.colorValue = 'rgb(255, 255, 255)'
            this.formData.red = 255
            this.formData.green = 255
            this.formData.blue = 255
            this.updateNode()
        },
        
        checkCrossOrigin() {
            try {
                // 如果是base64图片或相对路径，不算跨域
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
                // 域名不同就认为跨域
                this.isCrossOrigin = imageOrigin !== currentOrigin
                
                return Promise.resolve()
            } catch (e) {
                this.isCrossOrigin = false
                return Promise.resolve()
            }
        },
        handleImageLoad() {
            // 图片加载完成
            this.notice=''
            this.formData.lastSuccessfulSrc = this.formData.data
            // this.formData.data = this.formData.lastSuccessfulSrc

            this.isGif = this.formData.data.toLowerCase().endsWith('.gif')
            this.checkCrossOrigin().then(() => {
                if (this.isGif || this.isCrossOrigin) {
                    this.formData.filtersEnabled = false // 禁用滤镜
                    if (this.isGif) {
                        this.switchNotice = 'GIF 图片不支持滤镜功能'
                    } else if (this.isCrossOrigin) {
                        this.switchNotice = '图片地址与当前域名不一致，滤镜已被禁用'
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
                this.$message.warning('请先选择图片')
                return
            }
            this.formData.data = img
        },
        handleImageError() {
            this.$message.warning('图片加载失败，请检查图片地址')
            if (this.formData.lastSuccessfulSrc) {
                this.notice = '加载失败，点击恢复上次成功的地址';
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