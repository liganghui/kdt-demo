<template>
    <div class="setting-stage-container">
        <el-tabs v-model="activeTabName" class="setting-tabs" :stretch="true">
            <el-tab-pane label='Canvas' name="stage">
                <el-scrollbar :noresize="true" :height="panelHeight">
                    <el-form :model="formData" class="form-wrapper">
                        <el-form-item label='Name'>
                            <el-input v-model="formData.name" type="text" :maxlength="50" class="w190"  @change="handleNameChange"/>
                        </el-form-item>

                         <el-form-item label='Size'>
                           <!-- TODO   Need to solve the issue after adjusting the position DOMComponent cannot be selected and component elements need to be rearranged -->
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
                                                    <span class="text-color">Screen</span>
                                                    <span class="sub-text-color">   1920*1080</span>
                                                </div>
                                            </el-dropdown-item>
                                        </el-dropdown-menu> 
                                    </template>
                                </el-dropdown>
                            </el-space>
                        </el-form-item> 
                        <el-form-item label="Bg Color">
                            <el-color-picker v-model="formData.stageBackgroundColor" show-alpha
                                :predefine="predefineColors" />
                        </el-form-item>
                        <el-form-item label="Bg Image">
                            <el-upload action="#" ref="upload" list-type="picture-card" :auto-upload="false" :limit="1"
                                :on-remove="handleRemove" :on-change="handleFileChange"
                                :on-preview="handlePictureCardPreview" v-model:file-list="fileList"
                                accept="image/png, image/jpeg, image/gif" :class="['w200', { hideUpload: showUpload }]">
                                <div class="flex-c flex-a-c mt10">
                                    <el-icon size="20" class="ft12 sub-text-color">
                                        <Plus />
                                    </el-icon>
                                    <p class="ft12 sub-text-color line-height-1-5 mt20">image size less than10Mb</p>
                                    <p class="ft12 sub-text-color line-height-1-5">supportpng/jpg format images</p>
                                </div>
                            </el-upload>
                        </el-form-item>
                        <el-form-item label="Bg Grid">
                            <el-switch v-model="formData.gridSwich" />
                        </el-form-item>
                        <el-form-item label="Grid Width" v-if="formData.gridSwich">
                            <el-input-number v-model="formData.gridWidth" :min="20" :max="500"></el-input-number>
                        </el-form-item>
                        <el-form-item label="Grid Color" v-if="formData.gridSwich">
                            <el-color-picker v-model="formData.gridColor" show-alpha :predefine="predefineColors" />
                        </el-form-item>
                        <el-divider />
                        <el-text class="ml14 mt10">Preview Settings</el-text>
                        <el-form-item label="Auto Flip" class="mt10">
                            <el-switch v-model="formData.allowMobileRotation" />
                            <el-tooltip effect="dark" 
                              content="after enabling，when previewing on mobile devices，the canvas will automatically rotate to fit the screen。" 
                              placement="right">
                              <svg-icon name="help" class="sub-text-color ml10" size="16"></svg-icon>
                            </el-tooltip>
                        </el-form-item>
                        <el-form-item label="Scaling Method" class="mt10">
                            <el-space>
                                <el-tooltip effect="dark" content="auto fill" placement="bottom">
                                    <el-button link @click="formData.scaleMethod = 'fill'">
                                        <svg-icon name="auto-fill" size="22"
                                            :class="{ 'primary-color': formData.scaleMethod === 'fill' }"></svg-icon>
                                    </el-button>
                                </el-tooltip>
                                <el-tooltip effect="dark" content="width fill" placement="bottom">
                                    <el-button link @click="formData.scaleMethod = 'fitWidth'">
                                        <svg-icon name="width-fill" size="22"
                                            :class="{ 'primary-color': formData.scaleMethod === 'fitWidth' }"></svg-icon>
                                    </el-button>
                                </el-tooltip>
                                <el-tooltip effect="dark" content="height fill" placement="bottom">
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
        <el-dialog v-model="formData.dialogVisible" draggable title="Background Image Preview" width="70vw">
            <el-image  :src="dialogImageUrl" alt="background image preview"    class="preview-img" />
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

// Expand correctly systemConfig.value
const formData = reactive({
    ...defaultStageConfig,
    name: '',
    stageBackgroundImage: '',
    dialogVisible: false,
    ...systemConfig.value
})

