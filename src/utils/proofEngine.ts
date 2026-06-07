import type {
  ProofConfig,
  ProofChar,
  ProofLine,
  ProofPage,
  ProofIssue,
  ProofResult,
  MissingCharInfo,
  StockPageEstimate,
  CharCount
} from '@/types'

const START_PROHIBITION_CHARS = new Set([
  '，', '。', '、', '；', '：', '？', '！',
  ',', '.', ';', ':', '?', '!',
  '）', '】', '》', '」', '』',
  ')', ']', '>',
  '…', '—', '～'
])

const END_PROHIBITION_CHARS = new Set([
  '（', '【', '《', '「', '『',
  '(', '[', '<'
])

const PUNCTUATION_CHARS = new Set([
  '，', '。', '、', '；', '：', '？', '！',
  ',', '.', ';', ':', '?', '!',
  '（', '）', '【', '】', '《', '》', '「', '」', '『', '』',
  '(', ')', '[', ']', '<', '>',
  '…', '—', '～', '·'
])

const SQUEEZE_FACTOR = 0.5

const SIMILAR_CHARS: Record<string, string[]> = {
  '天': ['大', '夫', '夭'],
  '地': ['池', '他', '她'],
  '人': ['入', '八', '儿'],
  '和': ['合', '禾', '何'],
  '大': ['天', '太', '犬'],
  '道': ['到', '导', '首'],
  '自': ['白', '目', '日'],
  '然': ['燃', '热', '照'],
  '风': ['凤', '夙', '凡'],
  '雨': ['两', '而', '丙'],
  '山': ['出', '巾', '屮'],
  '水': ['永', '冰', '求'],
  '春': ['舂', '泰', '奉'],
  '夏': ['复', '厦', '夔'],
  '秋': ['和', '种', '科'],
  '冬': ['各', '务', '条'],
  '日': ['曰', '目', '白'],
  '月': ['有', '用', '冉'],
  '星': ['醒', '腥', '生'],
  '云': ['去', '元', '无'],
  '花': ['化', '华', '草'],
  '草': ['早', '章', '卓'],
  '木': ['本', '未', '末'],
  '火': ['伙', '灭', '灰'],
  '金': ['全', '今', '舍'],
  '银': ['很', '根', '恨'],
  '铜': ['筒', '同', '桐'],
  '铁': ['跌', '失', '秩'],
  '东': ['车', '冻', '栋'],
  '西': ['四', '洒', '晒'],
  '南': ['男', '楠', '献'],
  '北': ['比', '背', '兆'],
  '中': ['申', '口', '丰'],
  '上': ['下', '止', '土'],
  '下': ['上', '卞', '卡'],
  '左': ['右', '在', '存'],
  '右': ['左', '有', '石'],
  '前': ['剪', '箭', '煎'],
  '后': ['司', '向', '石'],
  '里': ['理', '里', '野'],
  '外': ['处', '多', '夜'],
  '高': ['亮', '膏', '稿'],
  '低': ['底', '抵', '邸'],
  '长': ['常', '张', '涨'],
  '短': ['矮', '知', '逗'],
  '小': ['少', '尖', '尘'],
  '多': ['少', '夕', '名'],
  '少': ['小', '妙', '沙'],
  '一': ['二', '三', '十'],
  '二': ['一', '三', '土'],
  '三': ['一', '二', '王'],
  '四': ['西', '泗', '驷'],
  '五': ['伍', '玉', '王'],
  '六': ['文', '交', '亢'],
  '七': ['匕', '化', '叱'],
  '八': ['人', '入', '公'],
  '九': ['丸', '几', '凡'],
  '十': ['一', '士', '土'],
  '百': ['白', '柏', '伯'],
  '千': ['干', '于', '才'],
  '万': ['方', '石', '厉'],
  '是': ['足', '走', '提'],
  '的': ['白', '勺', '均'],
  '了': ['子', '孑', '孓'],
  '在': ['左', '存', '有'],
  '有': ['友', '右', '肴'],
  '我': ['找', '伐', '俄'],
  '你': ['他', '她', '尔'],
  '他': ['你', '她', '也'],
  '她': ['你', '他', '也'],
  '它': ['宝', '宅', '字'],
  '们': ['门', '问', '间'],
  '这': ['边', '迎', '进'],
  '那': ['哪', '挪', '娜'],
  '个': ['人', '介', '今'],
  '就': ['救', '蹴', '舅'],
  '也': ['他', '她', '池'],
  '都': ['者', '堵', '赌'],
  '而': ['面', '页', '丙'],
  '与': ['写', '兴', '马'],
  '及': ['级', '极', '圾'],
  '为': ['办', '力', '伪'],
  '以': ['似', '已', '矣'],
  '之': ['乏', '久', '乎'],
  '其': ['共', '具', '真'],
  '或': ['感', '戴', '裁'],
  '但': ['担', '胆', '旦'],
  '如': ['女', '好', '妃'],
  '若': ['苦', '若', '惹'],
  '则': ['测', '侧', '厕'],
  '所': ['听', '斤', '新'],
  '虽': ['强', '蛹', '屈'],
  '因': ['困', '固', '国'],
  '故': ['古', '姑', '辜']
}

