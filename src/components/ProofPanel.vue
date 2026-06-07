<template>
  <div class="proof-panel">
    <n-card title="待印文本" :bordered="false" size="small">
      <n-input
        type="textarea"
        :value="proofInputText"
        placeholder="请输入要印刷校样的文字..."
        :rows="5"
        @update:value="handleTextChange"
      />
      <div class="text-stats">
        <n-tag size="small" type="info">共 {{ textCharCount }} 字</n-tag>
      </div>
    </n-card>

    <n-card title="版面设置" :bordered="false" size="small" style="margin-top: 16px">
      <n-space vertical :size="12" style="width: 100%">
        <n-form-item label="列数（字数/行）">
          <n-input-number
            :value="proofConfig.cols"
            :min="10"
            :max="80"
            @update:value="(v) => updateConfig('cols', v)"
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item label="行数">
          <n-input-number
            :value="proofConfig.rows"
            :min="5"
            :max="60"
            @update:value="(v) => updateConfig('rows', v)"
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item label="字号 (px)">
          <n-input-number
            :value="proofConfig.fontSize"
            :min="12"
            :max="48"
            @update:value="(v) => updateConfig('fontSize', v)"
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item label="行高">
          <n-input-number
            :value="proofConfig.lineHeight"
            :min="1"
            :max="3"
            :step="0.1"
            @update:value="(v) => updateConfig('lineHeight', v)"
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item label="段落缩进（字）">
          <n-input-number
            :value="proofConfig.paragraphIndent"
            :min="0"
            :max="8"
            @update:value="(v) => updateConfig('paragraphIndent', v)"
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item label="段落间距（行）">
          <n-input-number
            :value="proofConfig.paragraphSpacing"
            :min="0"
            :max="4"
            @update:value="(v) => updateConfig('paragraphSpacing', v)"
            style="width: 100%"
          />
        </n-form-item>
        <n-space vertical :size="4">
          <n-switch v-model:value="proofConfig.enableProhibition">
            <template #checked>启用禁则</template>
            <template #unchecked>禁用禁则</template>
          </n-switch>
          <n-switch v-model:value="proofConfig.enablePunctuationSqueeze">
            <template #checked>标点挤压</template>
            <template #unchecked>无挤压</template>
          </n-switch>
        </n-space>
      </n-space>
    </n-card>

    <n-card title="校样统计" :bordered="false" size="small" style="margin-top: 16px">
      <n-space vertical :size="8" style="width: 100%">
        <div class="stat-row">
          <span class="stat-label">总页数</span>
          <span class="stat-value">{{ proofResult?.totalPages || 0 }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">总字符数</span>
          <span class="stat-value">{{ proofResult?.totalChars || 0 }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">缺字符数</span>
          <span class="stat-value error" v-if="proofResult?.totalMissingChars">
            {{ proofResult.totalMissingChars }}
          </span>
          <span class="stat-value" v-else>0</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">问题数</span>
          <span class="stat-value warning" v-if="proofResult?.totalIssues">
            {{ proofResult.totalIssues }}
          </span>
          <span class="stat-value" v-else>0</span>
        </div>
      </n-space>
    </n-card>

    <n-card title="库存预估" :bordered="false" size="small" type="info" style="margin-top: 16px" v-if="proofResult">
      <n-space vertical :size="8" style="width: 100%">
        <div class="estimate-main">
          <span class="estimate-number">{{ stockEstimate.canCompletePages }}</span>
          <span class="estimate-unit">页可完整印刷</span>
        </div>
        <div v-if="stockEstimate.limitingChar" class="estimate-detail">
          <span>瓶颈字符：</span>
          <n-tag type="warning" size="small">
            {{ stockEstimate.limitingChar }}
          </n-tag>
        </div>
        <div v-if="stockEstimate.limitingChar" class="estimate-detail-small">
          库存 {{ stockEstimate.limitingCharAvailable }} 个，每页约 {{ stockEstimate.limitingCharPerPage }} 个
        </div>
        <n-progress
          v-if="stockEstimate.totalPages > 0"
          type="line"
          :percentage="Math.round(stockEstimate.canCompletePages / stockEstimate.totalPages * 100)"
          :status="stockEstimate.canCompletePages >= stockEstimate.totalPages ? 'success' : 'warning'"
          :show-indicator="false"
          style="margin-top: 4px"
        />
        <div class="estimate-footer">
          共 {{ stockEstimate.totalPages }} 页
        </div>
      </n-space>
    </n-card>

    <n-card
      v-if="proofResult?.missingChars && proofResult.missingChars.length > 0"
      title="缺字清单"
      :bordered="false"
      size="small"
      type="error"
      style="margin-top: 16px"
    >
      <n-scrollbar style="max-height: 200px">
        <n-space vertical :size="6" style="width: 100%">
          <div v-for="m in proofResult.missingChars" :key="m.char" class="missing-item">
            <div class="missing-char-info">
              <n-tag type="error" size="small">
                {{ m.char }} × {{ m.count }}
              </n-tag>
            </div>
            <div v-if="m.alternatives.length > 0" class="missing-alternatives">
              <span class="alt-label">替代建议：</span>
              <n-tag
                v-for="alt in m.alternatives"
                :key="alt"
                size="small"
                type="info"
                class="alt-tag"
              >
                {{ alt }}
              </n-tag>
            </div>
          </div>
        </n-space>
      </n-scrollbar>
    </n-card>

    <n-card
      v-if="proofResult?.problemLines && proofResult.problemLines.length > 0"
      title="问题行列表"
      :bordered="false"
      size="small"
      type="warning"
      style="margin-top: 16px"
    >
      <n-scrollbar style="max-height: 200px">
        <n-list bordered size="small">
          <n-list-item
            v-for="(pl, idx) in proofResult.problemLines"
            :key="idx"
            class="problem-line-item"
          >
            <div class="problem-line-header">
              <n-tag size="small" type="warning">
                第{{ pl.page + 1 }}页 第{{ pl.line + 1 }}行
              </n-tag>
              <span class="problem-count">
                {{ pl.issues.length }} 个问题
              </span>
            </div>
            <n-space vertical :size="2" style="margin-top: 6px">
              <div
                v-for="(issue, iIdx) in pl.issues"
                :key="iIdx"
                class="problem-issue"
              >
                <n-tag :type="getIssueTagType(issue.severity)" size="tiny">
                  {{ getIssueTypeLabel(issue.type) }}
                </n-tag>
                <span class="issue-desc">{{ issue.message }}</span>
              </div>
            </n-space>
          </n-list-item>
        </n-list>
      </n-scrollbar>
    </n-card>

    <n-card title="用字统计 (前15)" :bordered="false" size="small" style="margin-top: 16px">
      <div v-if="!proofResult || proofResult.charStats.length === 0" class="empty-tip">
        无数据
      </div>
      <n-space v-else vertical :size="4" style="width: 100%">
        <div
          v-for="c in topCharStats"
          :key="c.char"
          class="freq-item"
        >
          <span class="freq-char">{{ c.char }}</span>
          <div class="freq-bar-container">
            <div
              class="freq-bar"
              :style="{ width: (c.count / maxFreqCount * 100) + '%' }"
            ></div>
          </div>
          <span class="freq-count">{{ c.count }}</span>
        </div>
      </n-space>
    </n-card>

    <n-card title="导出校样" :bordered="false" size="small" style="margin-top: 16px">
      <n-space vertical :size="8" style="width: 100%">
        <n-button
          type="primary"
          size="small"
          block
          :disabled="!proofResult || proofResult.totalPages === 0"
          @click="handleExportText"
        >
          导出文本报告
        </n-button>
        <n-button
          size="small"
          block
          :disabled="!proofResult || proofResult.totalPages === 0"
          @click="handleCopyText"
        >
          复制校样文本
        </n-button>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ProofConfig, ProofResult, StockPageEstimate, CharCount } from '@/types'
import { useCompositorStore } from '@/stores/compositor'
import { useProofDecisionStore } from '@/stores/proofDecision'
import { storeToRefs } from 'pinia'
import { composeProof, exportProofAsText } from '@/utils/proofEngine'
import { useMessage } from 'naive-ui'
import {
  NCard,
  NFormItem,
  NInputNumber,
  NInput,
  NSpace,
  NSwitch,
  NTag,
  NScrollbar,
  NList,
  NListItem,
  NButton,
  NProgress,
  NInput as NInputComp
} from 'naive-ui'

const store = useCompositorStore()
const decisionStore = useProofDecisionStore()
const message = useMessage()

const { charUniqueSet, totalAvailableStockByChar } = storeToRefs(store)
const { pendingIssues, progress } = storeToRefs(decisionStore)

const proofInputText = ref('')

const textCharCount = computed(() => {
  return proofInputText.value.replace(/\s/g, '').length
})

const proofConfig = ref<ProofConfig>({
  cols: 20,
  rows: 15,
  fontSize: 24,
  lineHeight: 1.5,
  paragraphIndent: 2,
  paragraphSpacing: 1,
  enableProhibition: true,
  enablePunctuationSqueeze: true
})

const proofResult = ref<ProofResult | null>(null)
const currentPage = ref(0)

const stockEstimate = computed<StockPageEstimate>(() => {
  return proofResult.value?.stockEstimate || {
    canCompletePages: 0,
    limitingChar: null,
    limitingCharAvailable: 0,
    limitingCharPerPage: 0,
    totalPages: 0
  }
})

const topCharStats = computed<CharCount[]>(() => {
  if (!proofResult.value) return []
  return proofResult.value.charStats.slice(0, 15)
})

const maxFreqCount = computed(() => {
  if (!proofResult.value || proofResult.value.charStats.length === 0) return 1
  return proofResult.value.charStats[0].count
})

watch([proofInputText, proofConfig], () => {
  generateProof()
}, { deep: true })

function generateProof() {
  if (!proofInputText.value || proofInputText.value.trim().length === 0) {
    proofResult.value = null
    currentPage.value = 0
    decisionStore.resetAll()
    return
  }

  const oldTotalPages = proofResult.value?.totalPages || 0
  const oldCurrentPage = currentPage.value

  proofResult.value = composeProof(
    proofInputText.value,
    proofConfig.value,
    charUniqueSet.value,
    totalAvailableStockByChar.value
  )

  if (proofResult.value) {
    decisionStore.setIssues(proofResult.value.issues)
  }

  const newTotalPages = proofResult.value.totalPages

  if (newTotalPages !== oldTotalPages && oldTotalPages > 0) {
    const pageProgress = oldCurrentPage / Math.max(1, oldTotalPages - 1)
    currentPage.value = Math.round(pageProgress * Math.max(0, newTotalPages - 1))
  }

  if (currentPage.value >= newTotalPages) {
    currentPage.value = Math.max(0, newTotalPages - 1)
  }
  if (currentPage.value < 0) {
    currentPage.value = 0
  }
}

function updateConfig(key: keyof ProofConfig, value: number | boolean | null) {
  if (value !== null) {
    (proofConfig.value as any)[key] = value
  }
}

function handleTextChange(value: string) {
  proofInputText.value = value
}
function getIssueTagType(severity: string): 'error' | 'warning' | 'info' {
 switch (severity) {
 case 'error': return 'error';
 case 'warning': return 'warning';
 default: return 'info';
 }
}
function getIssueTypeLabel(type: string): string {
 switch (type) {
 case 'prohibition-start': return '行首禁则';
 case 'prohibition-end': return '行尾禁则';
 case 'missing-char': return '缺字';
 case 'insufficient-stock': return '库存不足';
 case 'line-overflow': return '行溢出';
 default: return '其他';
 }
}
function handleExportText() {
 if (!proofResult.value)
 return;
 const text = exportProofAsText(proofResult.value, proofConfig.value);
 const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
 const url = URL.createObjectURL(blob);
 const link = document.createElement('a');
 link.href = url;
 link.download = `印刷校样报告_${new Date().toISOString().slice(0, 10)}.txt`;
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 URL.revokeObjectURL(url);
 message.success('校样报告已导出');
}
function handleCopyText() {
  if (!proofResult.value) return
  const text = exportProofAsText(proofResult.value, proofConfig.value)
  navigator.clipboard.writeText(text).then(() => {
    message.success('校样文本已复制到剪贴板')
  }).catch(() => {
    message.error('复制失败')
  })
}

function setCurrentPage(page: number) {
  const total = proofResult.value?.totalPages || 0
  currentPage.value = Math.max(0, Math.min(page, Math.max(0, total - 1)))
}

function nextPage() {
  setCurrentPage(currentPage.value + 1)
}

function prevPage() {
  setCurrentPage(currentPage.value - 1)
}

defineExpose({
  proofConfig,
  proofResult,
  currentPage,
  setCurrentPage,
  nextPage,
  prevPage
})
</script>

<style scoped>
.proof-panel {
  width: 100%;
}

.text-stats {
  margin-top: 8px;
  text-align: right;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.stat-label {
  color: #999;
}

.stat-value {
  font-weight: 600;
  color: #333;
}

.stat-value.error {
  color: #d03050;
}

.stat-value.warning {
  color: #d48806;
}

.estimate-main {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.estimate-number {
  font-size: 28px;
  font-weight: 700;
  color: #18a058;
}

.estimate-unit {
  font-size: 13px;
  color: #666;
}

.estimate-detail {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
}

.estimate-detail-small {
  font-size: 12px;
  color: #999;
}

.estimate-footer {
  font-size: 12px;
  color: #999;
  text-align: right;
}

.missing-item {
  padding: 8px;
  background: #fff1f0;
  border-radius: 4px;
}

.missing-char-info {
  margin-bottom: 4px;
}

.missing-alternatives {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 12px;
}

.alt-label {
  color: #999;
}

.alt-tag {
  cursor: pointer;
}

.problem-line-item {
  padding: 10px 12px !important;
}

.problem-line-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.problem-count {
  font-size: 12px;
  color: #999;
}

.problem-issue {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.issue-desc {
  color: #666;
}

.empty-tip {
  color: #999;
  font-size: 13px;
  text-align: center;
  padding: 12px 0;
}

.freq-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.freq-char {
  width: 24px;
  text-align: center;
  font-weight: 500;
}

.freq-bar-container {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.freq-bar {
  height: 100%;
  background: linear-gradient(90deg, #18a058, #36ad6a);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.freq-count {
  width: 30px;
  text-align: right;
  color: #666;
  font-size: 12px;
}
</style>
