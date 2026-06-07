import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TypeChar, GridConfig, PathStep, CharCount, CompositorScheme } from '@/types'

export const useCompositorStore = defineStore('compositor', () => {
  const gridConfig = ref<GridConfig>({
    cols: 12,
    rows: 8,
    cellSize: 60
  })

  const characters = ref<TypeChar[]>([
    { char: '天', x: 0, y: 0, stock: 5 },
    { char: '地', x: 1, y: 0, stock: 3 },
    { char: '人', x: 2, y: 0, stock: 4 },
    { char: '和', x: 3, y: 0, stock: 2 },
    { char: '大', x: 4, y: 0, stock: 6 },
    { char: '道', x: 5, y: 0, stock: 2 },
    { char: '自', x: 6, y: 0, stock: 3 },
    { char: '然', x: 7, y: 0, stock: 4 },
    { char: '风', x: 8, y: 0, stock: 2 },
    { char: '雨', x: 9, y: 0, stock: 3 },
    { char: '山', x: 10, y: 0, stock: 5 },
    { char: '水', x: 11, y: 0, stock: 4 },

    { char: '春', x: 0, y: 1, stock: 2 },
    { char: '夏', x: 1, y: 1, stock: 2 },
    { char: '秋', x: 2, y: 1, stock: 2 },
    { char: '冬', x: 3, y: 1, stock: 2 },
    { char: '日', x: 4, y: 1, stock: 5 },
    { char: '月', x: 5, y: 1, stock: 4 },
    { char: '星', x: 6, y: 1, stock: 3 },
    { char: '云', x: 7, y: 1, stock: 2 },
    { char: '花', x: 8, y: 1, stock: 3 },
    { char: '草', x: 9, y: 1, stock: 2 },
    { char: '木', x: 10, y: 1, stock: 4 },
    { char: '火', x: 11, y: 1, stock: 3 },

    { char: '金', x: 0, y: 2, stock: 2 },
    { char: '银', x: 1, y: 2, stock: 1 },
    { char: '铜', x: 2, y: 2, stock: 1 },
    { char: '铁', x: 3, y: 2, stock: 1 },
    { char: '东', x: 4, y: 2, stock: 3 },
    { char: '西', x: 5, y: 2, stock: 3 },
    { char: '南', x: 6, y: 2, stock: 3 },
    { char: '北', x: 7, y: 2, stock: 3 },
    { char: '中', x: 8, y: 2, stock: 4 },
    { char: '上', x: 9, y: 2, stock: 3 },
    { char: '下', x: 10, y: 2, stock: 3 },
    { char: '左', x: 11, y: 2, stock: 2 },

    { char: '右', x: 0, y: 3, stock: 2 },
    { char: '前', x: 1, y: 3, stock: 2 },
    { char: '后', x: 2, y: 3, stock: 2 },
    { char: '里', x: 3, y: 3, stock: 2 },
    { char: '外', x: 4, y: 3, stock: 2 },
    { char: '高', x: 5, y: 3, stock: 2 },
    { char: '低', x: 6, y: 3, stock: 2 },
    { char: '长', x: 7, y: 3, stock: 3 },
    { char: '短', x: 8, y: 3, stock: 2 },
    { char: '大2', x: 9, y: 3, stock: 2 },
    { char: '小', x: 10, y: 3, stock: 4 },
    { char: '多', x: 11, y: 3, stock: 3 },

    { char: '少', x: 0, y: 4, stock: 2 },
    { char: '一', x: 1, y: 4, stock: 10 },
    { char: '二', x: 2, y: 4, stock: 8 },
    { char: '三', x: 3, y: 4, stock: 6 },
    { char: '四', x: 4, y: 4, stock: 4 },
    { char: '五', x: 5, y: 4, stock: 4 },
    { char: '六', x: 6, y: 4, stock: 3 },
    { char: '七', x: 7, y: 4, stock: 3 },
    { char: '八', x: 8, y: 4, stock: 3 },
    { char: '九', x: 9, y: 4, stock: 3 },
    { char: '十', x: 10, y: 4, stock: 5 },
    { char: '百', x: 11, y: 4, stock: 2 },

    { char: '千', x: 0, y: 5, stock: 2 },
    { char: '万', x: 1, y: 5, stock: 2 },
    { char: '是', x: 2, y: 5, stock: 6 },
    { char: '的', x: 3, y: 5, stock: 15 },
    { char: '了', x: 4, y: 5, stock: 8 },
    { char: '在', x: 5, y: 5, stock: 6 },
    { char: '有', x: 6, y: 5, stock: 5 },
    { char: '我', x: 7, y: 5, stock: 5 },
    { char: '你', x: 8, y: 5, stock: 4 },
    { char: '他', x: 9, y: 5, stock: 4 },
    { char: '她', x: 10, y: 5, stock: 3 },
    { char: '它', x: 11, y: 5, stock: 2 },

    { char: '们', x: 0, y: 6, stock: 4 },
    { char: '这', x: 1, y: 6, stock: 5 },
    { char: '那', x: 2, y: 6, stock: 4 },
    { char: '个', x: 3, y: 6, stock: 6 },
    { char: '就', x: 4, y: 6, stock: 3 },
    { char: '也', x: 5, y: 6, stock: 4 },
    { char: '都', x: 6, y: 6, stock: 3 },
    { char: '而', x: 7, y: 6, stock: 2 },
    { char: '与', x: 8, y: 6, stock: 2 },
    { char: '及', x: 9, y: 6, stock: 2 },
    { char: '为', x: 10, y: 6, stock: 3 },
    { char: '以', x: 11, y: 6, stock: 3 },

    { char: '之', x: 0, y: 7, stock: 3 },
    { char: '其', x: 1, y: 7, stock: 2 },
    { char: '或', x: 2, y: 7, stock: 2 },
    { char: '但', x: 3, y: 7, stock: 2 },
    { char: '如', x: 4, y: 7, stock: 2 },
    { char: '若', x: 5, y: 7, stock: 1 },
    { char: '则', x: 6, y: 7, stock: 2 },
    { char: '所', x: 7, y: 7, stock: 3 },
    { char: '然', x: 8, y: 7, stock: 2 },
    { char: '虽', x: 9, y: 7, stock: 1 },
    { char: '因', x: 10, y: 7, stock: 2 },
    { char: '故', x: 11, y: 7, stock: 2 }
  ])

  const inputText = ref('')
  const showHeatmap = ref(false)
  const showPath = ref(true)

  const charMap = computed(() => {
    const map = new Map<string, TypeChar>()
    characters.value.forEach(c => map.set(c.char, c))
    return map
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
    return charCounts.value.filter(c => !charMap.value.has(c.char))
  })

  const availableCharCounts = computed((): CharCount[] => {
    return charCounts.value
      .filter(c => charMap.value.has(c.char))
      .map(c => ({
        char: c.char,
        count: c.count
      }))
  })

  const insufficientStockChars = computed((): { char: string; needed: number; available: number }[] => {
    return availableCharCounts.value
      .filter(c => {
        const charData = charMap.value.get(c.char)
        return charData && c.count > charData.stock
      })
      .map(c => ({
        char: c.char,
        needed: c.count,
        available: charMap.value.get(c.char)?.stock || 0
      }))
  })

  const heatmapData = computed(() => {
    const map = new Map<string, number>()
    charCounts.value.forEach(c => {
      const charData = charMap.value.get(c.char)
      if (charData) {
        map.set(`${charData.x},${charData.y}`, c.count)
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

  const pathSteps = computed((): PathStep[] => {
    const steps: PathStep[] = []
    const text = inputText.value
    let idx = 0
    for (const ch of text) {
      if (ch.trim() === '') continue
      const charData = charMap.value.get(ch)
      if (charData) {
        steps.push({
          char: ch,
          x: charData.x,
          y: charData.y,
          index: idx++
        })
      }
    }
    return steps
  })

  const totalDistance = computed(() => {
    const steps = pathSteps.value
    if (steps.length <= 1) return 0
    let dist = 0
    for (let i = 1; i < steps.length; i++) {
      const dx = steps[i].x - steps[i - 1].x
      const dy = steps[i].y - steps[i - 1].y
      dist += Math.sqrt(dx * dx + dy * dy)
    }
    return Math.round(dist * 100) / 100
  })

  function setGridConfig(config: Partial<GridConfig>) {
    gridConfig.value = { ...gridConfig.value, ...config }
  }

  function addCharacter(char: TypeChar): { success: boolean; message?: string } {
    if (usedPositions.value.has(`${char.x},${char.y}`)) {
      return { success: false, message: '该位置已被占用' }
    }
    if (charMap.value.has(char.char)) {
      return { success: false, message: '该字符已存在' }
    }
    if (char.x < 0 || char.x >= gridConfig.value.cols || char.y < 0 || char.y >= gridConfig.value.rows) {
      return { success: false, message: '位置超出字盘范围' }
    }
    characters.value.push(char)
    return { success: true }
  }

  function removeCharacter(char: string) {
    const idx = characters.value.findIndex(c => c.char === char)
    if (idx > -1) {
      characters.value.splice(idx, 1)
    }
  }

  function updateCharacter(char: string, updates: Partial<TypeChar>): { success: boolean; message?: string } {
    const idx = characters.value.findIndex(c => c.char === char)
    if (idx === -1) return { success: false, message: '字符不存在' }

    const current = characters.value[idx]
    const newX = updates.x ?? current.x
    const newY = updates.y ?? current.y

    if (newX !== current.x || newY !== current.y) {
      if (usedPositions.value.has(`${newX},${newY}`)) {
        return { success: false, message: '该位置已被占用' }
      }
    }
    if (newX < 0 || newX >= gridConfig.value.cols || newY < 0 || newY >= gridConfig.value.rows) {
      return { success: false, message: '位置超出字盘范围' }
    }

    characters.value[idx] = { ...current, ...updates }
    return { success: true }
  }

  function moveCharacter(char: string, newX: number, newY: number): { success: boolean; message?: string } {
    return updateCharacter(char, { x: newX, y: newY })
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

  function saveScheme(name: string): string {
    const schemes = loadSchemes()
    const id = Date.now().toString()
    const scheme: CompositorScheme = {
      id,
      name,
      gridConfig: { ...gridConfig.value },
      characters: characters.value.map(c => ({ ...c })),
      createdAt: Date.now()
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
    gridConfig.value = { ...scheme.gridConfig }
    characters.value = scheme.characters.map(c => ({ ...c }))
    return true
  }

  function deleteScheme(id: string) {
    const schemes = loadSchemes().filter(s => s.id !== id)
    localStorage.setItem('compositor_schemes', JSON.stringify(schemes))
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
      gridConfig.value = { ...scheme.gridConfig }
      characters.value = scheme.characters.map(c => ({ ...c }))
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
    charMap,
    usedPositions,
    charCounts,
    missingChars,
    availableCharCounts,
    insufficientStockChars,
    heatmapData,
    maxHeatValue,
    pathSteps,
    totalDistance,
    setGridConfig,
    addCharacter,
    removeCharacter,
    updateCharacter,
    moveCharacter,
    setInputText,
    toggleHeatmap,
    togglePath,
    saveScheme,
    loadSchemes,
    loadScheme,
    deleteScheme,
    exportSchemeAsJson,
    importSchemeFromJson
  }
})