export function isPunctuation(char: string): boolean {
  return PUNCTUATION_CHARS.has(char)
}

export function isStartProhibition(char: string): boolean {
  return START_PROHIBITION_CHARS.has(char)
}

export function isEndProhibition(char: string): boolean {
  return END_PROHIBITION_CHARS.has(char)
}

export function getCharAlternatives(char: string, availableChars: Set<string>): string[] {
  const similar = SIMILAR_CHARS[char] || []
  return similar.filter(c => availableChars.has(c))
}

export function getCharWidth(char: string, fontSize: number, squeezeAfter: number = 0): number {
  if (isPunctuation(char)) {
    return fontSize * (1 - squeezeAfter)
  }
  return fontSize
}

export interface CharStreamItem {
  char: string
  isNewline: boolean
  isParagraphEnd: boolean
}

export function parseTextToStream(text: string): CharStreamItem[] {
  const stream: CharStreamItem[] = []
  const lines = text.split(/\r?\n/)

  lines.forEach((line, lineIdx) => {
    const chars = Array.from(line)
    chars.forEach((char, charIdx) => {
      stream.push({
        char,
        isNewline: false,
        isParagraphEnd: false
      })
    })

    if (lineIdx < lines.length - 1) {
      stream.push({
        char: '\n',
        isNewline: true,
        isParagraphEnd: line.trim().length > 0 && lineIdx < lines.length - 1
      })
    }
  })

  return stream
}

