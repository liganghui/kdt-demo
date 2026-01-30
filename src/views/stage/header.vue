<template>
  <div class="header-container" :key="key" ref="headerRef">
    <div class="menu-wrapper flex flex-a-center no-select">
      <el-icon class="home-icon pointer">
        <el-tooltip content="view homepage" placement="bottom">
          <a href="https://cloud.yu-con.com/login">
            <HomeFilled />
          </a>
        </el-tooltip>
      </el-icon>
      <el-space :size="24">
        <el-dropdown class="ml20" placement="bottom">
          <span class="el-dropdown-link pointer"> file </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="importStage">
                <p>
                  <span>import file</span>
                </p>
              </el-dropdown-item>
              <el-dropdown-item @click="exportStage">
                <p>
                  <span>export file</span>
                </p>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown placement="bottom" v-if="isViteDev">
          <span class="el-dropdown-link pointer"> tools </span>
          <template #dropdown>
            <el-dropdown-menu class="custom-dropdown">
              <el-dropdown-item @click="toggleStats">
                <div class="flex-j-b flex-a-c" style="width: 100px">
                  <span>FPS Monitor</span>
                  <el-icon v-if="statsVisible"><Select /></el-icon>
                </div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown placement="bottom">
          <span class="el-dropdown-link pointer"> help </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="shortcutKeyDialogVisible = true">
                <span>shortcuts</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-space>
    </div>
    <div class="title-wrapper flex flex-c-c">
      <el-input v-model="stageName" :maxlength="30" class="title-input" readonly />
    </div>
    <div class="operate-wrapper flex flex-j-b no-select">
      <el-space :size="22">
        <el-switch v-model="isDark" class="theme-switch" @change="handleToggleTheme">
          <template #active-action>
            <el-icon>
              <Moon />
            </el-icon>
          </template>
          <template #inactive-action>
            <el-icon>
              <Sunny />
            </el-icon>
          </template>
        </el-switch>
      </el-space>
      <el-space>
        <el-space>
          <el-button
            size="small"
            type="info"
            @click="previewStage"
            :loading="saveLoading"
            :disabled="isPreviewMode"
          >
            <svg-icon name="preview" size="16" />
            <span class="ml4">preview</span>
          </el-button>
          <el-popconfirm
            title="Whether To Save Thumbnails Simultaneously"
            width="220"
            @confirm="saveStage(true)"
            confirm-button-text="save simultaneously"
            cancel-button-text="do not save simultaneously"
            @cancel="saveStage(false)"
          >
            <template #reference>
              <el-badge :is-dot="hasUnsavedChanges" class="save-badge">
                <el-button
                  size="small"
                  type="success"
                  :loading="saveLoading"
                  :disabled="isPreviewMode"
                >
                  <svg-icon name="save" size="14" />
                  <span class="ml4">save</span>
                </el-button>
              </el-badge>
            </template>
          </el-popconfirm>
          <el-button
            size="small"
            type="primary"
            @click="publishStage"
            :loading="publishLoading"
            :disabled="isPreviewMode"
          >
            <svg-icon name="send" size="16" />
            <span class="ml4">publish</span>
          </el-button>
        </el-space>
      </el-space>
    </div>
    <HotKeyDialog
      :visible="shortcutKeyDialogVisible"
      @close="shortcutKeyDialogVisible = false"
    ></HotKeyDialog>
  </div>
</template>
<script setup>
import { saveStageData } from '@/api/system'
import { getExportData } from '@/utils/utils'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ref, onMounted, computed, onBeforeMount } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'
import HotKeyDialog from './components/hotKeyDialog.vue'
const headerRef = ref(null)
const store = useStore()
const route = useRoute()
const router = useRouter()
const saveLoading = ref(false)
const publishLoading = ref(false)
const key = ref(0)
// Check if it is preview mode
const isPreviewMode = computed(() => {
  return !store.state.system.isPanelShow
})
// Check if there are unsaved changes
const hasUnsavedChanges = computed(() => {
  return !!store.state.system.unsavedChanges
})

