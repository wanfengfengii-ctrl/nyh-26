<template>
  <div class="type-tray-container">
    <v-stage
      :config="stageConfig"
      ref="stageRef"
      class="type-tray-stage"
    >
      <v-layer>
        <v-rect
          v-for="(_, idx) in gridCells"
          :key="`bg-${idx}`"
          :config="getCellConfig(idx)"
        />

        <v-rect
          v-for="(heat, key) in heatmapCells"
          :key="`heat-${key}`"
          :config="getHeatmapConfig(heat.x, heat.y, heat.value)"
        />

        <v-group
          v-for="char in characters"
          :key="char.id || char.char"
          :config="{
            x: char.x * cellSize + cellSize / 2,
            y: char.y * cellSize + cellSize / 2,
            draggable: editable,
          }"
          @dragstart="handleDragStart(char)"
          @dragend="handleDragEnd($event, char)"
        >
          <v-rect
            :config="{
              x: -cellSize / 2 + 2,
              y: -cellSize / 2 + 2,
              width: cellSize - 4,
              height: cellSize - 4,
              fill: getCharBgColor(char),
              stroke: getCharStrokeColor(char),
              strokeWidth: getCharStrokeWidth(char),
              cornerRadius: 4,
              shadowColor: getShadowColor(char),
              shadowBlur: getShadowBlur(char),
              shadowOffsetX: 1,
              shadowOffsetY: 1,
            }"
          />
          <v-text
            :config="{
              text: char.char,
              fontSize: cellSize * 0.5,
              fontFamily: 'serif',
              fill: '#333',
              x: 0,
              y: -cellSize * 0.15,
              width: cellSize - 8,
              align: 'center',
              ellipsis: false,
            }"
          />
          <v-text
            :config="{
              text: `库存:${char.stock}`,
              fontSize: 10,
              fill: getStockColor(char),
              x: 0,
              y: cellSize * 0.25,
              width: cellSize - 8,
              align: 'center',
            }"
          />
          <v-text
            v-if="getInstanceLabel(char)"
            :config="{
              text: getInstanceLabel(char) || '',
              fontSize: 9,
              fill: '#18a058',
              x: cellSize / 2 - 4,
              y: -cellSize / 2 + 8,
              width: 20,
              align: 'right',
            }"
          />
        </v-group>

        <v-line
          v-if="showPath && pathSteps.length > 1"
          :config="pathLineConfig"
        />

        <v-circle
          v-if="showPath"
          v-for="step in displaySteps"
          :key="`step-${step.index}`"
          :config="getStepNodeConfig(step)"
        />

        <v-text
          v-if="showPath"
          v-for="step in displaySteps"
          :key="`step-num-${step.index}`"
          :config="getStepTextConfig(step)"
        />

        <v-circle
          v-if="showAnimatedPicker && animPosition"
          :config="{
            x: animPosition.x * cellSize + cellSize / 2,
            y: animPosition.y * cellSize + cellSize / 2,
            radius: cellSize * 0.35,
            fill: 'rgba(24, 160, 88, 0.2)',
            stroke: '#18a058',
            strokeWidth: 2,
            listening: false,
          }"
        />
        <v-text
          v-if="showAnimatedPicker && currentAnimChar"
          :config="{
            x: animPosition.x * cellSize + cellSize / 2,
            y: animPosition.y * cellSize + cellSize / 2 - cellSize * 0.55,
            text: currentAnimChar,
            fontSize: cellSize * 0.4,
            fontFamily: 'serif',
            fill: '#18a058',
            width: cellSize,
            align: 'center',
            listening: false,
          }"
        />
      </v-layer>
    </v-stage>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useCompositorStore } from '@/stores/compositor'
import { storeToRefs } from 'pinia'
import type { TypeChar, PathStep } from '@/types'

const props = defineProps<{
  editable?: boolean
}>()

const store = useCompositorStore()
const {
  gridConfig,
  characters,
  showPath,
  pathSteps,
  heatmapData,
  maxHeatValue,
  showHeatmap,
  insufficientStockChars,
  missingChars,
  canCompletePick,
  currentTaskSheet,
  currentTaskStep,
  isAnimating,
  charMap
} = storeToRefs(store)

const { moveCharacter } = store

const stageRef = ref()

const cellSize = computed(() => gridConfig.value.cellSize)
const cols = computed(() => gridConfig.value.cols)
const rows = computed(() => gridConfig.value.rows)

