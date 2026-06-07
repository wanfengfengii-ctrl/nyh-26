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
        <n-tag size="small" type="warning" v-if="currentPageData?.missingCharCount">
          {{ currentPageData?.missingCharCount }} 缺字
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
          :class="{ 'has-issue': line.issues.length > 0 }"
          :style="lineStyle"
        >
          <span
            v-for="(char, charIdx) in line.chars"
            :key="charIdx"
            class="proof-char"
            :class="{
              'is-missing': char.isMissing,
              'is-punctuation': char.isPunctuation,
              'squeeze-before': char.squeezeBefore > 0
            }"
            :style="getCharStyle(char)"
            :title="getCharTitle(char)"
          >
            {{ char.isMissing ? '□' : char.char }}
          </span>
          <span
            v-if="line.issues.length > 0"
            class="line-issue-indicator"
            @click="toggleLineIssues(lineIdx)"
          >
            ⚠
          </span>
        </div>
      </div>
      <div v-else class="empty-preview">
        <n-empty description="输入文本后生成校样预览" />
      </div>
    </div>

    <div v-if="showLineIssues" class="line-issues-popup">
      <div class="popup-header">
        <span>本行问题</span>
        <n-button size="tiny" text @click="showLineIssues = false">✕</n-button>
      </div>
      <n-list size="small" bordered>
        <n-list-item
          v-for="(issue, idx) in currentLineIssues"
          :key="idx"
        >
          <n-tag :type="getIssueTagType(issue.severity)" size="small">
            {{ getIssueTypeLabel(issue.type) }}
          </n-tag>
          <span class="issue-text">{{ issue.message }}</span>
        </n-list-item>
      </n-list>
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
  NListItem
} from 'naive-ui'

const props = defineProps<{
  pages: ProofPage[]
  config: ProofConfig
  currentPage: number
}>()

const emit = defineEmits<{
  'update:currentPage': [page: number]
}>()

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
  const line = currentPageData.value.lines[selectedLineIdx.value]
  return line?.issues || []
})

function getCharStyle(char: ProofChar) {
  const base: Record<string, string> = {}
  if (char.squeezeBefore > 0) {
    base.marginLeft = `-${char.squeezeBefore * 0.5}em`
  }
  return base
}

function getCharTitle(char: ProofChar): string {
  if (char.isMissing) {
    const alts = char.alternatives.length > 0
      ? `\n建议替代：${char.alternatives.join('、')}`
      : ''
    return `缺字：${char.char}${alts}`
  }
  return char.char
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
    default: return '其他'
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

function toggleLineIssues(lineIdx: number) {
  if (selectedLineIdx.value === lineIdx && showLineIssues.value) {
    showLineIssues.value = false
  } else {
    selectedLineIdx.value = lineIdx
    showLineIssues.value = true
  }
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
}

.proof-line {
  display: flex;
  align-items: center;
  position: relative;
  white-space: nowrap;
}

.proof-line.has-issue {
  background: #fff7e6;
}

.proof-char {
  display: inline-block;
  text-align: center;
  transition: color 0.2s, background 0.2s;
}

.proof-char.is-missing {
  color: #d03050;
  background: #fff1f0;
  font-weight: bold;
}

.proof-char.is-punctuation {
  color: #666;
}

.proof-char.squeeze-before {
  position: relative;
}

.line-issue-indicator {
  position: absolute;
  right: -24px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  font-size: 14px;
  color: #faad14;
  opacity: 0;
  transition: opacity 0.2s;
}

.proof-line:hover .line-issue-indicator {
  opacity: 1;
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
  width: 280px;
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

.issue-text {
  font-size: 12px;
  color: #666;
  margin-left: 8px;
}
</style>
