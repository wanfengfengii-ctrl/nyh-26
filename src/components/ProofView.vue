<template>
  <div class="proof-view">
    <aside class="proof-sidebar">
      <ProofPanel ref="proofPanelRef" />
    </aside>

    <section class="proof-main">
      <div class="proof-preview-wrapper">
        <ProofPreview
          :pages="proofPages"
          :config="proofConfig"
          :current-page="currentPage"
          @update:current-page="currentPage = $event"
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
            <span class="legend-box issue-line"></span>
            <span>问题行</span>
          </div>
        </n-space>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NSpace } from 'naive-ui'
import ProofPreview from './ProofPreview.vue'
import ProofPanel from './ProofPanel.vue'
import type { ProofConfig, ProofPage } from '@/types'

const proofPanelRef = ref<InstanceType<typeof ProofPanel> | null>(null)

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

const currentPage = ref(0)
</script>

<style scoped>
.proof-view {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  gap: 16px;
}

.proof-sidebar {
  flex-shrink: 0;
  width: 320px;
  overflow-y: auto;
  min-height: 0;
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
  padding: 12px 20px;
  background: #fff;
  border-radius: 8px;
  margin-top: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
}

.legend-box {
  width: 20px;
  height: 20px;
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

.legend-box.issue-line {
  background: #fff7e6;
  border-color: #ffd591;
}
</style>
