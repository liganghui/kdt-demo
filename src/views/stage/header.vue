<template>
  <div class="header-container" :key="key" ref="headerRef">
    <div class="menu-wrapper flex flex-a-center no-select">
      <el-icon class="home-icon pointer">
        <el-tooltip content="查看首页" placement="bottom">
          <a href="https://cloud.yu-con.com/login">
            <HomeFilled />
          </a>
        </el-tooltip>
      </el-icon>
      <el-space :size="24">
        <el-dropdown class="ml20" placement="bottom">
          <span class="el-dropdown-link pointer"> 文件 </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="importStage">
                <p>
                  <span>导入文件</span>
                </p>
              </el-dropdown-item>
              <el-dropdown-item @click="exportStage">
                <p>
                  <span>导出文件</span>
                </p>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown placement="bottom" v-if="isViteDev">
          <span class="el-dropdown-link pointer"> 工具 </span>
          <template #dropdown>
            <el-dropdown-menu class="custom-dropdown">
              <el-dropdown-item @click="toggleStats">
                <div class="flex-j-b flex-a-c" style="width: 100px">
                  <span>性能监视器</span>
                  <el-icon v-if="statsVisible"><Select /></el-icon>
                </div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown placement="bottom">
          <span class="el-dropdown-link pointer"> 帮助 </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="shortcutKeyDialogVisible = true">
                <span>快捷键</span>
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
            <span class="ml4">预览</span>
          </el-button>
          <el-popconfirm
            title="是否需要同时保存缩略图"
            width="220"
            @confirm="saveStage(true)"
            confirm-button-text="同时保存"
            cancel-button-text="不同时保存"
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
                  <span class="ml4">保存</span>
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
            <span class="ml4">发布</span>
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
// 检测是否为预览模式
const isPreviewMode = computed(() => {
  return !store.state.system.isPanelShow
})
// 是否存在未保存的
const hasUnsavedChanges = computed(() => {
  return !!store.state.system.unsavedChanges
})

const stageName = computed({
  get() {
    return store.state.stage.systemConfig?.name || ''
  },
  set(value) {
    // 更新 store 中的 name
    const updatedConfig = {
      ...store.state.stage.systemConfig,
      name: value
    }
    store.dispatch('setSystemConfig', updatedConfig)
  }
})
const isDark = ref(false)
const shortcutKeyDialogVisible = ref(false)
const isViteDev = import.meta.env.DEV // 判断是否是 Vite 的开发环境
const statsVisible = ref(isViteDev) // 开发环境默认显示性能监视器
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
  //  初始化主题
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
// 生成画布预览图
const generateStageThumbnail = async () => {
  try {
    const stage = window.kdt.state.stage
    const originalScale = stage.scaleX()
    const originalPosition = stage.position()
    const originalWidth = stage.width()
    const originalHeight = stage.height()
    const domRects = stage.find('.dom-rect')
    const tempStyles = []

    // 为dom-rect节点添加临时样式，使其在截图中可见
    domRects.forEach((rect) => {
      const domId = rect.attrs.domId
      const dom = document.getElementById(domId)

      if (dom) {
        // 保存当前样式
        tempStyles.push({
          domId,
          originalDisplay: dom.style.display,
          originalOpacity: dom.style.opacity
        })
        // 确保DOM元素可见
        dom.style.display = 'block'
        // dom.style.backgroundColor = 'green'
        dom.style.opacity = '1'
      }
    })

    stage.scale({ x: 1, y: 1 })
    stage.position({ x: 0, y: 0 })
    window.kdt.updateDomPosition()
    stage.batchDraw()

    // 等待DOM更新完成
    await new Promise((resolve) => setTimeout(resolve, 100))

    const konvaContainer = document.querySelector('.konvajs-content')
    // 配置选项
    const options = {
      quality: 0.85,
      width: originalWidth,
      height: originalHeight
    }
    // 生成PNG图像
    // const dom = await snapdom.toPng(konvaContainer, options)

    // console.log(dom,'dom')
    // const dataUrl=dom.src
    const dataUrl = stage.toDataURL({
      mimeType: 'image/png',
      quality: 0.85,
      width: originalWidth,
      height: originalHeight,
      pixelRatio: 1 // 可以根据需要调整这个值
    })
    // 恢复舞台状态
    stage.scale({ x: originalScale, y: originalScale })
    stage.position({ x: originalPosition.x, y: originalPosition.y })
    window.kdt.updateDomPosition()
    stage.batchDraw()
    // 缩放到合适的尺寸
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
        // 转换为base64
        const thumbnailBase64 = canvas.toDataURL('image/png')

        // 恢复DOM节点的原始样式
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
        console.error('预览图加载失败:', err)
        // 恢复DOM节点样式
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
    console.error('生成预览图异常:', error)
    throw error
  }
}
// 发布画布
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
    // 生成预览图
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
    // 关闭loading
    window.stageComponent.isLoading = false
    if (res.code === 200 || res.StatusCode === 200) {
      ElMessage({
        type: 'success',
        message: '发布成功'
      })
      // 清除本地临时数据
      localStorage.removeItem('tmpStageData')
    } else {
      ElMessage({
        type: 'error',
        message:'发布失败'
      })
    }
  } catch (err) {
    ElMessage({
      type: 'error',
      message:'发布失败 系统异常'
    })
    console.error('发布异常，' + err)
    // 确保关闭loading
    window.stageComponent.isLoading = false
  } finally {
    publishLoading.value = false
  }
}

