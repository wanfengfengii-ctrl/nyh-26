import type { PathStep, PickTaskSheet, PickTaskItem, CharCount, TypeChar } from '@/types'
import { totalPathDistance } from './pathOptimizer'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

export function generateTaskSheet(
  steps: PathStep[],
  shortages: CharCount[],
  totalChars: number,
  name?: string
): PickTaskSheet {
  const grouped = new Map<string, { steps: PathStep[]; char: string }>()

  steps.forEach((step, idx) => {
    const key = step.charInstanceId || `${step.x},${step.y}`
    if (!grouped.has(key)) {
      grouped.set(key, { steps: [], char: step.char })
    }
    grouped.get(key)!.steps.push(step)
  })

  const items: PickTaskItem[] = []
  let order = 0

  const firstStepByGroup = new Map<string, number>()
  steps.forEach((step, idx) => {
    const key = step.charInstanceId || `${step.x},${step.y}`
    if (!firstStepByGroup.has(key)) {
      firstStepByGroup.set(key, idx)
    }
  })

  const sortedGroups = Array.from(grouped.entries()).sort((a, b) => {
    const idxA = firstStepByGroup.get(a[0]) || 0
    const idxB = firstStepByGroup.get(b[0]) || 0
    return idxA - idxB
  })

  sortedGroups.forEach(([key, group]) => {
    const firstStep = group.steps[0]
    items.push({
      id: generateId(),
      char: group.char,
      x: firstStep.x,
      y: firstStep.y,
      quantity: group.steps.length,
      order: order++,
      charInstanceId: key,
      status: 'pending'
    })
  })

  const dist = totalPathDistance(steps)

  const hasShortage = shortages.length > 0
  const status: PickTaskSheet['status'] = hasShortage ? 'partial' : 'ready'

  return {
    id: generateId(),
    name: name || `拣字任务单 ${new Date().toLocaleString()}`,
    createdAt: Date.now(),
    items,
    totalDistance: Math.round(dist * 100) / 100,
    totalChars,
    completedChars: 0,
    shortageChars: shortages,
    status
  }
}

export function getTaskSheetProgress(sheet: PickTaskSheet): {
  completed: number
  total: number
  percent: number
} {
  const completed = sheet.completedChars
  const total = sheet.totalChars
  return {
    completed,
    total,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0
  }
}

export function generateStepByStepWalkthrough(
  sheet: PickTaskSheet,
  steps: PathStep[]
): {
  currentItemIndex: number
  currentStepIndex: number
  position: { x: number; y: number }
  nextPosition?: { x: number; y: number }
  remainingStock: number
  isComplete: boolean
}[] {
  const walkthrough: {
    currentItemIndex: number
    currentStepIndex: number
    position: { x: number; y: number }
    nextPosition?: { x: number; y: number }
    remainingStock: number
    isComplete: boolean
  }[] = []

  if (steps.length === 0) return walkthrough

  walkthrough.push({
    currentItemIndex: -1,
    currentStepIndex: -1,
    position: { x: 0, y: 0 },
    nextPosition: { x: steps[0].x, y: steps[0].y },
    remainingStock: -1,
    isComplete: false
  })

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    const item = sheet.items.find(it =>
      it.charInstanceId === (step.charInstanceId || `${step.x},${step.y}`)
    )

    const nextPos = i < steps.length - 1
      ? { x: steps[i + 1].x, y: steps[i + 1].y }
      : undefined

    walkthrough.push({
      currentItemIndex: item?.order ?? -1,
      currentStepIndex: i,
      position: { x: step.x, y: step.y },
      nextPosition: nextPos,
      remainingStock: step.stockRemaining ?? 0,
      isComplete: false
    })
  }

  const last = walkthrough[walkthrough.length - 1]
  if (last) {
    last.isComplete = true
  }

  return walkthrough
}

export function splitStockToMultipleLocations(
  char: TypeChar,
  targetCount: number,
  availablePositions: { x: number; y: number }[]
): TypeChar[] {
  if (targetCount <= 1 || availablePositions.length === 0) {
    return [char]
  }

  const perLocation = Math.ceil(char.stock / targetCount)
  const results: TypeChar[] = []
  let remaining = char.stock

  for (let i = 0; i < targetCount && remaining > 0; i++) {
    const pos = availablePositions[i] || { x: char.x + i, y: char.y }
    const stock = Math.min(perLocation, remaining)
    results.push({
      char: char.char,
      x: pos.x,
      y: pos.y,
      stock,
      id: `${char.char}-${i}`
    })
    remaining -= stock
  }

  return results
}

export function findEmptyPositions(
  characters: TypeChar[],
  cols: number,
  rows: number,
  nearX?: number,
  nearY?: number
): { x: number; y: number }[] {
  const used = new Set<string>()
  characters.forEach(c => used.add(`${c.x},${c.y}`))

  const empty: { x: number; y: number }[] = []
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!used.has(`${x},${y}`)) {
        empty.push({ x, y })
      }
    }
  }

  if (nearX !== undefined && nearY !== undefined) {
    empty.sort((a, b) => {
      const da = Math.abs(a.x - nearX) + Math.abs(a.y - nearY)
      const db = Math.abs(b.x - nearX) + Math.abs(b.y - nearY)
      return da - db
    })
  }

  return empty
}
