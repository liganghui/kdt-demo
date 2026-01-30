<template>
  <el-dialog
    title="快捷键"
    :model-value="visible"
    width="40%"
    @close="handleClose"
    @open="loadHotkeys"
  >
    <el-scrollbar :max-height="500">
      <el-input
        v-model="searchQuery"
        placeholder="搜索快捷键"
        clearable
        style="margin-bottom: 20px"
      >
        <template #prefix>
          <el-icon>
            <Search />
          </el-icon>
        </template>
      </el-input>

      <el-table :data="filteredHotkeys" style="width: 100%" size="small" border>
        <el-table-column prop="key" label="按键" width="240"></el-table-column>
        <el-table-column prop="description" label="功能说明"></el-table-column>
      </el-table>
    </el-scrollbar>

    <div class="mt20 text-r">
      <el-button @click="handleClose">关闭</el-button>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible'])

const searchQuery = ref('')
const hotkeys = ref([])

// 当弹窗打开时加载快捷键
function loadHotkeys() {
  if (window.kdt) {
    hotkeys.value = window.kdt.getHotKeyList()
  } else {
    this.$message('获取快捷键信息失败')
  }
}

const filteredHotkeys = computed(() => {
  if (!searchQuery.value) {
    return hotkeys.value
  }
  return hotkeys.value.filter(
    (item) =>
      item.key.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

function handleClose() {
  emit('close', false)
}
</script>

<style scoped>
.dialog-footer {
  text-align: right;
}
</style>
