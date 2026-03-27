import { computed, type Ref } from 'vue'

export type FindingSeverity = 'pass' | 'info' | 'warning' | 'error'

export interface SmtpFinding {
  severity: FindingSeverity
  title: string
  detail?: string
}

export interface MimeNode {
  contentType: string
  encoding?: string
  children: MimeNode[]
}

export interface SmtpLink {
  href: string
  text: string
  isEmpty: boolean
  isHttp: boolean
}

export interface SmtpMetrics {
  totalSize: number
  htmlSize: number
  textSize: number
  linkCount: number
  imageCount: number
  contentType: string
  charset: string
}

// ---- Header Parser ----

export function parseRawHeaders(raw: string): Record<string, string> {
  const headerEnd = raw.indexOf('\r\n\r\n')
  const headerBlock = headerEnd > 0 ? raw.slice(0, headerEnd) : raw.slice(0, 2000)

  const headers: Record<string, string> = {}
  const lines = headerBlock.split('\r\n')
  let currentKey = ''

  for (const line of lines) {
    if (line.startsWith(' ') || line.startsWith('\t')) {
      // Continuation line
      if (currentKey) {
        headers[currentKey] += ' ' + line.trim()
      }
    } else {
      const colon = line.indexOf(':')
      if (colon > 0) {
        currentKey = line.slice(0, colon).trim().toLowerCase()
        headers[currentKey] = line.slice(colon + 1).trim()
      }
    }
  }

  return headers
}

