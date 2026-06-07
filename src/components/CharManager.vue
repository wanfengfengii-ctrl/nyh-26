<template>
  <div class="char-manager">
    <n-card title="字库管理" :bordered="false" size="small">
      <n-space vertical :size="12" style="width: 100%">
        <n-input
          v-model:value="searchQuery"
          placeholder="搜索字符..."
          clearable
          size="small"
        />
        <n-button
          type="primary"
          size="small"
          block
          @click="showAddDialog = true"
        >
          添加活字
        </n-button>
      </n-space>
    </n-card>

    <n-card title="活字列表" :bordered="false" size="small" style="margin-top: 16px">
      <n-scrollbar style="max-height: 400px">
        <n-list bordered :show-divider="false" size="small">
          <n-list-item
            v-for="char in filteredChars"
            :key="char.char"
            class="char-item"
          >
            <div class="char-info">
              <span class="char-display">{{ char.char }}</span>
              <span class="char-pos">({{ char.x }}, {{ char.y }})</span>
              <n-tag size="small" type="info">库存: {{ char.stock }}</n-tag>
            </div>
            <n-space>
              <n-button size="tiny" text @click="editChar(char)">编辑</n-button>
              <n-button size="tiny" text type="error" @click="handleDelete(char.char)">删除</n-button>
            </n-space>
          </n-list-item>
          <n-list-item v-if="filteredChars.length === 0" class="empty-item">
            暂无字符
          </n-list-item>
        </n-list>
      </n-scrollbar>
    </n-card>

    <n-modal
      v-model:show="showAddDialog"
      :title="editingChar ? '编辑活字' : '添加活字'"
      preset="dialog"
      positive-text="确定"
      negative-text="取消"
      @positive-click="handleSubmit"
    >
      <n-form label-placement="left" :label-width="80">
        <n-form-item label="字符">
          <n-input
            v-model:value="formData.char"
            maxlength="1"
            placeholder="请输入单个字符"
            :disabled="!!editingChar"
          />
        </n-form-item>
        <n-form-item label="X 坐标">
          <n-input-number
            v-model:value="formData.x"
            :min="0"
            :max="gridConfig.cols - 1"
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item label="Y 坐标">
          <n-input-number
            v-model:value="formData.y"
            :min="0"
            :max="gridConfig.rows - 1"
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item label="库存量">
          <n-input-number
            v-model:value="formData.stock"
            :min="1"
            :max="999"
            style="width: 100%"
          />
        </n-form-item>
      </n-form>
    </n-modal>

    <n-modal
      v-model:show="showDeleteConfirm"
      title="确认删除"
      preset="dialog"
      content="确定要删除这个活字吗？"
      positive-text="删除"
      negative-text="取消"
      positive-button-props="{ type: 'error' }"
      @positive-click="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCompositorStore } from '@/stores/compositor'
import { storeToRefs } from 'pinia'
import { useMessage } from 'naive-ui'
import type { TypeChar } from '@/types'
import {
  NCard,
  NInput,
  NButton,
  NSpace,
  NList,
  NListItem,
  NTag,
  NModal,
  NForm,
  NFormItem,
  NInputNumber,
  NScrollbar
} from 'naive-ui'

const store = useCompositorStore()
const { characters, gridConfig } = storeToRefs(store)
const { addCharacter, removeCharacter, updateCharacter } = store

const message = useMessage()

const searchQuery = ref('')
const showAddDialog = ref(false)
const showDeleteConfirm = ref(false)
const editingChar = ref<TypeChar | null>(null)
const deletingChar = ref('')

const formData = ref({
  char: '',
  x: 0,
  y: 0,
  stock: 1
})

const filteredChars = computed(() => {
  if (!searchQuery.value) return characters.value
  return characters.value.filter(c => c.char.includes(searchQuery.value))
})

function editChar(char: TypeChar) {
  editingChar.value = char
  formData.value = {
    char: char.char,
    x: char.x,
    y: char.y,
    stock: char.stock
  }
  showAddDialog.value = true
}

function handleDelete(char: string) {
  deletingChar.value = char
  showDeleteConfirm.value = true
}

function confirmDelete() {
  removeCharacter(deletingChar.value)
  message.success('删除成功')
  showDeleteConfirm.value = false
  deletingChar.value = ''
}

function handleSubmit() {
  if (!formData.value.char) {
    message.warning('请输入字符')
    return
  }
  
  if (editingChar.value) {
    const result = updateCharacter(editingChar.value.char, {
      x: formData.value.x,
      y: formData.value.y,
      stock: formData.value.stock
    })
    if (result.success) {
      message.success('更新成功')
      showAddDialog.value = false
      editingChar.value = null
    } else {
      message.error(result.message || '更新失败')
    }
  } else {
    const result = addCharacter({
      char: formData.value.char,
      x: formData.value.x,
      y: formData.value.y,
      stock: formData.value.stock
    })
    if (result.success) {
      message.success('添加成功')
      showAddDialog.value = false
      resetForm()
    } else {
      message.error(result.message || '添加失败')
    }
  }
}

function resetForm() {
  formData.value = { char: '', x: 0, y: 0, stock: 1 }
  editingChar.value = null
}
</script>

<style scoped>
.char-manager {
  width: 320px;
}

.char-item {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  padding: 8px 12px !important;
}

.char-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.char-display {
  font-size: 18px;
  font-weight: 500;
  min-width: 24px;
  text-align: center;
}

.char-pos {
  color: #999;
  font-size: 12px;
  font-family: monospace;
}

.empty-item {
  text-align: center;
  color: #999;
  justify-content: center !important;
}
</style>
