<template>
  <div class="scheme-manager">
    <n-card title="方案管理" :bordered="false" size="small">
      <n-space vertical :size="12" style="width: 100%">
        <n-input
          v-model:value="newSchemeName"
          placeholder="方案名称"
          size="small"
        />
        <n-space :size="8" wrap>
          <n-button size="small" type="primary" @click="handleSave">
            保存当前
          </n-button>
          <n-button size="small" @click="handleExport">
            导出 JSON
          </n-button>
        </n-space>
        <n-upload
          :show-file-list="false"
          :custom-request="handleImport"
          accept=".json"
        >
          <n-button size="small" block>
            导入 JSON
          </n-button>
        </n-upload>
      </n-space>
    </n-card>

    <n-card title="已保存方案" :bordered="false" size="small" style="margin-top: 16px">
      <n-scrollbar style="max-height: 280px">
        <n-list bordered :show-divider="false" size="small">
          <n-list-item
            v-for="scheme in rootSchemes"
            :key="scheme.id"
            class="scheme-item"
          >
            <div class="scheme-info" @click="toggleVersion(scheme.id)">
              <span class="scheme-name">{{ scheme.name }}</span>
              <span class="scheme-meta">
                {{ scheme.gridConfig.cols }}×{{ scheme.gridConfig.rows }} | 
                {{ scheme.characters.length }} 字
              </span>
              <span v-if="getVersionCount(scheme.id) > 1" class="version-badge">
                {{ getVersionCount(scheme.id) }} 个版本
              </span>
            </div>
            <n-space>
              <n-button size="tiny" text type="primary" @click="handleLoad(scheme.id)">
                加载
              </n-button>
              <n-button size="tiny" text @click="handleSaveVersion(scheme.id)">
                存新版本
              </n-button>
              <n-button size="tiny" text type="error" @click="handleDelete(scheme.id)">
                删除
              </n-button>
            </n-space>

            <div v-if="expandedVersions.has(scheme.id)" class="version-list">
              <div
                v-for="ver in getVersions(scheme.id)"
                :key="ver.id"
                class="version-item"
                :class="{ 'is-current': ver.id === scheme.id }"
              >
                <span class="version-name">
                  v{{ ver.version || 1 }} · {{ ver.name }}
                </span>
                <n-space>
                  <n-button size="tiny" text type="primary" @click="handleLoad(ver.id)">
                    加载
                  </n-button>
                </n-space>
              </div>
            </div>
          </n-list-item>
          <n-list-item v-if="rootSchemes.length === 0" class="empty-item">
            暂无保存的方案
          </n-list-item>
        </n-list>
      </n-scrollbar>
    </n-card>

    <n-modal
      v-model:show="showVersionDialog"
      title="保存为新版本"
      preset="dialog"
      positive-text="保存"
      negative-text="取消"
      @positive-click="confirmSaveVersion"
    >
      <n-form label-placement="left" :label-width="80">
        <n-form-item label="版本名">
          <n-input
            v-model:value="versionName"
            placeholder="输入版本名称"
          />
        </n-form-item>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCompositorStore } from '@/stores/compositor'
import { useMessage } from 'naive-ui'
import type { CompositorScheme } from '@/types'
import {
  NCard,
  NInput,
  NButton,
  NSpace,
  NList,
  NListItem,
  NScrollbar,
  NUpload,
  NModal,
  NForm,
  NFormItem
} from 'naive-ui'

const store = useCompositorStore()
const message = useMessage()

const newSchemeName = ref('')
const schemes = ref<CompositorScheme[]>([])
const expandedVersions = ref<Set<string>>(new Set())
const showVersionDialog = ref(false)
const versionName = ref('')
const currentParentSchemeId = ref('')

const rootSchemes = computed(() => {
  return schemes.value.filter(s => !s.parentId)
})

function refreshSchemes() {
  schemes.value = store.loadSchemes()
}

function getVersionCount(schemeId: string): number {
  return store.getSchemeVersions(schemeId).length
}

function getVersions(schemeId: string): CompositorScheme[] {
  return store.getSchemeVersions(schemeId).filter(s => s.id !== schemeId)
}

function toggleVersion(schemeId: string) {
  if (expandedVersions.value.has(schemeId)) {
    expandedVersions.value.delete(schemeId)
  } else {
    expandedVersions.value.add(schemeId)
  }
  expandedVersions.value = new Set(expandedVersions.value)
}

function handleSave() {
  if (!newSchemeName.value.trim()) {
    message.warning('请输入方案名称')
    return
  }
  store.saveScheme(newSchemeName.value.trim())
  message.success('保存成功')
  newSchemeName.value = ''
  refreshSchemes()
}

function handleSaveVersion(parentId: string) {
  currentParentSchemeId.value = parentId
  versionName.value = ''
  showVersionDialog.value = true
}

function confirmSaveVersion() {
  const result = store.saveSchemeVersion(currentParentSchemeId.value, versionName.value)
  if (result) {
    message.success('版本保存成功')
    showVersionDialog.value = false
    refreshSchemes()
  } else {
    message.error('保存失败')
  }
}

function handleLoad(id: string) {
  const success = store.loadScheme(id)
  if (success) {
    message.success('加载成功')
  } else {
    message.error('加载失败')
  }
}

function handleDelete(id: string) {
  store.deleteScheme(id)
  message.success('删除成功')
  refreshSchemes()
}

function handleExport() {
  const json = store.exportSchemeAsJson(newSchemeName.value || '字盘方案')
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${newSchemeName.value || 'type-tray'}.json`
  a.click()
  URL.revokeObjectURL(url)
  message.success('导出成功')
}

function handleImport(options: { file: File }) {
  const file = options.file
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    const result = store.importSchemeFromJson(text)
    if (result.success) {
      message.success('导入成功')
      refreshSchemes()
    } else {
      message.error(result.message || '导入失败')
    }
  }
  reader.readAsText(file)
}

onMounted(() => {
  refreshSchemes()
})
</script>

<style scoped>
.scheme-manager {
  width: 320px;
}

.scheme-item {
  padding: 0 !important;
}

.scheme-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  cursor: pointer;
}

.scheme-name {
  font-weight: 500;
  font-size: 14px;
}

.scheme-meta {
  color: #999;
  font-size: 12px;
}

.version-badge {
  display: inline-block;
  padding: 2px 6px;
  background: #e6f7ff;
  color: #1890ff;
  border-radius: 4px;
  font-size: 11px;
  width: fit-content;
}

.version-list {
  padding: 4px 12px 12px 24px;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
}

.version-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #eee;
  margin-bottom: 4px;
}

.version-item.is-current {
  border-color: #18a058;
  background: #f6ffed;
}

.version-name {
  font-size: 12px;
  color: #666;
}

.empty-item {
  text-align: center;
  color: #999;
  justify-content: center !important;
  padding: 20px !important;
}
</style>