const stageConfig = computed(() => ({
  width: cols.value * cellSize.value,
  height: rows.value * cellSize.value,
}))

const gridCells = computed(() => {
  const cells: { x: number; y: number }[] = []
  for (let y = 0; y < rows.value; y++) {
    for (let x = 0; x < cols.value; x++) {
      cells.push({ x, y })
    }
  }
  return cells
})

function getCellConfig(idx: number) {
  const cell = gridCells.value[idx]
  return {
    x: cell.x * cellSize.value,
    y: cell.y * cellSize.value,
    width: cellSize.value,
    height: cellSize.value,
    fill: (cell.x + cell.y) % 2 === 0 ? '#fafafa' : '#f0f0f0',
    stroke: '#e0e0e0',
    strokeWidth: 1,
  }
}

const heatmapCells = computed(() => {
  if (!showHeatmap.value) return []
  const cells: { x: number; y: number; value: number }[] = []
  heatmapData.value.forEach((value, key) => {
    const [x, y] = key.split(',').map(Number)
    cells.push({ x, y, value })
  })
  return cells
})

function getHeatmapConfig(x: number, y: number, value: number) {
  const ratio = value / maxHeatValue.value
  const r = Math.floor(255 * (1 - ratio) + 24 * ratio)
  const g = Math.floor(250 * (1 - ratio) + 160 * ratio)
  const b = Math.floor(240 * (1 - ratio) + 88 * ratio)
  return {
    x: x * cellSize.value + 2,
    y: y * cellSize.value + 2,
    width: cellSize.value - 4,
    height: cellSize.value - 4,
    fill: `rgba(${r}, ${g}, ${b}, 0.6)`,
    cornerRadius: 4,
    listening: false,
  }
}

const insufficientSet = computed(() => {
  const set = new Set<string>()
  insufficientStockChars.value.forEach(c => set.add(c.char))
  return set
})

const multiCopyChars = computed(() => {
  const set = new Set<string>()
  charMap.value.forEach((instances, char) => {
    if (instances.length > 1) set.add(char)
  })
  return set
})

const activeTaskItem = computed(() => {
  if (!currentTaskSheet.value || currentTaskStep.value < 0 || currentTaskStep.value >= currentTaskSheet.value.items.length) {
    return null
  }
  return currentTaskSheet.value.items[currentTaskStep.value]
})

const completedTaskItems = computed(() => {
  if (!currentTaskSheet.value || currentTaskStep.value <= 0) return []
  return currentTaskSheet.value.items.slice(0, currentTaskStep.value)
})

function getCharBgColor(char: TypeChar): string {
  const posKey = `${char.x},${char.y}`

  if (activeTaskItem.value && activeTaskItem.value.charInstanceId === char.id) {
    return '#e6f7ff'
  }

  if (completedTaskItems.value.some(item => item.charInstanceId === char.id)) {
    return '#f6ffed'
  }

  return '#ffffff'
}

function getCharStrokeColor(char: TypeChar): string {
  if (multiCopyChars.value.has(char.char)) {
    return '#18a058'
  }
  return '#d0d0d0'
}

function getCharStrokeWidth(char: TypeChar): number {
  if (multiCopyChars.value.has(char.char)) {
    return 2
  }
  return 1
}

function getShadowColor(char: TypeChar): string {
  if (multiCopyChars.value.has(char.char)) {
    return 'rgba(24, 160, 88, 0.3)'
  }
  return 'rgba(0,0,0,0.1)'
}

function getShadowBlur(char: TypeChar): number {
  if (multiCopyChars.value.has(char.char)) {
    return 6
  }
  return 3
}

function getStockColor(char: TypeChar) {
  if (insufficientSet.value.has(char.char)) {
    return '#d03050'
  }
  if (multiCopyChars.value.has(char.char)) {
    return '#18a058'
  }
  return '#666'
}

function getInstanceLabel(char: TypeChar): string | null {
  if (!multiCopyChars.value.has(char.char)) return null
  const instances = charMap.value.get(char.char)
  if (!instances) return null
  const idx = instances.findIndex(i => i.id === char.id)
  if (idx === -1) return null
  return `#${idx + 1}`
}

const displaySteps = computed(() => {
  if (currentTaskSheet.value && currentTaskSheet.value.items.length > 0) {
    const steps: PathStep[] = currentTaskSheet.value.items.map((item, idx) => ({
      char: item.char,
      x: item.x,
      y: item.y,
      index: idx,
      charInstanceId: item.charInstanceId
    }))
    return steps
  }
  return pathSteps.value
})

