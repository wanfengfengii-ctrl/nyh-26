import type { HistorySnapshot, TypeChar, GridConfig } from '@/types'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

export class HistoryManager {
  private past: HistorySnapshot[] = []
  private future: HistorySnapshot[] = []
  private maxHistory: number = 50
  private currentLabel: string = ''

  constructor(maxHistory: number = 50) {
    this.maxHistory = maxHistory
  }

  push(
    characters: TypeChar[],
    gridConfig: GridConfig,
    inputText: string,
    label: string = ''
  ): void {
    const snapshot: HistorySnapshot = {
      id: generateId(),
      timestamp: Date.now(),
      label: label || this.currentLabel,
      characters: characters.map(c => ({ ...c })),
      gridConfig: { ...gridConfig },
      inputText
    }

    this.past.push(snapshot)
    this.future = []

    if (this.past.length > this.maxHistory) {
      this.past.shift()
    }
  }

  canUndo(): boolean {
    return this.past.length > 0
  }

  canRedo(): boolean {
    return this.future.length > 0
  }

  undo(
    currentCharacters: TypeChar[],
    currentGridConfig: GridConfig,
    currentInputText: string
  ): { characters: TypeChar[]; gridConfig: GridConfig; inputText: string; snapshot: HistorySnapshot } | null {
    if (!this.canUndo()) return null

    const previous = this.past.pop()!

    this.future.push({
      id: generateId(),
      timestamp: Date.now(),
      label: 'redo',
      characters: currentCharacters.map(c => ({ ...c })),
      gridConfig: { ...currentGridConfig },
      inputText: currentInputText
    })

    return {
      characters: previous.characters.map(c => ({ ...c })),
      gridConfig: { ...previous.gridConfig },
      inputText: previous.inputText,
      snapshot: previous
    }
  }

  redo(
    currentCharacters: TypeChar[],
    currentGridConfig: GridConfig,
    currentInputText: string
  ): { characters: TypeChar[]; gridConfig: GridConfig; inputText: string; snapshot: HistorySnapshot } | null {
    if (!this.canRedo()) return null

    const next = this.future.pop()!

    this.past.push({
      id: generateId(),
      timestamp: Date.now(),
      label: 'undo',
      characters: currentCharacters.map(c => ({ ...c })),
      gridConfig: { ...currentGridConfig },
      inputText: currentInputText
    })

    return {
      characters: next.characters.map(c => ({ ...c })),
      gridConfig: { ...next.gridConfig },
      inputText: next.inputText,
      snapshot: next
    }
  }

  setLabel(label: string): void {
    this.currentLabel = label
  }

  clear(): void {
    this.past = []
    this.future = []
  }

  getPastCount(): number {
    return this.past.length
  }

  getFutureCount(): number {
    return this.future.length
  }

  getHistory(): { past: HistorySnapshot[]; future: HistorySnapshot[] } {
    return {
      past: [...this.past],
      future: [...this.future]
    }
  }
}

export function createHistoryManager(maxHistory: number = 50): HistoryManager {
  return new HistoryManager(maxHistory)
}