export function parseMimeStructure(raw: string): MimeNode | null {
  const headers = parseRawHeaders(raw)
  const ct = headers['content-type'] || ''

  const buildNode = (contentType: string, body: string): MimeNode => {
    const node: MimeNode = {
      contentType: contentType.split(';')[0].trim(),
      encoding: undefined,
      children: [],
    }

    const boundaryMatch = contentType.match(/boundary=([^\s;]+)/i)
    if (boundaryMatch) {
      const boundary = boundaryMatch[1].replace(/"/g, '')
      const parts = body.split('--' + boundary)

      for (const part of parts) {
        if (part.startsWith('--') || part.trim() === '') continue
        const partHeaderEnd = part.indexOf('\r\n\r\n')
        if (partHeaderEnd < 0) continue

        const partHeaders = part.slice(0, partHeaderEnd)
        const ctMatch = partHeaders.match(/content-type:\s*([^\r\n]+)/i)
        const encMatch = partHeaders.match(/content-transfer-encoding:\s*([^\r\n]+)/i)

        if (ctMatch) {
          const child = buildNode(ctMatch[1], part.slice(partHeaderEnd))
          if (encMatch) child.encoding = encMatch[1].trim()
          node.children.push(child)
        }
      }
    }

    return node
  }

  if (!ct) return null
  return buildNode(ct, raw)
}

// ---- Analytics ----

function analyzeDeliverability(raw: string, html: string, text: string, subject: string): SmtpFinding[] {
  const findings: SmtpFinding[] = []
  const headers = parseRawHeaders(raw)

  // Size check
  const totalKB = Math.round(raw.length / 1024 * 10) / 10
  if (totalKB > 102) {
    findings.push({ severity: 'warning', title: 'Email exceeds 102 KB', detail: `Total size: ${totalKB} KB. Gmail will clip content beyond 102 KB.` })
  }

  // Missing headers
  if (!headers['date']) {
    findings.push({ severity: 'warning', title: 'Missing Date header', detail: 'Many spam filters penalize emails without a Date header.' })
  }
  if (!headers['mime-version']) {
    findings.push({ severity: 'info', title: 'Missing MIME-Version header', detail: 'RFC 2045 requires a MIME-Version header for MIME messages.' })
  }
  if (!headers['message-id']) {
    findings.push({ severity: 'warning', title: 'Missing Message-ID header', detail: 'Emails without Message-ID may be flagged by spam filters.' })
  }

  // No text fallback
  if (html && !text) {
    findings.push({ severity: 'warning', title: 'No plain-text alternative', detail: 'Best practice is to include a text/plain part alongside text/html.' })
  }

  // Subject length
  if (subject && subject.length > 78) {
    findings.push({ severity: 'info', title: `Subject line is ${subject.length} chars`, detail: 'Subjects over 78 characters may be truncated on mobile devices.' })
  }

  if (findings.length === 0) {
    findings.push({ severity: 'pass', title: 'No deliverability issues found' })
  }

  return findings
}

function analyzeContentQa(html: string, text: string): SmtpFinding[] {
  const findings: SmtpFinding[] = []

  if (html) {
    // Links
    const linkMatches = html.match(/<a\s[^>]*href\s*=\s*["']([^"']*)["'][^>]*>/gi) || []
    const emptyHrefs = linkMatches.filter((l) => /href=["']\s*["']/i.test(l))
    const httpLinks = linkMatches.filter((l) => /href=["']http:\/\//i.test(l))

    if (emptyHrefs.length > 0) {
      findings.push({ severity: 'warning', title: `${emptyHrefs.length} empty link href(s)`, detail: 'Links with empty href="" will not navigate anywhere.' })
    }
    if (httpLinks.length > 0) {
      findings.push({ severity: 'info', title: `${httpLinks.length} HTTP link(s) (not HTTPS)`, detail: 'Consider using HTTPS for all links.' })
    }

    // Images
    const imgMatches = html.match(/<img\s[^>]*>/gi) || []
    const missingAlt = imgMatches.filter((img) => !/alt\s*=/i.test(img))

    if (missingAlt.length > 0) {
      findings.push({ severity: 'warning', title: `${missingAlt.length} image(s) missing alt text`, detail: 'Screen readers and image-blocked clients need alt attributes.' })
    }

    // HTML/Text parity
    if (html && text) {
      const strippedHtml = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      const normalizedText = text.replace(/\s+/g, ' ').trim()
      if (normalizedText.length > 0 && strippedHtml.length > 0) {
        const ratio = normalizedText.length / strippedHtml.length
        if (ratio < 0.3) {
          findings.push({ severity: 'info', title: 'Text version is much shorter than HTML', detail: 'The plain-text alternative covers less than 30% of the HTML content.' })
        }
      }
    }
  }

  if (findings.length === 0) {
    findings.push({ severity: 'pass', title: 'Content looks good' })
  }

  return findings
}

function analyzeCompatibility(html: string, raw: string): SmtpFinding[] {
  const findings: SmtpFinding[] = []

  if (!html) return [{ severity: 'pass', title: 'No HTML to analyze' }]

  // Dark mode
  const hasColorScheme = /meta\s+name=["']color-scheme["']/i.test(html)
  const hasDarkMedia = /@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)/i.test(html)

  if (hasColorScheme || hasDarkMedia) {
    findings.push({ severity: 'pass', title: 'Dark mode support detected' })
  } else {
    findings.push({ severity: 'info', title: 'No dark mode support', detail: 'Add <meta name="color-scheme" content="light dark"> and @media (prefers-color-scheme: dark) for dark mode.' })
  }

  // Problematic CSS
  if (/display\s*:\s*flex/i.test(html)) {
    findings.push({ severity: 'warning', title: 'Uses CSS flexbox', detail: 'Flexbox is not supported in Outlook desktop. Use table-based layout.' })
  }
  if (/display\s*:\s*grid/i.test(html)) {
    findings.push({ severity: 'warning', title: 'Uses CSS grid', detail: 'CSS Grid is not supported in most email clients.' })
  }
  if (/<link\s[^>]*rel=["']stylesheet["']/i.test(html)) {
    findings.push({ severity: 'error', title: 'External stylesheet detected', detail: 'External CSS files are not supported in email clients. Use inline styles.' })
  }

  // Problematic elements
  if (/<form[\s>]/i.test(html)) {
    findings.push({ severity: 'warning', title: 'Contains <form> element', detail: 'Forms are blocked in most email clients.' })
  }
  if (/<video[\s>]/i.test(html)) {
    findings.push({ severity: 'warning', title: 'Contains <video> element', detail: 'Video is not supported in email clients. Use an image with a play button linking to the video.' })
  }

  // Charset
  const headers = parseRawHeaders(raw)
  const ctHeader = headers['content-type'] || ''
  const hasUtf8Header = /charset=utf-8/i.test(ctHeader)
  const hasUtf8Meta = /charset=["']?utf-8/i.test(html)

  if (!hasUtf8Header && !hasUtf8Meta) {
    findings.push({ severity: 'info', title: 'No UTF-8 charset declaration', detail: 'Declare charset=utf-8 in Content-Type header or HTML meta for proper character rendering.' })
  }

  if (findings.length === 0) {
    findings.push({ severity: 'pass', title: 'No compatibility issues found' })
  }

  return findings
}

function analyzeSecurity(html: string, raw: string): SmtpFinding[] {
  const findings: SmtpFinding[] = []

  if (!html) return [{ severity: 'pass', title: 'No HTML to analyze' }]

  // Tracking pixels
  const imgMatches = html.match(/<img\s[^>]*>/gi) || []
  const trackingPixels = imgMatches.filter((img) => {
    const isSmall = /width=["']?1["']?\s/i.test(img) && /height=["']?1["']?\s/i.test(img)
    const isHidden = /display\s*:\s*none/i.test(img) || /visibility\s*:\s*hidden/i.test(img)
    return isSmall || isHidden
  })

  if (trackingPixels.length > 0) {
    findings.push({ severity: 'info', title: `${trackingPixels.length} likely tracking pixel(s)`, detail: 'Small or hidden images are commonly used for open tracking.' })
  }

  // External domains
  const srcMatches = html.match(/(?:src|href)=["'](https?:\/\/[^"'\s]+)["']/gi) || []
  const domains = new Set<string>()
  for (const match of srcMatches) {
    const urlMatch = match.match(/https?:\/\/([^/"'\s]+)/i)
    if (urlMatch) domains.add(urlMatch[1])
  }
  if (domains.size > 0) {
    findings.push({ severity: 'info', title: `References ${domains.size} external domain(s)`, detail: Array.from(domains).join(', ') })
  }

  if (findings.length === 0) {
    findings.push({ severity: 'pass', title: 'No security concerns found' })
  }

  return findings
}

// ---- Main composable ----

export function useSmtpAnalytics(
  raw: Ref<string>,
  html: Ref<string>,
  text: Ref<string>,
  subject: Ref<string>
) {
  const headers = computed(() => parseRawHeaders(raw.value))
  const mimeTree = computed(() => parseMimeStructure(raw.value))

  const metrics = computed<SmtpMetrics>(() => {
    const linkMatches = (html.value || '').match(/<a\s[^>]*href/gi) || []
    const imgMatches = (html.value || '').match(/<img\s/gi) || []
    const ct = headers.value['content-type'] || ''
    const charset = ct.match(/charset=([^\s;]+)/i)?.[1]?.replace(/"/g, '') || 'unknown'

    return {
      totalSize: raw.value.length,
      htmlSize: (html.value || '').length,
      textSize: (text.value || '').length,
      linkCount: linkMatches.length,
      imageCount: imgMatches.length,
      contentType: ct.split(';')[0].trim() || 'unknown',
      charset,
    }
  })

  const deliverability = computed(() => analyzeDeliverability(raw.value, html.value, text.value, subject.value))
  const contentQa = computed(() => analyzeContentQa(html.value, text.value))
  const compatibility = computed(() => analyzeCompatibility(html.value, raw.value))
  const security = computed(() => analyzeSecurity(html.value, raw.value))

  const links = computed<SmtpLink[]>(() => {
    if (!html.value) return []

    const results: SmtpLink[] = []
    const regex = /<a\s[^>]*href\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi
    let match: RegExpExecArray | null

    while ((match = regex.exec(html.value)) !== null) {
      const href = match[1].trim()
      const innerHtml = match[2]
      const hasImage = /<img\s/i.test(innerHtml)
      const strippedText = innerHtml.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

      let text: string
      if (strippedText) {
        text = strippedText
      } else if (hasImage) {
        const alt = innerHtml.match(/alt=["']([^"']*)["']/i)?.[1]
        text = alt ? `[image: ${alt}]` : '[image]'
      } else {
        text = '(no text)'
      }

      results.push({
        href,
        text,
        isEmpty: !href,
        isHttp: href.startsWith('http://'),
      })
    }

    return results
  })

  return {
    headers,
    mimeTree,
    metrics,
    links,
    deliverability,
    contentQa,
    compatibility,
    security,
  }
}
