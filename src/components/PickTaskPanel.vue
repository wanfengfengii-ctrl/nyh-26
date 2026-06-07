<template>
  <div class="pick-task-panel">
    <n-card title="拣字任务单" :bordered="false" size="small">
      <n-space vertical :size="12" style="width: 100%">
        <n-button
          type="primary"
          size="small"
          block
          :disabled="pathSteps.length === 0"
          @click="handleGenerate"
        >
          生成拣字任务单
        </n-button>

        <template v-if="currentTaskSheet">
          <n-divider style="margin: 4px 0" />

          <div class="task-header">
            <span class="task-name">{{ currentTaskSheet.name }}</span>
            <n-tag :type="statusTagType" size="small">
              {{ statusText }}
            </n-tag>
          </div>

          <n-progress
            type="line"
            :percentage="progressPercent"
            :status="progressStatus"
            :show-indicator="false"
            style="margin-top: 4px"
          />

          <div class="task-stats">
            <div class="stat-item">
              <span class="stat-label">已拣字</span>
              <span class="stat-value">{{ currentTaskSheet.completedChars }}</span>
            </div>
            <div class="stat-divider" />
            <div class="stat-item">
              <span class="stat-label">总字数</span>
              <span class="stat-value">{{ currentTaskSheet.totalChars }}</span>
            </div>
            <div class="stat-divider" />
            <div class="stat-item">
              <span class="stat-label">总距离</span>
              <span class="stat-value">{{ currentTaskSheet.totalDistance }}</span>
            </div>
          </div>

          <n-space :size="8" wrap>
            <n-button size="small" :disabled="currentTaskStep <= 0" @click="handlePrev">
              上一步
            </n-button>
            <n-button
              size="small"
              type="primary"
              :disabled="currentTaskStep >= currentTaskSheet.items.length"
              @click="handleNext"
            >
              下一步
            </n-button>
          </n-space>

          <n-space :size="8" wrap>
            <n-button
              size="small"
              v-if="!isAnimating"
              @click="handleStartAnim"
              :disabled="currentTaskStep >= currentTaskSheet.items.length"
            >
              播放动画
            </n-button>
            <n-button size="small" v-else type="warning" @click="handleStopAnim">
              暂停
            </n-button>
            <n-button size="small" @click="handleReset">
              重置
            </n-button>
          </n-space>

          <n-space vertical :size="4" style="width: 100%">
            <span class="speed-label">动画速度</span>
            <n-slider
              v-model:value="animSpeed"
              :min="100"
              :max="2000"
              :step="100"
              :marks="{ 100: '快', 1000: '中', 2000: '慢' }"
              @update:value="handleSpeedChange"
            />
          </n-space>

          <n-divider style="margin: 4px 0" />

          <div class="task-list-title">
            <span>拣字步骤</span>
            <span class="step-count">{{ currentTaskSheet.items.length }} 个取字点</span>
          </div>

          <n-scrollbar style="max-height: 280px">
            <n-list bordered :show-divider="true" size="small">
              <n-list-item
                v-for="item in currentTaskSheet.items"
                :key="item.id"
                class="task-item"
                :class="{
                  'is-picking': item.status === 'picking',
                  'is-completed': item.status === 'completed'
                }"
              >
                <div class="item-order">
                  <n-tag size="small" :type="getItemTagType(item.status)" round>
                    {{ item.order + 1 }}
                  </n-tag>
                </div>
                <div class="item-info">
                  <span class="item-char">{{ item.char }}</span>
                  <span class="item-pos">({{ item.x }}, {{ item.y }})</span>
                </div>
                <div class="item-quantity">
                  <n-tag size="small" type="info">×{{ item.quantity }}</n-tag>
                </div>
              </n-list-item>
            </n-list>
          </n-scrollbar>

          <n-button size="small" text @click="handleClear">
            关闭任务单
          </n-button>
        </template>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref, onUnmounted } from 'vue'
import { useCompositorStore } from '@/stores/compositor'
import { storeToRefs } from 'pinia'
import { useMessage } from 'naive-ui'
import type { PickTaskItem } from '@/types'
import {
  NCard,
  NButton,
  NSpace,
  NDivider,
  NTag,
  NProgress,
  NList,
  NListItem,
  NScrollbar,
  NSlider
} from 'naive-ui'

