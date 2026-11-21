import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { FrameSymbolState } from '../../lib'
import CodeGraphFrameLink from './code-graph-frame-link.vue'

const state = ref<FrameSymbolState>({ state: 'off' })
vi.mock('../../lib', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib')>()),
  useFrameSymbol: () => state
}))

const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/code', name: 'code', component: { render: () => null } },
      { path: '/:p(.*)*', component: { render: () => null } }
    ]
  })

const mountLink = async (props: Record<string, unknown> = {}) => {
  const router = makeRouter()
  await router.push('/sentry/event/abc')
  await router.isReady()
  const wrapper = mount(CodeGraphFrameLink, {
    props: { file: '/var/www/html/app/Services/CheckoutService.php', line: 88, origin: 'OrderFailedException', ...props },
    global: { plugins: [router] }
  })
  return { wrapper, router }
}

const symbol = {
  id: 42,
  root: 'shop-web',
  kind: 'method' as const,
  name: 'placeOrder',
  fqn: 'App\\Services\\CheckoutService::placeOrder',
  file: 'app/Services/CheckoutService.php',
  line_start: 61,
  line_end: 104
}

describe('CodeGraphFrameLink (#6573 A)', () => {
  beforeEach(() => {
    state.value = { state: 'off' }
  })

  it('links a resolved frame to the Code page with where it came from', async () => {
    state.value = { state: 'found', symbol }
    const { wrapper, router } = await mountLink()
    const link = wrapper.get('[data-test="code-graph-link"]')
    expect(link.attributes('aria-label')).toBe('Open placeOrder() in the code graph')
    expect(link.text()).toBe('Graph')
    const query = router.resolve(link.attributes('href')!).query
    expect(query).toEqual({
      symbol: '42',
      fqn: symbol.fqn,
      root: 'shop-web',
      file: '/var/www/html/app/Services/CheckoutService.php',
      line: '88',
      from: 'OrderFailedException, frame CheckoutService.php:88',
      back: '/sentry/event/abc'
    })
  })

  it('says «Code» on a span, without «frame»', async () => {
    state.value = { state: 'found', symbol }
    const { wrapper, router } = await mountLink({ label: 'Code', origin: 'POST /cart/checkout' })
    const link = wrapper.get('[data-test="code-graph-link"]')
    expect(link.text()).toBe('Code')
    expect(router.resolve(link.attributes('href')!).query.from).toBe('POST /cart/checkout, CheckoutService.php:88')
  })

  it('says why a vendor frame has no link', async () => {
    state.value = { state: 'vendor' }
    const { wrapper } = await mountLink()
    expect(wrapper.find('[data-test="code-graph-link"]').exists()).toBe(false)
    expect(wrapper.get('[data-test="code-graph-reason"]').text()).toBe('vendor · not in the code graph')
  })

  it('says why a line outside any function has no link', async () => {
    state.value = { state: 'no-symbol', line: 18 }
    const { wrapper } = await mountLink()
    expect(wrapper.get('[data-test="code-graph-reason"]').text()).toBe('no symbol on line 18')
  })

  it.each(['off', 'loading', 'unknown'] as const)('shows nothing while %s', async (s) => {
    state.value = { state: s } as FrameSymbolState
    const { wrapper } = await mountLink()
    expect(wrapper.text()).toBe('')
  })
})
