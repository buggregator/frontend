import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSettingsStore } from '@/shared/stores'
import { normalizeMonolog } from '../../lib/use-monolog/normalize-monolog'
import { monologWithExtraMock } from '../../mocks'
import type { Monolog } from '../../types'
import PreviewCard from './preview-card.vue'

const getItem = vi.fn()
vi.mock('@/shared/lib/use-events', () => ({ useEvents: () => ({ events: { getItem } }) }))

const render = (payload: Partial<Monolog> & Record<string, unknown>) =>
  mount(PreviewCard, {
    props: { event: normalizeMonolog({ ...monologWithExtraMock, payload } as never) },
    global: {
      stubs: {
        RouterLink: RouterLinkStub,
        // The shared frame (header, pin, delete) has tests of its own.
        PreviewCard: { template: '<article><slot /></article>' },
      },
    },
  })

const headers = (wrapper: ReturnType<typeof render>) =>
  wrapper.findAll('.monolog-details__label').map((h) => h.text())

describe('monolog PreviewCard: context in the list (frontend#283)', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setActivePinia(createPinia())
    getItem.mockReset()
  })

  it('shows the message only while the setting is off (the default)', async () => {
    const wrapper = render(monologWithExtraMock.payload as never)
    await flushPromises()

    expect(headers(wrapper)).toEqual([])
    expect(wrapper.text()).toContain('Invalid timezone header')
    expect(getItem).not.toHaveBeenCalled()
  })

  it('shows context and extra as JSON trees when the setting is on', async () => {
    useSettingsStore().changeMonologInlineContext()
    const wrapper = render(monologWithExtraMock.payload as never)
    await flushPromises()

    expect(headers(wrapper)).toEqual(['context', 'extra'])
    expect(wrapper.findAllComponents({ name: 'JsonTreeView' })).toHaveLength(2)
    expect(wrapper.text()).toContain('timezone_header')
    expect(getItem).not.toHaveBeenCalled()
  })

  it('fetches the full event when the preview has no context', async () => {
    getItem.mockResolvedValue({ uuid: monologWithExtraMock.uuid, payload: monologWithExtraMock.payload })
    useSettingsStore().changeMonologInlineContext()
    const { context: _c, extra: _e, ...slim } = monologWithExtraMock.payload as Record<string, unknown>
    const wrapper = render(slim as never)
    await flushPromises()

    expect(getItem).toHaveBeenCalledWith(monologWithExtraMock.uuid)
    expect(headers(wrapper)).toEqual(['context', 'extra'])
  })
})
