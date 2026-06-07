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
        <n-space :size="8" wrap>
          <n-button type="primary" size="small" @click="showAddDialog = true">
            添加活字
          </n-button>
          <n-button size="small" @click="showUndoRedo = !showUndoRedo">
            撤销/重做
          </n-button>
        </n-space>

        <div v-if="showUndoRedo" class="undo-redo-box">
          <n-space :size="8">
            <n-button
              size="small"
              :disabled="!canUndo"
              @click="handleUndo"
            >
              ↶ 撤销
            </n-button>
            <n-button
              size="small"
              :disabled="!canRedo"
              @click="handleRedo"
            >
              ↷ 重做
            </n-button>
          </n-space>
          <div class="history-hint">
            可撤销 {{ pastCount }} 步，可重做 {{ futureCount }} 步
          </div>
        </div>
      </n-space>
    </n-card>

    <n-card title="字符分组" :bordered="false" size="small" style="margin-top: 16px">
      <n-scrollbar style="max-height: 300px">
        <n-list bordered :show-divider="false" size="small">
          <n-list-item
            v-for="group in charGroups"
            :key="group.char"
            class="char-group-item"
            @click="toggleGroup(group.char)"
          >
            <div class="group-header">
              <span class="group-char">{{ group.char }}</span>
              <n-tag size="small" type="info">{{ group.count }} 个副本</n-tag>
              <n-tag size="small" type="success">库存 {{ group.totalStock }}</n-tag>
              <n-icon size="16" class="expand-icon" :class="{ expanded: expandedChars.has(group.char) }">
                <ChevronDown />
              </n-icon>
            </div>

            <div v-if="expandedChars.has(group.char)" class="group-detail">
              <n-space vertical :size="4" style="width: 100%">
                <div
                  v-for="instance in group.instances"
                  :key="instance.id"
                  class="instance-item"
                >
                  <span class="instance-pos">({{ instance.x }}, {{ instance.y }})</span>
                  <n-tag size="small">库存: {{ instance.stock }}</n-tag>
                  <n-space>
                    <n-button size="tiny" text @click.stop="editInstance(instance)">编辑</n-button>
                    <n-button size="tiny" text type="error" @click.stop="handleDeleteInstance(instance.id)">
                      删除
                    </n-button>
                  </n-space>
                </div>
              </n-space>

              <n-space :size="8" style="margin-top: 8px">
                <n-button size="tiny" @click.stop="handleSplit(group.char)">
                  拆分为多副本
                </n-button>
                <n-button
                  size="tiny"
                  :disabled="group.count <= 1"
                  @click.stop="handleMerge(group.char)"
                >
                  合并副本
                </n-button>
                <n-button size="tiny" type="primary" @click.stop="handleAddInstance(group.char)">
                  添加副本
                </n-button>
              </n-space>
            </div>
          </n-list-item>
          <n-list-item v-if="charGroups.length === 0" class="empty-item">
            暂无字符
          </n-list-item>
        </n-list>
      </n-scrollbar>
    </n-card>

    <n-modal
      v-model:show="showAddDialog"
      :title="editingInstance ? '编辑活字' : '添加活字'"
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
            :disabled="!!editingInstance"
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
      v-model:show="showSplitDialog"
      title="拆分为多副本"
      preset="dialog"
      positive-text="确定"
      negative-text="取消"
      @positive-click="confirmSplit"
    >
      <n-form label-placement="left" :label-width="100">
        <n-form-item label="目标副本数">
          <n-input-number
            v-model:value="splitCount"
            :min="2"
            :max="20"
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item label="当前副本数">
          <span>{{ currentSplitCharInfo?.count || 0 }} 个</span>
        </n-form-item>
        <n-form-item label="总库存量">
          <span>{{ currentSplitCharInfo?.totalStock || 0 }} 字</span>
        </n-form-item>
      </n-form>
      <div class="split-tip">
        库存将平均分配到各副本，空位从该字符附近开始填充。
      </div>
    </n-modal>

    <n-modal
      v-model:show="showDeleteConfirm"
      title="确认删除"
      preset="dialog"
      content="确定要删除这个活字副本吗？"
      positive-text="删除"
      negative-text="取消"
      :positive-button-props="{ type: 'error' }"
      @positive-click="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCompositorStore } from '@/stores/compositor'
import { storeToRefs } from 'pinia'
import { useMessage, NIcon } from 'naive-ui'
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
import { ChevronDown } from '@vicons/ionicons5'

const store = useCompositorStore()
const message = useMessage()

const { characters, gridConfig, canUndo, canRedo } = storeToRefs(store)
const {
  addCharacter,
  removeCharacter,
  updateCharacter,
  splitCharStock,
  mergeCharStock,
  addCharInstance,
  undo,
  redo
} = store

const searchQuery = ref('')
const showAddDialog = ref(false)
const showDeleteConfirm = ref(false)
const showSplitDialog = ref(false)
const showUndoRedo = ref(false)
const editingInstance = ref<TypeChar | null>(null)
const deletingId = ref('')
const splitChar = ref('')
const splitCount = ref(2)
const expandedChars = ref<Set<string>>(new Set())

const pastCount = computed(() => {
  // 使用 canUndo 等反应式，这里简化显示
  return canUndo.value ? '多' : 0
})

