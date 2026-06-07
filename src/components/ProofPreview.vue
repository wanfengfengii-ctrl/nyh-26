<template>
  <div class="proof-preview">
    <div class="preview-header">
      <div class="page-nav">
        <n-button
          size="small"
          :disabled="currentPage <= 0"
          @click="prevPage"
        >
          上一页
        </n-button>
        <span class="page-indicator">
          第 {{ currentPage + 1 }} / {{ totalPages }} 页
        </span>
        <n-button
          size="small"
          :disabled="currentPage >= totalPages - 1"
          @click="nextPage"
        >
          下一页
        </n-button>
      </div>
      <n-space :size="8">
        <n-tag size="small" type="info">
          {{ currentPageData?.charCount || 0 }} 字
        </n-tag>
        <n-tag size="small" type="warning" v-if="pageIssueCount > 0">
          {{ pageIssueCount }} 问题
        </n-tag>
        <n-tag size="small" type="info" v-if="pageAnnotationCount > 0">
          {{ pageAnnotationCount }} 批注
        </n-tag>
      </n-space>
    </div>

    <div class="preview-container" ref="previewContainer">
      <div
        class="proof-page"
        :style="pageStyle"
        v-if="currentPageData"
      >
        <div
          v-for="(line, lineIdx) in currentPageData.lines"
          :key="lineIdx"
          class="proof-line"
          :class="getLineClass(line, lineIdx)"
          :style="lineStyle"
          @click="handleLineClick(lineIdx)"
        >
          <span
            v-for="(char, charIdx) in line.chars"
            :key="charIdx"
            class="proof-char"
            :class="getCharClass(char, lineIdx, charIdx)"
            :style="getCharStyle(char)"
            :title="getCharTitle(char, lineIdx, charIdx)"
            @click.stop="handleCharClick(lineIdx, charIdx, char.char)"
          >
            <template v-if="char.isMissing">
              <span class="missing-char-box">□</span>
            </template>
            <template v-else>
              {{ char.char }}
            </template>
            <span
              v-if="hasIssueOnChar(lineIdx, charIdx)"
              class="char-issue-indicator"
              :class="getIssueIndicatorClass(lineIdx, charIdx)"
            ></span>
            <span
              v-if="hasAnnotationOnChar(lineIdx, charIdx)"
              class="char-annotation-indicator"
            ></span>
          </span>

          <div class="line-side-indicators">
            <span
              v-if="getLineIssues(lineIdx).length > 0"
              class="line-issue-badge"
              :class="getLineIssueBadgeClass(lineIdx)"
            >
              {{ getLineIssues(lineIdx).length }}
            </span>
            <span
              v-if="getLineAnnotations(lineIdx).length > 0"
              class="line-annotation-badge"
              @click.stop="handleLineAnnotationClick(lineIdx)"
            >
              {{ getLineAnnotations(lineIdx).length }}
            </span>
          </div>
        </div>
      </div>
      <div v-else class="empty-preview">
        <n-empty description="输入文本后生成校样预览" />
      </div>
    </div>

    <div v-if="showLineIssues" class="line-issues-popup">
      <div class="popup-header">
        <span>本行问题（{{ currentLineIssues.length }}）</span>
        <n-button size="tiny" text @click="showLineIssues = false">✕</n-button>
      </div>
      <n-scrollbar style="max-height: 300px">
        <n-list size="small" bordered>
          <n-list-item
            v-for="issue in currentLineIssues"
            :key="issue.id"
            class="popup-issue-item"
            :class="{ selected: issue.id === selectedIssueId }"
            @click="handleSelectIssue(issue.id)"
          >
            <div class="issue-row">
              <n-tag :type="getIssueTagType(issue.severity)" size="small">
                {{ getIssueTypeLabel(issue.type) }}
              </n-tag>
              <n-tag :type="getIssueStatusType(issue.status)" size="tiny">
                {{ getIssueStatusLabel(issue.status) }}
              </n-tag>
            </div>
            <div class="issue-text">{{ issue.message }}</div>
            <div v-if="issue.resolution" class="issue-resolution">
              {{ issue.resolution }}
            </div>
          </n-list-item>
        </n-list>
      </n-scrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ProofPage, ProofChar, ProofIssue, ProofConfig } from '@/types'
import {
  NButton,
  NSpace,
  NTag,
  NEmpty,
  NList,
  NListItem,
  NScrollbar
} from 'naive-ui'
import { useProofDecisionStore } from '@/stores/proofDecision'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  pages: ProofPage[]
  config: ProofConfig
  currentPage: number
}>()

const emit = defineEmits<{
  'update:currentPage': [page: number]
  'char-click': [page: number, line: number, charIndex: number, char: string]
  'line-click': [page: number, line: number]
  'issue-select': [issueId: string]
}>()

