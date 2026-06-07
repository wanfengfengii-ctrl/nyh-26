import type { PathStep, TypeChar, CharCount } from '@/types'

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}

export function totalPathDistance(steps: PathStep[]): number {
  if (steps.length <= 1) return 0
  let dist = 0
  for (let i = 1; i < steps.length; i++) {
    dist += distance(steps[i - 1].x, steps[i - 1].y, steps[i].x, steps[i].y)
  }
  return dist
}

export function nearestNeighborOptimize(steps: PathStep[]): PathStep[] {
  if (steps.length <= 2) return steps

  const remaining = [...steps]
  const optimized: PathStep[] = []
  const first = remaining.shift()!
  optimized.push({ ...first, index: 0 })

  let current = { x: first.x, y: first.y }
  let newIndex = 1

  while (remaining.length > 0) {
    let minDist = Infinity
    let minIdx = -1

    for (let i = 0; i < remaining.length; i++) {
      const dist = distance(current.x, current.y, remaining[i].x, remaining[i].y)
      if (dist < minDist) {
        minDist = dist
        minIdx = i
      }
    }

    const next = remaining.splice(minIdx, 1)[0]
    optimized.push({ ...next, index: newIndex++ })
    current = { x: next.x, y: next.y }
  }

  return optimized
}

function twoOptSwap(steps: PathStep[], i: number, k: number): PathStep[] {
  const result = steps.slice(0, i)
  for (let j = k; j >= i; j--) {
    result.push(steps[j])
  }
  result.push(...steps.slice(k + 1))
  return result.map((s, idx) => ({ ...s, index: idx }))
}

export function twoOptOptimize(steps: PathStep[], maxIterations: number = 50): PathStep[] {
  if (steps.length <= 3) return steps

  let best = [...steps]
  let bestDist = totalPathDistance(best)
  let improved = true
  let iterations = 0

  while (improved && iterations < maxIterations) {
    improved = false
    iterations++

    for (let i = 1; i < best.length - 2; i++) {
      for (let k = i + 1; k < best.length - 1; k++) {
        const newPath = twoOptSwap(best, i, k)
        const newDist = totalPathDistance(newPath)
        if (newDist < bestDist - 0.001) {
          best = newPath
          bestDist = newDist
          improved = true
        }
      }
    }
  }

  return best
}

export function greedyTwoOptOptimize(steps: PathStep[]): PathStep[] {
  const nn = nearestNeighborOptimize(steps)
  return twoOptOptimize(nn)
}

export function groupByCharAndAssignStock(
  charCounts: CharCount[],
  characters: TypeChar[]
): { assigned: PathStep[]; shortages: CharCount[] } {
  const charLocations = new Map<string, TypeChar[]>()
  characters.forEach(c => {
    if (!charLocations.has(c.char)) {
      charLocations.set(c.char, [])
    }
    charLocations.get(c.char)!.push(c)
  })

  const assigned: PathStep[] = []
  const shortages: CharCount[] = []

  for (const cc of charCounts) {
    const locations = charLocations.get(cc.char) || []
    const totalStock = locations.reduce((sum, loc) => sum + loc.stock, 0)

    if (totalStock < cc.count) {
      shortages.push({ char: cc.char, count: cc.count - totalStock })
    }

    let remaining = cc.count
    let stepIndex = assigned.length

    for (const loc of locations) {
      if (remaining <= 0) break
      const take = Math.min(remaining, loc.stock)
      for (let i = 0; i < take; i++) {
        assigned.push({
          char: cc.char,
          x: loc.x,
          y: loc.y,
          index: stepIndex++,
          charInstanceId: loc.id || `${loc.x},${loc.y}`,
          stockRemaining: loc.stock - i - 1
        })
      }
      remaining -= take
    }
  }

  return { assigned, shortages }
}

export interface OptimizedPickResult {
  steps: PathStep[]
  totalDistance: number
  shortages: CharCount[]
  algorithm: string
}

