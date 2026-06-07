<template>
  <div class="control-panel">
    <n-alert
      v-if="!canCompletePick && inputText.trim().length > 0"
      :type="alertType"
      :title="alertTitle"
      show-icon
      style="margin-bottom: 16px"
    >
      <template #default>
      <div class="alert-detail">
        <div v-if="missingChars.length > 0" class="alert-line">
          <span>· 缺失 {{ missingChars.length }} 个字符：</span>
          <span class="alert-chars">
            {{ missingChars.map(c => c.char).join('、') }}
          </span>
        </div>
        <div v-if="insufficientStockChars.length > 0" class="alert-line">
          <span>· 库存不足 {{ insufficientStockChars.length }} 项</span>
        </div>
      </div>
      </template>
    </n-alert>

    <n-card title="字盘设置" :bordered="false" size="small">
      <n-space vertical :size="12">
        <n-form-item label="列数">
          <n-input-number
            :value="gridConfig.cols"
            :min="2"
            :max="30"
            @update:value="(v) => handleGridChange('cols', v)"
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item label="行数">
          <n-input-number
            :value="gridConfig.rows"
            :min="2"
            :max="20"
            @update:value="(v) => handleGridChange('rows', v)"
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item label="格子大小">
          <n-input-number
            :value="gridConfig.cellSize"
            :min="30"
            :max="100"
            @update:value="(v) => handleGridChange('cellSize', v)"
            style="width: 100%"
          />
        </n-form-item>
      </n-space>
    </n-card>

    <n-card title="待印文本" :bordered="false" size="small" style="margin-top: 16px">
      <n-space vertical :size="12" style="width: 100%">
        <n-input
          type="textarea"
          :value="inputText"
          placeholder="请输入要印刷的文字..."
          :rows="4"
          @update:value="handleTextChange"
        />
        <n-space vertical :size="8">
          <n-space>
            <n-switch v-model:value="showPath">
              <template #checked>显示路径</template>
              <template #unchecked>隐藏路径</template>
            </n-switch>
            <n-switch v-model:value="showHeatmap">
              <template #checked>热力图</template>
              <template #unchecked>无热力</template>
            </n-switch>
          </n-space>
          <n-space>
            <n-switch v-model:value="optimizePath">
              <template #checked>路径优化</template>
              <template #unchecked>按原文顺序</template>
            </n-switch>
            <n-tag v-if="optimizePath && savedDistancePercent > 0" type="success" size="small">
              节省 {{ savedDistancePercent }}%
            </n-tag>
          </n-space>
        </n-space>
      </n-space>
    </n-card>

    <n-card title="统计信息" :bordered="false" size="small" style="margin-top: 16px">
      <n-statistic label="总移动距离 (格)" :value="totalDistance" :precision="2">
        <template #suffix>
          <n-tag v-if="optimizePath && savedDistancePercent > 0" type="success" size="small">
            优化后
          </n-tag>
        </template>
      </n-statistic>
      <n-statistic
        v-if="optimizePath && originalDistance !== totalDistance"
        label="原顺序距离"
        :value="originalDistance"
        :precision="2"
        style="margin-top: 8px; font-size: 12px"
      >
        <template #label>
          <span style="color: #999; font-size: 12px">原顺序距离 (格)</span>
        </template>
      </n-statistic>
      <n-divider style="margin: 12px 0" />
      <n-statistic label="字符总数" :value="totalChars" />
      <n-statistic label="可用字符" :value="availableCharsCount" style="margin-top: 8px" />
      <n-statistic label="缺失字符" :value="missingChars.length" style="margin-top: 8px">
        <template #value>
          <span :class="{ 'text-error': missingChars.length > 0 }">
            {{ missingChars.length }}
          </span>
        </template>
      </n-statistic>
    </n-card>

    <n-card v-if="missingChars.length > 0" title="缺字清单" :bordered="false" size="small" type="error" style="margin-top: 16px">
      <div class="missing-chars">
        <n-tag
          v-for="c in missingChars"
          :key="c.char"
          type="error"
          style="margin: 4px"
        >
          {{ c.char }} × {{ c.count }}
        </n-tag>
      </div>
    </n-card>

    <n-card v-if="insufficientStockChars.length > 0" title="库存不足" :bordered="false" size="small" type="warning" style="margin-top: 16px">
      <div class="stock-warning">
        <n-tag
          v-for="c in insufficientStockChars"
          :key="c.char"
          type="warning"
          style="margin: 4px"
        >
          {{ c.char }}: 需{{ c.needed }} / 有{{ c.available }}
        </n-tag>
      </div>
    </n-card>

    <n-card title="字符使用频率" :bordered="false" size="small" style="margin-top: 16px">
      <div v-if="availableCharCounts.length === 0" class="empty-tip">
        输入文本后显示
      </div>
      <n-space v-else vertical :size="4" style="width: 100%">
        <div
          v-for="c in availableCharCounts.slice(0, 15)"
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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCompositorStore } from '@/stores/compositor'
import { storeToRefs } from 'pinia'
import {
  NCard,
  NFormItem,
  NInputNumber,
  NInput,
  NSpace,
  NSwitch,
  NStatistic,
  NDivider,
  NTag,
  NAlert
} from 'naive-ui'

const store = useCompositorStore()
const {
  gridConfig,
  inputText,
  showPath,
  showHeatmap,
  optimizePath,
  missingChars,
  availableCharCounts,
  insufficientStockChars,
  totalDistance,
  originalDistance,
  savedDistancePercent,
  charCounts,
  canCompletePick
} = storeToRefs(store)

const { setGridConfig, setInputText, toggleOptimizePath } = store

const totalChars = computed(() => {
  return charCounts.value.reduce((sum, c) => sum + c.count, 0)
})

const availableCharsCount = computed(() => {
  return availableCharCounts.value.reduce((sum, c) => sum + c.count, 0)
})

const maxFreqCount = computed(() => {
  if (availableCharCounts.value.length === 0) return 1
  return availableCharCounts.value[0].count
})

const alertType = computed(() => {
  if (missingChars.value.length > 0) return 'error'
  return 'warning'
})

const alertTitle = computed(() => {
  if (missingChars.value.length > 0 && insufficientStockChars.value.length > 0) {
    return '⚠️ 无法完成拣字 - 存在缺字和库存不足'
  }
  if (missingChars.value.length > 0) {
    return '⚠️ 无法完成拣字 - 存在缺失字符'
  }
  return '⚠️ 库存不足 - 无法完整拣字'
})

function handleGridChange(key: 'cols' | 'rows' | 'cellSize', value: number | null) {
  if (value !== null) {
    setGridConfig({ [key]: value })
  }
}

function handleTextChange(value: string) {
  setInputText(value)
}
</script>

<style scoped>
.control-panel {
  width: 320px;
}

.alert-detail {
  margin-top: 8px;
  font-size: 13px;
}

.alert-line {
  margin-bottom: 4px;
  line-height: 1.6;
}

.alert-chars {
  font-weight: 500;
  letter-spacing: 1px;
}

.missing-chars,
.stock-warning {
  display: flex;
  flex-wrap: wrap;
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

.text-error {
  color: #d03050;
}
</style>
