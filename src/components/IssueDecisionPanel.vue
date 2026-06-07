<template>
  <div class="issue-decision-panel">
    <n-card title="问题处理" :bordered="false" size="small">
      <div v-if="!selectedIssue" class="empty-state">
        <n-empty description="点击校样中的问题进行处理" />
      </div>

      <div v-else class="issue-detail">
        <div class="issue-header">
          <n-tag :type="getSeverityType(selectedIssue.severity)" size="small">
            {{ getIssueTypeLabel(selectedIssue.type) }}
          </n-tag>
          <n-tag :type="getStatusType(selectedIssue.status)" size="small">
            {{ getStatusLabel(selectedIssue.status) }}
          </n-tag>
        </div>

        <div class="issue-location">
          <span class="location-label">位置：</span>
          <span class="location-value">
            第{{ selectedIssue.pageIndex + 1 }}页 第{{ selectedIssue.lineIndex + 1 }}行
            <span v-if="selectedIssue.charIndex !== undefined">
              第{{ selectedIssue.charIndex + 1 }}字
            </span>
          </span>
        </div>

        <div class="issue-message">
          {{ selectedIssue.message }}
        </div>

        <div v-if="selectedIssue.resolution" class="issue-resolution">
          <div class="resolution-label">处理结果：</div>
          <div class="resolution-text">{{ selectedIssue.resolution }}</div>
        </div>

        <template v-if="selectedIssue.status === 'pending'">
          <n-divider style="margin: 12px 0" />

          <div v-if="selectedIssue.type === 'missing-char' && selectedIssue.alternatives && selectedIssue.alternatives.length > 0">
            <div class="section-title">替代字建议</div>
            <div class="alt-chars">
              <n-button
                v-for="alt in selectedIssue.alternatives"
                :key="alt"
                size="small"
                type="primary"
                ghost
                @click="handleAdoptAlternative(alt)"
              >
                {{ alt }}
              </n-button>
            </div>
          </div>

          <div v-if="selectedIssue.type === 'missing-char'" class="custom-replace-section">
            <div class="section-title">自定义替换</div>
            <n-input
              v-model:value="customChar"
              size="small"
              placeholder="输入替换字符"
              maxlength="1"
              style="width: 120px"
            />
            <n-button
              size="small"
              type="primary"
              :disabled="!customChar"
              style="margin-left: 8px"
              @click="handleCustomReplace"
            >
              替换
            </n-button>
          </div>

          <n-divider style="margin: 12px 0" />

          <div class="action-buttons">
            <n-button
              size="small"
              type="info"
              block
              @click="handleIgnore"
            >
              忽略问题
            </n-button>
            <n-button
              size="small"
              type="warning"
              block
              @click="handleMarkReview"
            >
              标记复核
            </n-button>
          </div>

          <div class="reason-input" v-if="showIgnoreDialog || showReviewDialog">
            <n-input
              v-model:value="reasonText"
              type="textarea"
              :rows="2"
              placeholder="输入原因（可选）"
              size="small"
            />
            <div class="reason-actions">
              <n-button size="small" type="primary" @click="confirmAction">
                确认
              </n-button>
              <n-button size="small" @click="cancelAction">
                取消
              </n-button>
            </div>
          </div>
        </template>

        <template v-else>
          <n-divider style="margin: 12px 0" />
          <n-button
            size="small"
            block
            @click="handleReset"
          >
            重置为待处理
          </n-button>
        </template>
      </div>
    </n-card>

    <n-card title="批注管理" :bordered="false" size="small" style="margin-top: 12px">
      <div class="annotation-section">
        <div class="section-title">添加批注</div>
        <n-select
          v-model:value="newAnnotationType"
          size="small"
          :options="annotationTypeOptions"
          style="margin-bottom: 8px"
        />
        <n-input
          v-model:value="newAnnotationContent"
          type="textarea"
          :rows="3"
          placeholder="输入批注内容..."
          size="small"
        />
        <n-button
          size="small"
          type="primary"
          block
          style="margin-top: 8px"
          :disabled="!newAnnotationContent.trim() || !canAddAnnotation"
          @click="handleAddAnnotation"
        >
          {{ annotationTargetText }}
        </n-button>
      </div>

      <n-divider v-if="pageAnnotations.length > 0" style="margin: 12px 0" />

      <div v-if="pageAnnotations.length > 0" class="annotations-list">
        <div class="section-title">本页批注 ({{ pageAnnotations.length }})</div>
        <n-scrollbar style="max-height: 240px">
          <n-list size="small" bordered>
            <n-list-item
              v-for="ann in pageAnnotations"
              :key="ann.id"
              class="annotation-item"
              :class="{ resolved: ann.resolved, selected: ann.id === selectedAnnotationId }"
              @click="handleSelectAnnotation(ann.id)"
            >
              <div class="annotation-header">
                <n-tag :type="getAnnotationType(ann.type)" size="tiny">
                  {{ getAnnotationTypeLabel(ann.type) }}
                </n-tag>
                <span class="annotation-author">{{ ann.author }}</span>
              </div>
              <div class="annotation-content">{{ ann.content }}</div>
              <div class="annotation-meta">
                <span>第{{ ann.lineIndex + 1 }}行</span>
                <span v-if="ann.charIndex !== undefined">第{{ ann.charIndex + 1 }}字</span>
              </div>
              <div v-if="ann.resolution" class="annotation-resolution">
                处理：{{ ann.resolution }}
              </div>
            </n-list-item>
          </n-list>
        </n-scrollbar>
      </div>

      <div v-if="selectedAnnotationId && selectedAnnotation" class="selected-annotation-actions">
        <n-divider style="margin: 12px 0" />
        <div class="section-title">批注操作</div>
        <div class="annotation-detail-actions">
          <n-input
            v-if="editingAnnotation"
            v-model:value="editAnnotationContent"
            type="textarea"
            :rows="2"
            size="small"
          />
          <div class="action-row">
            <n-button
              size="tiny"
              v-if="!editingAnnotation && !selectedAnnotation.resolved"
              @click="startEditAnnotation"
            >
              编辑
            </n-button>
            <n-button
              size="tiny"
              type="primary"
              v-if="editingAnnotation"
              @click="saveEditAnnotation"
            >
              保存
            </n-button>
            <n-button
              size="tiny"
              v-if="editingAnnotation"
              @click="cancelEditAnnotation"
            >
              取消
            </n-button>
            <n-button
              size="tiny"
              type="success"
              v-if="!selectedAnnotation.resolved"
              @click="showResolveDialog = true"
            >
              标记已处理
            </n-button>
            <n-button
              size="tiny"
              type="error"
              @click="handleDeleteAnnotation"
            >
              删除
            </n-button>
          </div>
          <div v-if="showResolveDialog" class="resolve-dialog">
            <n-input
              v-model:value="resolveText"
              placeholder="处理说明（可选）"
              size="small"
              style="margin-bottom: 6px"
            />
            <div class="action-row">
              <n-button size="tiny" type="primary" @click="confirmResolve">确认</n-button>
              <n-button size="tiny" @click="showResolveDialog = false">取消</n-button>
            </div>
          </div>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  NCard,
  NTag,
  NEmpty,
  NDivider,
  NButton,
  NInput,
  NSelect,
  NList,
  NListItem,
  NSpace,
  NScrollbar,
  useMessage
} from 'naive-ui'
import { useProofDecisionStore } from '@/stores/proofDecision'
import { storeToRefs } from 'pinia'
import type { AnnotationType, ProofIssue, ProofAnnotation } from '@/types'

