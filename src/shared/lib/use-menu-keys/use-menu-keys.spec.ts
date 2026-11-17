import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { useMenuKeys } from './use-menu-keys'

const onClose = vi.fn()

const Menu = defineComponent({
  setup() {
    const root = ref<HTMLElement | null>(null)
    const { onKeydown, focusCurrent } = useMenuKeys(root, onClose)
    return { focusCurrent, render: () => null, root, onKeydown }
  },
  render() {
    return h('div', { ref: 'root', role: 'menu', onKeydown: this.onKeydown }, [
      h('button', { role: 'menuitemradio', class: 'a', 'aria-checked': 'false' }, 'A'),
      h('button', { role: 'menuitemradio', class: 'b', 'aria-checked': 'true' }, 'B'),
      h('button', { role: 'menuitemradio', class: 'c', 'aria-checked': 'false' }, 'C'),
    ])
  },
})

const press = (key: string) => {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  document.activeElement?.dispatchEvent(e)
  return e
}

describe('useMenuKeys', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    onClose.mockReset()
  })

  it('focuses the checked item first', () => {
    const wrapper = mount(Menu, { attachTo: document.body })
    wrapper.vm.focusCurrent()
    expect(document.activeElement?.className).toBe('b')
    wrapper.unmount()
  })

  it('moves with the arrows, wraps around, and jumps with Home and End', () => {
    const wrapper = mount(Menu, { attachTo: document.body })
    wrapper.vm.focusCurrent()

    expect(press('ArrowDown').defaultPrevented).toBe(true)
    expect(document.activeElement?.className).toBe('c')
    press('ArrowDown')
    expect(document.activeElement?.className).toBe('a')
    press('ArrowUp')
    expect(document.activeElement?.className).toBe('c')
    press('Home')
    expect(document.activeElement?.className).toBe('a')
    press('End')
    expect(document.activeElement?.className).toBe('c')
    wrapper.unmount()
  })

  it('closes on Escape and leaves other keys alone', () => {
    const wrapper = mount(Menu, { attachTo: document.body })
    wrapper.vm.focusCurrent()

    expect(press('Enter').defaultPrevented).toBe(false)
    expect(onClose).not.toHaveBeenCalled()
    expect(press('Escape').defaultPrevented).toBe(true)
    expect(onClose).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})
