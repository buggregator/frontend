import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useCodeTree } from './use-code-tree'

const api = { getFiles: vi.fn(), getOutline: vi.fn() }
vi.mock('./use-code-graph-requests', () => ({ useCodeGraphRequests: () => api }))

const sym = (id: number, kind: string, fqn: string, members: unknown[] = []) => ({
  id, kind, fqn, name: fqn, root: 'shop', file: 'src/A.php', line_start: 1, line_end: 2, members
})

describe('useCodeTree', () => {
  beforeEach(() => {
    api.getFiles.mockReset().mockImplementation((_r: string, path: string) =>
      Promise.resolve(
        path === ''
          ? [
              { name: 'src', path: 'src', dir: true, symbols: 3 },
              { name: 'index.php', path: 'index.php', dir: false, symbols: 0 }
            ]
          : [{ name: 'A.php', path: 'src/A.php', dir: false, symbols: 3 }]
      )
    )
    api.getOutline.mockReset().mockResolvedValue([
      sym(1, 'namespace', 'App', [sym(2, 'class', 'App\\A', [sym(3, 'method', 'App\\A::run')])])
    ])
  })

  it('opens folder, file and class down to a method; files without symbols are hidden', async () => {
    const t = useCodeTree(ref('shop'))
    await flushPromises()
    expect(t.rows().map((r) => r.key)).toEqual(['d:src'])
    t.toggle('d:src')
    await flushPromises()
    t.toggle('f:src/A.php')
    await flushPromises()
    const cls = t.rows().find((r) => r.type === 'symbol')!
    expect(cls.type === 'symbol' && cls.symbol.fqn).toBe('App\\A')
    t.toggle(cls.key)
    expect(t.rows().map((r) => (r.type === 'symbol' ? r.symbol.fqn : r.key))).toEqual(['d:src', 'f:src/A.php', 'App\\A', 'App\\A::run'])
  })

  it('starts again when the root changes', async () => {
    const root = ref('shop')
    const t = useCodeTree(root)
    await flushPromises()
    t.toggle('d:src')
    await flushPromises()
    root.value = 'api'
    await flushPromises()
    expect(t.open.value.size).toBe(0)
    expect(api.getFiles).toHaveBeenLastCalledWith('api', '')
  })
})