const props = defineProps<{
  currentPage: number
  currentLine?: number
  currentChar?: number
  currentCharValue?: string
}>()

const emit = defineEmits<{
  'navigate-to-issue': [page: number, line: number, char?: number]
}>()

const store = useProofDecisionStore()
const message = useMessage()

const { selectedIssueId, selectedAnnotationId } = storeToRefs(store)

const customChar = ref('')
const reasonText = ref('')
const showIgnoreDialog = ref(false)
const showReviewDialog = ref(false)
const pendingAction = ref<'ignore' | 'review' | null>(null)

const newAnnotationType = ref<AnnotationType>('comment')
const newAnnotationContent = ref('')
const editingAnnotation = ref(false)
const editAnnotationContent = ref('')
const showResolveDialog = ref(false)
const resolveText = ref('')

const annotationTypeOptions = [
  { label: '评论', value: 'comment' },
  { label: '建议', value: 'suggestion' },
  { label: '疑问', value: 'question' },
  { label: '重要', value: 'important' }
]

const selectedIssue = computed<ProofIssue | undefined>(() => {
  if (!selectedIssueId.value) return undefined
  return store.getIssueById(selectedIssueId.value)
})

const selectedAnnotation = computed<ProofAnnotation | undefined>(() => {
  if (!selectedAnnotationId.value) return undefined
  return store.annotations.find(a => a.id === selectedAnnotationId.value)
})

