import { describe, expect, it } from 'vitest'
import type { CodeRootStatus } from '@/entities/code-graph'
import { formatAgo, formatTook, mountHint, rootProgress, rootSize, rootStatus, rootTimeLeft } from './code-roots-format'

const NOW = Date.parse('2026-11-21T12:00:00Z')
const root = (extra: Partial<CodeRootStatus> = {}): CodeRootStatus => ({ name: 'shop-web', path: '/code/shop-web', state: 'ready', ...extra })

describe('code roots text', () => {
  it('says how long indexing took', () => {
    expect(formatTook(350)).toBe('350 ms')
    expect(formatTook(1900)).toBe('1.9 s')
    expect(formatTook(42_000)).toBe('42 s')
    expect(formatTook(125_000)).toBe('2 min 5 s')
  })

  it('says how long ago', () => {
    expect(formatAgo('2026-11-21T11:59:50Z', NOW)).toBe('just now')
    expect(formatAgo('2026-11-21T11:58:00Z', NOW)).toBe('2 min ago')
    expect(formatAgo('2026-11-21T09:00:00Z', NOW)).toBe('3 h ago')
  })

  it('describes a ready folder', () => {
    const r = root({ files: 418, symbols: 6912, indexed_at: '2026-11-21T11:58:00Z', duration_ms: 1900 })
    expect(rootSize(r)).toBe('418 files · 6,912 symbols')
    expect(rootStatus(r, NOW)).toEqual({ tone: 'ok', text: 'Indexed 2 min ago · took 1.9 s' })
  })

  it('describes a folder being indexed, with progress and time left', () => {
    const r = root({ state: 'indexing', files: 127, files_seen: 84, started_at: '2026-11-21T11:59:40Z' })
    expect(rootProgress(r)).toBe(66)
    expect(rootSize(r)).toBe('84 / 127 files')
    expect(rootStatus(r, NOW)).toEqual({ tone: 'busy', text: 'Indexing 66%' })
    expect(rootTimeLeft(r, NOW)).toBe('about 10 s left')
  })

  it('has no progress before the total is known', () => {
    const r = root({ state: 'indexing' })
    expect(rootProgress(r)).toBeNull()
    expect(rootStatus(r, NOW).text).toBe('Indexing')
    expect(rootSize(r)).toBe('—')
  })

  it('gives the server error and a ready mount line', () => {
    const r = root({ state: 'error', error: 'Folder not found', name: 'payments-worker', path: '/code/payments-worker' })
    expect(rootStatus(r, NOW)).toEqual({ tone: 'err', text: 'Folder not found' })
    expect(mountHint(r)).toBe('-v ./payments-worker:/code/payments-worker:ro')
  })
})
