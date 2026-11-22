import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import PageEventHeader from './page-event-header.vue'

const removeById = vi.fn((_id: string) => Promise.resolve(true))

vi.mock('@/shared/lib/use-events', () => ({
  useEvents: () => ({ events: { removeById } }),
}))

const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div/>' } },
      { path: '/:type', name: 'events', component: { template: '<div/>' } },
      { path: '/:type/:id', name: 'event', component: { template: '<div/>' } },
    ],
  })

const clickDelete = async () => {
  const router = makeRouter()
  await router.push('/smtp/abc-123')
  await mount(PageEventHeader, {
    props: { title: 'SMTP', eventId: 'abc-123' },
    global: { plugins: [router] },
  })
    .get('button[aria-label="Delete event"]')
    .trigger('click')
  await flushPromises()
  return router
}

describe('PageEventHeader: Delete', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    removeById.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps the event when the person cancels', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false))

    const router = await clickDelete()

    expect(removeById).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/smtp/abc-123')
  })

  it('deletes after confirmation and goes back to the list it came from', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))

    const router = await clickDelete()

    expect(removeById).toHaveBeenCalledWith('abc-123')
    expect(router.currentRoute.value.path).toBe('/smtp')
  })

  it('stays on the event when the server refuses the delete', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    removeById.mockResolvedValueOnce(false)

    const router = await clickDelete()

    expect(removeById).toHaveBeenCalledWith('abc-123')
    expect(router.currentRoute.value.path).toBe('/smtp/abc-123')
  })
})

describe('PageEventHeader: rows (#6737 A)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('row 1 only: crumbs and actions; with tabs a row 2 for the event page to fill', async () => {
    const router = makeRouter()
    await router.push('/smtp/abc-123')
    const one = mount(PageEventHeader, { props: { title: 'SMTP', eventId: 'abc-123' }, global: { plugins: [router] } })
    expect(one.find('[data-test="app-header-toolbar"]').exists()).toBe(false)
    expect(one.get('.app-header__row').find('button[aria-label="Delete event"]').exists()).toBe(true)

    const two = mount(PageEventHeader, {
      props: { title: 'SMTP', eventId: 'abc-123', tabs: true },
      global: { plugins: [router] },
    })
    expect(two.get('[data-test="app-header-toolbar"]').attributes('id')).toBe('app-header-toolbar')
  })
})
