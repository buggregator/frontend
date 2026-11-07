import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import XdebugBreakpointAdd from './xdebug-breakpoint-add.vue'

const mk = (add = vi.fn(async () => true), findFiles = vi.fn(async () => ['file:///app/src/Repo/CouponRepository.php'])) => ({
  w: mount(XdebugBreakpointAdd, { props: { add, findFiles }, attachTo: document.body }),
  add,
  findFiles
})

describe('XdebugBreakpointAdd', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('adds path:line and empties the field', async () => {
    const { w, add } = mk()
    const input = w.find('input')
    await input.setValue('/app/src/Cart.php:43')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(add).toHaveBeenCalledWith({ type: 'line', file: '/app/src/Cart.php', line: 43 })
    expect((input.element as HTMLInputElement).value).toBe('')
    w.unmount()
  })

  it('asks for a line number and marks the field invalid', async () => {
    const { w, add } = mk()
    await w.find('input').setValue('/app/src/Cart.php')
    await w.find('form').trigger('submit')
    expect(add).not.toHaveBeenCalled()
    expect(w.find('input').attributes('aria-invalid')).toBe('true')
    expect(w.text()).toContain('Add a line number after the colon')
    w.unmount()
  })

  it('offers files and picks one with the keyboard, leaving path: in the field', async () => {
    const { w, findFiles } = mk()
    const input = w.find('input')
    ;(input.element as HTMLInputElement).focus()
    await input.setValue('Coupon')
    await vi.advanceTimersByTimeAsync(200)
    await flushPromises()
    expect(findFiles).toHaveBeenCalledWith('Coupon')
    expect(input.attributes('aria-expanded')).toBe('true')
    expect(w.find('mark').text()).toBe('Coupon')

    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(input.attributes('aria-activedescendant')).toMatch(/-files-0$/)
    await w.find('form').trigger('submit')
    await flushPromises()
    expect((input.element as HTMLInputElement).value).toBe('/app/src/Repo/CouponRepository.php:')
    expect(input.attributes('aria-expanded')).toBe('false')
    w.unmount()
  })
  it('asks to clear the server error when the user types again', async () => {
    const w = mount(XdebugBreakpointAdd, { props: { add: vi.fn(), findFiles: vi.fn(async () => []), serverError: 'file must be absolute' } })
    expect(w.text()).toContain('file must be absolute')
    await w.find('input').setValue('/app/x.php:1')
    expect(w.emitted('edit')).toBeTruthy()
    w.unmount()
  })

  it('adds an exception class without the leading backslash', async () => {
    const { w, add } = mk()
    await w.find('input').setValue('\\RuntimeException')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(add).toHaveBeenCalledWith({ type: 'exception', exception: 'RuntimeException' })
    w.unmount()
  })
  it('keeps the list closed when suggestions arrive after Enter', async () => {
    const { w } = mk()
    const input = w.find('input')
    ;(input.element as HTMLInputElement).focus()
    await input.setValue('/app/src/Cart.php:4')
    await input.setValue('RuntimeException')
    await w.find('form').trigger('submit')
    await vi.advanceTimersByTimeAsync(200)
    await flushPromises()
    expect(input.attributes('aria-expanded')).toBe('false')
    w.unmount()
  })
})
