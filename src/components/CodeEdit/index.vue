<template>
    <div class="editor-wrapper">
        <vue-monaco-editor 
            :style="{ height: height }" 
            :language="language" 
            v-model:value="internalCode"
            :theme="store.state.system.theme === 'dark' ? 'vs-dark' : 'vs'" 
            :options="editorOptions"
            @mount="handleMount" 
            :onValidate="handleValidate" 
        />
        
        <div class="readonly-mask" :style="{ height: height }" v-if="readonly && allowEdit" @click="handleEdit">
            <el-icon>
                <EditPen />
            </el-icon>
            <span class="ml4">编辑</span>
        </div>
    </div>
</template>

<script setup>
import { useStore } from 'vuex'
import {
    ref,
    shallowRef,
    watch,
    toRefs,
    computed,
    nextTick
} from 'vue'
import { ElMessage } from 'element-plus'

// 定义props
const props = defineProps({
    height: {
        type: String,
        default: '200px'
    },
    allowEdit: {
        type: Boolean,
        default: true
    },
    language: {
        type: String,
        default: 'javascript'
    },
    codeValue: {
        type: [String, Object, Number, Boolean],
        default: ''
    },
    minimap: {
        type: Boolean,
        default: true
    },
    readonly: {
        type: Boolean,
        default: false
    },
    showLineNumbers: {
        type: Boolean,
        default: true
    },
    fontSize: {
        type: Number,
        default: 14
    },
    autoFormat: {
        type: Boolean,
        default: false  // 控制是否自动格式化
    }
})

const store = useStore()
const emit = defineEmits(['update', 'edit', 'codeChange', 'validate'])
const { height, language, codeValue, readonly, minimap, fontSize, showLineNumbers, autoFormat } = toRefs(props)

const MONACO_EDITOR_OPTIONS = {
    automaticLayout: true,
    formatOnType: false,  // 禁用输入时自动格式化
    formatOnPaste: true
}

// 计算编辑器选项
const editorOptions = computed(() => ({
    ...MONACO_EDITOR_OPTIONS,
    readOnly: readonly.value,
    readOnlyMessage: {
        value: '禁止编辑'
    },
    fontSize: fontSize.value,
    lineNumbers: showLineNumbers.value ? 'on' : 'off',
    renderLineHighlight: readonly.value ? 'none' : 'all',
    minimap: { enabled: !minimap },
    scrollbar: {
        vertical: readonly.value ? 'hidden' : 'visible',
        horizontal: readonly.value ? 'hidden' : 'visible'
    }
}))

const internalCode = ref(String(codeValue.value));
const errArr = ref([])
const editorRef = shallowRef()
const isInternalUpdate = ref(false) // 标记是否为内部更新
let formatTimer = null // 防抖定时器

// 工具函数：计算代码统计信息
function getCodeStats(code) {
    if (!code || typeof code !== 'string') {
        return { total: 0, effective: 0, empty: 0, comments: 0 }
    }
    
    const lines = code.split('\n')
    const stats = {
        total: lines.length,
        effective: 0,
        empty: 0,
        comments: 0
    }
    
    lines.forEach(line => {
        const trimmed = line.trim()
        if (trimmed === '') {
            stats.empty++
        } else if (trimmed.startsWith('//') || trimmed.startsWith('/*') || 
                  trimmed === '*/' || trimmed.match(/^\s*\/\*.*\*\/\s*$/)) {
            stats.comments++
        } else {
            stats.effective++
        }
    })
    
    return stats
}

// 防抖格式化函数
const debouncedFormat = () => {
    if (formatTimer) {
        clearTimeout(formatTimer)
    }
    formatTimer = setTimeout(() => {
        if (autoFormat.value && !readonly.value) {
            formatCode()
        }
    }, 1000) // 用户停止输入1秒后再格式化
}

// 当 codeValue 变化时，同步更新 internalCode
watch(codeValue, (newVal) => {
    if (!isInternalUpdate.value) {
        internalCode.value = String(newVal)
        // 只在初始化时格式化，避免输入时格式化
        nextTick(() => {
            if (autoFormat.value) {
                formatCode()
            }
        })
        emitCodeChange(internalCode.value)
    }
})

// 当 internalCode 变化时，触发 update:codeValue 事件
watch(internalCode, (newVal) => {
    isInternalUpdate.value = true
    emit('update', newVal)
    emitCodeChange(newVal)
    
    // 使用防抖格式化
    if (autoFormat.value) {
        debouncedFormat()
    }
    
    nextTick(() => {
        isInternalUpdate.value = false
    })
})

