export interface TypeChar {
  char: string
  x: number
  y: number
  stock: number
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
}
