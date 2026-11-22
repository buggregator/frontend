import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import LogsLevelChips from './logs-level-chips.vue'

const counts = { debug: 412, info: 1208, notice: 3, warning: 37, error: 11, critical: 6 }
const render = (modelValue: string[] = [], c: Record<string, number> = counts) =>
  mount(LogsLevelChips, { props: { counts: c, modelValue, 'onUpdate:modelValue': () => {} } })

describe('LogsLevelChips', () => {
  it('shows the six common levels with counts, all on without a pick', () => {
    const chips = render().findAll('button')
    expect(chips.map((c) => c.attributes('data-level'))).toEqual([
      'debug',
      'info',
      'notice',
      'warning',
      'error',
      'critical'
    ])
    expect(chips[1].attributes('aria-label')).toBe('Info, 1,208 lines')
    expect(chips.every((c) => c.attributes('aria-pressed') === 'true')).toBe(true)
  })

  it('turning one off from all picks the rest', async () => {
    const wrapper = render()
    await wrapper.get('[data-level="debug"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([
      [['info', 'notice', 'warning', 'error', 'critical']]
    ])
  })

  it('turning the last one back on is all again', async () => {
    const wrapper = render(['info', 'notice', 'warning', 'error', 'critical'])
    expect(wrapper.get('[data-level="debug"]').attributes('aria-pressed')).toBe('false')
    await wrapper.get('[data-level="debug"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[[]]])
  })

  it('adds alert and emergency once there are some', () => {
    const levels = render([], { ...counts, emergency: 1 })
      .findAll('button')
      .map((c) => c.attributes('data-level'))
    expect(levels).toContain('emergency')
    expect(levels).not.toContain('alert')
  })
})
