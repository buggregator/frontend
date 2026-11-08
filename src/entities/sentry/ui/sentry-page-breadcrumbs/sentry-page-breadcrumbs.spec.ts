import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { shortcutsIn } from '@/shared/lib/shortcuts'
import type { SentryBreadcrumb } from '../../types'
import SentryPageBreadcrumbs from './sentry-page-breadcrumbs.vue'

const crumbs = [
  { type: 'default', category: 'a', message: 'one', timestamp: 1 },
  { type: 'default', category: 'b', message: 'two', timestamp: 2 },
  { type: 'default', category: 'c', message: 'three', timestamp: 3 },
] as unknown as SentryBreadcrumb[]

const position = (wrapper: ReturnType<typeof mount>) =>
  wrapper.find('.breadcrumbs__nav-position').exists()
    ? wrapper.find('.breadcrumbs__nav-position').text()
    : null

describe('SentryPageBreadcrumbs keys', () => {
  // Every key the registry lists for the breadcrumbs does its job here.
  it.each(shortcutsIn('sentry-breadcrumbs').flatMap((s) => s.keys.map((key) => [s.id, key])))(
    '%s reacts to %s',
    async (id, key) => {
      const wrapper = mount(SentryPageBreadcrumbs, { props: { breadcrumbs: crumbs } })
      await wrapper.findAll('.breadcrumbs__row')[1].trigger('click')
      expect(position(wrapper)).toBe('2 / 3')

      await wrapper.find('.breadcrumbs').trigger('keydown', { key })

      const expected = { 'crumbs-prev': '1 / 3', 'crumbs-next': '3 / 3', 'crumbs-close': null }[id]
      expect(position(wrapper)).toBe(expected)
    },
  )
})