const stageName = computed({
  get() {
    return store.state.stage.systemConfig?.name || ''
  },
  set(value) {
    // Update store in name
    const updatedConfig = {
      ...store.state.stage.systemConfig,
      name: value
    }
    store.dispatch('setSystemConfig', updatedConfig)
  }
})
const isDark = ref(false)
const shortcutKeyDialogVisible = ref(false)
const isViteDev = import.meta.env.DEV // Determine if it is Vite development environment
const statsVisible = ref(isViteDev) // Performance monitor is displayed by default in development environment
let stats

onBeforeMount(() => {
  const theme = localStorage.getItem('theme')
  store.dispatch('setTheme', theme)
  switchTheme(theme === 'dark')
})

onMounted(() => {
  if (isViteDev) {
    loadStats()
  }
  //  Initialize theme
  isDark.value = store.state.system.theme === 'dark' ? true : false
})
const loadStats = () => {
  const script = document.createElement('script')
  script.onload = function () {
    stats = new Stats()
    stats.dom.style.position = 'fixed'
    stats.dom.style.top = '10px'
    stats.dom.style.left = '10px'
    document.body.appendChild(stats.dom)
    requestAnimationFrame(function loop() {
      stats.update()
      if (statsVisible.value) {
        requestAnimationFrame(loop)
      }
    })
  }
  script.src = '/js/stats.min.js'
  document.head.appendChild(script)
}

const toggleStats = () => {
  statsVisible.value = !statsVisible.value
  if (stats) {
    stats.dom.style.display = statsVisible.value ? 'block' : 'none'
  }
}
// Generate canvas preview
const generateStageThumbnail = async () => {
  try {
    const stage = window.kdt.state.stage
    const originalScale = stage.scaleX()
    const originalPosition = stage.position()
    const originalWidth = stage.width()
    const originalHeight = stage.height()
    const domRects = stage.find('.dom-rect')
    const tempStyles = []

    // fordom-rectAdd temporary styles to nodes，Make it visible in the screenshot
    domRects.forEach((rect) => {
      const domId = rect.attrs.domId
      const dom = document.getElementById(domId)

      if (dom) {
        // Save current styles
        tempStyles.push({
          domId,
          originalDisplay: dom.style.display,
          originalOpacity: dom.style.opacity
        })
        // EnsureDOMElement is visible
        dom.style.display = 'block'
        // dom.style.backgroundColor = 'green'
        dom.style.opacity = '1'
      }
    })

    stage.scale({ x: 1, y: 1 })
    stage.position({ x: 0, y: 0 })
    window.kdt.updateDomPosition()
    stage.batchDraw()

    // Wait forDOMUpdate to complete
    await new Promise((resolve) => setTimeout(resolve, 100))

    const konvaContainer = document.querySelector('.konvajs-content')
    // Configuration options
    const options = {
      quality: 0.85,
      width: originalWidth,
      height: originalHeight
    }
    // GeneratePNGimage
    // const dom = await snapdom.toPng(konvaContainer, options)

    // console.log(dom,'dom')
    // const dataUrl=dom.src
    const dataUrl = stage.toDataURL({
      mimeType: 'image/png',
      quality: 0.85,
      width: originalWidth,
      height: originalHeight,
      pixelRatio: 1 // This value can be adjusted as needed
    })
    // Restore stage state
    stage.scale({ x: originalScale, y: originalScale })
    stage.position({ x: originalPosition.x, y: originalPosition.y })
    window.kdt.updateDomPosition()
    stage.batchDraw()
    // Scale to appropriate size
    const maxWidth = 600
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        const scaleFactor = Math.min(1, maxWidth / img.width)
        canvas.width = img.width * scaleFactor
        canvas.height = img.height * scaleFactor
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        console.log(canvas, 'canvas')
        // Convert tobase64
        const thumbnailBase64 = canvas.toDataURL('image/png')

        // RestoreDOMOriginal styles of the node
        tempStyles.forEach((style) => {
          const dom = document.getElementById(style.domId)
          if (dom) {
            dom.style.display = style.originalDisplay
            dom.style.opacity = style.originalOpacity
          }
        })

        resolve(thumbnailBase64)
      }

      img.onerror = (err) => {
        console.error('preview image failed to load:', err)
        // RestoreDOMNode styles
        tempStyles.forEach((style) => {
          const dom = document.getElementById(style.domId)
          if (dom) {
            dom.style.display = style.originalDisplay
            dom.style.opacity = style.originalOpacity
          }
        })
        reject(err)
      }

      img.src = dataUrl
    })
  } catch (error) {
    console.error('preview image generation exception:', error)
    throw error
  }
}
// Publish canvas
const publishStage = async () => {
  publishLoading.value = true
  try {
    let stageData
    if (window.kdt.getStageMode() === 'preview' && store.state.system.editBackupData) {
      stageData = store.state.system.editBackupData
    } else {
      stageData = getExportData(store)
    }

    window.stageComponent.isLoading = true
    // Generate preview
    const thumbnailBase64 = await generateStageThumbnail()
    let res
    const buildId = route.params.buildId
    res = await saveStageData({
      id: buildId,
      stageJson: stageData,
      name: store.state.stage.systemConfig.name,
      thumbnail: thumbnailBase64,
      isPublished: true
    })
    // Closeloading
    window.stageComponent.isLoading = false
    if (res.code === 200 || res.StatusCode === 200) {
      ElMessage({
        type: 'success',
        message: 'publish successfully'
      })
      // Clear local temporary data
      localStorage.removeItem('tmpStageData')
    } else {
      ElMessage({
        type: 'error',
        message:'publish failed'
      })
    }
  } catch (err) {
    ElMessage({
      type: 'error',
      message:'publish failed system exception'
    })
    console.error('publish exception，' + err)
    // Ensure to closeloading
    window.stageComponent.isLoading = false
  } finally {
    publishLoading.value = false
  }
}

