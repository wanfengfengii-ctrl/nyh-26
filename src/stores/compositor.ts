import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  TypeChar,
  GridConfig,
  PathStep,
  CharCount,
  CompositorScheme,
  PickTaskSheet,
  PickTaskItem,
  HistorySnapshot,
  ShortageInfo,
  PathAlgorithm,
  RerouteEvent
} from '@/types'
import {
  optimizePickPath,
  rerouteAfterDepletion,
  nearestNeighborOptimize,
  totalPathDistance
} from '@/utils/pathOptimizer'
import {
  generateTaskSheet,
  splitStockToMultipleLocations,
  findEmptyPositions
} from '@/utils/taskGenerator'
import { HistoryManager } from '@/utils/historyManager'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

const historyManager = new HistoryManager(50)

export const useCompositorStore = defineStore('compositor', () => {
  const gridConfig = ref<GridConfig>({
    cols: 12,
    rows: 8,
    cellSize: 60
  })

  const characters = ref<TypeChar[]>([
    { char: '天', x: 0, y: 0, stock: 5, id: '天-0' },
    { char: '地', x: 1, y: 0, stock: 3, id: '地-0' },
    { char: '人', x: 2, y: 0, stock: 4, id: '人-0' },
    { char: '和', x: 3, y: 0, stock: 2, id: '和-0' },
    { char: '大', x: 4, y: 0, stock: 6, id: '大-0' },
    { char: '道', x: 5, y: 0, stock: 2, id: '道-0' },
    { char: '自', x: 6, y: 0, stock: 3, id: '自-0' },
    { char: '然', x: 7, y: 0, stock: 4, id: '然-0' },
    { char: '风', x: 8, y: 0, stock: 2, id: '风-0' },
    { char: '雨', x: 9, y: 0, stock: 3, id: '雨-0' },
    { char: '山', x: 10, y: 0, stock: 5, id: '山-0' },
    { char: '水', x: 11, y: 0, stock: 4, id: '水-0' },

    { char: '春', x: 0, y: 1, stock: 2, id: '春-0' },
    { char: '夏', x: 1, y: 1, stock: 2, id: '夏-0' },
    { char: '秋', x: 2, y: 1, stock: 2, id: '秋-0' },
    { char: '冬', x: 3, y: 1, stock: 2, id: '冬-0' },
    { char: '日', x: 4, y: 1, stock: 5, id: '日-0' },
    { char: '月', x: 5, y: 1, stock: 4, id: '月-0' },
    { char: '星', x: 6, y: 1, stock: 3, id: '星-0' },
    { char: '云', x: 7, y: 1, stock: 2, id: '云-0' },
    { char: '花', x: 8, y: 1, stock: 3, id: '花-0' },
    { char: '草', x: 9, y: 1, stock: 2, id: '草-0' },
    { char: '木', x: 10, y: 1, stock: 4, id: '木-0' },
    { char: '火', x: 11, y: 1, stock: 3, id: '火-0' },

    { char: '金', x: 0, y: 2, stock: 2, id: '金-0' },
    { char: '银', x: 1, y: 2, stock: 1, id: '银-0' },
    { char: '铜', x: 2, y: 2, stock: 1, id: '铜-0' },
    { char: '铁', x: 3, y: 2, stock: 1, id: '铁-0' },
    { char: '东', x: 4, y: 2, stock: 3, id: '东-0' },
    { char: '西', x: 5, y: 2, stock: 3, id: '西-0' },
    { char: '南', x: 6, y: 2, stock: 3, id: '南-0' },
    { char: '北', x: 7, y: 2, stock: 3, id: '北-0' },
    { char: '中', x: 8, y: 2, stock: 4, id: '中-0' },
    { char: '上', x: 9, y: 2, stock: 3, id: '上-0' },
    { char: '下', x: 10, y: 2, stock: 3, id: '下-0' },
    { char: '左', x: 11, y: 2, stock: 2, id: '左-0' },

    { char: '右', x: 0, y: 3, stock: 2, id: '右-0' },
    { char: '前', x: 1, y: 3, stock: 2, id: '前-0' },
    { char: '后', x: 2, y: 3, stock: 2, id: '后-0' },
    { char: '里', x: 3, y: 3, stock: 2, id: '里-0' },
    { char: '外', x: 4, y: 3, stock: 2, id: '外-0' },
    { char: '高', x: 5, y: 3, stock: 2, id: '高-0' },
    { char: '低', x: 6, y: 3, stock: 2, id: '低-0' },
    { char: '长', x: 7, y: 3, stock: 3, id: '长-0' },
    { char: '短', x: 8, y: 3, stock: 2, id: '短-0' },
    { char: '大', x: 9, y: 3, stock: 2, id: '大-1' },
    { char: '小', x: 10, y: 3, stock: 4, id: '小-0' },
    { char: '多', x: 11, y: 3, stock: 3, id: '多-0' },

    { char: '少', x: 0, y: 4, stock: 2, id: '少-0' },
    { char: '一', x: 1, y: 4, stock: 10, id: '一-0' },
    { char: '二', x: 2, y: 4, stock: 8, id: '二-0' },
    { char: '三', x: 3, y: 4, stock: 6, id: '三-0' },
    { char: '四', x: 4, y: 4, stock: 4, id: '四-0' },
    { char: '五', x: 5, y: 4, stock: 4, id: '五-0' },
    { char: '六', x: 6, y: 4, stock: 3, id: '六-0' },
    { char: '七', x: 7, y: 4, stock: 3, id: '七-0' },
    { char: '八', x: 8, y: 4, stock: 3, id: '八-0' },
    { char: '九', x: 9, y: 4, stock: 3, id: '九-0' },
    { char: '十', x: 10, y: 4, stock: 5, id: '十-0' },
    { char: '百', x: 11, y: 4, stock: 2, id: '百-0' },

    { char: '千', x: 0, y: 5, stock: 2, id: '千-0' },
    { char: '万', x: 1, y: 5, stock: 2, id: '万-0' },
    { char: '是', x: 2, y: 5, stock: 6, id: '是-0' },
    { char: '的', x: 3, y: 5, stock: 15, id: '的-0' },
    { char: '了', x: 4, y: 5, stock: 8, id: '了-0' },
    { char: '在', x: 5, y: 5, stock: 6, id: '在-0' },
    { char: '有', x: 6, y: 5, stock: 5, id: '有-0' },
    { char: '我', x: 7, y: 5, stock: 5, id: '我-0' },
    { char: '你', x: 8, y: 5, stock: 4, id: '你-0' },
    { char: '他', x: 9, y: 5, stock: 4, id: '他-0' },
    { char: '她', x: 10, y: 5, stock: 3, id: '她-0' },
    { char: '它', x: 11, y: 5, stock: 2, id: '它-0' },

    { char: '们', x: 0, y: 6, stock: 4, id: '们-0' },
    { char: '这', x: 1, y: 6, stock: 5, id: '这-0' },
    { char: '那', x: 2, y: 6, stock: 4, id: '那-0' },
    { char: '个', x: 3, y: 6, stock: 6, id: '个-0' },
    { char: '就', x: 4, y: 6, stock: 3, id: '就-0' },
    { char: '也', x: 5, y: 6, stock: 4, id: '也-0' },
    { char: '都', x: 6, y: 6, stock: 3, id: '都-0' },
    { char: '而', x: 7, y: 6, stock: 2, id: '而-0' },
    { char: '与', x: 8, y: 6, stock: 2, id: '与-0' },
    { char: '及', x: 9, y: 6, stock: 2, id: '及-0' },
    { char: '为', x: 10, y: 6, stock: 3, id: '为-0' },
    { char: '以', x: 11, y: 6, stock: 3, id: '以-0' },

    { char: '之', x: 0, y: 7, stock: 3, id: '之-0' },
    { char: '其', x: 1, y: 7, stock: 2, id: '其-0' },
    { char: '或', x: 2, y: 7, stock: 2, id: '或-0' },
    { char: '但', x: 3, y: 7, stock: 2, id: '但-0' },
    { char: '如', x: 4, y: 7, stock: 2, id: '如-0' },
    { char: '若', x: 5, y: 7, stock: 1, id: '若-0' },
    { char: '则', x: 6, y: 7, stock: 2, id: '则-0' },
    { char: '所', x: 7, y: 7, stock: 3, id: '所-0' },
    { char: '然', x: 8, y: 7, stock: 2, id: '然-0' },
    { char: '虽', x: 9, y: 7, stock: 1, id: '虽-0' },
    { char: '因', x: 10, y: 7, stock: 2, id: '因-0' },
    { char: '故', x: 11, y: 7, stock: 2, id: '故-0' }
  ])

  const inputText = ref('')
  const showHeatmap = ref(false)
  const showPath = ref(true)
  const pathAlgorithm = ref<PathAlgorithm>('greedy-2opt')

  const currentTaskSheet = ref<PickTaskSheet | null>(null)
  const currentTaskStep = ref(0)
  const isAnimating = ref(false)
  const animationSpeed = ref(500)

  const canUndo = ref(false)
  const canRedo = ref(false)

  const rerouteEvents = ref<RerouteEvent[]>([])

  const charMap = computed(() => {
    const map = new Map<string, TypeChar[]>()
    characters.value.forEach(c => {
      if (!map.has(c.char)) {
        map.set(c.char, [])
      }
      map.get(c.char)!.push(c)
    })
    return map
  })

  const charUniqueSet = computed(() => {
    const set = new Set<string>()
    characters.value.forEach(c => set.add(c.char))
    return set
  })

  const usedPositions = computed(() => {
    const set = new Set<string>()
    characters.value.forEach(c => set.add(`${c.x},${c.y}`))
    return set
  })

  const charCounts = computed((): CharCount[] => {
    const counts = new Map<string, number>()
    const text = inputText.value
    for (const ch of text) {
      if (ch.trim() === '') continue
      counts.set(ch, (counts.get(ch) || 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([char, count]) => ({ char, count }))
      .sort((a, b) => b.count - a.count)
  })

  const missingChars = computed((): CharCount[] => {
    return charCounts.value.filter(c => !charUniqueSet.value.has(c.char))
  })

  const availableCharCounts = computed((): CharCount[] => {
    return charCounts.value.filter(c => charUniqueSet.value.has(c.char))
  })

  const totalAvailableStockByChar = computed(() => {
    const map = new Map<string, number>()
    characters.value.forEach(c => {
      map.set(c.char, (map.get(c.char) || 0) + c.stock)
    })
    return map
  })

  const insufficientStockChars = computed((): { char: string; needed: number; available: number }[] => {
    return availableCharCounts.value
      .filter(c => {
        const available = totalAvailableStockByChar.value.get(c.char) || 0
        return c.count > available
      })
      .map(c => ({
        char: c.char,
        needed: c.count,
        available: totalAvailableStockByChar.value.get(c.char) || 0
      }))
  })

  const shortageInfoList = computed((): ShortageInfo[] => {
    return insufficientStockChars.value.map(item => {
      const locations = charMap.value.get(item.char)?.map(c => ({
        x: c.x,
        y: c.y,
        stock: c.stock
      })) || []
      return {
        char: item.char,
        needed: item.needed,
        available: item.available,
        shortage: item.needed - item.available,
        locations
      }
    })
  })

  const heatmapData = computed(() => {
    const map = new Map<string, number>()
    charCounts.value.forEach(c => {
      const charLocations = charMap.value.get(c.char)
      if (charLocations && charLocations.length > 0) {
        const totalStock = charLocations.reduce((sum, loc) => sum + loc.stock, 0)
        charLocations.forEach(loc => {
          const proportion = loc.stock / totalStock
          const count = Math.round(c.count * proportion)
          const key = `${loc.x},${loc.y}`
          map.set(key, (map.get(key) || 0) + count)
        })
      }
    })
    return map
  })

  const maxHeatValue = computed(() => {
    let max = 0
    heatmapData.value.forEach(v => {
      if (v > max) max = v
    })
    return max || 1
  })

  const canCompletePick = computed(() => {
    return missingChars.value.length === 0 && insufficientStockChars.value.length === 0
  })

  const rawPathSteps = computed((): PathStep[] => {
    const steps: PathStep[] = []
    const text = inputText.value
    let idx = 0
    for (const ch of text) {
      if (ch.trim() === '') continue
      const locations = charMap.value.get(ch)
      if (locations && locations.length > 0) {
        const loc = locations[0]
        steps.push({
          char: ch,
          x: loc.x,
          y: loc.y,
          index: idx++,
          charInstanceId: loc.id
        })
      }
    }
    return steps
  })

  const optimizedPathResult = computed(() => {
    return optimizePickPath(
      availableCharCounts.value,
      characters.value,
      pathAlgorithm.value,
      0,
      0
    )
  })

  const pathSteps = computed((): PathStep[] => {
    return optimizedPathResult.value.steps
  })

  const totalDistance = computed(() => {
    return Math.round(totalPathDistance(pathSteps.value) * 100) / 100
  })

  const originalDistance = computed(() => {
    return Math.round(totalPathDistance(rawPathSteps.value) * 100) / 100
  })

  const savedDistancePercent = computed(() => {
    const orig = originalDistance.value
    const opt = totalDistance.value
    if (orig === 0) return 0
    return Math.round((1 - opt / orig) * 100)
  })

  const shortages = computed(() => optimizedPathResult.value.shortages)

  function saveHistory(label: string = '') {
    historyManager.push(characters.value, gridConfig.value, inputText.value, label)
    canUndo.value = historyManager.canUndo()
    canRedo.value = historyManager.canRedo()
  }

  function undo(): boolean {
    const result = historyManager.undo(characters.value, gridConfig.value, inputText.value)
    if (result) {
      characters.value = result.characters
      gridConfig.value = result.gridConfig
      inputText.value = result.inputText
      canUndo.value = historyManager.canUndo()
      canRedo.value = historyManager.canRedo()
      return true
    }
    return false
  }

  function redo(): boolean {
    const result = historyManager.redo(characters.value, gridConfig.value, inputText.value)
    if (result) {
      characters.value = result.characters
      gridConfig.value = result.gridConfig
      inputText.value = result.inputText
      canUndo.value = historyManager.canUndo()
      canRedo.value = historyManager.canRedo()
      return true
    }
    return false
  }

  function setGridConfig(config: Partial<GridConfig>) {
    saveHistory('调整字盘设置')
    gridConfig.value = { ...gridConfig.value, ...config }
  }

  function addCharacter(char: TypeChar): { success: boolean; message?: string } {
    if (usedPositions.value.has(`${char.x},${char.y}`)) {
      return { success: false, message: '该位置已被占用' }
    }
    if (char.x < 0 || char.x >= gridConfig.value.cols || char.y < 0 || char.y >= gridConfig.value.rows) {
      return { success: false, message: '位置超出字盘范围' }
    }
    saveHistory(`添加字符 ${char.char}`)
    const newChar = { ...char, id: char.id || `${char.char}-${Date.now()}` }
    characters.value.push(newChar)
    return { success: true }
  }

  function addCharInstance(
    char: string,
    x: number,
    y: number,
    stock: number
  ): { success: boolean; message?: string } {
    if (usedPositions.value.has(`${x},${y}`)) {
      return { success: false, message: '该位置已被占用' }
    }
    if (x < 0 || x >= gridConfig.value.cols || y < 0 || y >= gridConfig.value.rows) {
      return { success: false, message: '位置超出字盘范围' }
    }
    saveHistory(`添加 ${char} 副本`)
    const existingCount = characters.value.filter(c => c.char === char).length
    characters.value.push({
      char,
      x,
      y,
      stock,
      id: `${char}-${existingCount}`
    })
    return { success: true }
  }

  function removeCharacter(id: string): { success: boolean; message?: string } {
    const idx = characters.value.findIndex(c => c.id === id)
    if (idx === -1) return { success: false, message: '字符不存在' }
    const char = characters.value[idx]
    saveHistory(`删除字符 ${char.char}`)
    characters.value.splice(idx, 1)
    return { success: true }
  }

  function removeAllInstancesOfChar(char: string): number {
    const before = characters.value.length
    saveHistory(`删除所有 ${char} 副本`)
    characters.value = characters.value.filter(c => c.char !== char)
    return before - characters.value.length
  }

  function updateCharacter(id: string, updates: Partial<TypeChar>): { success: boolean; message?: string } {
    const idx = characters.value.findIndex(c => c.id === id)
    if (idx === -1) return { success: false, message: '字符不存在' }

    const current = characters.value[idx]
    const newX = updates.x ?? current.x
    const newY = updates.y ?? current.y

    if (newX < 0 || newX >= gridConfig.value.cols || newY < 0 || newY >= gridConfig.value.rows) {
      return { success: false, message: '位置超出字盘范围' }
    }

    if (newX !== current.x || newY !== current.y) {
      const occupant = characters.value.find(c => c.x === newX && c.y === newY)
      if (occupant && occupant.id !== id) {
        return { success: false, message: '该位置已被占用' }
      }
    }

    saveHistory(`更新字符 ${current.char}`)
    characters.value[idx] = { ...current, ...updates }
    return { success: true }
  }

  function moveCharacter(id: string, newX: number, newY: number): { success: boolean; message?: string } {
    return updateCharacter(id, { x: newX, y: newY })
  }

  function splitCharStock(char: string, numCopies: number): { success: boolean; message?: string; newChars?: TypeChar[] } {
    const instances = characters.value.filter(c => c.char === char)
    if (instances.length === 0) {
      return { success: false, message: '字符不存在' }
    }
    if (numCopies <= instances.length) {
      return { success: false, message: '副本数需大于当前数量' }
    }

    const emptyPositions = findEmptyPositions(
      characters.value,
      gridConfig.value.cols,
      gridConfig.value.rows,
      instances[0].x,
      instances[0].y
    )

    const additionalNeeded = numCopies - instances.length
    if (emptyPositions.length < additionalNeeded) {
      return { success: false, message: '空位不足，无法拆分' }
    }

    const totalStock = instances.reduce((sum, c) => sum + c.stock, 0)
    const perCopy = Math.ceil(totalStock / numCopies)

    saveHistory(`拆分 ${char} 为 ${numCopies} 个副本`)

    const newChars: TypeChar[] = []
    let remainingStock = totalStock - instances[0].stock
    let posIdx = 0

    for (let i = 1; i < numCopies; i++) {
      if (i < instances.length) continue

      const pos = emptyPositions[posIdx++]
      const stock = Math.min(perCopy, remainingStock)
      if (stock <= 0) break

      const newChar: TypeChar = {
        char,
        x: pos.x,
        y: pos.y,
        stock,
        id: `${char}-${i}-${Date.now()}`
      }
      characters.value.push(newChar)
      newChars.push(newChar)
      remainingStock -= stock
    }

    if (instances.length > 0 && remainingStock !== instances[0].stock) {
      const firstIdx = characters.value.findIndex(c => c.id === instances[0].id)
      if (firstIdx > -1) {
        characters.value[firstIdx].stock = totalStock - (totalStock - remainingStock - instances[0].stock) - remainingStock
      }
    }

    const allInstances = characters.value.filter(c => c.char === char)
    const actualTotal = allInstances.reduce((sum, c) => sum + c.stock, 0)
    if (actualTotal !== totalStock && allInstances.length > 0) {
      const firstIdx = characters.value.findIndex(c => c.id === allInstances[0].id)
      if (firstIdx > -1) {
        characters.value[firstIdx].stock += totalStock - actualTotal
      }
    }

    return { success: true, newChars }
  }

  function mergeCharStock(char: string): { success: boolean; message?: string } {
    const instances = characters.value.filter(c => c.char === char)
    if (instances.length <= 1) {
      return { success: false, message: '只有一个副本，无需合并' }
    }

    const totalStock = instances.reduce((sum, c) => sum + c.stock, 0)

    saveHistory(`合并 ${char} 的 ${instances.length} 个副本`)

    const keepId = instances[0].id
    characters.value = characters.value.filter(c => c.char !== char || c.id === keepId)
    const kept = characters.value.find(c => c.id === keepId)
    if (kept) {
      kept.stock = totalStock
    }

    return { success: true }
  }

  function setInputText(text: string) {
    inputText.value = text
  }

  function toggleHeatmap() {
    showHeatmap.value = !showHeatmap.value
  }

  function togglePath() {
    showPath.value = !showPath.value
  }

  function setPathAlgorithm(algo: PathAlgorithm) {
    pathAlgorithm.value = algo
  }

  function generatePickTaskSheet(name?: string): PickTaskSheet | null {
    if (pathSteps.value.length === 0) return null

    const sheet = generateTaskSheet(
      pathSteps.value,
      shortages.value,
      availableCharCounts.value.reduce((s, c) => s + c.count, 0),
      name
    )
    currentTaskSheet.value = sheet
    currentTaskStep.value = 0
    return sheet
  }

  function clearTaskSheet() {
    currentTaskSheet.value = null
    currentTaskStep.value = 0
    isAnimating.value = false
  }

  function setTaskStep(step: number) {
    if (!currentTaskSheet.value) return
    const maxStep = currentTaskSheet.value.items.length
    currentTaskStep.value = Math.max(0, Math.min(step, maxStep))

    if (currentTaskSheet.value) {
      const items = currentTaskSheet.value.items
      items.forEach((item, idx) => {
        if (idx < currentTaskStep.value) {
          item.status = 'completed'
        } else if (idx === currentTaskStep.value) {
          item.status = 'picking'
        } else {
          item.status = 'pending'
        }
      })

      const completedChars = items
        .filter(i => i.status === 'completed')
        .reduce((s, i) => s + i.quantity, 0)
      currentTaskSheet.value.completedChars = completedChars

      const allCompleted = currentTaskStep.value >= items.length
      const hasShortage = currentTaskSheet.value.shortageChars.length > 0
      if (allCompleted) {
        currentTaskSheet.value.status = hasShortage ? 'partial' : 'completed'
      } else {
        currentTaskSheet.value.status = 'in-progress'
      }
    }
  }

  function nextTaskStep() {
    if (!currentTaskSheet.value) return
    setTaskStep(currentTaskStep.value + 1)
  }

  function prevTaskStep() {
    if (!currentTaskSheet.value) return
    setTaskStep(currentTaskStep.value - 1)
  }

  function startAnimation() {
    if (!currentTaskSheet.value || isAnimating.value) return
    isAnimating.value = true
  }

  function stopAnimation() {
    isAnimating.value = false
  }

  function setAnimationSpeed(speed: number) {
    animationSpeed.value = speed
  }

  function handleStockDepletion(stepIndex: number): { rerouted: boolean; shortage?: CharCount } {
    const result = rerouteAfterDepletion(
      pathSteps.value,
      stepIndex,
      characters.value,
      charCounts.value
    )

    if (result.shortages.length > 0) {
      return { rerouted: false, shortage: result.shortages[0] }
    }

    if (result.reroutedEvents.length > 0) {
      rerouteEvents.value.push(...result.reroutedEvents)
      return { rerouted: true }
    }

    return { rerouted: false }
  }

  function saveScheme(name: string): string {
    const schemes = loadSchemes()
    const id = Date.now().toString()
    const scheme: CompositorScheme = {
      id,
      name,
      gridConfig: { ...gridConfig.value },
      characters: characters.value.map(c => ({ ...c })),
      createdAt: Date.now(),
      version: 1
    }
    schemes.push(scheme)
    localStorage.setItem('compositor_schemes', JSON.stringify(schemes))
    return id
  }

  function saveSchemeVersion(parentId: string, name: string): string | null {
    const schemes = loadSchemes()
    const parent = schemes.find(s => s.id === parentId)
    if (!parent) return null

    const newVersion = (parent.version || 1) + 1
    const id = Date.now().toString()
    const scheme: CompositorScheme = {
      id,
      name: `${name || parent.name} v${newVersion}`,
      gridConfig: { ...gridConfig.value },
      characters: characters.value.map(c => ({ ...c })),
      createdAt: Date.now(),
      version: newVersion,
      parentId
    }
    schemes.push(scheme)
    localStorage.setItem('compositor_schemes', JSON.stringify(schemes))
    return id
  }

  function loadSchemes(): CompositorScheme[] {
    try {
      const data = localStorage.getItem('compositor_schemes')
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  function loadScheme(id: string): boolean {
    const schemes = loadSchemes()
    const scheme = schemes.find(s => s.id === id)
    if (!scheme) return false
    saveHistory('加载方案')
    gridConfig.value = { ...scheme.gridConfig }
    characters.value = scheme.characters.map(c => ({ ...c }))
    historyManager.clear()
    canUndo.value = false
    canRedo.value = false
    return true
  }

  function deleteScheme(id: string) {
    const schemes = loadSchemes().filter(s => s.id !== id)
    localStorage.setItem('compositor_schemes', JSON.stringify(schemes))
  }

  function getSchemeVersions(schemeId: string): CompositorScheme[] {
    const schemes = loadSchemes()
    return schemes
      .filter(s => s.parentId === schemeId || s.id === schemeId)
      .sort((a, b) => (a.version || 1) - (b.version || 1))
  }

  function exportSchemeAsJson(schemeName: string): string {
    const scheme: CompositorScheme = {
      id: 'export',
      name: schemeName,
      gridConfig: { ...gridConfig.value },
      characters: characters.value.map(c => ({ ...c })),
      createdAt: Date.now()
    }
    return JSON.stringify(scheme, null, 2)
  }

  function importSchemeFromJson(json: string): { success: boolean; message?: string } {
    try {
      const scheme: CompositorScheme = JSON.parse(json)
      if (!scheme.gridConfig || !scheme.characters) {
        return { success: false, message: '无效的方案格式' }
      }
      saveHistory('导入方案')
      gridConfig.value = { ...scheme.gridConfig }
      characters.value = scheme.characters.map(c => ({ ...c, id: c.id || `${c.char}-${Date.now()}` }))
      return { success: true }
    } catch {
      return { success: false, message: 'JSON 解析失败' }
    }
  }

  return {
    gridConfig,
    characters,
    inputText,
    showHeatmap,
    showPath,
    pathAlgorithm,
    charMap,
    charUniqueSet,
    usedPositions,
    charCounts,
    missingChars,
    availableCharCounts,
    insufficientStockChars,
    shortageInfoList,
    canCompletePick,
    heatmapData,
    maxHeatValue,
    pathSteps,
    totalDistance,
    originalDistance,
    savedDistancePercent,
    shortages,
    currentTaskSheet,
    currentTaskStep,
    isAnimating,
    animationSpeed,
    canUndo,
    canRedo,
    rerouteEvents,
    totalAvailableStockByChar,
    rawPathSteps,
    setGridConfig,
    addCharacter,
    addCharInstance,
    removeCharacter,
    removeAllInstancesOfChar,
    updateCharacter,
    moveCharacter,
    splitCharStock,
    mergeCharStock,
    setInputText,
    toggleHeatmap,
    togglePath,
    setPathAlgorithm,
    generatePickTaskSheet,
    clearTaskSheet,
    setTaskStep,
    nextTaskStep,
    prevTaskStep,
    startAnimation,
    stopAnimation,
    setAnimationSpeed,
    handleStockDepletion,
    saveScheme,
    saveSchemeVersion,
    loadSchemes,
    loadScheme,
    deleteScheme,
    getSchemeVersions,
    exportSchemeAsJson,
    importSchemeFromJson,
    undo,
    redo,
    saveHistory
  }
})