// 发射代码变化事件，包含统计信息
function emitCodeChange(code) {
    const stats = getCodeStats(code)
    const hasReturn = /\breturn\s+/.test(code)
    
    emit('codeChange', {
        code,
        stats,
        hasReturn,
        hasErrors: errArr.value.length > 0,
        errors: errArr.value
    })
}

const handleMount = (editor) => {
    editorRef.value = editor
    // 初始化时格式化
    if (autoFormat.value) {
        nextTick(() => {
            formatCode()
        })
    }
    emitCodeChange(internalCode.value)
}

const formatCode = () => {
    if (!editorRef.value) return
    
    if (readonly.value) {
        editorRef.value.updateOptions({ readOnly: false })
        setTimeout(() => {
            editorRef.value?.trigger('anyString', 'editor.action.formatDocument')
            setTimeout(() => {
                editorRef.value.updateOptions({ readOnly: true })
            }, 100)
        }, 50)
    } else {
        editorRef.value?.trigger('anyString', 'editor.action.formatDocument')
    }
}

const handleValidate = (e) => {
    errArr.value = e.filter((item) => {
        return item.code !== '6133'
    })
    
    // 验证事件
    emit('validate', {
        errors: errArr.value,
        hasErrors: errArr.value.length > 0
    })
    
    // 代码变化事件
    emitCodeChange(internalCode.value)
}

// 检查代码是否有语法错误
const checkCodeForErrors = () => {
    if (errArr.value.length > 0) {
        ElMessage({
            type: 'error',
            message: '脚本中存在语法错误，请修改后再试'
        })
        return false
    }
    return true
}

const handleEdit = () => {
    emit('edit')
}

const getValue = () => {
    try {
        const value = JSON.parse(internalCode.value);
        if (typeof value === 'string' || typeof value === 'number') {
            return internalCode.value;
        }
        return value;
    } catch (e) {
        return internalCode.value;
    }
}

// 设置编辑器值
const setValue = (value) => {
    internalCode.value = String(value)
    emitCodeChange(internalCode.value)
}

// 获取代码统计信息
const getStats = () => {
    return getCodeStats(internalCode.value)
}

// 手动格式化代码
const manualFormat = () => {
    formatCode()
}

// 自动添加return语句
const autoAddReturn = () => {
    const lines = internalCode.value.split('\n')
    const lastEffectiveLine = lines.reverse().find(line => line.trim() && !line.trim().startsWith('//'))
    
    if (lastEffectiveLine && !lastEffectiveLine.trim().startsWith('return')) {
        const lastIndex = internalCode.value.lastIndexOf(lastEffectiveLine.trim())
        const newCode = internalCode.value.substring(0, lastIndex) + 
                       'return ' + lastEffectiveLine.trim() + 
                       internalCode.value.substring(lastIndex + lastEffectiveLine.trim().length)
        internalCode.value = newCode
        return true
    }
    return false
}

// 简化为单行（移除return）
const simplifyToExpression = () => {
    const trimmed = internalCode.value.trim()
    if (trimmed.startsWith('return ')) {
        internalCode.value = trimmed.substring(7)
        return true
    }
    return false
}

// 获取处理后的代码
const getProcessedCode = () => {
    const stats = getCodeStats(internalCode.value)
    // 如果只有一行有效代码且没有return，自动添加
    if (stats.effective === 1) {
        const trimmed = internalCode.value.trim()
        if (!trimmed.startsWith('return ')) {
            return `return ${trimmed}`
        }
    }
    
    return internalCode.value
}

defineExpose({
    checkCodeForErrors,
    getValue,
    formatCode: manualFormat, // 暴露手动格式化方法
    setValue,
    getStats,
    autoAddReturn,
    simplifyToExpression,
    getProcessedCode
})
</script>

<style scoped lang="scss">
.editor-wrapper {
    position: relative;
    border: 1px solid var(--el-border-color-light);
    border-radius: 4px;
    overflow: hidden;
}

.editor-wrapper:hover .readonly-mask {
    opacity: 1;
}

.readonly-mask {
    position: absolute;
    top: 0;
    opacity: 0;
    transition: 0.3s all;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.3);
    letter-spacing: 2px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--text-color);
    cursor: pointer;
    font-size: 14px;
}
</style>