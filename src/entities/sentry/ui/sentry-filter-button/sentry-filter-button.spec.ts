import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { reloadSentryFilters, useSentryFilters } from '../../lib/use-sentry-filters'
import SentryFilterButton from './sentry-filter-button.vue'

const render = (tab: 'exceptions' | 'traces' | 'logs' | 'metrics' = 'exceptions') =>
  mount(SentryFilterButton, { props: { tab }, attachTo: document.body })

// The popover is loaded on first open.
const openPanel = async (wrapper: ReturnType<typeof render>) => {
  await wrapper.get('[data-test="sentry-filter-button"]').trigger('click')
  await vi.waitFor(() => wrapper.get('[data-test="sentry-filter-panel"]'))
  await flushPromises()
}

describe('SentryFilterButton', () => {
  beforeEach(() => {
    window.localStorage.clear()
    reloadSentryFilters()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('opens a dialog with the tab’s groups; focus lands on the checked option', async () => {
    const wrapper = render('exceptions')
    const btn = wrapper.get('[data-test="sentry-filter-button"]')
    expect(btn.attributes('aria-expanded')).toBe('false')
    expect(btn.attributes('aria-label')).toBe('Filters for Exceptions')

    await openPanel(wrapper)

    const panel = wrapper.get('[data-test="sentry-filter-panel"]')
    expect(panel.attributes('role')).toBe('dialog')
    expect(btn.attributes('aria-expanded')).toBe('true')
    // The view is a row of tabs under the header now (#6543): only filters here.
    expect(panel.findAll('[role="radiogroup"]')).toHaveLength(1)
    expect(panel.find('[data-value="grouped"]').exists()).toBe(false)
    expect(document.activeElement?.textContent).toContain('All levels')
  })

  it('a choice applies at once and shows in the badge; the view does not count', async () => {
    useSentryFilters().exceptionsView = 'grouped'
    const wrapper = render('exceptions')
    await openPanel(wrapper)
    expect(wrapper.find('[data-test="sentry-filter-badge"]').exists()).toBe(false)

    await wrapper.get('[data-value="error"]').trigger('click')
    expect(useSentryFilters().exceptionsLevel).toBe('error')
    expect(wrapper.get('[data-test="sentry-filter-badge"]').text()).toBe('1')
    expect(wrapper.get('[data-test="sentry-filter-button"]').attributes('aria-label')).toBe(
      'Filters for Exceptions, 1 on'
    )
  })

  it('arrow keys move and select inside a group', async () => {
    const wrapper = render('logs')
    await openPanel(wrapper)
    await wrapper.get('[aria-checked="true"]').trigger('keydown', { key: 'ArrowDown' })
    await nextTick()

    expect(useSentryFilters().logsLevel).toBe('fatal')
    expect(document.activeElement?.getAttribute('data-value')).toBe('fatal')

    await wrapper.get('[aria-checked="true"]').trigger('keydown', { key: 'ArrowUp' })
    await wrapper.get('[aria-checked="true"]').trigger('keydown', { key: 'ArrowUp' })
    expect(useSentryFilters().logsLevel).toBe('debug')
  })

  it('Reset is off on defaults; it clears the filters and keeps the view', async () => {
    const wrapper = render('exceptions')
    await openPanel(wrapper)
    const reset = () => wrapper.get('[data-test="sentry-filter-reset"]')
    expect(reset().attributes('disabled')).toBeDefined()

    useSentryFilters().exceptionsView = 'grouped'
    await wrapper.get('[data-value="fatal"]').trigger('click')
    expect(reset().attributes('disabled')).toBeUndefined()
    await reset().trigger('click')

    expect(useSentryFilters().exceptionsLevel).toBe('')
    expect(useSentryFilters().exceptionsView).toBe('grouped')
  })

  it('Metrics: the name box filters, counted in the badge', async () => {
    const wrapper = render('metrics')
    await openPanel(wrapper)
    await wrapper.get('input[type="search"]').setValue('order')

    expect(useSentryFilters().metricsName).toBe('order')
    expect(wrapper.get('[data-test="sentry-filter-badge"]').text()).toBe('1')
  })

  it('Esc closes and gives focus back to the button', async () => {
    const wrapper = render('traces')
    const btn = wrapper.get('[data-test="sentry-filter-button"]')
    await openPanel(wrapper)
    await wrapper.get('[aria-checked="true"]').trigger('keydown', { key: 'Escape' })

    expect(wrapper.find('[data-test="sentry-filter-panel"]').exists()).toBe(false)
    expect(document.activeElement).toBe(btn.element)
  })
})