const futureCount = computed(() => {
  return canRedo.value ? '多' : 0
})

const formData = ref({
  char: '',
  x: 0,
  y: 0,
  stock: 1
})

interface CharGroup {
  char: string
  count: number
  totalStock: number
  instances: TypeChar[]
}

const charGroups = computed<CharGroup[]>(() => {
  const map = new Map<string, TypeChar[]>()
  characters.value.forEach(c => {
    if (!searchQuery.value || c.char.includes(searchQuery.value)) {
      if (!map.has(c.char)) {
        map.set(c.char, [])
      }
      map.get(c.char)!.push(c)
    }
  })

  return Array.from(map.entries())
    .map(([char, instances]) => ({
      char,
      count: instances.length,
      totalStock: instances.reduce((s, i) => s + i.stock, 0),
      instances: instances.sort((a, b) => a.y - b.y || a.x - b.x)
    }))
    .sort((a, b) => b.totalStock - a.totalStock)
})

const currentSplitCharInfo = computed(() => {
  return charGroups.value.find(g => g.char === splitChar.value)
})

function toggleGroup(char: string) {
  if (expandedChars.value.has(char)) {
    expandedChars.value.delete(char)
  } else {
    expandedChars.value.add(char)
  }
  expandedChars.value = new Set(expandedChars.value)
}

function editInstance(instance: TypeChar) {
  editingInstance.value = instance
  formData.value = {
    char: instance.char,
    x: instance.x,
    y: instance.y,
    stock: instance.stock
  }
  showAddDialog.value = true
}

function handleDeleteInstance(id: string) {
  deletingId.value = id
  showDeleteConfirm.value = true
}

function confirmDelete() {
  const result = removeCharacter(deletingId.value)
  if (result.success) {
    message.success('删除成功')
  } else {
    message.error(result.message || '删除失败')
  }
  showDeleteConfirm.value = false
  deletingId.value = ''
}

function handleSubmit() {
  if (!formData.value.char) {
    message.warning('请输入字符')
    return
  }

  if (editingInstance.value) {
    const result = updateCharacter(editingInstance.value.id!, {
      x: formData.value.x,
      y: formData.value.y,
      stock: formData.value.stock
    })
    if (result.success) {
      message.success('更新成功')
      showAddDialog.value = false
      editingInstance.value = null
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
  editingInstance.value = null
}

function handleSplit(char: string) {
  splitChar.value = char
  const group = charGroups.value.find(g => g.char === char)
  splitCount.value = (group?.count || 1) + 1
  showSplitDialog.value = true
}

function confirmSplit() {
  const result = splitCharStock(splitChar.value, splitCount.value)
  if (result.success) {
    message.success('拆分成功')
    showSplitDialog.value = false
  } else {
    message.error(result.message || '拆分失败')
  }
}

function handleMerge(char: string) {
  const result = mergeCharStock(char)
  if (result.success) {
    message.success('合并成功')
  } else {
    message.error(result.message || '合并失败')
  }
}

function handleAddInstance(char: string) {
  const group = charGroups.value.find(g => g.char === char)
  if (!group) return

  const emptyPositions: { x: number; y: number }[] = []
  const used = new Set<string>()
  characters.value.forEach(c => used.add(`${c.x},${c.y}`))

  const refX = group.instances[0]?.x || 0
  const refY = group.instances[0]?.y || 0

  for (let radius = 1; radius < 20; radius++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const x = refX + dx
        const y = refY + dy
        if (x >= 0 && x < gridConfig.value.cols && y >= 0 && y < gridConfig.value.rows) {
          if (!used.has(`${x},${y}`)) {
            emptyPositions.push({ x, y })
            if (emptyPositions.length >= 1) break
          }
        }
      }
      if (emptyPositions.length >= 1) break
    }
    if (emptyPositions.length >= 1) break
  }

  if (emptyPositions.length === 0) {
    message.warning('没有空位了')
    return
  }

  const pos = emptyPositions[0]
  const result = addCharInstance(char, pos.x, pos.y, 1)
  if (result.success) {
    message.success('添加副本成功')
  } else {
    message.error(result.message || '添加失败')
  }
}

function handleUndo() {
  const result = undo()
  if (result) {
    message.success('已撤销')
  }
}

function handleRedo() {
  const result = redo()
  if (result) {
    message.success('已重做')
  }
}
</script>

<style scoped>
.char-manager {
  width: 320px;
}

.undo-redo-box {
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-hint {
  font-size: 11px;
  color: #999;
  text-align: center;
}

.char-group-item {
  cursor: pointer !important;
  padding: 0 !important;
  transition: background 0.2s;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
}

.group-char {
  font-size: 18px;
  font-weight: 500;
  min-width: 24px;
  text-align: center;
}

.expand-icon {
  margin-left: auto;
  transition: transform 0.2s;
  color: #999;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

.group-detail {
  padding: 8px 12px 12px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.instance-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #eee;
}

.instance-pos {
  font-size: 12px;
  color: #666;
  font-family: monospace;
  flex: 1;
}

.empty-item {
  text-align: center;
  color: #999;
  justify-content: center !important;
  padding: 20px !important;
}

.split-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
  line-height: 1.5;
}
</style>
