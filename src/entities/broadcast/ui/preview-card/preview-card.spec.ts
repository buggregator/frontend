import { mount, RouterLinkStub } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { normalizeBroadcastEvent } from '../../lib'
import { broadcastInvalidJsonMock, broadcastMultiChannelMock, broadcastProductsMocks } from '../../mocks'
import type { BroadcastEvent } from '../../types'
import PreviewCard from './preview-card.vue'

const render = (event: BroadcastEvent) =>
  mount(PreviewCard, {
    props: { event: normalizeBroadcastEvent(event) },
    global: {
      stubs: {
        RouterLink: RouterLinkStub,
        // The shared frame (header, pin, delete) has tests of its own.
        PreviewCard: { template: '<article><slot /></article>' }
      }
    }
  })

describe('broadcast PreviewCard', () => {
  let warn: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    warn = vi.spyOn(console, 'warn')
  })
  afterEach(() => {
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('shows the event, its first three channels and how many more', () => {
    const wrapper = render(broadcastMultiChannelMock)
    expect(wrapper.find('.bc-card__name').text()).toBe('OrderShipped')
    const tags = wrapper.findAll('.bc-tag').map((t) => `${t.find('.bc-tag__kind').text()} ${t.find('.bc-tag__name').text()}`)
    expect(tags).toEqual(['private orders.42', 'private App.Models.User.7', 'presence support.3'])
    expect(wrapper.find('.bc-card__more').text()).toBe('+1 more')
    expect(wrapper.find('.bc-card__data').text()).toContain('"carrier":"UPS"')
    const foot = wrapper.find('.bc-card__foot').text()
    expect(foot).toContain('batch of 2')
    expect(foot).toContain('forwarded: 200, 12 ms')
  })

  it('opens the channel console on this event', () => {
    const link = render(broadcastProductsMocks[0]).findComponent(RouterLinkStub)
    expect(link.props('to')).toEqual({ path: '/broadcast', query: { event: broadcastProductsMocks[0].uuid } })
  })

  it('says what a real server would refuse, with an icon and words', () => {
    const problems = render(broadcastInvalidJsonMock).findAll('.bc-card__problem')
    expect(problems.map((p) => p.classes())).toEqual([
      expect.arrayContaining(['bc-card__problem--error']),
      expect.arrayContaining(['bc-card__problem--warning'])
    ])
    expect(problems[0].text()).toBe('✕ data is not JSON: Laravel Echo cannot parse it')
  })
})