// Adjust panel height when component is mounted
onMounted(() => {
    panelHeight.value =
        window.innerHeight -
        document.querySelector('.canvas-header').offsetHeight -
        document.querySelector('.el-tabs__header').offsetHeight -
        15
})

// Handle formData Changes and update Vuex
const handleFormChange = (newVal, oldVal) => {
    // ObjectkeysIterate to find which properties have changed
    for (const key in newVal) {
        if (newVal[key] !== oldVal[key]) {
            if (key === 'stageWidth' || key === 'stageHeight') {
                window.kdt.setStageSize({
                    width: newVal.stageWidth,
                    height: newVal.stageHeight
                })
                // After the canvas size is changed，If the background grid is enabled, the grid should be redrawn
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
                    // When there is a background image，Update file list
                    fileList.value = [
                        {
                            uid: new Date().getTime(), // Ensure each file has a unique uid
                            name: 'Background Image',
                            status: 'success', // Set status to success
                            url: newVal.stageBackgroundImage
                        }
                    ]
                    // Hide upload component
                    showUpload.value = true
                } else {
                    fileList.value = []
                    showUpload.value = false
                }
            }
        }
    }
}

// Listen formData Changes and update Vuex
watch(
    () => ({ ...formData }),
    (newVal, oldVal) => {
        store.dispatch('setSystemConfig', { ...newVal })
        setTimeout(() => {
           // 300ms Update canvas after 300ms to avoid updating before the canvas is initialized
            handleFormChange(newVal, oldVal)
        }, 300)
    },
    { deep: true }
)

// Listen Vuex Of systemConfig Changes and update formData
watch(
    systemConfig,
    (newConfig) => {
        if (JSON.stringify(formData) !== JSON.stringify(newConfig)) {
             // Use Object.assign To avoid reassigning
            Object.assign(formData, newConfig)
        }
    },
    {
        deep: true
    }
)

// Method for updating canvas size
const setSelectSize = (size) => {
    formData.stageWidth = size[0]
    formData.stageHeight = size[1]
}

// Method for handling image preview
const handlePictureCardPreview = (file) => {
    dialogImageUrl.value = file.url
    formData.dialogVisible = true
}

// Method for handling file removal
const handleRemove = () => {
    formData.stageBackgroundImage = ''
    fileList.value = []
    showUpload.value = false
    window.kdt.removeBackgroundImage()
}

// Method for handling file change
const handleFileChange = (file) => {
    if (file.status === 'ready') {
        const isLt10M = file.size / 1024 / 1024 <= 10
        const isJPG = file.raw.type === 'image/jpeg'
        const isPNG = file.raw.type === 'image/png'
        
        if (!isLt10M) {
            ElMessage.error('background image size cannot exceed 10MB!')
            upload.value.clearFiles()
            return false
        }
        if (!isJPG && !isPNG) {
            ElMessage.error('background image only supports JPG/PNG format!')
            upload.value.clearFiles()
            return false
        }
        
        // Plugin compresses images
        const compress = new Compress()
        compress
            .compress([file.raw], {
                size: 10, // Maximum file size，Unit isMB
                quality: 0.75, // Compression quality
            })
            .then((data) => {
                // data Is the compressed image array
                const img = data[0]
                const base64str = img.prefix + img.data
                formData.stageBackgroundImage = base64str
                showUpload.value = true
                window.kdt.setBackgroundImage({ url: base64str })
            })
            .catch((err) => {
                console.error('image compression failed')
                ElMessage.error('image compression failed')
                upload.value.clearFiles()
            })
    }
}

// Handle name change
const handleNameChange = async (newName) => {
  try {
    // Check if there is corresponding data in local storage
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
    //Update store Name in
    const updatedConfig = {
      ...store.state.stage.systemConfig,
      name: newName
    }
    store.dispatch('setSystemConfig', updatedConfig)
    // Update data in local storage
    const updatedStoredData = {
      ...parsedData,
      Name: newName
    }
    localStorage.setItem(buildId, JSON.stringify(updatedStoredData))
    
    ElMessage({
      type: 'success',
      message: 'name updated successfully'
    })
  } catch (err) {
    ElMessage({
      type: 'error',
      message: 'name update failed'
    })
    console.error('name update exception:', err)
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
    /* Upload button hidden */
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
