import { describe, expect, it, vi } from 'vitest'
import type { XdebugTraceNode, XdebugTraceTreePage } from '../types'
import { ROOT, useTraceTree, type TreeQuery } from './use-trace-tree'

const node = (nr: number, offset: number, children = 0): XdebugTraceNode => ({
  nr, offset, children, func: `f${nr}`, file: '/app/a.php', line: nr, level: 1,
  start: 0, incl: 0, self: 0, memory: 0, user: true, done: true,
})

const page = (nodes: XdebugTraceNode[], next: number | null = null): XdebugTraceTreePage =>
  ({ nodes, next, truncated: false })

// A fake API: top level has two calls (the first with callees), callees come in two pages.
const fakeApi = () => vi.fn(async (q: TreeQuery): Promise<XdebugTraceTreePage> => {
  if (q.parent === undefined && q.from === undefined) return page([node(1, 100, 3), node(5, 500)])
  if (q.parent === 100 && q.from === 350) return page([node(4, 400)])
  if (q.parent === 100 && q.from === undefined) return page([node(2, 200, 1), node(3, 300)], 350)
  if (q.parent === 200) return page([node(9, 900)])
  throw new Error(`unexpected ${JSON.stringify(q)}`)
})

describe('useTraceTree', () => {
  it('loads the top level once', async () => {
    const api = fakeApi()
    const tree = useTraceTree(api)

    await tree.loadRoot()
    await tree.loadRoot()

    expect(tree.childrenOf(ROOT).map((n) => n.nr)).toEqual([1, 5])
    expect(api).toHaveBeenCalledTimes(1)
  })

  it('expands a call by loading its callees, collapses without reloading', async () => {
    const api = fakeApi()
    const tree = useTraceTree(api)
    await tree.loadRoot()
    const first = tree.childrenOf(ROOT)[0]

    await tree.toggle(first)
    expect(tree.isExpanded(100)).toBe(true)
    expect(tree.childrenOf(100).map((n) => n.nr)).toEqual([2, 3])
    expect(tree.hasMore(100)).toBe(true)

    await tree.toggle(first)
    await tree.toggle(first)
    expect(api).toHaveBeenCalledTimes(2)
  })

  it('does not expand a call without callees', async () => {
    const tree = useTraceTree(fakeApi())
    await tree.loadRoot()

    await tree.toggle(tree.childrenOf(ROOT)[1])

    expect(tree.isExpanded(500)).toBe(false)
  })

  it('appends the next page with «more»', async () => {
    const tree = useTraceTree(fakeApi())
    await tree.loadRoot()
    await tree.toggle(tree.childrenOf(ROOT)[0])

    await tree.loadMore(100)

    expect(tree.childrenOf(100).map((n) => n.nr)).toEqual([2, 3, 4])
    expect(tree.hasMore(100)).toBe(false)
  })

  it('opens the path down to a search hit and marks it', async () => {
    const tree = useTraceTree(fakeApi())

    await tree.reveal({ ...node(9, 900), path: [{ nr: 1, func: 'f1', offset: 100 }, { nr: 2, func: 'f2', offset: 200 }] })

    expect(tree.isExpanded(100)).toBe(true)
    expect(tree.isExpanded(200)).toBe(true)
    expect(tree.childrenOf(200).map((n) => n.nr)).toEqual([9])
    expect(tree.highlighted.value).toBe(900)
  })

  it('keeps the error of a failed load and tries again', async () => {
    const api = vi.fn()
      .mockRejectedValueOnce(new Error('The server answered 500.'))
      .mockResolvedValueOnce(page([node(1, 100)]))
    const tree = useTraceTree(api)

    await tree.loadRoot()
    expect(tree.errorOf(ROOT)).toBe('The server answered 500.')

    await tree.loadRoot()
    expect(tree.errorOf(ROOT)).toBe('')
    expect(tree.childrenOf(ROOT)).toHaveLength(1)
  })

  it('loads further pages of the caller until the hit is there', async () => {
    const tree = useTraceTree(fakeApi())

    await tree.reveal({ ...node(4, 400), path: [{ nr: 1, func: 'f1', offset: 100 }] })

    expect(tree.childrenOf(100).map((n) => n.nr)).toEqual([2, 3, 4])
    expect(tree.highlighted.value).toBe(400)
  })

  it('retries a failed «more» page without losing the loaded calls', async () => {
    const api = vi.fn()
      .mockResolvedValueOnce(page([node(1, 100)], 150))
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce(page([node(2, 200)]))
    const tree = useTraceTree(api)
    await tree.loadRoot()
    await tree.loadMore(ROOT)
    expect(tree.errorOf(ROOT)).toBe('timeout')

    await tree.retry(ROOT)

    expect(api).toHaveBeenLastCalledWith({ from: 150 })
    expect(tree.childrenOf(ROOT).map((n) => n.nr)).toEqual([1, 2])
  })
})
