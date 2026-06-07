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
          :key="char.char"
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
              fill: '#ffffff',
              stroke: '#d0d0d0',
              strokeWidth: 1,
              cornerRadius: 4,
              shadowColor: 'rgba(0,0,0,0.1)',
              shadowBlur: 3,
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
        </v-group>

        <v-line
          v-if="showPath && pathSteps.length > 1"
          :config="pathLineConfig"
        />

        <v-circle
          v-if="showPath"
          v-for="step in pathSteps"
          :key="`step-${step.index}`"
          :config="{
            x: step.x * cellSize + cellSize / 2,
            y: step.y * cellSize + cellSize / 2 - cellSize * 0.3,
            radius: 10,
            fill: stepNodeColor,
            stroke: '#fff',
            strokeWidth: 2,
          }"
        />

        <v-text
          v-if="showPath"
          v-for="step in pathSteps"
          :key="`step-num-${step.index}`"
          :config="{
            x: step.x * cellSize + cellSize / 2 - 6,
            y: step.y * cellSize + cellSize / 2 - cellSize * 0.3 - 6,
            text: String(step.index + 1),
            fontSize: 11,
            fill: '#fff',
            width: 12,
            align: 'center',
          }"
        />
      </v-layer>
    </v-stage>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCompositorStore } from '@/stores/compositor'
import { storeToRefs } from 'pinia'
import type { TypeChar } from '@/types'

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
  moveCharacter
} = storeToRefs(store)

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

function getStockColor(char: TypeChar) {
  if (insufficientSet.value.has(char.char)) {
    return '#d03050'
  }
  return '#666'
}

const pathLineConfig = computed(() => {
  if (pathSteps.value.length <= 1) {
    return { points: [], stroke: 'transparent' }
  }
  const points: number[] = []
  pathSteps.value.forEach(step => {
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

const stepNodeColor = computed(() => {
  return canCompletePick.value ? '#18a058' : '#f0a020'
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
    const result = moveCharacter.value(char.char, boundedX, boundedY)
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