const pathLineConfig = computed(() => {
  if (displaySteps.value.length <= 1) {
    return { points: [], stroke: 'transparent' }
  }

  const showCount = currentTaskSheet.value
    ? Math.max(0, currentTaskStep.value + 1)
    : displaySteps.value.length

  const visibleSteps = displaySteps.value.slice(0, Math.min(showCount, displaySteps.value.length))

  const points: number[] = []
  visibleSteps.forEach(step => {
    points.push(step.x * cellSize.value + cellSize.value / 2)
    points.push(step.y * cellSize.value + cellSize.value / 2)
  })

  const strokeColor = canCompletePick.value ? '#18a058' : '#f0a020'
  return {
    points,
    stroke: strokeColor,
    strokeWidth: 2,
    lineCap: 'round',
    lineJoin: 'round',
    dash: canCompletePick.value ? [8, 4] : [4, 4],
    opacity: canCompletePick.value ? 0.7 : 0.5,
    listening: false,
  }
})

function getStepNodeConfig(step: PathStep) {
  const isCompleted = currentTaskSheet.value
    ? currentTaskStep.value >= 0 && step.index < currentTaskStep.value
    : false
  const isCurrent = currentTaskSheet.value
    ? step.index === currentTaskStep.value
    : false

  let fill = stepNodeColor.value
  if (isCompleted) {
    fill = '#52c41a'
  } else if (isCurrent) {
    fill = '#1890ff'
  }

  return {
    x: step.x * cellSize.value + cellSize.value / 2,
    y: step.y * cellSize.value + cellSize.value / 2 - cellSize.value * 0.3,
    radius: isCurrent ? 14 : 10,
    fill,
    stroke: '#fff',
    strokeWidth: 2,
    listening: false,
  }
}

function getStepTextConfig(step: PathStep) {
  return {
    x: step.x * cellSize.value + cellSize.value / 2 - 6,
    y: step.y * cellSize.value + cellSize.value / 2 - cellSize.value * 0.3 - 6,
    text: String(step.index + 1),
    fontSize: 11,
    fill: '#fff',
    width: 12,
    align: 'center',
    listening: false,
  }
}

const stepNodeColor = computed(() => {
  return canCompletePick.value ? '#18a058' : '#f0a020'
})

const showAnimatedPicker = computed(() => {
  return isAnimating.value || (currentTaskSheet.value && currentTaskStep.value >= 0)
})

const animPosition = computed(() => {
  if (displaySteps.value.length === 0) return null
  if (currentTaskSheet.value && currentTaskStep.value >= 0) {
    const stepIdx = Math.min(currentTaskStep.value, displaySteps.value.length - 1)
    if (stepIdx >= 0 && stepIdx < displaySteps.value.length) {
      return { x: displaySteps.value[stepIdx].x, y: displaySteps.value[stepIdx].y }
    }
  }
  return null
})

const currentAnimChar = computed(() => {
  if (displaySteps.value.length === 0) return ''
  if (currentTaskSheet.value && currentTaskStep.value >= 0) {
    const stepIdx = Math.min(currentTaskStep.value, displaySteps.value.length - 1)
    if (stepIdx >= 0 && stepIdx < displaySteps.value.length) {
      return displaySteps.value[stepIdx].char
    }
  }
  return ''
})

let dragStartChar: TypeChar | null = null

function handleDragStart(char: TypeChar) {
  dragStartChar = char
}

function handleDragEnd(event: any, char: TypeChar) {
  const node = event.target
  const newX = Math.round(node.x() / cellSize.value - 0.5)
  const newY = Math.round(node.y() / cellSize.value - 0.5)

  const boundedX = Math.max(0, Math.min(cols.value - 1, newX))
  const boundedY = Math.max(0, Math.min(rows.value - 1, newY))

  if (boundedX !== char.x || boundedY !== char.y) {
    const result = moveCharacter.value(char.id!, boundedX, boundedY)
    if (!result.success) {
      node.x(char.x * cellSize.value + cellSize.value / 2)
      node.y(char.y * cellSize.value + cellSize.value / 2)
    }
  } else {
    node.x(char.x * cellSize.value + cellSize.value / 2)
    node.y(char.y * cellSize.value + cellSize.value / 2)
  }

  dragStartChar = null
}
</script>

<style scoped>
.type-tray-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: auto;
}

.type-tray-stage {
  cursor: default;
}
</style>
