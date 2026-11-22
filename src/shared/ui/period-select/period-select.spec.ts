import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useEventsStore } from '../../stores'
import PeriodSelect from './period-select.vue'

describe('PeriodSelect', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('sets the feed period without a model', async () => {
    const wrapper = mount(PeriodSelect)
    await wrapper.get('select').setValue('3h')
    expect(useEventsStore().period).toBe('3h')
  })

  it('with a model shows it and emits the pick, the feed period stays', async () => {
    const store = useEventsStore()
    const before = store.period
    const wrapper = mount(PeriodSelect, { props: { modelValue: '1h' } })
    expect((wrapper.get('select').element as HTMLSelectElement).value).toBe('1h')

    await wrapper.get('select').setValue('24h')
    expect(wrapper.emitted('update:modelValue')).toEqual([['24h']])
    expect(store.period).toBe(before)
  })
})