export function composeProof(
  text: string,
  config: ProofConfig,
  availableCharSet: Set<string>,
  totalStockMap: Map<string, number>
): ProofResult {
  const stream = parseTextToStream(text)
  const pages: ProofPage[] = []
  const allIssues: ProofIssue[] = []
  const missingCharMap = new Map<string, { count: number; positions: { page: number; line: number; char: number }[] }>()
  const charCountMap = new Map<string, number>()
  const problemLines: { page: number; line: number; issues: ProofIssue[] }[] = []
  const charUsageCount = new Map<string, number>()

  let currentPage = 0
  let currentLine = 0
  let currentLineChars: ProofChar[] = []
  let currentLineWidth = 0
  let globalLineIndex = 0

  const maxLineWidth = config.cols * config.fontSize

  function newPage(): ProofPage {
    return {
      pageIndex: currentPage,
      lines: [],
      charCount: 0,
      missingCharCount: 0,
      lineCount: 0
    }
  }

  let page = newPage()

  function pushLine() {
    const lineIssues = analyzeLineIssues(currentLineChars, currentLine, currentPage, config)
    allIssues.push(...lineIssues)

    const line: ProofLine = {
      chars: currentLineChars,
      lineIndex: currentLine,
      pageIndex: currentPage,
      issues: lineIssues,
      actualWidth: currentLineWidth
    }

    page.lines.push(line)
    page.lineCount++

    lineCharsCounts(currentLineChars, page, charCountMap, missingCharMap, currentPage, currentLine)

    if (lineIssues.length > 0) {
      problemLines.push({
        page: currentPage,
        line: currentLine,
        issues: lineIssues
      })
    }

    currentLine++
    globalLineIndex++
    currentLineChars = []
    currentLineWidth = 0

    if (page.lines.length >= config.rows) {
      pages.push(page)
      currentPage++
      currentLine = 0
      page = newPage()
    }
  }

  let paragraphFirstLine = true

  for (let i = 0; i < stream.length; i++) {
    const item = stream[i]

    if (item.isNewline) {
      if (currentLineChars.length > 0) {
        pushLine()
      }

      if (item.isParagraphEnd) {
        if (config.paragraphSpacing > 0) {
          for (let s = 0; s < config.paragraphSpacing; s++) {
            if (page.lines.length < config.rows) {
              page.lines.push({
                chars: [],
                lineIndex: currentLine,
                pageIndex: currentPage,
                issues: [],
                actualWidth: 0
              })
              currentLine++
            }
          }
        }
        paragraphFirstLine = true
      }
      continue
    }

    if (paragraphFirstLine && config.paragraphIndent > 0) {
      for (let s = 0; s < config.paragraphIndent; s++) {
        currentLineChars.push({
          char: '　',
          isMissing: false,
          isPunctuation: false,
          squeezeBefore: 0,
          squeezeAfter: 0,
          alternatives: []
        })
        currentLineWidth += config.fontSize
      }
      paragraphFirstLine = false
    }

    const char = item.char
    const isMissing = !availableCharSet.has(char)
    const isPunc = isPunctuation(char)
    const alternatives = isMissing ? getCharAlternatives(char, availableCharSet) : []

    let squeezeBefore = 0
    let squeezeAfter = 0

    if (config.enablePunctuationSqueeze && isPunc) {
      if (currentLineChars.length > 0) {
        const prevChar = currentLineChars[currentLineChars.length - 1]
        if (prevChar.isPunctuation) {
          squeezeBefore = SQUEEZE_FACTOR
        }
      }
    }

    const charWidth = getCharWidth(char, config.fontSize, squeezeBefore)
    const projectedWidth = currentLineWidth + charWidth

    if (projectedWidth > maxLineWidth && currentLineChars.length > 0) {
      const lineBreakResult = findLineBreakPoint(
        currentLineChars,
        char,
        currentLineWidth,
        charWidth,
        maxLineWidth,
        config
      )

      if (lineBreakResult.breakBefore) {
        pushLine()

        if (paragraphFirstLine && config.paragraphIndent > 0) {
          for (let s = 0; s < config.paragraphIndent; s++) {
            currentLineChars.push({
              char: '　',
              isMissing: false,
              isPunctuation: false,
              squeezeBefore: 0,
              squeezeAfter: 0,
              alternatives: []
            })
            currentLineWidth += config.fontSize
          }
          paragraphFirstLine = false
        }
      } else {
        if (currentLineChars.length > lineBreakResult.breakIndex) {
          const keptChars = currentLineChars.slice(0, lineBreakResult.breakIndex + 1)
          const remainingChars = currentLineChars.slice(lineBreakResult.breakIndex + 1)

          currentLineChars = keptChars
          currentLineWidth = calculateLineWidth(keptChars, config.fontSize)
          pushLine()

          for (const rc of remainingChars) {
            currentLineChars.push(rc)
            currentLineWidth += getCharWidth(rc.char, config.fontSize, rc.squeezeBefore)
          }
          paragraphFirstLine = false
        }
      }
    }

    currentLineChars.push({
      char,
      isMissing,
      isPunctuation: isPunc,
      squeezeBefore,
      squeezeAfter,
      alternatives
    })
    currentLineWidth += charWidth
  }

  if (currentLineChars.length > 0) {
    pushLine()
  }

  if (page.lines.length > 0) {
    pages.push(page)
  }

  const missingChars: MissingCharInfo[] = Array.from(missingCharMap.entries()).map(([char, info]) => ({
    char,
    count: info.count,
    positions: info.positions,
    alternatives: getCharAlternatives(char, availableCharSet)
  }))

  const charStats: CharCount[] = Array.from(charCountMap.entries())
    .map(([char, count]) => ({ char, count }))
    .sort((a, b) => b.count - a.count)

  const stockEstimate = calculateStockPageEstimate(
    charStats,
    totalStockMap,
    pages.length,
    availableCharSet
  )

  addStockInsufficientIssues(pages, totalStockMap, allIssues, problemLines)

  let totalChars = 0
  let totalMissing = 0
  pages.forEach(p => {
    totalChars += p.charCount
    totalMissing += p.missingCharCount
  })

  return {
    pages,
    totalPages: pages.length,
    totalChars,
    totalMissingChars: totalMissing,
    totalIssues: allIssues.length,
    issues: allIssues,
    missingChars,
    stockEstimate,
    charStats,
    problemLines
  }
}

function lineCharsCounts(
  chars: ProofChar[],
  page: ProofPage,
  charCountMap: Map<string, number>,
  missingCharMap: Map<string, { count: number; positions: { page: number; line: number; char: number }[] }>,
  pageIndex: number,
  lineIndex: number
) {
  chars.forEach((pc, idx) => {
    if (pc.char === '　' || pc.char === ' ' || pc.char === '\n') return

    page.charCount++
    charCountMap.set(pc.char, (charCountMap.get(pc.char) || 0) + 1)

    if (pc.isMissing) {
      page.missingCharCount++
      if (!missingCharMap.has(pc.char)) {
        missingCharMap.set(pc.char, { count: 0, positions: [] })
      }
      const info = missingCharMap.get(pc.char)!
      info.count++
      info.positions.push({ page: pageIndex, line: lineIndex, char: idx })
    }
  })
}

