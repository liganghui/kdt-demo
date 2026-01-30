<template>
  <el-dialog
    title="Shortcut Keys"
    :model-value="visible"
    width="40%"
    @close="handleClose"
    @open="loadHotkeys"
  >
    <el-scrollbar :max-height="500">
      <el-input
        v-model="searchQuery"
        placeholder="search shortcut keys"
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
        <el-table-column prop="key" label="Key" width="240"></el-table-column>
        <el-table-column prop="description" label="Function Description"></el-table-column>
      </el-table>
    </el-scrollbar>

    <div class="mt20 text-r">
      <el-button @click="handleClose">close</el-button>
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

// Load shortcut keys when the popup opens
function loadHotkeys() {
  if (window.kdt) {
    hotkeys.value = window.kdt.getHotKeyList()
  } else {
    this.$message('failed to get shortcut key information')
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
