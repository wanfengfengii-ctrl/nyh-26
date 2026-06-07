export interface TypeChar {
  char: string
  x: number
  y: number
  stock: number
  id?: string
}

export interface GridConfig {
  cols: number
  rows: number
  cellSize: number
}

export interface PathStep {
  char: string
  x: number
  y: number
  index: number
  charInstanceId?: string
  stockRemaining?: number
  isRerouted?: boolean
  originalIndex?: number
}

export interface CharCount {
  char: string
  count: number
}

export interface CompositorScheme {
  id: string
  name: string
  gridConfig: GridConfig
  characters: TypeChar[]
  createdAt: number
  version?: number
  parentId?: string
}

export interface PickTaskItem {
  id: string
  char: string
  x: number
  y: number
  quantity: number
  order: number
  charInstanceId: string
  status: 'pending' | 'picking' | 'completed' | 'shortage'
}

export interface PickTaskSheet {
  id: string
  name: string
  createdAt: number
  items: PickTaskItem[]
  totalDistance: number
  totalChars: number
  completedChars: number
  shortageChars: CharCount[]
  status: 'ready' | 'in-progress' | 'completed' | 'partial'
}

export interface HistorySnapshot {
  id: string
  timestamp: number
  label: string
  characters: TypeChar[]
  gridConfig: GridConfig
  inputText: string
}

export interface ShortageInfo {
  char: string
  needed: number
  available: number
  shortage: number
  locations: { x: number; y: number; stock: number }[]
}

export type PathAlgorithm = 'nearest-neighbor' | 'greedy-2opt' | 'original'

export interface RerouteEvent {
  stepIndex: number
  char: string
  fromX: number
  fromY: number
  toX: number
  toY: number
  reason: 'stock-depleted' | 'shorter-path'
}
