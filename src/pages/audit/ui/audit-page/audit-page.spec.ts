import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { RouteName } from '@/shared/types'
import { AuditPage } from '.'

vi.mock('@/widgets/ui', () => ({
  LayoutBase: { template: '<div><slot name="header" /><slot /></div>' },
  LayoutSidebar: { template: '<nav />' },
}))

const json = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }))

const render = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: RouteName.Home, component: { template: '<div/>' } },
      { path: '/audit', name: RouteName.Audit, component: AuditPage },
    ],
  })
  await router.push('/audit')
  const wrapper = mount(AuditPage, { global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

describe('AuditPage', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.unstubAllGlobals())

  it('lists who did what: plain words for known actions, the route for others', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        json({
          data: [
            { id: 2, at: '2026-11-22T10:00:00Z', user_id: 'u', user: 'ann@example.test', action: 'DELETE /api/mocks/{id}', target: '/api/mocks/7', status: 403, ip: '10.0.0.1' },
            { id: 1, at: '2026-11-22T09:00:00Z', user_id: 'u', user: 'ann@example.test', action: 'login', target: '', status: 200, ip: '10.0.0.1' },
          ],
          next_before: 1,
        })
      )
    )
    const rows = (await render()).findAll('[data-test="audit-row"]')

    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('DELETE /api/mocks/{id}')
    expect(rows[0].text()).toContain('/api/mocks/7')
    expect(rows[0].find('.audit-page__status--failed').exists()).toBe(true)
    expect(rows[1].text()).toContain('Signed in')
  })

  it('tells a person who is not an admin why there is nothing', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json({ message: 'only admins' }, 403)))

    expect((await render()).find('[data-test="audit-forbidden"]').exists()).toBe(true)
  })

  it('says so when nothing was recorded', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json({ data: [] })))

    expect((await render()).find('[data-test="audit-empty"]').exists()).toBe(true)
  })
})
