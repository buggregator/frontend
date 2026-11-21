import type { CspReport } from '../types'

// Words a person reads in the card and on the page (#6604).

export const isCspViolation = (r: CspReport) => r.type === 'csp-violation' || !!r.directive

export const isReportOnly = (r: CspReport) => r.disposition === 'report'

// «inline», «eval» and the like come as keywords; a URL shows as host + path.
export const blockedText = (r: CspReport): string => {
  const b = r.blocked || ''
  if (!b) return ''
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(b)) return b
  try {
    const u = new URL(b)
    return `${u.host}${u.pathname === '/' ? '' : u.pathname}`
  } catch {
    return b
  }
}

// The page the report came from, without the scheme.
export const pageText = (url: string): string => {
  try {
    const u = new URL(url)
    return `${u.host}${u.pathname}${u.search}`
  } catch {
    return url
  }
}

// One line: «script-src-elem blocked cdn.example.com/x.js» or, for another
// report type, «deprecation: <message>».
export const reportTitle = (r: CspReport): string => {
  if (isCspViolation(r)) {
    const what = blockedText(r)
    return what ? `${r.directive || 'CSP'} blocked ${what}` : `${r.directive || 'CSP'} violation`
  }
  return r.message ? `${r.type}: ${r.message}` : r.type || 'report'
}

export const sourceText = (r: CspReport): string => {
  if (!r.source_file) return ''
  const pos = [r.line, r.column].filter((n) => n > 0).join(':')
  return pos ? `${r.source_file}:${pos}` : r.source_file
}
