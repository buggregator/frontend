import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useProfileStore, useSettingsStore } from '@/shared/stores'
import { RouteName } from '@/shared/types'
import { LoginPage } from '.'

const page = { template: '<div/>' }
const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: RouteName.Home, component: page },
      { path: '/login', name: RouteName.Login, component: LoginPage },
      { path: '/:rest(.*)', component: page },
    ],
  })

const open = async (path: string) => {
  const router = makeRouter()
  await router.push(path)
  const wrapper = mount(LoginPage, { global: { plugins: [router] } })
  await flushPromises()
  return { router, wrapper }
}

// #6772: after sign-in the person lands on the page they opened (return_to).
describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.stubGlobal('requestAnimationFrame', (cb: () => void) => cb())
  })

  afterEach(() => vi.unstubAllGlobals())

  it('signed in: opens return_to', async () => {
    useProfileStore().setToken('tok')
    const { router } = await open('/login?token=tok&return_to=%2Fsentry%2Fabc')

    expect(router.currentRoute.value.fullPath).toBe('/sentry/abc')
  })

  it('signed in: goes home when return_to is not a page of this site', async () => {
    useProfileStore().setToken('tok')
    const { router } = await open('/login?return_to=%2F%2Fevil.test')

    expect(router.currentRoute.value.name).toBe(RouteName.Home)
  })

  it('signed out: the sign-in button carries return_to to the server', async () => {
    useSettingsStore().authLogicUrl = 'auth/sso/login'
    const assign = vi.fn()
    vi.stubGlobal('location', { set href(v: string) { assign(v) } })
    const { wrapper } = await open('/login?return_to=%2Fsentry%2Fabc')

    await wrapper.get('button').trigger('click')

    expect(assign).toHaveBeenCalledWith(expect.stringMatching(/\/auth\/sso\/login\?return_to=%2Fsentry%2Fabc$/))
  })
})
