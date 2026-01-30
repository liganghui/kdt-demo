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
            <span class="ml4">edit</span>
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

// Defineprops
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
        default: false  // Controls whether to auto - format
    }
})

const store = useStore()
const emit = defineEmits(['update', 'edit', 'codeChange', 'validate'])
const { height, language, codeValue, readonly, minimap, fontSize, showLineNumbers, autoFormat } = toRefs(props)

const MONACO_EDITOR_OPTIONS = {
    automaticLayout: true,
    formatOnType: false,  // Disables auto - formatting while typing
    formatOnPaste: true
}

// Calculate editor options
const editorOptions = computed(() => ({
    ...MONACO_EDITOR_OPTIONS,
    readOnly: readonly.value,
    readOnlyMessage: {
        value: 'disable editing'
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
const isInternalUpdate = ref(false) // Mark whether it is an internal update
let formatTimer = null // Debounce timer

// Utility function：Calculate code statistics
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

// Debounce formatting function
const debouncedFormat = () => {
    if (formatTimer) {
        clearTimeout(formatTimer)
    }
    formatTimer = setTimeout(() => {
        if (autoFormat.value && !readonly.value) {
            formatCode()
        }
    }, 1000) // User stops typing1Format again after seconds
}

// When codeValue When it changes，Sync update internalCode
watch(codeValue, (newVal) => {
    if (!isInternalUpdate.value) {
        internalCode.value = String(newVal)
        // Only format during initialization，Avoid formatting while typing
        nextTick(() => {
            if (autoFormat.value) {
                formatCode()
            }
        })
        emitCodeChange(internalCode.value)
    }
})

// When internalCode When it changes，Trigger update:codeValue Event
watch(internalCode, (newVal) => {
    isInternalUpdate.value = true
    emit('update', newVal)
    emitCodeChange(newVal)
    
    // Use debounce formatting
    if (autoFormat.value) {
        debouncedFormat()
    }
    
    nextTick(() => {
        isInternalUpdate.value = false
    })
})

// Emit code change event，Include statistical information
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
    // Format during initialization
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
    
    // Validation event
    emit('validate', {
        errors: errArr.value,
        hasErrors: errArr.value.length > 0
    })
    
    // Code change event
    emitCodeChange(internalCode.value)
}

// Check if code has syntax errors
const checkCodeForErrors = () => {
    if (errArr.value.length > 0) {
        ElMessage({
            type: 'error',
            message: 'syntax error in script，please modify and try again'
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

// Set editor value
const setValue = (value) => {
    internalCode.value = String(value)
    emitCodeChange(internalCode.value)
}

// Get code statistics
const getStats = () => {
    return getCodeStats(internalCode.value)
}

// Manually format code
const manualFormat = () => {
    formatCode()
}

// Auto - addreturnStatement
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

// Simplify to a single line（Removereturn）
const simplifyToExpression = () => {
    const trimmed = internalCode.value.trim()
    if (trimmed.startsWith('return ')) {
        internalCode.value = trimmed.substring(7)
        return true
    }
    return false
}

// Get processed code
const getProcessedCode = () => {
    const stats = getCodeStats(internalCode.value)
    // If there is only one line of valid code and there is noreturn，Auto - add
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
    formatCode: manualFormat, // Expose manual formatting method
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