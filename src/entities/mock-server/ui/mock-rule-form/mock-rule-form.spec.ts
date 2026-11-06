import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { emptyDraft } from '../../lib/mock-rule'
import type { MockRuleInput } from '../../types'
import MockRuleForm from './mock-rule-form.vue'

const mountForm = (props: Partial<InstanceType<typeof MockRuleForm>['$props']> = {}) =>
  mount(MockRuleForm, {
    props: { modelValue: { ...emptyDraft(), path: '/users/{id}' }, baseUrl: 'http://h/mock/', ...props },
  })

const lastValue = (w: ReturnType<typeof mountForm>) =>
  (w.emitted('update:modelValue') as MockRuleInput[][]).at(-1)?.[0] as MockRuleInput

describe('MockRuleForm', () => {
  it('turns header rows into the rule headers', async () => {
    const w = mountForm()
    await w.find('button.mock-rule-form__link').trigger('click') // + Add header
    const inputs = w.findAll('.mock-rule-form__header-row input')
    await inputs[2].setValue('X-Shop')
    await inputs[3].setValue('1')

    expect(lastValue(w).headers).toEqual({ 'Content-Type': 'application/json', 'X-Shop': '1' })
  })

  it('marks an invalid field and links its message', () => {
    const w = mountForm({ errors: { path: 'Every “{” needs a closing “}”.' } })
    const path = w.find('#mock-f-path')

    expect(path.attributes('aria-invalid')).toBe('true')
    expect(path.attributes('aria-describedby')).toBe('mock-err-path')
    expect(w.find('#mock-err-path').text()).toContain('closing')
  })

  it('sets the status from a chip', async () => {
    const w = mountForm()
    await w.findAll('.mock-rule-form__chip').find((b) => b.text() === '404')!.trigger('click')
    expect(lastValue(w).status).toBe(404)
  })

  it('is read-only for a yaml rule', () => {
    const w = mountForm({ readOnly: true })
    expect(w.find('#mock-f-path').attributes('readonly')).toBeDefined()
    expect(w.find('.mock-rule-form__chips').exists()).toBe(false)
    expect(w.find('[role="switch"]').attributes('disabled')).toBeDefined()
  })
})
