<template>
  <div class="proof-view">
    <aside class="proof-sidebar left-sidebar">
      <ProofPanel ref="proofPanelRef" />
    </aside>

    <section class="proof-main">
      <div class="proof-preview-wrapper">
        <ProofPreview
          :pages="proofPages"
          :config="proofConfig"
          :current-page="currentPage"
          @update:current-page="currentPage = $event"
          @char-click="handleCharClick"
          @line-click="handleLineClick"
          @issue-select="handleIssueSelect"
        />
      </div>
      <div class="proof-legend">
        <n-space :size="16" wrap>
          <div class="legend-item">
            <span class="legend-box normal"></span>
            <span>正常字符</span>
          </div>
          <div class="legend-item">
            <span class="legend-box missing"></span>
            <span>缺字（□ 占位）</span>
          </div>
          <div class="legend-item">
            <span class="legend-box punctuation"></span>
            <span>标点符号</span>
          </div>
          <div class="legend-item">
            <span class="legend-box issue-pending"></span>
            <span>待处理问题行</span>
          </div>
          <div class="legend-item">
            <span class="legend-box issue-resolved"></span>
            <span>已解决问题行</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot annotation"></span>
            <span>有批注</span>
          </div>
        </n-space>
      </div>
    </section>

    <aside class="proof-sidebar right-sidebar">
      <n-tabs type="line" animated size="small">
        <n-tab-pane name="decision" tab="🎯 决策处理">
          <IssueDecisionPanel
            :current-page="currentPage"
            :current-line="currentLine"
            :current-char="currentChar"
            :current-char-value="currentCharValue"
          />
        </n-tab-pane>
        <n-tab-pane name="dashboard" tab="📊 进度统计">
          <ProofDashboard />
        </n-tab-pane>
      </n-tabs>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NSpace, NTabs, NTabPane } from 'naive-ui'
import ProofPreview from './ProofPreview.vue'
import ProofPanel from './ProofPanel.vue'
import IssueDecisionPanel from './IssueDecisionPanel.vue'
import ProofDashboard from './ProofDashboard.vue'
import type { ProofConfig, ProofPage } from '@/types'

const proofPanelRef = ref<InstanceType<typeof ProofPanel> | null>(null)

const currentLine = ref<number | undefined>(undefined)
const currentChar = ref<number | undefined>(undefined)
const currentCharValue = ref<string>('')

const proofConfig = computed<ProofConfig>(() => {
  return proofPanelRef.value?.proofConfig || {
    cols: 20,
    rows: 15,
    fontSize: 24,
    lineHeight: 1.5,
    paragraphIndent: 2,
    paragraphSpacing: 1,
    enableProhibition: true,
    enablePunctuationSqueeze: true
  }
})

const proofPages = computed<ProofPage[]>(() => {
  return proofPanelRef.value?.proofResult?.pages || []
})

const totalPages = computed(() => {
  return proofPanelRef.value?.proofResult?.totalPages || 0
})

const currentPage = computed({
  get: () => proofPanelRef.value?.currentPage ?? 0,
  set: (val: number) => {
    if (proofPanelRef.value?.setCurrentPage) {
      proofPanelRef.value.setCurrentPage(val)
    }
  }
})

watch(currentPage, () => {
  currentLine.value = undefined
  currentChar.value = undefined
  currentCharValue.value = ''
})

function handleCharClick(page: number, line: number, charIndex: number, char: string) {
  currentLine.value = line
  currentChar.value = charIndex
  currentCharValue.value = char
}

function handleLineClick(page: number, line: number) {
  currentLine.value = line
  currentChar.value = undefined
  currentCharValue.value = ''
}

function handleIssueSelect(issueId: string) {
  // Issue select is handled by store
}
</script>

<style scoped>
.proof-view {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  gap: 12px;
}

.proof-sidebar {
  flex-shrink: 0;
  overflow-y: auto;
  min-height: 0;
}

.left-sidebar {
  width: 300px;
}

.right-sidebar {
  width: 320px;
}

.right-sidebar :deep(.n-tabs) {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.right-sidebar :deep(.n-tabs-content) {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.right-sidebar :deep(.n-tab-pane) {
  height: 100%;
  overflow-y: auto;
}

.proof-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.proof-preview-wrapper {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  min-height: 0;
}

.proof-legend {
  flex-shrink: 0;
  padding: 10px 16px;
  background: #fff;
  border-radius: 8px;
  margin-top: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
}

.legend-box {
  width: 18px;
  height: 18px;
  border-radius: 3px;
  display: inline-block;
  border: 1px solid #ddd;
}

.legend-box.normal {
  background: #f5f5f5;
}

.legend-box.missing {
  background: #fff1f0;
  border-color: #ffccc7;
}

.legend-box.punctuation {
  background: #f0f0f0;
  color: #666;
}

.legend-box.issue-pending {
  background: #fff7e6;
  border-color: #ffd591;
}

.legend-box.issue-resolved {
  background: #f6ffed;
  border-color: #b7eb8f;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.legend-dot.annotation {
  background: #1890ff;
}
</style>