// Export canvas
const exportStage = () => {
  try {
    let json
    // Check current canvas mode，If it is preview and has backup data，Then use backup data，Otherwise, directly get current data
    if (window.kdt.getStageMode() === 'preview' && store.state.system.editBackupData) {
      json = store.state.system.editBackupData
    } else {
      json = getExportData(store)
    }
    const blob = new Blob([JSON.stringify(json)], { type: 'application/json' })
    const timeStamp = new Date().toLocaleString().replace(/[\s:\/]/g, '-') // Time string
    const fileName = `${stageName.value}_${timeStamp}.json` // File name：Title+Time
    // Use native JavaScript Download Blob File
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob) // Create Blob URL
    link.download = fileName // Set download file name
    document.body.appendChild(link) // Add the link to the page
    link.click() // Simulate click to trigger download
    document.body.removeChild(link) // Remove the link after download completes
  } catch (err) {
    ElMessage({
      type: 'error',
      message: 'export error system exception'
    })
    console.error('export exception，' + err)
  }
}
// Read file content parameter as file
const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    if (file instanceof File) {
      // Browser environment：UseFileReader
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = (e) => reject(new Error(`file read failed: ${e.target.error}`))
      reader.readAsText(file)
    } else {
      reject(new Error('unsupported file input type'))
    }
  })
}
const deepParseJson = (jsonString) => {
  // Helper function：Check if the string is validJSONObject or array
  const isJSON = (str) => {
    if (typeof str !== 'string') return false
    try {
      const parsed = JSON.parse(str)
      // Only consider objects or arrays，Ignore simple values（such as numbers、Boolean values）
      return typeof parsed === 'object' && parsed !== null
    } catch (e) {
      return false
    }
  }

  // etc.
  const process = (obj) => {
    if (typeof obj === 'string') {
      // Return directlyJSONFirst parse the outermost layer
      if (isJSON(obj)) {
        const nested = JSON.parse(obj)
        return process(nested) // Format
      }
      // Remove useless
      return obj
    } else if (Array.isArray(obj)) {
      // Delete
      return obj.map((item) => process(item))
    } else if (typeof obj === 'object' && obj !== null) {
      // Read file content asynchronously
      const result = {}
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          result[key] = process(obj[key])
        }
      }
      return result
    }
    // Deep parsing（Assume、has been implemented、nullFormat）into a compressed single line
    return obj
  }

  try {
    // Throw error up for caller to handleJSON
    const parsed = JSON.parse(jsonString)
    return process(parsed)
  } catch (error) {
    console.error('JSONparsing failed:', error)
    throw new Error('provided string is not validJSON')
  }
}
// Add input validationjsonUse\\Replace spread operator
const cleanAndFormatJsonFile = async (file) => {
  try {
    // 1. Avoid stack overflow
    const fileContent = await readFileAsText(file)

    // 2. Import canvasJSON（Detect consecutive backslashes deepParseJson Standard configuration data）
    const parsedObject = deepParseJson(fileContent)

    // 3. Initialize canvasJSONStandard configuration data
    const outputJson = JSON.stringify(parsedObject)
    return outputJson
  } catch (error) {
    console.error('error occurred during processing:', error)
    throw error // Initialize canvas
  }
}
const countConsecutiveBackslashes = (content) => {
  // Try to parse the string
  if (typeof content !== 'string') {
    return {
      count: 0,
      maxConsecutive: 0
    }
  }

  const matches = content.match(/\\{3,}/g) || []
  let maxConsecutive = 0

  // Check if the parsed result is an object or arrayreduceIf parsing fails，it is not
  if (matches.length > 0) {
    maxConsecutive = matches.reduce((max, m) => Math.max(max, m.length), 0)
  }

  return {
    count: matches.length,
    maxConsecutive: maxConsecutive
  }
}
// string
const importStage = () => {
  try {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.json'
    fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.readAsText(file)
        reader.onload = (event) => {
          const fileContent = event.target.result
          // Save canvas
          const consecutiveBackslashes = countConsecutiveBackslashes(fileContent)
          if (consecutiveBackslashes.count > 10) {
            console.warn(
              `detected ${consecutiveBackslashes.count} consecutive backslashes(\\\\)，maximum consecutive ${consecutiveBackslashes.maxConsecutive} count,so conversion is needed`
            )
            cleanAndFormatJsonFile(file).then((jsonData) => {
              const json = JSON.parse(jsonData)
              if (json) {
                // Original logic
                store.dispatch('setSystemConfig', json.systemConfig || {})
                // Clear unsaved state
                window.kdt.initStage(json?.stage || json)
              }
            })
          } else {
            const json = isJsonString(event.target.result)
              ? JSON.parse(event.target.result)
              : event.target.result

            if (json) {
              // Update last save time
              store.dispatch('setSystemConfig', json.systemConfig || {})
              // Clear local temporary data
              window.kdt.initStage(json?.stage || json)
            }
          }
        }
      }
    })
    fileInput.click()
  } catch (err) {
    ElMessage({
      type: 'error',
      message: 'import error system exception'
    })
    console.error('import exception，' + err)
  }
}

