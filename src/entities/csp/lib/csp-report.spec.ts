import { describe, expect, it } from 'vitest'
import type { CspReport } from '../types'
import { blockedText, isCspViolation, isReportOnly, pageText, reportTitle, sourceText } from './csp-report'

const report = (over: Partial<CspReport> = {}): CspReport => ({
  type: 'csp-violation',
  url: 'http://shop.test/checkout?step=2',
  user_agent: 'Chrome',
  directive: 'script-src-elem',
  blocked: 'https://cdn.example.com/lib.js',
  disposition: 'enforce',
  source_file: '',
  line: 0,
  column: 0,
  sample: '',
  policy: '',
  message: '',
  id: '',
  ...over
})

describe('csp-report words', () => {
  it('names the directive and what it blocked, a URL as host and path', () => {
    expect(reportTitle(report())).toBe('script-src-elem blocked cdn.example.com/lib.js')
  })

  it.each([
    ['a keyword', report({ blocked: 'inline' }), 'script-src-elem blocked inline'],
    ['nothing blocked', report({ blocked: '' }), 'script-src-elem violation'],
    ['a deprecation report', report({ type: 'deprecation', directive: '', blocked: '', message: 'unload is deprecated' }), 'deprecation: unload is deprecated'],
    ['a report without a message', report({ type: 'intervention', directive: '', blocked: '' }), 'intervention']
  ])('titles %s', (_, r, title) => {
    expect(reportTitle(r)).toBe(title)
  })

  it('keeps a bare origin short and a broken URL as is', () => {
    expect(blockedText(report({ blocked: 'https://fonts.example.com/' }))).toBe('fonts.example.com')
    expect(blockedText(report({ blocked: 'eval' }))).toBe('eval')
    expect(pageText('not a url')).toBe('not a url')
    expect(pageText('http://shop.test/checkout?step=2')).toBe('shop.test/checkout?step=2')
  })

  it('tells report-only from enforced, and CSP from other reports', () => {
    expect(isReportOnly(report({ disposition: 'report' }))).toBe(true)
    expect(isReportOnly(report())).toBe(false)
    expect(isCspViolation(report({ type: 'deprecation', directive: '' }))).toBe(false)
    expect(isCspViolation(report({ type: '', directive: 'img-src' }))).toBe(true)
  })

  it('copes with the fields the server leaves out', () => {
    const bare: CspReport = { type: 'csp-violation', directive: 'img-src', blocked: 'data' }
    expect(reportTitle(bare)).toBe('img-src blocked data')
    expect(sourceText(bare)).toBe('')
    expect(isReportOnly(bare)).toBe(false)
    expect(pageText(undefined)).toBe('')
  })

  it('joins the source file with line and column', () => {
    expect(sourceText(report({ source_file: 'http://shop.test/app.js', line: 10, column: 4 }))).toBe('http://shop.test/app.js:10:4')
    expect(sourceText(report({ source_file: 'app.js', line: 3 }))).toBe('app.js:3')
    expect(sourceText(report())).toBe('')
  })
})
