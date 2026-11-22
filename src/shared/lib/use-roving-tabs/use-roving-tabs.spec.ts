import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, ref, type PropType } from 'vue'
import { useRovingTabs, type RovingActivation, type RovingItem } from './use-roving-tabs'

const ITEMS: RovingItem[] = [{ id: 'a' }, { id: 'b' }, { id: 'c', disabled: true }, { id: 'd' }]

const List = defineComponent({
  props: {
    activation: { type: String as PropType<RovingActivation>, default: 'automatic' },
    items: { type: Array as PropType<RovingItem[]>, default: () => ITEMS },
    initial: { type: String, default: 'a' }
  },
  emits: ['select'],
  setup(props, { emit, expose }) {
    const root = ref<HTMLElement | null>(null)
    const current = ref(props.initial)
    const { tabindexOf, onKeydown, focusCurrent } = useRovingTabs(root, {
      items: () => props.items,
      current,
      activation: () => props.activation,
      onSelect: (id) => {
        current.value = id
        emit('select', id)
      }
    })
    expose({ focusCurrent })
    return () =>
      h(
        'div',
        { ref: root, role: 'tablist', onKeydown },
        props.items.map((item) =>
          h('button', { role: 'tab', class: item.id, tabindex: tabindexOf(item.id) }, item.id)
        )
      )
  }
})

const press = async (key: string) => {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  document.activeElement?.dispatchEvent(e)
  await new Promise((r) => setTimeout(r))
  return e
}

const focused = () => document.activeElement?.className

describe('useRovingTabs', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('one tab stop: the current item; the first enabled one when the current is missing', () => {
    const w = mount(List, { attachTo: document.body })
    expect(w.findAll('button').map((b) => b.attributes('tabindex'))).toEqual(['0', '-1', '-1', '-1'])
    const missing = mount(List, { props: { initial: 'zzz' }, attachTo: document.body })
    expect(missing.findAll('button').map((b) => b.attributes('tabindex'))).toEqual(['0', '-1', '-1', '-1'])
  })

  it('automatic: arrows select and move focus, wrap around and skip disabled items', async () => {
    const w = mount(List, { attachTo: document.body })
    ;(w.get('.a').element as HTMLElement).focus()

    expect((await press('ArrowRight')).defaultPrevented).toBe(true)
    expect(focused()).toBe('b')
    await press('ArrowRight')
    expect(focused()).toBe('d')
    await press('ArrowRight')
    expect(focused()).toBe('a')
    await press('ArrowLeft')
    expect(focused()).toBe('d')
    expect(w.emitted('select')).toEqual([['b'], ['d'], ['a'], ['d']])
    expect(w.get('.d').attributes('tabindex')).toBe('0')
  })

  it('Home and End jump to the first and last enabled items', async () => {
    const items = [{ id: 'a', disabled: true }, { id: 'b' }, { id: 'c' }, { id: 'd', disabled: true }]
    const w = mount(List, { props: { items, initial: 'c' }, attachTo: document.body })
    ;(w.get('.c').element as HTMLElement).focus()
    await press('Home')
    expect(focused()).toBe('b')
    await press('End')
    expect(focused()).toBe('c')
  })

  it('focusCurrent() focuses the tab stop', async () => {
    const w = mount(List, { props: { initial: 'd' }, attachTo: document.body })
    ;(w.vm as unknown as { focusCurrent: () => Promise<void> }).focusCurrent()
    await new Promise((r) => setTimeout(r))
    expect(focused()).toBe('d')
  })

  it('manual: arrows move focus only', async () => {
    const w = mount(List, { props: { activation: 'manual' }, attachTo: document.body })
    ;(w.get('.a').element as HTMLElement).focus()
    await press('ArrowRight')
    expect(focused()).toBe('b')
    expect(w.emitted('select')).toBeUndefined()
    expect(w.get('.a').attributes('tabindex')).toBe('0')
  })

  it('leaves other keys alone', async () => {
    const w = mount(List, { attachTo: document.body })
    ;(w.get('.a').element as HTMLElement).focus()
    expect((await press('Enter')).defaultPrevented).toBe(false)
    expect((await press('ArrowDown')).defaultPrevented).toBe(false)
    expect(focused()).toBe('a')
  })
})