const pageAnnotations = computed(() => {
  return store.getAnnotationsByPage(props.currentPage)
})

const canAddAnnotation = computed(() => {
  return props.currentLine !== undefined
})

const annotationTargetText = computed(() => {
  if (props.currentChar !== undefined && props.currentCharValue) {
    return `添加到字符「${props.currentCharValue}」`
  }
  if (props.currentLine !== undefined) {
    return `添加到第${props.currentLine + 1}行`
  }
  return '选择位置后添加'
})

function getSeverityType(severity: string): 'error' | 'warning' | 'info' {
  switch (severity) {
    case 'error': return 'error'
    case 'warning': return 'warning'
    default: return 'info'
  }
}

function getIssueTypeLabel(type: string): string {
  switch (type) {
    case 'prohibition-start': return '行首禁则'
    case 'prohibition-end': return '行尾禁则'
    case 'missing-char': return '缺字'
    case 'insufficient-stock': return '库存不足'
    case 'line-overflow': return '行溢出'
    case 'abnormal-break': return '换行异常'
    default: return '其他'
  }
}

function getStatusType(status: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'pending': return 'default'
    case 'adopted': return 'success'
    case 'ignored': return 'info'
    case 'review': return 'warning'
    default: return 'default'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return '待处理'
    case 'adopted': return '已采纳'
    case 'ignored': return '已忽略'
    case 'review': return '待复核'
    default: return status
  }
}

function getAnnotationType(type: string): 'default' | 'info' | 'success' | 'warning' | 'error' {
  switch (type) {
    case 'comment': return 'default'
    case 'suggestion': return 'info'
    case 'question': return 'warning'
    case 'important': return 'error'
    default: return 'default'
  }
}

function getAnnotationTypeLabel(type: string): string {
  switch (type) {
    case 'comment': return '评论'
    case 'suggestion': return '建议'
    case 'question': return '疑问'
    case 'important': return '重要'
    default: return type
  }
}

function handleAdoptAlternative(alt: string) {
  if (!selectedIssueId.value) return
  store.adoptAlternative(selectedIssueId.value, alt)
  message.success(`已采纳替代字「${alt}」`)
}

function handleCustomReplace() {
  if (!selectedIssueId.value || !customChar.value) return
  store.customReplace(selectedIssueId.value, customChar.value)
  message.success(`已替换为「${customChar.value}」`)
  customChar.value = ''
}

function handleIgnore() {
  pendingAction.value = 'ignore'
  showIgnoreDialog.value = true
}

function handleMarkReview() {
  pendingAction.value = 'review'
  showReviewDialog.value = true
}

