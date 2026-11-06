import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { useDialogFocus } from './use-dialog-focus'

const Dialog = defineComponent({
  emits: ['close'],
  setup(_, { emit }) {
    const root = ref<HTMLElement | null>(null)
    useDialogFocus(root, () => emit('close'))
    return () =>
      h('div', { ref: root, role: 'dialog' }, [
        h('button', { class: 'first' }, 'Close'),
        h('a', { href: '#x', class: 'mid' }, 'Link'),
        h('button', { class: 'last' }, 'Last'),
      ])
  },
})

const tab = (shift = false) => {
  const e = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: shift, bubbles: true, cancelable: true })
  document.activeElement?.dispatchEvent(e)
  return e
}

describe('useDialogFocus', () => {
  afterEach(() => { document.body.innerHTML = '' })

  it('moves focus into the dialog and gives it back on close', async () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()

    const wrapper = mount(Dialog, { attachTo: document.body })
    await Promise.resolve()
    expect(document.activeElement?.className).toBe('first')

    wrapper.unmount()
    expect(document.activeElement).toBe(opener)
  })

  it('keeps Tab and Shift+Tab inside the dialog', async () => {
    const wrapper = mount(Dialog, { attachTo: document.body })
    await Promise.resolve()

    ;(wrapper.get('.last').element as HTMLElement).focus()
    const forward = tab()
    expect(forward.defaultPrevented).toBe(true)
    expect(document.activeElement?.className).toBe('first')

    const back = tab(true)
    expect(back.defaultPrevented).toBe(true)
    expect(document.activeElement?.className).toBe('last')

    ;(wrapper.get('.first').element as HTMLElement).focus()
    expect(tab().defaultPrevented).toBe(false)
    wrapper.unmount()
  })

  it('closes on Escape', async () => {
    const wrapper = mount(Dialog, { attachTo: document.body })
    await Promise.resolve()
    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })
})
