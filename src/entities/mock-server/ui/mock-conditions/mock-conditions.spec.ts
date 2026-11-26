import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import type { MockCondition } from '../../types'
import MockConditions from './mock-conditions.vue'

const auth: MockCondition = { in: 'header', name: 'Authorization', op: 'equals', value: 'Bearer good' }
const token: MockCondition = { in: 'body', name: 'card.token', op: 'exists' }

// A parent that keeps v-model, so the list re-renders as it would in the form.
const mountList = (modelValue: MockCondition[], props: Record<string, unknown> = {}) => {
  const w = mount(MockConditions, {
    props: {
      modelValue,
      ...props,
      'onUpdate:modelValue': (v: MockCondition[]) => w.setProps({ modelValue: v }),
    },
    attachTo: document.body,
  })
  return w
}

const last = (w: ReturnType<typeof mountList>) =>
  (w.emitted('update:modelValue') as MockCondition[][][]).at(-1)?.[0] as MockCondition[]

describe('MockConditions', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('adds a header condition and focuses its name', async () => {
    const w = mountList([])
    await w.find('.mock-conditions__add').trigger('click')
    await w.vm.$nextTick()

    expect(last(w)).toEqual([{ in: 'header', name: '', op: 'equals', value: '' }])
    expect(document.activeElement).toBe(w.find('.mock-conditions__name').element)
  })

  it('edits where, name, comparison and value', async () => {
    const w = mountList([auth])
    await w.find('.mock-conditions__in').setValue('body')
    await w.find('.mock-conditions__name').setValue('card.token')
    await w.find('.mock-conditions__op').setValue('not_equals')
    await w.find('input.mock-conditions__value').setValue('tok_ok')

    expect(last(w)).toEqual([{ in: 'body', name: 'card.token', op: 'not_equals', value: 'tok_ok' }])
  })

  it('hides the value for presence checks', () => {
    const w = mountList([token])
    expect(w.find('input.mock-conditions__value').exists()).toBe(false)
    expect(w.text()).toContain('no value needed')
  })

  it('removes a row and keeps focus in the list', async () => {
    const w = mountList([auth, token])
    await w.findAll('.mock-conditions__icon')[0].trigger('click')
    await w.vm.$nextTick()

    expect(last(w)).toEqual([token])
    expect(document.activeElement).toBe(w.find('.mock-conditions__name').element)

    await w.find('.mock-conditions__icon').trigger('click')
    await w.vm.$nextTick()
    expect(document.activeElement).toBe(w.find('.mock-conditions__add').element)
  })

  it('stops at 20 conditions', () => {
    const w = mountList(Array.from({ length: 20 }, () => auth))
    expect(w.find('.mock-conditions__add').attributes('disabled')).toBeDefined()
  })

  it('marks the field a server error is about', () => {
    const w = mountList([auth, auth], {
      errors: { 'conditions.0': 'invalid header name "X Y"', 'conditions.1': 'value must be at most 4096 bytes' },
    })
    const names = w.findAll('.mock-conditions__name')
    const values = w.findAll('input.mock-conditions__value')

    expect(names[0].attributes('aria-invalid')).toBe('true')
    expect(names[0].attributes('aria-describedby')).toBe('mock-err-conditions-0')
    expect(values[0].attributes('aria-invalid')).toBeUndefined()
    expect(names[1].attributes('aria-invalid')).toBeUndefined()
    expect(values[1].attributes('aria-invalid')).toBe('true')
    expect(w.find('#mock-err-conditions-1').text()).toContain('4096')
  })

  it('shows the rule-order hint once a condition exists', () => {
    expect(mountList([]).text()).not.toContain('top to bottom')
    expect(mountList([auth]).text()).toContain('top to bottom')
  })

  it('is read-only for a yaml rule and hidden when it has none', () => {
    expect(mountList([], { readOnly: true }).find('.mock-conditions').exists()).toBe(false)

    const w = mountList([auth], { readOnly: true })
    expect(w.find('.mock-conditions__name').attributes('readonly')).toBeDefined()
    expect(w.find('.mock-conditions__in').attributes('disabled')).toBeDefined()
    expect(w.find('.mock-conditions__add').exists()).toBe(false)
    expect(w.find('.mock-conditions__icon').exists()).toBe(false)
  })
})