const store = useProofDecisionStore()
const { selectedIssueId } = storeToRefs(store)

const showLineIssues = ref(false)
const selectedLineIdx = ref(-1)
const previewContainer = ref<HTMLElement | null>(null)

const totalPages = computed(() => props.pages.length)

const currentPageData = computed(() => {
  if (props.currentPage >= 0 && props.currentPage < props.pages.length) {
    return props.pages[props.currentPage]
  }
  return null
})

const pageIssueCount = computed(() => {
  return store.getIssuesByPage(props.currentPage).length
})

const pageAnnotationCount = computed(() => {
  return store.getAnnotationsByPage(props.currentPage).length
})

const pageStyle = computed(() => ({
  fontSize: props.config.fontSize + 'px',
  lineHeight: props.config.lineHeight,
  padding: props.config.fontSize + 'px'
}))

const lineStyle = computed(() => ({
  height: props.config.fontSize * props.config.lineHeight + 'px'
}))

const currentLineIssues = computed(() => {
  if (!currentPageData.value || selectedLineIdx.value < 0) return []
  return store.getIssuesByLine(props.currentPage, selectedLineIdx.value)
})

function getLineClass(line: any, lineIdx: number): Record<string, boolean> {
  const issues = store.getIssuesByLine(props.currentPage, lineIdx)
  const hasPending = issues.some(i => i.status === 'pending')
  const hasResolved = issues.length > 0 && issues.every(i => i.status !== 'pending')
  return {
    'has-issue': issues.length > 0,
    'has-pending': hasPending,
    'has-resolved': hasResolved,
    'selected-line': selectedLineIdx.value === lineIdx
  }
}

function getCharClass(
  char: ProofChar,
  lineIdx: number,
  charIdx: number
): Record<string, boolean> {
  const hasIssue = hasIssueOnChar(lineIdx, charIdx)
  return {
    'is-missing': char.isMissing,
    'is-punctuation': char.isPunctuation,
    'squeeze-before': char.squeezeBefore > 0,
    'has-issue': hasIssue,
    'is-selected': selectedLineIdx.value === lineIdx
  }
}

function getCharStyle(char: ProofChar) {
  const base: Record<string, string> = {}
  if (char.squeezeBefore > 0) {
    base.marginLeft = `-${char.squeezeBefore * 0.5}em`
  }
  return base
}

function getCharTitle(char: ProofChar, lineIdx: number, charIdx: number): string {
  let title = ''
  if (char.isMissing) {
    const alts = char.alternatives.length > 0
      ? `\n建议替代：${char.alternatives.join('、')}`
      : ''
    title = `缺字：${char.char}${alts}`
  } else {
    title = char.char
  }

  const charIssues = store.getIssuesByChar(props.currentPage, lineIdx, charIdx)
  if (charIssues.length > 0) {
    title += `\n\n问题（${charIssues.length}）：`
    charIssues.forEach((issue, i) => {
      title += `\n${i + 1}. [${getIssueStatusLabel(issue.status)}] ${issue.message}`
    })
  }

  const charAnns = store.getAnnotationsByChar(props.currentPage, lineIdx, charIdx)
  if (charAnns.length > 0) {
    title += `\n\n批注（${charAnns.length}）：`
    charAnns.forEach((ann, i) => {
      title += `\n${i + 1}. ${ann.author}: ${ann.content}`
    })
  }

  return title
}

function hasIssueOnChar(lineIdx: number, charIdx: number): boolean {
  return store.getIssuesByChar(props.currentPage, lineIdx, charIdx).length > 0
}

function hasAnnotationOnChar(lineIdx: number, charIdx: number): boolean {
  return store.getAnnotationsByChar(props.currentPage, lineIdx, charIdx).length > 0
}

function getIssueIndicatorClass(lineIdx: number, charIdx: number): string {
  const issues = store.getIssuesByChar(props.currentPage, lineIdx, charIdx)
  const hasPending = issues.some(i => i.status === 'pending')
  const hasError = issues.some(i => i.severity === 'error' && i.status === 'pending')
  if (hasError) return 'error'
  if (hasPending) return 'warning'
  return 'resolved'
}

function getLineIssues(lineIdx: number): ProofIssue[] {
  return store.getIssuesByLine(props.currentPage, lineIdx)
}

function getLineAnnotations(lineIdx: number) {
  return store.getAnnotationsByLine(props.currentPage, lineIdx)
}

function getLineIssueBadgeClass(lineIdx: number): string {
  const issues = getLineIssues(lineIdx)
  const hasPending = issues.some(i => i.status === 'pending')
  const hasError = issues.some(i => i.severity === 'error' && i.status === 'pending')
  if (hasError) return 'error'
  if (hasPending) return 'warning'
  return 'resolved'
}

