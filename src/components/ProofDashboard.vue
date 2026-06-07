<template>
  <div class="proof-dashboard">
    <n-card title="校样进度" :bordered="false" size="small">
      <div class="progress-section">
        <div class="progress-circle">
          <n-progress
            type="circle"
            :percentage="progress"
            :status="progressStatus"
            :stroke-width="10"
            :show-indicator="true"
          >
            <div class="progress-inner-text">
              <div class="progress-number">{{ progress }}%</div>
              <div class="progress-label">处理进度</div>
            </div>
          </n-progress>
        </div>

        <div class="progress-stats">
          <div class="stat-item">
            <span class="stat-count total">{{ totalIssues }}</span>
            <span class="stat-label">总问题</span>
          </div>
          <div class="stat-item">
            <span class="stat-count resolved">{{ resolvedCount }}</span>
            <span class="stat-label">已处理</span>
          </div>
          <div class="stat-item">
            <span class="stat-count pending">{{ pendingCount }}</span>
            <span class="stat-label">待处理</span>
          </div>
        </div>
      </div>

      <n-divider style="margin: 12px 0" />

      <div class="status-breakdown">
        <div class="breakdown-item">
          <span class="breakdown-dot adopted"></span>
          <span class="breakdown-label">已采纳</span>
          <span class="breakdown-count">{{ adoptedCount }}</span>
        </div>
        <div class="breakdown-item">
          <span class="breakdown-dot ignored"></span>
          <span class="breakdown-label">已忽略</span>
          <span class="breakdown-count">{{ ignoredCount }}</span>
        </div>
        <div class="breakdown-item">
          <span class="breakdown-dot review"></span>
          <span class="breakdown-label">待复核</span>
          <span class="breakdown-count">{{ reviewCount }}</span>
        </div>
        <div class="breakdown-item">
          <span class="breakdown-dot pending"></span>
          <span class="breakdown-label">待处理</span>
          <span class="breakdown-count">{{ pendingCount }}</span>
        </div>
      </div>

      <n-divider style="margin: 12px 0" />

      <div class="severity-breakdown">
        <div class="breakdown-item">
          <n-tag type="error" size="small">错误</n-tag>
          <span class="breakdown-count">{{ errorCount }}</span>
        </div>
        <div class="breakdown-item">
          <n-tag type="warning" size="small">警告</n-tag>
          <span class="breakdown-count">{{ warningCount }}</span>
        </div>
        <div class="breakdown-item">
          <n-tag type="info" size="small">信息</n-tag>
          <span class="breakdown-count">{{ infoCount }}</span>
        </div>
      </div>

      <n-divider style="margin: 12px 0" />

      <div class="annotations-stats">
        <div class="section-title">批注统计</div>
        <div class="annotations-row">
          <div class="annotations-stat">
            <span class="stat-number">{{ totalAnnotations }}</span>
            <span class="stat-label">总批注</span>
          </div>
          <div class="annotations-stat">
            <span class="stat-number unresolved">{{ unresolvedAnnotationsCount }}</span>
            <span class="stat-label">待处理</span>
          </div>
        </div>
      </div>
    </n-card>

    <n-card title="修订历史" :bordered="false" size="small" style="margin-top: 12px">
      <div v-if="revisions.length === 0" class="empty-history">
        <n-empty description="暂无修订记录" :icon-size="24" />
      </div>
      <n-scrollbar v-else style="max-height: 320px">
        <n-timeline size="small">
          <n-timeline-item
            v-for="rev in revisions.slice(0, 20)"
            :key="rev.id"
            :type="getTimelineType(rev.action)"
          >
            <div class="revision-item">
              <div class="revision-header">
                <n-tag :type="getActionTagType(rev.action)" size="tiny">
                  {{ getActionLabel(rev.action) }}
                </n-tag>
                <span class="revision-version">v{{ rev.version }}</span>
              </div>
              <div class="revision-content">
                <span v-if="rev.originalChar">「{{ rev.originalChar }}」</span>
                <span v-if="rev.newChar"> → 「{{ rev.newChar }}」</span>
              </div>
              <div class="revision-reason" v-if="rev.reason">
                {{ rev.reason }}
              </div>
              <div class="revision-meta">
                <span class="meta-author">{{ rev.author }}</span>
                <span class="meta-location">
                  第{{ rev.pageIndex + 1 }}页 第{{ rev.lineIndex + 1 }}行
                </span>
                <span class="meta-time">{{ formatTime(rev.timestamp) }}</span>
              </div>
            </div>
          </n-timeline-item>
        </n-timeline>
      </n-scrollbar>
    </n-card>

    <n-card title="版本管理" :bordered="false" size="small" style="margin-top: 12px">
      <div class="version-actions">
        <n-input
          v-model:value="newVersionLabel"
          size="small"
          placeholder="版本标签"
          style="flex: 1"
        />
        <n-button
          size="small"
          type="primary"
          @click="handleSaveVersion"
        >
          保存版本
        </n-button>
      </div>
      <n-input
        v-model:value="newVersionDesc"
        type="textarea"
        :rows="2"
        placeholder="版本说明（可选）"
        size="small"
        style="margin-top: 8px"
      />

      <n-divider v-if="versions.length > 0" style="margin: 12px 0" />

      <div v-if="versions.length > 0" class="versions-list">
        <n-list size="small" bordered>
          <n-list-item
            v-for="ver in versions"
            :key="ver.version"
            class="version-item"
          >
            <div class="version-header">
              <n-tag size="small" type="info">{{ ver.label }}</n-tag>
              <span class="version-time">{{ formatTime(ver.timestamp) }}</span>
            </div>
            <div class="version-info">
              <span>问题：{{ ver.issueCount }} 个</span>
              <span>已处理：{{ ver.resolvedCount }} 个</span>
            </div>
            <div class="version-author">{{ ver.author }}</div>
            <div v-if="ver.description" class="version-desc">
              {{ ver.description }}
            </div>
          </n-list-item>
        </n-list>
      </div>
    </n-card>

    <n-card title="导出校样结论" :bordered="false" size="small" type="success" style="margin-top: 12px">
      <div class="export-section">
        <div class="export-preview">
          <div class="preview-title">{{ conclusionTitle }}</div>
          <div class="preview-stats">
            <span>共 {{ totalIssues }} 个问题</span>
            <span>已处理 {{ resolvedCount }} 个</span>
          </div>
          <n-progress
            type="line"
            :percentage="progress"
            :status="progressStatus"
            :show-indicator="false"
            style="margin: 8px 0"
          />
        </div>
        <n-space vertical :size="8" style="width: 100%">
          <n-button
            type="primary"
            size="small"
            block
            @click="handleExportConclusion"
          >
            导出校样结论
          </n-button>
          <n-button
            size="small"
            block
            @click="handleCopyConclusion"
          >
            复制结论文本
          </n-button>
        </n-space>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NCard,
  NProgress,
  NDivider,
  NTag,
  NEmpty,
  NScrollbar,
  NTimeline,
  NTimelineItem,
  NList,
  NListItem,
  NInput,
  NButton,
  NSpace,
  useMessage
} from 'naive-ui'
import { useProofDecisionStore } from '@/stores/proofDecision'
import { storeToRefs } from 'pinia'
import type { DecisionAction } from '@/types'