const store = useCompositorStore()
const message = useMessage()

const {
  pathSteps,
  currentTaskSheet,
  currentTaskStep,
  isAnimating,
  animationSpeed
} = storeToRefs(store)

const {
  generatePickTaskSheet,
  clearTaskSheet,
  nextTaskStep,
  prevTaskStep,
  setTaskStep,
  startAnimation,
  stopAnimation,
  setAnimationSpeed
} = store

const animSpeed = ref(animationSpeed.value)

let animTimer: ReturnType<typeof setInterval> | null = null

const progressPercent = computed(() => {
  if (!currentTaskSheet.value) return 0
  const total = currentTaskSheet.value.totalChars
  if (total === 0) return 0
  return Math.round((currentTaskSheet.value.completedChars / total) * 100)
})

const progressStatus = computed<'success' | 'info' | 'warning' | 'error'>(() => {
  if (!currentTaskSheet.value) return 'info'
  if (currentTaskSheet.value.status === 'completed') return 'success'
  if (currentTaskSheet.value.status === 'partial') return 'warning'
  if (currentTaskSheet.value.status === 'in-progress') return 'info'
  return 'info'
})

const statusTagType = computed<'success' | 'info' | 'warning' | 'error'>(() => {
  if (!currentTaskSheet.value) return 'info'
  switch (currentTaskSheet.value.status) {
    case 'ready': return 'info'
    case 'in-progress': return 'warning'
    case 'completed': return 'success'
    case 'partial': return 'warning'
    default: return 'info'
  }
})

const statusText = computed(() => {
  if (!currentTaskSheet.value) return ''
  switch (currentTaskSheet.value.status) {
    case 'ready': return '待开始'
    case 'in-progress': return '进行中'
    case 'completed': return '已完成'
    case 'partial': return '部分完成'
    default: return ''
  }
})

function getItemTagType(status: PickTaskItem['status']): 'default' | 'success' | 'info' | 'warning' | 'error' {
  switch (status) {
    case 'pending': return 'default'
    case 'picking': return 'warning'
    case 'completed': return 'success'
    case 'shortage': return 'error'
    default: return 'default'
  }
}

function handleGenerate() {
  const sheet = generatePickTaskSheet()
  if (sheet) {
    message.success('任务单生成成功')
  }
}

function handleNext() {
  nextTaskStep()
}

function handlePrev() {
  prevTaskStep()
}

function handleReset() {
  setTaskStep(0)
  stopAnimation()
}

function handleClear() {
  stopAnimation()
  clearTaskSheet()
}

function handleStartAnim() {
  startAnimation()
}

function handleStopAnim() {
  stopAnimation()
}

function handleSpeedChange(val: number) {
  setAnimationSpeed(val)
}

watch(isAnimating, (val) => {
  if (val) {
    animTimer = setInterval(() => {
      if (currentTaskSheet.value && currentTaskStep.value < currentTaskSheet.value.items.length) {
        nextTaskStep()
      } else {
        stopAnimation()
      }
    }, animationSpeed.value)
  } else {
    if (animTimer) {
      clearInterval(animTimer)
      animTimer = null
    }
  }
})

onUnmounted(() => {
  if (animTimer) {
    clearInterval(animTimer)
  }
})
</script>

<style scoped>
.pick-task-panel {
  width: 100%;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-name {
  font-weight: 500;
  font-size: 14px;
}

.task-stats {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.stat-item {
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: #eee;
}

.task-list-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.step-count {
  font-size: 12px;
  color: #999;
  font-weight: normal;
}

.task-item {
  display: flex !important;
  align-items: center;
  padding: 8px 12px !important;
  transition: background 0.2s;
}

.task-item.is-picking {
  background: #fffbe6;
}

.task-item.is-completed {
  opacity: 0.6;
}

.item-order {
  flex-shrink: 0;
  margin-right: 10px;
}

.item-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-char {
  font-size: 18px;
  font-weight: 500;
  min-width: 24px;
  text-align: center;
}

.item-pos {
  font-size: 12px;
  color: #999;
  font-family: monospace;
}

.item-quantity {
  flex-shrink: 0;
}

.speed-label {
  font-size: 12px;
  color: #999;
}
</style>