// 导出画布
const exportStage = () => {
  try {
    let json
    // 检查当前画布模式，如果为预览且有备份数据，则使用备份数据，否则直接获取当前数据
    if (window.kdt.getStageMode() === 'preview' && store.state.system.editBackupData) {
      json = store.state.system.editBackupData
    } else {
      json = getExportData(store)
    }
    const blob = new Blob([JSON.stringify(json)], { type: 'application/json' })
    const timeStamp = new Date().toLocaleString().replace(/[\s:\/]/g, '-') // 时间字符串
    const fileName = `${stageName.value}_${timeStamp}.json` // 文件名：标题+时间
    // 使用原生 JavaScript 下载 Blob 文件
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob) // 创建 Blob URL
    link.download = fileName // 设置下载文件名
    document.body.appendChild(link) // 将链接添加到页面
    link.click() // 模拟点击触发下载
    document.body.removeChild(link) // 下载完成后移除链接
  } catch (err) {
    ElMessage({
      type: 'error',
      message: '导出错误 系统异常'
    })
    console.error('导出异常，' + err)
  }
}
// 读取文件内容参数为文件
const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    if (file instanceof File) {
      // 浏览器环境：使用FileReader
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = (e) => reject(new Error(`文件读取失败: ${e.target.error}`))
      reader.readAsText(file)
    } else {
      reject(new Error('不支持的文件输入类型'))
    }
  })
}
const deepParseJson = (jsonString) => {
  // 辅助函数：检查字符串是否是有效的JSON对象或数组
  const isJSON = (str) => {
    if (typeof str !== 'string') return false
    try {
      const parsed = JSON.parse(str)
      // 只考虑对象或数组，忽略简单值（如数字、布尔值）
      return typeof parsed === 'object' && parsed !== null
    } catch (e) {
      return false
    }
  }

  // 递归处理函数
  const process = (obj) => {
    if (typeof obj === 'string') {
      // 只解析看起来像JSON对象或数组的字符串
      if (isJSON(obj)) {
        const nested = JSON.parse(obj)
        return process(nested) // 递归解析嵌套内容
      }
      // 否则直接返回原始字符串
      return obj
    } else if (Array.isArray(obj)) {
      // 处理数组中的每个元素
      return obj.map((item) => process(item))
    } else if (typeof obj === 'object' && obj !== null) {
      // 处理对象中的每个属性
      const result = {}
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          result[key] = process(obj[key])
        }
      }
      return result
    }
    // 其他类型（数字、布尔值、null等）直接返回
    return obj
  }

  try {
    // 首先解析最外层的JSON
    const parsed = JSON.parse(jsonString)
    return process(parsed)
  } catch (error) {
    console.error('JSON解析失败:', error)
    throw new Error('提供的字符串不是有效的JSON')
  }
}
// 格式化json将无用的\\删除
const cleanAndFormatJsonFile = async (file) => {
  try {
    // 1. 异步读取文件内容
    const fileContent = await readFileAsText(file)

    // 2. 深度解析JSON（假设 deepParseJson 已实现）
    const parsedObject = deepParseJson(fileContent)

    // 3. 格式化JSON为压缩单行
    const outputJson = JSON.stringify(parsedObject)
    return outputJson
  } catch (error) {
    console.error('处理过程中发生错误:', error)
    throw error // 向上抛出错误以便调用方处理
  }
}
const countConsecutiveBackslashes = (content) => {
  // 添加输入校验
  if (typeof content !== 'string') {
    return {
      count: 0,
      maxConsecutive: 0
    }
  }

  const matches = content.match(/\\{3,}/g) || []
  let maxConsecutive = 0

  // 使用reduce替代展开运算符，避免堆栈溢出
  if (matches.length > 0) {
    maxConsecutive = matches.reduce((max, m) => Math.max(max, m.length), 0)
  }

  return {
    count: matches.length,
    maxConsecutive: maxConsecutive
  }
}
// 导入画布
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
          // 检测连续反斜杠
          const consecutiveBackslashes = countConsecutiveBackslashes(fileContent)
          if (consecutiveBackslashes.count > 10) {
            console.warn(
              `检测到 ${consecutiveBackslashes.count} 处连续反斜杠(\\\\)，最多连续 ${consecutiveBackslashes.maxConsecutive} 个,所以需要走转换`
            )
            cleanAndFormatJsonFile(file).then((jsonData) => {
              const json = JSON.parse(jsonData)
              if (json) {
                // 标准组态数据
                store.dispatch('setSystemConfig', json.systemConfig || {})
                // 初始化画布
                window.kdt.initStage(json?.stage || json)
              }
            })
          } else {
            const json = isJsonString(event.target.result)
              ? JSON.parse(event.target.result)
              : event.target.result

            if (json) {
              // 标准组态数据
              store.dispatch('setSystemConfig', json.systemConfig || {})
              // 初始化画布
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
      message: '导入错误 系统异常'
    })
    console.error('导入异常，' + err)
  }
}