const store = useProofDecisionStore()
const message = useMessage()

const {
  issues,
  revisions,
  versions,
  currentVersion,
  progress,
  pendingIssues,
  adoptedIssues,
  ignoredIssues,
  reviewIssues,
  resolvedIssues,
  errorIssues,
  warningIssues,
  annotations,
  unresolvedAnnotations
} = storeToRefs(store)

const newVersionLabel = ref('')
const newVersionDesc = ref('')
const conclusionTitle = ref('校样结论')

const totalIssues = computed(() => issues.value.length)
const pendingCount = computed(() => pendingIssues.value.length)
const adoptedCount = computed(() => adoptedIssues.value.length)
const ignoredCount = computed(() => ignoredIssues.value.length)
const reviewCount = computed(() => reviewIssues.value.length)
const resolvedCount = computed(() => resolvedIssues.value.length)
const errorCount = computed(() => errorIssues.value.length)
const warningCount = computed(() => warningIssues.value.length)
const infoCount = computed(() => totalIssues.value - errorCount.value - warningCount.value)
const totalAnnotations = computed(() => annotations.value.length)
const unresolvedAnnotationsCount = computed(() => unresolvedAnnotations.value.length)

const progressStatus = computed<'success' | 'warning' | 'error' | 'info'>(() => {
  if (totalIssues.value === 0) return 'info'
  if (progress.value >= 100) return 'success'
  if (progress.value >= 60) return 'warning'
  return 'error'
})

function getTimelineType(action: DecisionAction): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (action) {
    case 'adopt-alternative':
    case 'custom-replace':
      return 'success'
    case 'ignore':
      return 'info'
    case 'mark-review':
      return 'warning'
    default:
      return 'default'
  }
}

function getActionTagType(action: DecisionAction): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (action) {
    case 'adopt-alternative':
    case 'custom-replace':
      return 'success'
    case 'ignore':
      return 'info'
    case 'mark-review':
      return 'warning'
    default:
      return 'default'
  }
}