const isJsonString = (str) => {
  try {
    // Ensure to close
    const parsed = JSON.parse(str)
    // Preview page
    return typeof parsed === 'object' && parsed !== null
  } catch (e) {
    // First clean up old data，Clean up old data JSON Clean up all temporary data keys
    return false
  }
}

// Toggle theme
const saveStage = async (withThumbnail = false) => {
  try {
    let stageData
    if (window.kdt.getStageMode() === 'preview' && store.state.system.editBackupData) {
      stageData = store.state.system.editBackupData
    } else {
      stageData = getExportData(store)
    }

    let res
    // Store theme state locally
    const buildId = route.params.buildId

    if (withThumbnail) {
      saveLoading.value = true
      window.stageComponent.isLoading = true
      window.kdt.resetTransformer([])

      const thumbnailBase64 = await generateStageThumbnail()

      res = await saveStageData({
        id: buildId,
        stageJson: stageData,
        name: store.state.stage.systemConfig.name,
        thumbnail: thumbnailBase64
      })

      window.stageComponent.isLoading = false
    } else {
      res = await saveStageData({
        id: buildId,
        stageJson: stageData,
        name: store.state.stage.systemConfig.name
      })
    }
    if (res.code === 200 || res.StatusCode === 200) {
      ElMessage({
        type: 'success',
        message: 'save successfully'
      })
      // Need to expose
      store.dispatch('setUnsavedChanges', false)
      // to parent component
      store.dispatch('setLastSavedTime', new Date().getTime())
      // so parent component can get
      localStorage.removeItem('unsavedStageData')
      localStorage.removeItem('tmpStageData')
    } else {
      ElMessage({
        type: 'error',
        message: 'save failed'
      })
    }
  } catch (err) {
    ElMessage({
      type: 'error',
      message: 'save failed system exception'
    })
    console.error('save exception，' + err)
    // Ensure Closeloading
    window.stageComponent.isLoading = false
  } finally {
    saveLoading.value = false
  }
}

