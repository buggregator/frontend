import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { emptyDraft } from '../../lib/mock-rule'
import type { MockRuleInput } from '../../types'
import MockRuleForm from './mock-rule-form.vue'

// Stand-ins: the real panels call the server.
/* eslint-disable vue/one-component-per-file */
const HelpersStub = defineComponent({
  name: 'MockTemplateHelpers',
  emits: ['insert'],
  setup: (_, { emit }) => () => h('button', { class: 'helpers-stub', onClick: () => emit('insert', '{{ path "id" }}') }),
})
const PreviewStub = defineComponent({ name: 'MockTemplatePreview', props: { rule: { type: Object, required: true } }, setup: () => () => h('div', { class: 'preview-stub' }) })

const mountForm = (props: Partial<InstanceType<typeof MockRuleForm>['$props']> = {}) =>
  mount(MockRuleForm, {
    props: { modelValue: { ...emptyDraft(), path: '/users/{id}' }, baseUrl: 'http://h/mock/', ...props },
    global: { stubs: { MockTemplateHelpers: HelpersStub, MockTemplatePreview: PreviewStub } },
    attachTo: document.body,
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

  it('has the template switch off for a new rule and no template tools', () => {
    const w = mountForm()
    const sw = w.find('[aria-labelledby="mock-f-template-label"]')

    expect(sw.attributes('aria-checked')).toBe('false')
    expect(w.find('#mock-f-seed').exists()).toBe(false)
    expect(w.find('.helpers-stub').exists()).toBe(false)
    expect(w.find('.preview-stub').exists()).toBe(false)
  })

  it('turns the template on', async () => {
    const w = mountForm()
    await w.find('[aria-labelledby="mock-f-template-label"]').trigger('click')
    expect(lastValue(w).template).toBe(true)
  })

  it('shows the seed, helpers and preview for a template and edits the seed', async () => {
    const w = mountForm({ modelValue: { ...emptyDraft(), path: '/a', template: true } })
    await w.find('#mock-f-seed').setValue('42')

    expect(lastValue(w).seed).toBe(42)
    expect(w.find('.helpers-stub').exists()).toBe(true)
    expect(w.find('.preview-stub').exists()).toBe(true)
    expect(w.text()).toContain('Template')
  })

  it('inserts a helper at the cursor of the body', async () => {
    const w = mountForm({ modelValue: { ...emptyDraft(), path: '/a', template: true, body: '{"id": }' } })
    const body = w.find('#mock-f-body').element as HTMLTextAreaElement
    body.setSelectionRange(7, 7)
    await w.find('.helpers-stub').trigger('click')

    expect(lastValue(w).body).toBe('{"id": {{ path "id" }}}')
    w.unmount()
  })

  it('marks a template error from the server on the body', () => {
    const w = mountForm({
      modelValue: { ...emptyDraft(), path: '/a', template: true },
      errors: { body: 'template: body:1: unexpected "}" in operand' },
    })
    expect(w.find('#mock-f-body').attributes('aria-invalid')).toBe('true')
    expect(w.find('#mock-err-body').text()).toContain('unexpected')
  })

  it('a yaml template rule shows the preview but no helpers', () => {
    const w = mountForm({ readOnly: true, modelValue: { ...emptyDraft(), path: '/a', template: true } })
    expect(w.find('.helpers-stub').exists()).toBe(false)
    expect(w.find('.preview-stub').exists()).toBe(true)
    expect(w.find('[aria-labelledby="mock-f-template-label"]').attributes('disabled')).toBeDefined()
  })
})