function calculateLineWidth(chars: ProofChar[], fontSize: number): number {
  let width = 0
  chars.forEach((c, idx) => {
    let squeezeBefore = 0
    if (idx > 0 && chars[idx - 1].isPunctuation && c.isPunctuation) {
      squeezeBefore = SQUEEZE_FACTOR
    }
    width += getCharWidth(c.char, fontSize, squeezeBefore)
  })
  return width
}

function findLineBreakPoint(
  currentChars: ProofChar[],
  nextChar: string,
  currentWidth: number,
  nextWidth: number,
  maxWidth: number,
  config: ProofConfig
): { breakBefore: boolean; breakIndex: number } {
  if (!config.enableProhibition) {
    return { breakBefore: true, breakIndex: currentChars.length - 1 }
  }

  if (isStartProhibition(nextChar)) {
    for (let i = currentChars.length - 1; i >= Math.max(0, currentChars.length - 5); i--) {
      const ch = currentChars[i]
      if (!isEndProhibition(ch.char) && !isPunctuation(ch.char)) {
        return { breakBefore: false, breakIndex: i }
      }
    }
    return { breakBefore: false, breakIndex: Math.max(0, currentChars.length - 2) }
  }

  if (currentChars.length > 0) {
    const lastChar = currentChars[currentChars.length - 1]
    if (isEndProhibition(lastChar.char)) {
      for (let i = currentChars.length - 2; i >= Math.max(0, currentChars.length - 5); i--) {
        const ch = currentChars[i]
        if (!isEndProhibition(ch.char)) {
          return { breakBefore: false, breakIndex: i }
        }
      }
    }
  }

  return { breakBefore: true, breakIndex: currentChars.length - 1 }
}

function analyzeLineIssues(
  chars: ProofChar[],
  lineIndex: number,
  pageIndex: number,
  config: ProofConfig
): ProofIssue[] {
  const issues: ProofIssue[] = []

  if (chars.length === 0) return issues

  const firstChar = chars[0]
  const lastChar = chars[chars.length - 1]

  if (config.enableProhibition && isStartProhibition(firstChar.char)) {
    issues.push({
      type: 'prohibition-start',
      severity: 'warning',
      message: `行首禁则："${firstChar.char}" 不应出现在行首`,
      lineIndex,
      charIndex: 0,
      char: firstChar.char
    })
  }

  if (config.enableProhibition && isEndProhibition(lastChar.char)) {
    issues.push({
      type: 'prohibition-end',
      severity: 'warning',
      message: `行尾禁则："${lastChar.char}" 不应出现在行尾`,
      lineIndex,
      charIndex: chars.length - 1,
      char: lastChar.char
    })
  }

  chars.forEach((ch, idx) => {
    if (ch.isMissing) {
      issues.push({
        type: 'missing-char',
        severity: 'error',
        message: `缺字："${ch.char}" 字盘中不存在`,
        lineIndex,
        charIndex: idx,
        char: ch.char
      })
    }
  })

  return issues
}

function calculateStockPageEstimate(
  charStats: CharCount[],
  totalStockMap: Map<string, number>,
  totalPages: number,
  availableCharSet: Set<string>
): StockPageEstimate {
  if (totalPages === 0 || charStats.length === 0) {
    return {
      canCompletePages: 0,
      limitingChar: null,
      limitingCharAvailable: 0,
      limitingCharPerPage: 0,
      totalPages
    }
  }

  let minCanComplete = Infinity
  let limitingChar: string | null = null
  let limitingAvailable = 0
  let limitingPerPage = 0

  charStats.forEach(item => {
    if (!availableCharSet.has(item.char)) return

    const available = totalStockMap.get(item.char) || 0
    const perPage = item.count / totalPages

    if (perPage > 0) {
      const canComplete = Math.floor(available / perPage)
      if (canComplete < minCanComplete) {
        minCanComplete = canComplete
        limitingChar = item.char
        limitingAvailable = available
        limitingPerPage = perPage
      }
    }
  })

  if (minCanComplete === Infinity) {
    minCanComplete = 0
  }

  return {
    canCompletePages: Math.min(minCanComplete, totalPages),
    limitingChar,
    limitingCharAvailable: limitingAvailable,
    limitingCharPerPage: Math.round(limitingPerPage * 100) / 100,
    totalPages
  }
}

