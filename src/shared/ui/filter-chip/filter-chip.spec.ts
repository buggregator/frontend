import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FilterChip from './filter-chip.vue'

describe('FilterChip', () => {
  it('«key = value», ✕ named after the filter', async () => {
    const w = mount(FilterChip, { props: { name: 'host', value: 'anna-mbp' } })
    expect(w.get('.filter-chip__op').text()).toBe('=')
    expect(w.get('.filter-chip__op').attributes('aria-hidden')).toBe('true')
    expect(w.get('.sr-only').text()).toBe('is')
    const remove = w.get('button')
    expect(remove.attributes('aria-label')).toBe('Remove filter host = anna-mbp')
    await remove.trigger('click')
    expect(w.emitted('remove')).toHaveLength(1)
  })

  it('an exclude: «≠», read as «is not»', () => {
    const w = mount(FilterChip, { props: { name: 'channel', value: 'doctrine', not: true } })
    expect(w.classes()).toContain('filter-chip--not')
    expect(w.get('.filter-chip__op').text()).toBe('≠')
    expect(w.get('.sr-only').text()).toBe('is not')
    expect(w.get('button').attributes('aria-label')).toBe('Remove filter channel is not doctrine')
  })

  it('takes its own name for ✕', () => {
    const w = mount(FilterChip, { props: { name: 'Service', value: 'api', removeLabel: 'Show all services' } })
    expect(w.get('button').attributes('aria-label')).toBe('Show all services')
  })
})
