<template>
    <div class="setting-stage-container">
        <el-tabs v-model="activeTabName" class="setting-tabs" :stretch="true">
            <el-tab-pane label='画布' name="stage">
                <el-scrollbar :noresize="true" :height="panelHeight">
                    <el-form :model="formData" class="form-wrapper">
                        <el-form-item label='名称'>
                            <el-input v-model="formData.name" type="text" :maxlength="50" class="w190"  @change="handleNameChange"/>
                        </el-form-item>

                         <el-form-item label='画布尺寸'>
                           <!-- TODO   需要解决调整位置后 DOM组件无法选中和组件元素重新排版问题 -->
                            <el-space>
                                <el-space>
                                    <span class="text-color ft12">W</span>
                                    <el-input v-model="formData.stageWidth" controls-position="right"
                                        style="width: 60px" />
                                </el-space>
                                <el-space>
                                    <span class="text-color ft12">H</span>
                                    <el-input v-model="formData.stageHeight" controls-position="right"
                                        style="width: 60px" />
                                </el-space>
                                <el-dropdown @command="setSelectSize">
                                    <el-button link class="outline-none">
                                        <el-icon size="16">
                                            <Operation />
                                        </el-icon>
                                    </el-button>
                                    <template #dropdown>
                                        <el-dropdown-menu>
                                            <el-dropdown-item :command="[1920, 1080]">
                                                <div class="w150 flex-j-b">
                                                    <span class="text-color">大屏</span>
                                                    <span class="sub-text-color">   1920*1080</span>
                                                </div>
                                            </el-dropdown-item>
                                        </el-dropdown-menu> 
                                    </template>
                                </el-dropdown>
                            </el-space>
                        </el-form-item> 
                        <el-form-item label="背景颜色">
                            <el-color-picker v-model="formData.stageBackgroundColor" show-alpha
                                :predefine="predefineColors" />
                        </el-form-item>
                        <el-form-item label="背景图片">
                            <el-upload action="#" ref="upload" list-type="picture-card" :auto-upload="false" :limit="1"
                                :on-remove="handleRemove" :on-change="handleFileChange"
                                :on-preview="handlePictureCardPreview" v-model:file-list="fileList"
                                accept="image/png, image/jpeg, image/gif" :class="['w200', { hideUpload: showUpload }]">
                                <div class="flex-c flex-a-c mt10">
                                    <el-icon size="20" class="ft12 sub-text-color">
                                        <Plus />
                                    </el-icon>
                                    <p class="ft12 sub-text-color line-height-1-5 mt20">图片小于10Mb</p>
                                    <p class="ft12 sub-text-color line-height-1-5">支持png/jpg 格式图片</p>
                                </div>
                            </el-upload>
                        </el-form-item>
                        <el-form-item label="背景网格">
                            <el-switch v-model="formData.gridSwich" />
                        </el-form-item>
                        <el-form-item label="网格宽度" v-if="formData.gridSwich">
                            <el-input-number v-model="formData.gridWidth" :min="20" :max="500"></el-input-number>
                        </el-form-item>
                        <el-form-item label="网格颜色" v-if="formData.gridSwich">
                            <el-color-picker v-model="formData.gridColor" show-alpha :predefine="predefineColors" />
                        </el-form-item>
                        <el-divider />
                        <el-text class="ml14 mt10">预览设置</el-text>
                        <el-form-item label="自动翻转" class="mt10">
                            <el-switch v-model="formData.allowMobileRotation" />
                            <el-tooltip effect="dark" 
                              content="启用后，在移动设备上预览时，画布会自动旋转以适应屏幕。" 
                              placement="right">
                              <svg-icon name="help" class="sub-text-color ml10" size="16"></svg-icon>
                            </el-tooltip>
                        </el-form-item>
                        <el-form-item label="缩放方式" class="mt10">
                            <el-space>
                                <el-tooltip effect="dark" content="自动铺满" placement="bottom">
                                    <el-button link @click="formData.scaleMethod = 'fill'">
                                        <svg-icon name="auto-fill" size="22"
                                            :class="{ 'primary-color': formData.scaleMethod === 'fill' }"></svg-icon>
                                    </el-button>
                                </el-tooltip>
                                <el-tooltip effect="dark" content="宽度铺满" placement="bottom">
                                    <el-button link @click="formData.scaleMethod = 'fitWidth'">
                                        <svg-icon name="width-fill" size="22"
                                            :class="{ 'primary-color': formData.scaleMethod === 'fitWidth' }"></svg-icon>
                                    </el-button>
                                </el-tooltip>
                                <el-tooltip effect="dark" content="高度铺满" placement="bottom">
                                    <el-button link @click="formData.scaleMethod = 'fitHeight'">
                                        <svg-icon name="height-fill" size="22"
                                            :class="{ 'primary-color': formData.scaleMethod === 'fitHeight' }"></svg-icon>
                                    </el-button>
                                </el-tooltip>
                            </el-space>
                        </el-form-item>
                        <el-divider />
                    </el-form>
                </el-scrollbar>
            </el-tab-pane>
        </el-tabs>
        <el-dialog v-model="formData.dialogVisible" draggable title="背景图预览" width="70vw">
            <el-image  :src="dialogImageUrl" alt="背景图预览"    class="preview-img" />
        </el-dialog>
    </div>
