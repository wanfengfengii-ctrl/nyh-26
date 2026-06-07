import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ProofIssue,
  ProofAnnotation,
  AnnotationType,
  RevisionRecord,
  DecisionAction,
  ProofVersion,
  ProofConclusion
} from '@/types'

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useProofDecisionStore = defineStore('proofDecision', () => {
  const issues = ref<ProofIssue[]>([])
  const annotations = ref<ProofAnnotation[]>([])
  const revisions = ref<RevisionRecord[]>([])
  const versions = ref<ProofVersion[]>([])
  const currentVersion = ref(1)
  const currentReviewer = ref('校对员')
  const selectedIssueId = ref<string | null>(null)
  const selectedAnnotationId = ref<string | null>(null)

  const pendingIssues = computed(() =>
    issues.value.filter(i => i.status === 'pending')
  )

  const adoptedIssues = computed(() =>
    issues.value.filter(i => i.status === 'adopted')
  )

  const ignoredIssues = computed(() =>
    issues.value.filter(i => i.status === 'ignored')
  )

  const reviewIssues = computed(() =>
    issues.value.filter(i => i.status === 'review')
  )

  const resolvedIssues = computed(() =>
    issues.value.filter(i => i.status !== 'pending')
  )

  const progress = computed(() => {
    const total = issues.value.length
    if (total === 0) return 0
    return Math.round((resolvedIssues.value.length / total) * 100)
  })

  const errorIssues = computed(() =>
    issues.value.filter(i => i.severity === 'error')
  )

  const warningIssues = computed(() =>
    issues.value.filter(i => i.severity === 'warning')
  )

  const unresolvedAnnotations = computed(() =>
    annotations.value.filter(a => !a.resolved)
  )

  function setIssues(newIssues: ProofIssue[]) {
    const existingIds = new Set(issues.value.map(i => i.id))
    const newIds = new Set(newIssues.map(i => i.id))

    const toRemove = issues.value.filter(i => !newIds.has(i.id))
    const toAdd = newIssues.filter(i => !existingIds.has(i.id))
    const toUpdate = issues.value
      .filter(i => newIds.has(i.id))
      .map(existing => {
        const updated = newIssues.find(n => n.id === existing.id)
        if (updated) {
          return {
            ...existing,
            message: updated.message,
            severity: updated.severity,
            type: updated.type,
            char: updated.char,
            alternatives: updated.alternatives
          }
        }
        return existing
      })

    issues.value = [
      ...toUpdate,
      ...toAdd
    ]

    if (toRemove.length > 0) {
      revisions.value = revisions.value.filter(
        r => !toRemove.some(rm => rm.id === r.issueId)
      )
    }
  }

  function getIssueById(id: string): ProofIssue | undefined {
    return issues.value.find(i => i.id === id)
  }

  function getIssuesByPage(pageIndex: number): ProofIssue[] {
    return issues.value.filter(i => i.pageIndex === pageIndex)
  }

  function getIssuesByLine(pageIndex: number, lineIndex: number): ProofIssue[] {
    return issues.value.filter(i => i.pageIndex === pageIndex && i.lineIndex === lineIndex)
  }

  function getIssuesByChar(pageIndex: number, lineIndex: number, charIndex: number): ProofIssue[] {
    return issues.value.filter(
      i => i.pageIndex === pageIndex && i.lineIndex === lineIndex && i.charIndex === charIndex
    )
  }

  function adoptAlternative(issueId: string, alternativeChar: string, reason: string = ''): boolean {
    const issue = issues.value.find(i => i.id === issueId)
    if (!issue) return false

    issue.status = 'adopted'
    issue.resolvedChar = alternativeChar
    issue.resolution = `采纳替代字：${alternativeChar}${reason ? '，' + reason : ''}`
    issue.updatedAt = Date.now()

    const record: RevisionRecord = {
      id: generateId('rev'),
      issueId,
      action: 'adopt-alternative',
      pageIndex: issue.pageIndex,
      lineIndex: issue.lineIndex,
      charIndex: issue.charIndex,
      originalChar: issue.char,
      newChar: alternativeChar,
      reason: reason || `采纳替代字 ${alternativeChar}`,
      author: currentReviewer.value,
      timestamp: Date.now(),
      version: currentVersion.value
    }
    revisions.value.unshift(record)

    return true
  }

  function ignoreIssue(issueId: string, reason: string = ''): boolean {
    const issue = issues.value.find(i => i.id === issueId)
    if (!issue) return false

    issue.status = 'ignored'
    issue.resolution = reason || '忽略该问题'
    issue.updatedAt = Date.now()

    const record: RevisionRecord = {
      id: generateId('rev'),
      issueId,
      action: 'ignore',
      pageIndex: issue.pageIndex,
      lineIndex: issue.lineIndex,
      charIndex: issue.charIndex,
      originalChar: issue.char,
      reason: reason || '忽略问题',
      author: currentReviewer.value,
      timestamp: Date.now(),
      version: currentVersion.value
    }
    revisions.value.unshift(record)

    return true
  }

  function markForReview(issueId: string, reason: string = ''): boolean {
    const issue = issues.value.find(i => i.id === issueId)
    if (!issue) return false

    issue.status = 'review'
    issue.resolution = reason || '标记需复核'
    issue.updatedAt = Date.now()

    const record: RevisionRecord = {
      id: generateId('rev'),
      issueId,
      action: 'mark-review',
      pageIndex: issue.pageIndex,
      lineIndex: issue.lineIndex,
      charIndex: issue.charIndex,
      originalChar: issue.char,
      reason: reason || '标记需复核',
      author: currentReviewer.value,
      timestamp: Date.now(),
      version: currentVersion.value
    }
    revisions.value.unshift(record)

    return true
  }

  function customReplace(issueId: string, newChar: string, reason: string = ''): boolean {
    const issue = issues.value.find(i => i.id === issueId)
    if (!issue) return false

    issue.status = 'adopted'
    issue.resolvedChar = newChar
    issue.resolution = `自定义替换：${newChar}${reason ? '，' + reason : ''}`
    issue.updatedAt = Date.now()

    const record: RevisionRecord = {
      id: generateId('rev'),
      issueId,
      action: 'custom-replace',
      pageIndex: issue.pageIndex,
      lineIndex: issue.lineIndex,
      charIndex: issue.charIndex,
      originalChar: issue.char,
      newChar,
      reason: reason || `自定义替换为 ${newChar}`,
      author: currentReviewer.value,
      timestamp: Date.now(),
      version: currentVersion.value
    }
    revisions.value.unshift(record)

    return true
  }

  function resetIssue(issueId: string): boolean {
    const issue = issues.value.find(i => i.id === issueId)
    if (!issue) return false

    issue.status = 'pending'
    issue.resolution = undefined
    issue.resolvedChar = undefined
    issue.updatedAt = Date.now()

    return true
  }

  function addAnnotation(
    type: AnnotationType,
    content: string,
    pageIndex: number,
    lineIndex: number,
    charIndex?: number,
    char?: string
  ): ProofAnnotation {
    const annotation: ProofAnnotation = {
      id: generateId('ann'),
      type,
      content,
      author: currentReviewer.value,
      pageIndex,
      lineIndex,
      charIndex,
      char,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      resolved: false
    }
    annotations.value.unshift(annotation)
    return annotation
  }

  function updateAnnotation(id: string, content: string): boolean {
    const ann = annotations.value.find(a => a.id === id)
    if (!ann) return false
    ann.content = content
    ann.updatedAt = Date.now()
    return true
  }

  function resolveAnnotation(id: string, resolution: string = ''): boolean {
    const ann = annotations.value.find(a => a.id === id)
    if (!ann) return false
    ann.resolved = true
    ann.resolution = resolution || '已处理'
    ann.updatedAt = Date.now()
    return true
  }

  function deleteAnnotation(id: string): boolean {
    const idx = annotations.value.findIndex(a => a.id === id)
    if (idx === -1) return false
    annotations.value.splice(idx, 1)
    return true
  }

  function getAnnotationsByPage(pageIndex: number): ProofAnnotation[] {
    return annotations.value.filter(a => a.pageIndex === pageIndex)
  }

  function getAnnotationsByLine(pageIndex: number, lineIndex: number): ProofAnnotation[] {
    return annotations.value.filter(a => a.pageIndex === pageIndex && a.lineIndex === lineIndex)
  }

  function getAnnotationsByChar(
    pageIndex: number,
    lineIndex: number,
    charIndex: number
  ): ProofAnnotation[] {
    return annotations.value.filter(
      a => a.pageIndex === pageIndex && a.lineIndex === lineIndex && a.charIndex === charIndex
    )
  }

  function saveVersion(label: string, description: string = ''): ProofVersion {
    const version: ProofVersion = {
      version: currentVersion.value,
      label: label || `v${currentVersion.value}`,
      timestamp: Date.now(),
      description,
      issueCount: issues.value.length,
      resolvedCount: resolvedIssues.value.length,
      author: currentReviewer.value
    }
    versions.value.unshift(version)
    currentVersion.value++
    return version
  }

  function getRevisionsByVersion(version: number): RevisionRecord[] {
    return revisions.value.filter(r => r.version === version)
  }

  function getRevisionsByIssue(issueId: string): RevisionRecord[] {
    return revisions.value.filter(r => r.issueId === issueId)
  }

  function generateConclusion(title: string = '校样结论', conclusionText: string = ''): ProofConclusion {
    return {
      title,
      generatedAt: Date.now(),
      totalIssues: issues.value.length,
      resolvedIssues: resolvedIssues.value.length,
      pendingIssues: pendingIssues.value.length,
      adoptedRevisions: adoptedIssues.value.length,
      ignoredIssues: ignoredIssues.value.length,
      reviewIssues: reviewIssues.value.length,
      conclusionText: conclusionText || generateDefaultConclusion(),
      reviewer: currentReviewer.value,
      pages: 0,
      chars: 0,
      missingChars: errorIssues.value.filter(i => i.type === 'missing-char').length
    }
  }

  function generateDefaultConclusion(): string {
    const total = issues.value.length
    if (total === 0) {
      return '本次校样未发现任何问题，版面符合要求。'
    }

    const resolved = resolvedIssues.value.length
    const pending = pendingIssues.value.length
    const adopted = adoptedIssues.value.length
    const ignored = ignoredIssues.value.length
    const review = reviewIssues.value.length

    let text = `本次校样共发现 ${total} 个问题，`
    text += `已处理 ${resolved} 个，待处理 ${pending} 个。\n\n`
    text += `其中：\n`
    text += `- 已采纳修订：${adopted} 个\n`
    text += `- 已忽略问题：${ignored} 个\n`
    text += `- 标记需复核：${review} 个\n`

    if (pending > 0) {
      text += `\n尚有 ${pending} 个问题待处理，请相关人员跟进。`
    } else {
      text += `\n所有问题均已处理完毕。`
    }

    return text
  }

  function setReviewer(name: string) {
    currentReviewer.value = name
  }

  function selectIssue(id: string | null) {
    selectedIssueId.value = id
  }

  function selectAnnotation(id: string | null) {
    selectedAnnotationId.value = id
  }

  function resetAll() {
    issues.value = []
    annotations.value = []
    revisions.value = []
    versions.value = []
    currentVersion.value = 1
    selectedIssueId.value = null
    selectedAnnotationId.value = null
  }

  return {
    issues,
    annotations,
    revisions,
    versions,
    currentVersion,
    currentReviewer,
    selectedIssueId,
    selectedAnnotationId,

    pendingIssues,
    adoptedIssues,
    ignoredIssues,
    reviewIssues,
    resolvedIssues,
    progress,
    errorIssues,
    warningIssues,
    unresolvedAnnotations,

    setIssues,
    getIssueById,
    getIssuesByPage,
    getIssuesByLine,
    getIssuesByChar,

    adoptAlternative,
    ignoreIssue,
    markForReview,
    customReplace,
    resetIssue,

    addAnnotation,
    updateAnnotation,
    resolveAnnotation,
    deleteAnnotation,
    getAnnotationsByPage,
    getAnnotationsByLine,
    getAnnotationsByChar,

    saveVersion,
    getRevisionsByVersion,
    getRevisionsByIssue,

    generateConclusion,
    setReviewer,
    selectIssue,
    selectAnnotation,
    resetAll
  }
})
