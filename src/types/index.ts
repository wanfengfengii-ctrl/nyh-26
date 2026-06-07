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

export interface ProofConfig {
  cols: number
  rows: number
  fontSize: number
  lineHeight: number
  paragraphIndent: number
  paragraphSpacing: number
  enableProhibition: boolean
  enablePunctuationSqueeze: boolean
}

export interface ProofChar {
  char: string
  isMissing: boolean
  isPunctuation: boolean
  squeezeBefore: number
  squeezeAfter: number
  alternatives: string[]
}

export interface ProofLine {
  chars: ProofChar[]
  lineIndex: number
  pageIndex: number
  issues: ProofIssue[]
  actualWidth: number
}

export interface ProofPage {
  pageIndex: number
  lines: ProofLine[]
  charCount: number
  missingCharCount: number
  lineCount: number
}

export type IssueType = 'prohibition-start' | 'prohibition-end' | 'missing-char' | 'insufficient-stock' | 'line-overflow' | 'abnormal-break'

export interface ProofIssue {
  id: string
  type: IssueType
  severity: 'error' | 'warning' | 'info'
  message: string
  pageIndex: number
  lineIndex: number
  charIndex?: number
  char?: string
  alternatives?: string[]
  status: 'pending' | 'adopted' | 'ignored' | 'review'
  resolution?: string
  resolvedChar?: string
  createdAt: number
  updatedAt: number
}

export type AnnotationType = 'comment' | 'suggestion' | 'question' | 'important'

export interface ProofAnnotation {
  id: string
  type: AnnotationType
  content: string
  author: string
  pageIndex: number
  lineIndex: number
  charIndex?: number
  char?: string
  createdAt: number
  updatedAt: number
  resolved: boolean
  resolution?: string
}

export type DecisionAction = 'adopt-alternative' | 'ignore' | 'mark-review' | 'custom-replace'

export interface RevisionRecord {
  id: string
  issueId: string
  action: DecisionAction
  pageIndex: number
  lineIndex: number
  charIndex?: number
  originalChar?: string
  newChar?: string
  reason: string
  author: string
  timestamp: number
  version: number
}

export interface ProofVersion {
  version: number
  label: string
  timestamp: number
  description: string
  issueCount: number
  resolvedCount: number
  author: string
}

export interface ProofConclusion {
  title: string
  generatedAt: number
  totalIssues: number
  resolvedIssues: number
  pendingIssues: number
  adoptedRevisions: number
  ignoredIssues: number
  reviewIssues: number
  conclusionText: string
  reviewer: string
  pages: number
  chars: number
  missingChars: number
}

export interface MissingCharInfo {
  char: string
  count: number
  positions: { page: number; line: number; char: number }[]
  alternatives: string[]
}

export interface StockPageEstimate {
  canCompletePages: number
  limitingChar: string | null
  limitingCharAvailable: number
  limitingCharPerPage: number
  totalPages: number
}

export interface ProofResult {
  pages: ProofPage[]
  totalPages: number
  totalChars: number
  totalMissingChars: number
  totalIssues: number
  issues: ProofIssue[]
  missingChars: MissingCharInfo[]
  stockEstimate: StockPageEstimate
  charStats: CharCount[]
  problemLines: { page: number; line: number; issues: ProofIssue[] }[]
}