function addStockInsufficientIssues(
  pages: ProofPage[],
  totalStockMap: Map<string, number>,
  allIssues: ProofIssue[],
  problemLines: { page: number; line: number; issues: ProofIssue[] }[]
) {
  const charRunningCount = new Map<string, number>()
  const insufficientChars = new Set<string>()

  pages.forEach(page => {
    page.lines.forEach(line => {
      const lineInsufficientIssues: ProofIssue[] = []

      line.chars.forEach((pc, charIdx) => {
        if (pc.isMissing || pc.char === '　' || pc.char === ' ') return

        const currentCount = (charRunningCount.get(pc.char) || 0) + 1
        charRunningCount.set(pc.char, currentCount)

        const available = totalStockMap.get(pc.char) || 0
        if (currentCount > available) {
          if (!insufficientChars.has(pc.char)) {
            insufficientChars.add(pc.char)
          }

          const issue: ProofIssue = {
            type: 'insufficient-stock',
            severity: 'error',
            message: `库存不足："${pc.char}" 第 ${currentCount} 次使用，库存仅 ${available} 个`,
            lineIndex: line.lineIndex,
            charIndex: charIdx,
            char: pc.char
          }

          lineInsufficientIssues.push(issue)
          allIssues.push(issue)
        }
      })

      if (lineInsufficientIssues.length > 0) {
        line.issues.push(...lineInsufficientIssues)

        const existingProblemLine = problemLines.find(
          pl => pl.page === line.pageIndex && pl.line === line.lineIndex
        )
        if (!existingProblemLine) {
          problemLines.push({
            page: line.pageIndex,
            line: line.lineIndex,
            issues: line.issues
          })
        } else {
          existingProblemLine.issues = line.issues
        }
      }
    })
  })
}

export function exportProofAsText(proof: ProofResult, config: ProofConfig): string {
  let output = ''
  output += '========================================\n'
  output += '       印刷校样报告\n'
  output += '========================================\n\n'
  output += `版面配置：${config.cols}列 × ${config.rows}行\n`
  output += `字号：${config.fontSize}px\n`
  output += `总页数：${proof.totalPages}\n`
  output += `总字符数：${proof.totalChars}\n`
  output += `缺字符数：${proof.totalMissingChars}\n`
  output += `问题数：${proof.totalIssues}\n\n`

  output += '----------------------------------------\n'
  output += '库存预估\n'
  output += '----------------------------------------\n'
  if (proof.stockEstimate.limitingChar) {
    output += `当前字盘可完整印刷约 ${proof.stockEstimate.canCompletePages} 页\n`
    output += `瓶颈字符："${proof.stockEstimate.limitingChar}" `
    output += `(库存 ${proof.stockEstimate.limitingCharAvailable} 个，每页约 ${proof.stockEstimate.limitingCharPerPage} 个)\n`
  } else {
    output += '无法预估（无可用字符数据）\n'
  }
  output += '\n'

  if (proof.missingChars.length > 0) {
    output += '----------------------------------------\n'
    output += '缺字清单\n'
    output += '----------------------------------------\n'
    proof.missingChars.forEach(m => {
      const alts = m.alternatives.length > 0 ? ` (建议替代：${m.alternatives.join('、')})` : ''
      output += `  ${m.char} × ${m.count}${alts}\n`
    })
    output += '\n'
  }

  if (proof.problemLines.length > 0) {
    output += '----------------------------------------\n'
    output += '问题行列表\n'
    output += '----------------------------------------\n'
    proof.problemLines.forEach(pl => {
      output += `  第${pl.page + 1}页 第${pl.line + 1}行：\n`
      pl.issues.forEach(issue => {
        const icon = issue.severity === 'error' ? '✗' : '⚠'
        output += `    ${icon} ${issue.message}\n`
      })
    })
    output += '\n'
  }

  output += '----------------------------------------\n'
  output += '用字统计 (前20位)\n'
  output += '----------------------------------------\n'
  const topStats = proof.charStats.slice(0, 20)
  const maxCount = topStats.length > 0 ? topStats[0].count : 1
  topStats.forEach(cs => {
    const barLen = Math.round((cs.count / maxCount) * 30)
    const bar = '█'.repeat(barLen)
    output += `  ${cs.char} ${bar} ${cs.count}\n`
  })
  output += '\n'

  output += '----------------------------------------\n'
  output += '版面预览\n'
  output += '----------------------------------------\n'
  proof.pages.forEach((page, pIdx) => {
    output += `\n--- 第 ${pIdx + 1} 页 ---\n`
    page.lines.forEach(line => {
      const lineText = line.chars.map(c => c.char).join('')
      output += `${lineText || '(空行)'}\n`
    })
  })

  output += '\n========================================\n'
  output += '       校样报告结束\n'
  output += '========================================\n'

  return output
}
