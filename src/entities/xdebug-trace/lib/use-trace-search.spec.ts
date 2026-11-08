import { describe, expect, it, vi } from 'vitest'
import type { XdebugTraceNode, XdebugTraceTreePage } from '../types'
import { useTraceSearch } from './use-trace-search'

const hit = (nr: number): XdebugTraceNode => ({
  nr, offset: nr * 100, children: 0, func: 'strlen', file: '/app/a.php', line: nr, level: 2,
  start: 0, incl: 0, self: 0, memory: 0, user: false, done: true,
})

const page = (nodes: XdebugTraceNode[], next: number | null = null): XdebugTraceTreePage =>
  ({ nodes, next, truncated: false })

describe('useTraceSearch', () => {
  it('searches the trimmed query and pages with next', async () => {
    const api = vi.fn(async (_q: string, from?: number) =>
      from === undefined ? page([hit(1), hit(2)], 250) : page([hit(3)]))
    const s = useTraceSearch(api)

    s.query.value = '  strlen '
    await s.run()
    expect(api).toHaveBeenLastCalledWith('strlen', undefined)
    expect(s.searched.value).toBe('strlen')
    expect(s.next.value).toBe(250)

    await s.more()
    expect(api).toHaveBeenLastCalledWith('strlen', 250)
    expect(s.hits.value.map((h) => h.nr)).toEqual([1, 2, 3])
    expect(s.next.value).toBeNull()
  })

  it('does not call the server for an empty query and clears old hits', async () => {
    const api = vi.fn(async () => page([hit(1)]))
    const s = useTraceSearch(api)
    s.query.value = 'strlen'
    await s.run()

    s.query.value = '   '
    await s.run()

    expect(api).toHaveBeenCalledTimes(1)
    expect(s.hits.value).toEqual([])
    expect(s.searched.value).toBe('')
  })

  it('shows the error and keeps working after it', async () => {
    const api = vi.fn()
      .mockRejectedValueOnce(new Error('Server error'))
      .mockResolvedValueOnce(page([hit(1)]))
    const s = useTraceSearch(api)
    s.query.value = 'strlen'

    await s.run()
    expect(s.error.value).toBe('Server error')
    expect(s.loading.value).toBe(false)

    await s.run()
    expect(s.error.value).toBe('')
    expect(s.hits.value).toHaveLength(1)
  })

  it('ignores an older answer that arrives after a newer search', async () => {
    let releaseFirst: (p: XdebugTraceTreePage) => void = () => {}
    const api = vi.fn()
      .mockImplementationOnce(() => new Promise<XdebugTraceTreePage>((r) => { releaseFirst = r }))
      .mockResolvedValueOnce(page([hit(7)]))
    const s = useTraceSearch(api)

    s.query.value = 'old'
    const first = s.run()
    s.query.value = 'new'
    await s.run()
    releaseFirst(page([hit(1)]))
    await first

    expect(s.searched.value).toBe('new')
    expect(s.hits.value.map((h) => h.nr)).toEqual([7])
  })

  it('does not name the old query after a new search fails', async () => {
    const api = vi.fn()
      .mockResolvedValueOnce(page([hit(1)]))
      .mockRejectedValueOnce(new Error('timeout'))
    const s = useTraceSearch(api)
    s.query.value = 'foo'
    await s.run()

    s.query.value = 'bar'
    await s.run()

    expect(s.error.value).toBe('timeout')
    expect(s.searched.value).toBe('')
    expect(s.hits.value).toEqual([])
  })
})
