import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CodeGraphApiError } from './use-code-graph-requests'
import { crumbs, useFolderBrowser } from './use-folder-browser'

const api = { getFolders: vi.fn(), addRoot: vi.fn() }

vi.mock('./use-code-graph-requests', async (orig) => ({
  ...(await orig<typeof import('./use-code-graph-requests')>()),
  useCodeGraphRequests: () => api
}))

const listing = (path: string) => ({ base_dir: '/home/me', path, parent: path ? '' : null, folders: [] })

describe('crumbs', () => {
  it('walks from the base dir down', () => {
    expect(crumbs('', 'me')).toEqual([{ name: 'me', path: '' }])
    expect(crumbs('work/shop', 'me')).toEqual([
      { name: 'me', path: '' },
      { name: 'work', path: 'work' },
      { name: 'shop', path: 'work/shop' }
    ])
  })
})

describe('useFolderBrowser', () => {
  beforeEach(() => {
    api.getFolders.mockReset()
    api.addRoot.mockReset()
  })

  it('keeps the last folder opened when answers come out of order', async () => {
    let slow: (v: unknown) => void = () => {}
    api.getFolders.mockReturnValueOnce(new Promise((r) => (slow = r))).mockResolvedValueOnce(listing('b'))
    const b = useFolderBrowser()
    b.open('a')
    b.open('b')
    await flushPromises()
    slow(listing('a'))
    await flushPromises()
    expect(b.list.value?.path).toBe('b')
    expect(b.loading.value).toBe(false)
  })

  it('shows why a folder cannot be opened', async () => {
    api.getFolders.mockRejectedValueOnce(new CodeGraphApiError('outside the base folder', 400, 'outside_base'))
    const b = useFolderBrowser()
    await b.open('../etc')
    expect(b.error.value).toBe('outside the base folder')
  })

  it('adds a folder with a trimmed name, or without one', async () => {
    api.addRoot.mockResolvedValue({ name: 'shop', path: '/home/me/shop', state: 'indexing' })
    const b = useFolderBrowser()
    expect(await b.add('shop', '  ')).toMatchObject({ name: 'shop' })
    expect(api.addRoot).toHaveBeenLastCalledWith('shop', undefined)
    await b.add('shop', ' my shop ')
    expect(api.addRoot).toHaveBeenLastCalledWith('shop', 'my shop')
  })

  it('says why adding failed and returns nothing', async () => {
    api.addRoot.mockRejectedValueOnce(new CodeGraphApiError('a project named shop exists', 409, 'root_exists'))
    const b = useFolderBrowser()
    expect(await b.add('shop')).toBeNull()
    expect(b.addError.value).toBe('a project named shop exists')
    expect(b.adding.value).toBe(false)
  })
})