function getActionLabel(action: DecisionAction): string {
  switch (action) {
    case 'adopt-alternative':
      return '采纳替代字'
    case 'custom-replace':
      return '自定义替换'
    case 'ignore':
      return '忽略问题'
    case 'mark-review':
      return '标记复核'
    default:
      return action
  }
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

function handleSaveVersion() {
  const label = newVersionLabel.value || `v${currentVersion.value}`
  store.saveVersion(label, newVersionDesc.value)
  message.success(`版本 ${label} 已保存`)
  newVersionLabel.value = ''
  newVersionDesc.value = ''
}

function handleExportConclusion() {
  const conclusion = store.generateConclusion(conclusionTitle.value)
  const text = formatConclusionText(conclusion)
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `校样结论_${new Date().toISOString().slice(0, 10)}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  message.success('校样结论已导出')
}

function handleCopyConclusion() {
  const conclusion = store.generateConclusion(conclusionTitle.value)
  const text = formatConclusionText(conclusion)
  navigator.clipboard.writeText(text).then(() => {
    message.success('结论已复制到剪贴板')
  }).catch(() => {
    message.error('复制失败')
  })
}

function formatConclusionText(conclusion: any): string {
  let text = ''
  text += '========================================\n'
  text += `       ${conclusion.title}\n`
  text += '========================================\n\n'
  text += `生成时间：${new Date(conclusion.generatedAt).toLocaleString()}\n`
  text += `校对人员：${conclusion.reviewer}\n\n`

  text += '----------------------------------------\n'
  text += '问题统计\n'
  text += '----------------------------------------\n'
  text += `总问题数：${conclusion.totalIssues}\n`
  text += `已处理：${conclusion.resolvedIssues}\n`
  text += `待处理：${conclusion.pendingIssues}\n`
  text += `已采纳修订：${conclusion.adoptedRevisions}\n`
  text += `已忽略问题：${conclusion.ignoredIssues}\n`
  text += `待复核：${conclusion.reviewIssues}\n\n`

  text += '----------------------------------------\n'
  text += '校样结论\n'
  text += '----------------------------------------\n'
  text += conclusion.conclusionText + '\n\n'

  text += '========================================\n'
  text += '       校样结论结束\n'
  text += '========================================\n'

  return text
}
</script>

<style scoped>
.proof-dashboard {
  width: 100%;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.progress-circle {
  flex-shrink: 0;
  width: 100px;
  height: 100px;
}

.progress-inner-text {
  text-align: center;
}

.progress-number {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.progress-label {
  font-size: 11px;
  color: #999;
}

.progress-stats {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-count {
  font-size: 18px;
  font-weight: 600;
}

.stat-count.total {
  color: #333;
}

.stat-count.resolved {
  color: #18a058;
}

.stat-count.pending {
  color: #d03050;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.status-breakdown,
.severity-breakdown {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.breakdown-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.breakdown-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.breakdown-dot.adopted {
  background: #18a058;
}

.breakdown-dot.ignored {
  background: #2080f0;
}

.breakdown-dot.review {
  background: #f0a020;
}

.breakdown-dot.pending {
  background: #d03050;
}

.breakdown-label {
  color: #666;
  flex: 1;
}

.breakdown-count {
  font-weight: 600;
  color: #333;
}

.section-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.annotations-stats {
  margin-top: 4px;
}

.annotations-row {
  display: flex;
  gap: 16px;
}

.annotations-stat {
  flex: 1;
  text-align: center;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 6px;
}

.stat-number {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  display: block;
}

.stat-number.unresolved {
  color: #d03050;
}

.empty-history {
  padding: 20px 0;
}

.revision-item {
  font-size: 12px;
}

.revision-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.revision-version {
  font-size: 11px;
  color: #999;
}

.revision-content {
  color: #333;
  margin-bottom: 2px;
}

.revision-reason {
  color: #666;
  font-size: 11px;
  margin-bottom: 4px;
}

.revision-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 10px;
  color: #999;
}

.version-actions {
  display: flex;
  gap: 8px;
}

.version-item {
  padding: 10px 12px !important;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.version-time {
  font-size: 11px;
  color: #999;
}

.version-info {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.version-author {
  font-size: 11px;
  color: #999;
  margin-bottom: 4px;
}

.version-desc {
  font-size: 11px;
  color: #666;
  padding-top: 6px;
  border-top: 1px dashed #eee;
  margin-top: 4px;
}

.export-section {
  width: 100%;
}

.export-preview {
  padding: 10px;
  background: #f0f9ff;
  border-radius: 6px;
  margin-bottom: 10px;
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  color: #18a058;
  margin-bottom: 4px;
}

.preview-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}
</style>