export function optimizePickPath(
  charCounts: CharCount[],
  characters: TypeChar[],
  algorithm: 'nearest-neighbor' | 'greedy-2opt' | 'original' = 'greedy-2opt',
  startX: number = 0,
  startY: number = 0
): OptimizedPickResult {
  const { assigned, shortages } = groupByCharAndAssignStock(charCounts, characters)

  if (assigned.length === 0) {
    return { steps: [], totalDistance: 0, shortages, algorithm }
  }

  const startStep: PathStep = {
    char: '__START__',
    x: startX,
    y: startY,
    index: 0,
    charInstanceId: 'start'
  }

  const stepsWithStart = [startStep, ...assigned]
  let optimized: PathStep[]

  switch (algorithm) {
    case 'nearest-neighbor':
      optimized = nearestNeighborOptimize(stepsWithStart)
      break
    case 'greedy-2opt':
      optimized = greedyTwoOptOptimize(stepsWithStart)
      break
    case 'original':
    default:
      optimized = stepsWithStart.map((s, i) => ({ ...s, index: i }))
  }

  const realSteps = optimized.filter(s => s.char !== '__START__')
  const reindexed = realSteps.map((s, i) => ({ ...s, index: i }))

  return {
    steps: reindexed,
    totalDistance: totalPathDistance(reindexed),
    shortages,
    algorithm
  }
}

export interface RerouteResult {
  newSteps: PathStep[]
  reroutedEvents: { stepIndex: number; char: string; fromX: number; fromY: number; toX: number; toY: number; reason: 'stock-depleted' | 'shorter-path' }[]
  shortages: CharCount[]
}

export function rerouteAfterDepletion(
  currentSteps: PathStep[],
  depletedStepIndex: number,
  characters: TypeChar[],
  charCounts: CharCount[]
): RerouteResult {
  const step = currentSteps[depletedStepIndex]
  if (!step) {
    return { newSteps: currentSteps, reroutedEvents: [], shortages: [] }
  }

  const char = step.char
  const usedStocks = new Map<string, number>()
  for (let i = 0; i <= depletedStepIndex; i++) {
    const s = currentSteps[i]
    const key = s.charInstanceId || `${s.x},${s.y}`
    usedStocks.set(key, (usedStocks.get(key) || 0) + 1)
  }

  const availableLocations = characters
    .filter(c => c.char === char)
    .filter(c => {
      const key = c.id || `${c.x},${c.y}`
      const used = usedStocks.get(key) || 0
      return c.stock > used
    })

  if (availableLocations.length === 0) {
    const cc = charCounts.find(c => c.char === char)
    return {
      newSteps: currentSteps,
      reroutedEvents: [],
      shortages: cc ? [{ char, count: 1 }] : []
    }
  }

  const currentPos = depletedStepIndex > 0
    ? { x: currentSteps[depletedStepIndex - 1].x, y: currentSteps[depletedStepIndex - 1].y }
    : { x: step.x, y: step.y }

  let nearest = availableLocations[0]
  let minDist = Infinity
  for (const loc of availableLocations) {
    const d = distance(currentPos.x, currentPos.y, loc.x, loc.y)
    if (d < minDist) {
      minDist = d
      nearest = loc
    }
  }

  const newSteps = [...currentSteps]
  newSteps[depletedStepIndex] = {
    ...step,
    x: nearest.x,
    y: nearest.y,
    charInstanceId: nearest.id || `${nearest.x},${nearest.y}`,
    isRerouted: true,
    originalIndex: step.originalIndex ?? step.index
  }

  const reroutedEvents = [{
    stepIndex: depletedStepIndex,
    char,
    fromX: step.x,
    fromY: step.y,
    toX: nearest.x,
    toY: nearest.y,
    reason: 'stock-depleted' as const
  }]

  return { newSteps, reroutedEvents, shortages: [] }
}