function confirmAction() {
  if (!selectedIssueId.value || !pendingAction.value) return

  if (pendingAction.value === 'ignore') {
    store.ignoreIssue(selectedIssueId.value, reasonText.value)
    message.success('已忽略该问题')
  } else if (pendingAction.value === 'review') {
    store.markForReview(selectedIssueId.value, reasonText.value)
    message.success('已标记为需复核')
  }

  reasonText.value = ''
  showIgnoreDialog.value = false
  showReviewDialog.value = false
  pendingAction.value = null
}

function cancelAction() {
  reasonText.value = ''
  showIgnoreDialog.value = false
  showReviewDialog.value = false
  pendingAction.value = null
}

function handleReset() {
  if (!selectedIssueId.value) return
  store.resetIssue(selectedIssueId.value)
  message.info('已重置为待处理')
}

function handleAddAnnotation() {
  if (!newAnnotationContent.value.trim()) return
  if (props.currentLine === undefined) return

  const ann = store.addAnnotation(
    newAnnotationType.value,
    newAnnotationContent.value,
    props.currentPage,
    props.currentLine,
    props.currentChar,
    props.currentCharValue
  )

  newAnnotationContent.value = ''
  store.selectAnnotation(ann.id)
  message.success('批注已添加')
}

function handleSelectAnnotation(id: string) {
  store.selectAnnotation(id)
}

function startEditAnnotation() {
  if (!selectedAnnotation.value) return
  editAnnotationContent.value = selectedAnnotation.value.content
  editingAnnotation.value = true
}

function saveEditAnnotation() {
  if (!selectedAnnotationId.value) return
  store.updateAnnotation(selectedAnnotationId.value, editAnnotationContent.value)
  editingAnnotation.value = false
  message.success('批注已更新')
}

function cancelEditAnnotation() {
  editingAnnotation.value = false
  editAnnotationContent.value = ''
}

function confirmResolve() {
  if (!selectedAnnotationId.value) return
  store.resolveAnnotation(selectedAnnotationId.value, resolveText.value)
  showResolveDialog.value = false
  resolveText.value = ''
  message.success('批注已标记为已处理')
}

function handleDeleteAnnotation() {
  if (!selectedAnnotationId.value) return
  store.deleteAnnotation(selectedAnnotationId.value)
  store.selectAnnotation(null)
  message.info('批注已删除')
}
</script>

<style scoped>
.issue-decision-panel {
  width: 100%;
}

.empty-state {
  padding: 20px 0;
}

.issue-detail {
  font-size: 13px;
}

.issue-header {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.issue-location {
  color: #666;
  font-size: 12px;
  margin-bottom: 8px;
}

.location-label {
  color: #999;
}

.issue-message {
  background: #f5f5f5;
  padding: 8px 10px;
  border-radius: 4px;
  color: #333;
}

.issue-resolution {
  margin-top: 8px;
  padding: 8px 10px;
  background: #f0f9ff;
  border-radius: 4px;
  border-left: 3px solid #18a058;
}

.resolution-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.resolution-text {
  color: #333;
  font-size: 12px;
}

.section-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.alt-chars {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.custom-replace-section {
  margin-top: 12px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.reason-input {
  margin-top: 10px;
}

.reason-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.annotation-section {
  margin-top: 4px;
}

.annotations-list {
  margin-top: 4px;
}

.annotation-item {
  padding: 8px 10px !important;
  cursor: pointer;
  transition: background 0.2s;
}

.annotation-item:hover {
  background: #f5f5f5;
}

.annotation-item.selected {
  background: #e6f4ff;
}

.annotation-item.resolved {
  opacity: 0.6;
}

.annotation-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.annotation-author {
  font-size: 11px;
  color: #999;
}

.annotation-content {
  font-size: 12px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 4px;
}

.annotation-meta {
  font-size: 11px;
  color: #999;
  display: flex;
  gap: 8px;
}

.annotation-resolution {
  font-size: 11px;
  color: #18a058;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px dashed #eee;
}

.selected-annotation-actions {
  margin-top: 4px;
}

.annotation-detail-actions {
  margin-top: 8px;
}

.action-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.resolve-dialog {
  margin-top: 8px;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 4px;
}
</style>