</template>

<script setup>
import Compress from 'compress.js'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { computed, reactive, watch, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import defaultStageConfig from '@/config/stage'
const store = useStore()
const route = useRoute()
const fileList = ref([])
const panelHeight = ref(window.innerHeight - 91)
const upload = ref(null)
const showUpload = ref(false)
const activeTabName = ref('stage')
const dialogImageUrl = ref('')
const predefineColors = ref([
    '#000',
    '#fff',
    '#ffd700',
    '#90ee90',
    '#00ced1',
    '#1e90ff',
    '#c71585',
    'rgba(255, 69, 0, 0.68)',
    'rgb(255, 120, 0)',
    'hsv(51, 100, 98)',
    'hsva(120, 40, 94, 0.5)',
    'hsl(181, 100%, 37%)',
    'hsla(209, 100%, 56%, 0.73)',
    '#c7158577'
])

const systemConfig = computed(() => store.state.stage.systemConfig)

// 正确展开 systemConfig.value
const formData = reactive({
    ...defaultStageConfig,
    name: '',
    stageBackgroundImage: '',
    dialogVisible: false,
    ...systemConfig.value
})

// 组件挂载时调整面板高度
onMounted(() => {
    panelHeight.value =
        window.innerHeight -
        document.querySelector('.canvas-header').offsetHeight -
        document.querySelector('.el-tabs__header').offsetHeight -
        15
})

// 处理 formData 的变化并更新 Vuex
const handleFormChange = (newVal, oldVal) => {
    // 对象keys遍历以找出哪些属性发生了变化
    for (const key in newVal) {
        if (newVal[key] !== oldVal[key]) {
            if (key === 'stageWidth' || key === 'stageHeight') {
                window.kdt.setStageSize({
                    width: newVal.stageWidth,
                    height: newVal.stageHeight
                })
                // 画布尺寸更改后，如果背景网格开启了应该重新绘制网格
                if (newVal.gridSwich) {
                    window.kdt.drawLinesSolution(newVal.gridColor, newVal.gridWidth)
                }
               
            } else if (key === 'stageBackgroundColor') {
                window.kdt.setBackgroundColor(newVal.stageBackgroundColor)
              
            } else if (key === 'gridSwich' || key === 'gridWidth' || key === 'gridColor') {
                if (newVal.gridSwich) {
                    window.kdt.drawLinesSolution(newVal.gridColor, newVal.gridWidth)
                } else {
                    window.kdt.removeGridLines()
                }
            } else if (key === 'stageBackgroundImage') {
                window.kdt.setBackgroundImage({ url: newVal.stageBackgroundImage })
                if (newVal.stageBackgroundImage) {
                    // 当有背景图片时，更新文件列表
                    fileList.value = [
                        {
                            uid: new Date().getTime(), // 确保每个文件有唯一的 uid
                            name: '背景图片',
                            status: 'success', // 设置状态为 success
                            url: newVal.stageBackgroundImage
                        }
                    ]
                    // 隐藏上传组件
                    showUpload.value = true
                } else {
                    fileList.value = []
                    showUpload.value = false
                }
            }
        }
    }
}

// 监听 formData 的变化并更新 Vuex
watch(
    () => ({ ...formData }),
    (newVal, oldVal) => {
        store.dispatch('setSystemConfig', { ...newVal })
        setTimeout(() => {
           // 300ms 后更新画布避免更新是画布还没初始化完成
            handleFormChange(newVal, oldVal)
        }, 300)
    },
    { deep: true }
)

// 监听 Vuex 的 systemConfig 变化并更新 formData
watch(
    systemConfig,
    (newConfig) => {
        if (JSON.stringify(formData) !== JSON.stringify(newConfig)) {
             // 使用 Object.assign 以避免重新赋值
            Object.assign(formData, newConfig)
        }
    },
    {
        deep: true
    }
)

// 用于更新画布尺寸的方法
const setSelectSize = (size) => {
    formData.stageWidth = size[0]
    formData.stageHeight = size[1]
}

// 处理图片预览的方法
const handlePictureCardPreview = (file) => {
    dialogImageUrl.value = file.url
    formData.dialogVisible = true
}

// 处理文件移除的方法
const handleRemove = () => {
    formData.stageBackgroundImage = ''
    fileList.value = []
    showUpload.value = false
    window.kdt.removeBackgroundImage()
}

// 处理文件变更的方法
const handleFileChange = (file) => {
    if (file.status === 'ready') {
        const isLt10M = file.size / 1024 / 1024 <= 10
        const isJPG = file.raw.type === 'image/jpeg'
        const isPNG = file.raw.type === 'image/png'
        
        if (!isLt10M) {
            ElMessage.error('背景图片大小不能超过 10MB!')
            upload.value.clearFiles()
            return false
        }
        if (!isJPG && !isPNG) {
            ElMessage.error('背景图片仅支持 JPG/PNG 格式!')
            upload.value.clearFiles()
            return false
        }
        
        // 插件压缩图片
        const compress = new Compress()
        compress
            .compress([file.raw], {
                size: 10, // 最大文件大小，单位为MB
                quality: 0.75, // 压缩质量
            })
            .then((data) => {
                // data 是压缩后的图片数组
                const img = data[0]
                const base64str = img.prefix + img.data
                formData.stageBackgroundImage = base64str
                showUpload.value = true
                window.kdt.setBackgroundImage({ url: base64str })
            })
            .catch((err) => {
                console.error('图片压缩失败')
                ElMessage.error('图片压缩失败')
                upload.value.clearFiles()
            })
    }
}

// 处理名称变化
const handleNameChange = async (newName) => {
  try {
    // 检查本地存储中是否有对应的数据
    const buildId = route.params.buildId
    const storedData = localStorage.getItem(buildId)
    if (!storedData) {
      return
    }
    let parsedData
    try {
      parsedData = JSON.parse(storedData)
    } catch (parseError) {
      return
    }
    //更新 store 中的名称
    const updatedConfig = {
      ...store.state.stage.systemConfig,
      name: newName
    }
    store.dispatch('setSystemConfig', updatedConfig)
    // 更新本地存储中的数据
    const updatedStoredData = {
      ...parsedData,
      Name: newName
    }
    localStorage.setItem(buildId, JSON.stringify(updatedStoredData))
    
    ElMessage({
      type: 'success',
      message: '名称更新成功'
    })
  } catch (err) {
    ElMessage({
      type: 'error',
      message: '名称更新失败'
    })
    console.error('名称更新异常:', err)
  }
}
</script>

<style lang="scss" scoped>
.setting-stage-container {
    background-color: var(--panel-light-bg-color);
    height: 100%;
    min-width: 300px;
    border-left: 1px solid var(--panel-border-out-color);

    .form-wrapper {
        width: 100%;
        overflow-x: hidden;
    }
}

:deep(.el-upload-list__item) {
    width: 195px;
    height: 103px;
}

:deep(.el-tabs__header) {
    margin: 0 0 15px;
}

:deep(.hideUpload) .el-upload {
    display: none;
    /* 上传按钮隐藏 */
}

:deep(.el-form-item__label) {
    padding-left: 14px;
    font-size: 14px;
    min-width: 98px;
    text-align: left;
    display: inline-block;
    color: var(--primary-text-color);
}

:deep(.el-upload) {
    width: 195px;
    height: 112.5px;
}

.dialog-footer {
    margin-top: 20px;
    display: flex;
    justify-content: end;
}

.preview-img {
    margin: 0 auto;
    display: block;
    max-height: 70vh;
}
</style>