function getIssueTagType(severity: string): 'error' | 'warning' | 'info' {
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

function getIssueStatusType(status: string): 'default' | 'success' | 'warning' | 'info' | 'error' {
  switch (status) {
    case 'pending': return 'default'
    case 'adopted': return 'success'
    case 'ignored': return 'info'
    case 'review': return 'warning'
    default: return 'default'
  }
}

function getIssueStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return '待处理'
    case 'adopted': return '已采纳'
    case 'ignored': return '已忽略'
    case 'review': return '待复核'
    default: return status
  }
}

function prevPage() {
  if (props.currentPage > 0) {
    emit('update:currentPage', props.currentPage - 1)
  }
}

function nextPage() {
  if (props.currentPage < totalPages.value - 1) {
    emit('update:currentPage', props.currentPage + 1)
  }
}

function handleLineClick(lineIdx: number) {
  emit('line-click', props.currentPage, lineIdx)

  if (selectedLineIdx.value === lineIdx && showLineIssues.value) {
    showLineIssues.value = false
  } else {
    selectedLineIdx.value = lineIdx
    showLineIssues.value = true
  }
}

function handleCharClick(lineIdx: number, charIdx: number, char: string) {
  emit('char-click', props.currentPage, lineIdx, charIdx, char)
  selectedLineIdx.value = lineIdx

  const charIssues = store.getIssuesByChar(props.currentPage, lineIdx, charIdx)
  if (charIssues.length > 0) {
    store.selectIssue(charIssues[0].id)
  } else {
    store.selectIssue(null)
  }
}

function handleLineAnnotationClick(lineIdx: number) {
  selectedLineIdx.value = lineIdx
}

function handleSelectIssue(issueId: string) {
  store.selectIssue(issueId)
  emit('issue-select', issueId)
}
</script>

<style scoped>
.proof-preview {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  position: relative;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.page-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-indicator {
  font-size: 14px;
  color: #666;
  min-width: 80px;
  text-align: center;
}

.preview-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow: auto;
  padding: 20px;
  background: #f0f2f5;
  min-height: 0;
}

.proof-page {
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  min-width: 300px;
  font-family: "SimSun", "宋体", "Songti SC", serif;
  color: #333;
  position: relative;
}

.proof-line {
  display: flex;
  align-items: center;
  position: relative;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s;
  padding-right: 40px;
}

.proof-line:hover {
  background: #f5f5f5;
}

.proof-line.selected-line {
  background: #e6f4ff;
}

.proof-line.has-issue {
  background: #fff7e6;
}

.proof-line.has-issue:hover {
  background: #ffefd6;
}

.proof-line.has-resolved {
  background: #f6ffed;
}

.proof-line.has-resolved:hover {
  background: #e6f7d6;
}

.proof-char {
  display: inline-block;
  text-align: center;
  transition: color 0.2s, background 0.2s;
  position: relative;
  cursor: pointer;
  padding: 2px 0;
}

.proof-char:hover {
  background: #bae0ff;
}

.proof-char.is-missing {
  color: #d03050;
  background: #fff1f0;
  font-weight: bold;
}

.proof-char.is-missing:hover {
  background: #ffccc7;
}

.proof-char.is-punctuation {
  color: #666;
}

.proof-char.squeeze-before {
  position: relative;
}

.proof-char.has-issue::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 2px;
  border-radius: 1px;
}

.missing-char-box {
  font-weight: bold;
}

.char-issue-indicator {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.char-issue-indicator.error {
  background: #d03050;
}

.char-issue-indicator.warning {
  background: #faad14;
}

.char-issue-indicator.resolved {
  background: #52c41a;
}

.char-annotation-indicator {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #1890ff;
}

.line-side-indicators {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 4px;
  align-items: center;
}

.line-issue-badge,
.line-annotation-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
}

.line-issue-badge.warning {
  background: #faad14;
}

.line-issue-badge.error {
  background: #d03050;
}

.line-issue-badge.resolved {
  background: #52c41a;
}

.line-annotation-badge {
  background: #1890ff;
}

.empty-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
}

.line-issues-popup {
  position: absolute;
  right: 16px;
  top: 60px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  width: 300px;
  z-index: 10;
  overflow: hidden;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #fafafa;
  border-bottom: 1px solid #eee;
  font-size: 13px;
  font-weight: 500;
}

.popup-issue-item {
  padding: 10px 12px !important;
  cursor: pointer;
  transition: background 0.2s;
}

.popup-issue-item:hover {
  background: #f5f5f5;
}

.popup-issue-item.selected {
  background: #e6f4ff;
}

.issue-row {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
}

.issue-text {
  font-size: 12px;
  color: #333;
  line-height: 1.5;
}

.issue-resolution {
  font-size: 11px;
  color: #18a058;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px dashed #eee;
}
</style>