const isJsonString = (str) => {
  try {
    // 尝试解析字符串
    const parsed = JSON.parse(str)
    // 检查解析结果是否为对象或数组
    return typeof parsed === 'object' && parsed !== null
  } catch (e) {
    // 如果解析出错，则不是 JSON 字符串
    return false
  }
}

// 保存画布
const saveStage = async (withThumbnail = false) => {
  try {
    let stageData
    if (window.kdt.getStageMode() === 'preview' && store.state.system.editBackupData) {
      stageData = store.state.system.editBackupData
    } else {
      stageData = getExportData(store)
    }

    let res
    // 原有逻辑
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
        message: '保存成功'
      })
      // 清除未保存状态
      store.dispatch('setUnsavedChanges', false)
      // 更新最后保存时间
      store.dispatch('setLastSavedTime', new Date().getTime())
      // 清除本地临时数据
      localStorage.removeItem('unsavedStageData')
      localStorage.removeItem('tmpStageData')
    } else {
      ElMessage({
        type: 'error',
        message: '保存失败'
      })
    }
  } catch (err) {
    ElMessage({
      type: 'error',
      message: '保存失败 系统异常'
    })
    console.error('保存异常，' + err)
    // 确保关闭loading
    window.stageComponent.isLoading = false
  } finally {
    saveLoading.value = false
  }
}

// 预览页
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
    // 先清理旧数据
    cleanOldTempData()
    var compressedData = JSON.stringify(dataToStore)
    const sizeInMB = new Blob([compressedData]).size / (1024 * 1024)
    if (sizeInMB > 10) {
      ElMessage({
        type: 'warning',
        message: '数据过大，请保存后通过监控查看'
      })
      return
    }
    localStorage.setItem('tmpStageData', compressedData)
    const resolvedRoute = router.resolve({
      path: `/preview/${route.params.buildId}`
    })
    window.open(resolvedRoute.href, '_blank')
  } catch (error) {
    console.error('预览数据存储失败:', error)
    ElMessage({
      type: 'error',
      message: '数据过大，请保存后通过监控查看'
    })
  }
}
// 清理旧数据
const cleanOldTempData = () => {
  try {
    // 清理所有临时数据键
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
    console.error('清理旧数据失败:', error)
  }
}
// 切换主题
const handleToggleTheme = () => {
  //   存储主题状态到本地
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
  // 这里要暴露ref给父组件 父组件才能获取到headerRef
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