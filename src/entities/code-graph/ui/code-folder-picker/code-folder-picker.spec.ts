import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CodeGraphApiError } from '../../lib/use-code-graph-requests'
import CodeFolderPicker from './code-folder-picker.vue'

const api = { getFolders: vi.fn(), addRoot: vi.fn() }
vi.mock('../../lib/use-code-graph-requests', async (orig) => ({
  ...(await orig<typeof import('../../lib/use-code-graph-requests')>()),
  useCodeGraphRequests: () => api
}))

const base = {
  base_dir: '/home/me/projects',
  path: '',
  parent: null,
  folders: [
    { name: 'shop', path: 'shop', hidden: false, excluded: false },
    { name: 'blog', path: 'blog', hidden: false, excluded: false, root: 'blog' },
    { name: '.cache', path: '.cache', hidden: true, excluded: false }
  ]
}
const shop = {
  base_dir: '/home/me/projects',
  path: 'shop',
  parent: '',
  folders: [{ name: 'vendor', path: 'shop/vendor', hidden: false, excluded: true }]
}

const mountPicker = async () => {
  // jsdom has no modal dialogs.
  HTMLDialogElement.prototype.showModal = vi.fn()
  HTMLDialogElement.prototype.close = vi.fn()
  const w = mount(CodeFolderPicker, { attachTo: document.body })
  await flushPromises()
  return w
}

const addButton = (w: Awaited<ReturnType<typeof mountPicker>>) => w.findAll('.cg-picker__btn--primary')[0]

describe('CodeFolderPicker', () => {
  beforeEach(() => {
    api.getFolders.mockReset()
    api.addRoot.mockReset()
  })

  it('starts at the base dir, where nothing can be added, hidden folders folded away', async () => {
    api.getFolders.mockResolvedValueOnce(base)
    const w = await mountPicker()
    expect(api.getFolders).toHaveBeenCalledWith('')
    expect(w.text()).toContain('/home/me/projects')
    expect(w.findAll('.cg-picker__row').map((r) => r.text())).toEqual(['▸shop', '▸blogindexed as blog'])
    expect(addButton(w).attributes('disabled')).toBeDefined()
    expect(w.text()).toContain('Open a folder inside the base folder')
    await w.find('.cg-picker__check input').setValue(true)
    expect(w.findAll('.cg-picker__row')).toHaveLength(3)
    w.unmount()
  })

  it('goes into a folder, marks vendor, and adds it under the typed name', async () => {
    api.getFolders.mockResolvedValueOnce(base).mockResolvedValueOnce(shop)
    api.addRoot.mockResolvedValueOnce({ name: 'my-shop', path: '/home/me/projects/shop', state: 'indexing' })
    const w = await mountPicker()
    await w.findAll('.cg-picker__row')[0].trigger('click')
    await flushPromises()
    expect(api.getFolders).toHaveBeenLastCalledWith('shop')
    expect(w.findAll('.cg-picker__crumb').map((c) => c.text())).toEqual(['projects', 'shop'])
    expect(w.text()).toContain('skipped by the index')
    await w.find('.cg-picker__input').setValue('my-shop')
    await addButton(w).trigger('click')
    await flushPromises()
    expect(api.addRoot).toHaveBeenCalledWith('shop', 'my-shop')
    expect(w.emitted('added')?.[0][0]).toMatchObject({ name: 'my-shop', state: 'indexing' })
    w.unmount()
  })

  it('shows why the server refused', async () => {
    api.getFolders.mockResolvedValueOnce(shop)
    api.addRoot.mockRejectedValueOnce(new CodeGraphApiError('a project named shop exists', 409, 'root_exists'))
    const w = await mountPicker()
    await addButton(w).trigger('click')
    await flushPromises()
    expect(w.find('[role=alert]').text()).toBe('a project named shop exists')
    expect(w.emitted('added')).toBeUndefined()
    w.unmount()
  })
})
