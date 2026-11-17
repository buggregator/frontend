import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useServerUpdateStore } from '@/entities/server-update/lib'
import { availableStatus, downloadingStatus, installingStatus, restartingStatus } from '@/entities/server-update/mocks'
import { RouteName } from '@/shared/types'
import UpdatePill from './update-pill.vue'
import UpdateRestartStrip from './update-restart-strip.vue'
import UpdateTopline from './update-topline.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div/>' } },
    { path: '/settings', name: RouteName.Settings, component: { template: '<div/>' } },
  ],
})

const mountIt = (component: unknown) => mount(component as never, { global: { plugins: [router] } })

describe('update progress outside the Settings page', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    useServerUpdateStore().stop()
    vi.unstubAllGlobals()
  })

  describe('header pill', () => {
    it('shows «Updating 42%» and leads to the update block', () => {
      useServerUpdateStore().setStatus(downloadingStatus)
      const pill = mountIt(UpdatePill).get('a[data-test="update-pill"]')

      expect(pill.text()).toBe('Updating42%')
      expect(pill.attributes('href')).toBe('/settings#updates')
      expect(pill.attributes('aria-label')).toBe('Updating to 2.10.0, 42%. Show details')
    })

    it('says «Restarting…» while the server restarts', () => {
      useServerUpdateStore().setStatus(restartingStatus)

      expect(mountIt(UpdatePill).get('a').text()).toBe('Restarting…')
    })

    it('is not there when nothing runs', () => {
      useServerUpdateStore().setStatus(availableStatus)

      expect(mountIt(UpdatePill).find('a').exists()).toBe(false)
    })
  })

  describe('thin bar under the header', () => {
    it('fills to the download percent', () => {
      useServerUpdateStore().setStatus(downloadingStatus)
      const bar = mountIt(UpdateTopline).get('[data-test="update-topline"]')

      expect(bar.attributes('aria-hidden')).toBe('true')
      expect(bar.get('i').attributes('style')).toContain('width: 42%')
      expect(bar.classes()).not.toContain('update-topline--indeterminate')
    })

    it('runs without a value when the percent is unknown', () => {
      useServerUpdateStore().setStatus(installingStatus)

      expect(mountIt(UpdateTopline).get('[data-test="update-topline"]').classes()).toContain('update-topline--indeterminate')
    })

    it('is not there when nothing runs', () => {
      useServerUpdateStore().setStatus(availableStatus)

      expect(mountIt(UpdateTopline).find('[data-test="update-topline"]').exists()).toBe(false)
    })
  })

  describe('restarting strip', () => {
    it('says events are not received and the page reloads by itself', () => {
      useServerUpdateStore().setStatus(restartingStatus)
      const strip = mountIt(UpdateRestartStrip).get('[data-test="update-restart-strip"]')

      expect(strip.attributes('role')).toBe('status')
      expect(strip.text()).toContain('Restarting with 2.10.0.')
      expect(strip.text()).toContain('events sent now are not received')
      expect(strip.text()).toContain('The page reloads by itself.')
    })

    it('after 90 s without an answer it says so and offers a reload', async () => {
      const store = useServerUpdateStore()
      store.setStatus(restartingStatus)
      store.restartGaveUp = true
      const reload = vi.spyOn(store, 'reload').mockImplementation(() => {})
      const wrapper = mountIt(UpdateRestartStrip)

      expect(wrapper.get('[data-test="update-restart-strip"]').attributes('role')).toBe('alert')
      await wrapper.get('button').trigger('click')
      expect(reload).toHaveBeenCalled()
    })

    it('is not there otherwise', () => {
      useServerUpdateStore().setStatus(downloadingStatus)

      expect(mountIt(UpdateRestartStrip).find('[data-test="update-restart-strip"]').exists()).toBe(false)
    })
  })
})