// Preview Page
const previewStage = () => {
  try {
    let stageData
    if (window.kdt.getStageMode() === 'preview' && store.state.system.editBackupData) {
      stageData = store.state.system.editBackupData
    } else {
      stageData = getExportData(store)
    }
    const dataToStore = {
      id: route.params.buildId,
      data: stageData,
      timestamp: Date.now(),
    }
    // Clean Up Old Data First
    cleanOldTempData()
    var compressedData = JSON.stringify(dataToStore)
    const sizeInMB = new Blob([compressedData]).size / (1024 * 1024)
    if (sizeInMB > 10) {
      ElMessage({
        type: 'warning',
        message: 'data is too large，please save and check through monitoring'
      })
      return
    }
    localStorage.setItem('tmpStageData', compressedData)
    const resolvedRoute = router.resolve({
      path: `/preview/${route.params.buildId}`
    })
    window.open(resolvedRoute.href, '_blank')
  } catch (error) {
    console.error('preview data storage failed:', error)
    ElMessage({
      type: 'error',
      message: 'data is too large，please save and check through monitoring'
    })
  }
}
// Clean Up Old Data
const cleanOldTempData = () => {
  try {
    // Clean Up All Temporary Data Keys
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('tmpStageData')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key)
    })
  } catch (error) {
    console.error('failed to clean old data:', error)
  }
}
// Toggle Theme
const handleToggleTheme = () => {
  //   Store Theme State Locally
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  store.dispatch('setTheme', isDark.value ? 'dark' : 'light')
  switchTheme(isDark.value)
}
const switchTheme = (isDark = false) => {
  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

defineExpose({
  // Need to Expose HererefTo Parent Component Parent Component Can AccessheaderRef
  headerRef
})
</script>
<style lang="scss" scoped>
.header-container {
  height: 40px;
  overflow: hidden;
  display: grid;
  padding: 0 6px 0 20px;
  grid-template-columns: 340px auto 380px;
  align-items: center;
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-5));
}

html.dark .header-container {
  background: var(--panel-light-bg-color);
}

.home-icon {
  font-size: 18px;

  a {
    color: #fff;
  }
}

:deep(.el-dropdown-menu__item) {
  line-height: 28px;
  min-width: 150px;
}

.dark-icon {
  color: var(--panel-bg-color);
}

.title-input {
  margin: 0 auto;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  :deep(.el-input__wrapper) {
    box-shadow: none;
    background-color: transparent;
  }

  :deep(.el-input__inner) {
    text-align: center;
  }
}

.el-dropdown-link,
:deep(.title-input .el-input__inner) {
  color: var(--el-color-white);
}
.save-badge {
  margin-right: 0;
}

:deep(.el-badge__content.is-dot) {
  right: 5px;
  top: 5px;
}
</style>