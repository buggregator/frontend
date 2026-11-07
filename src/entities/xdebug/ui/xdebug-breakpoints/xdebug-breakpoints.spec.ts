import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { BreakpointRow } from '../../lib/xdebug-breakpoints'
import type { XdebugSavedBreakpoint } from '../../types'
import XdebugBreakpoints from './xdebug-breakpoints.vue'

const bp = (over: Partial<XdebugSavedBreakpoint> = {}): XdebugSavedBreakpoint => ({
  id: 1, type: 'line', file: 'file:///app/src/Services/CartService.php', line: 40, enabled: true, source: 'ui', created_at: '', ...over
})
const row = (over: Partial<XdebugSavedBreakpoint> = {}, extra: Partial<BreakpointRow> = {}): BreakpointRow => ({ bp: bp(over), hits: 0, ...extra })
const mk = (props: Record<string, unknown> = {}) => mount(XdebugBreakpoints, {
  props: { rows: [row()], allowEval: true, saveCondition: vi.fn(async () => true), ...props },
  attachTo: document.body
})

describe('XdebugBreakpoints', () => {
  it('shows file:line, the directory and the full path in title', () => {
    const w = mk()
    expect(w.find('.xdebug-bp__f').text()).toBe('CartService.php:40')
    expect(w.find('.xdebug-bp__dir').text()).toBe('/app/src/Services')
    expect(w.find('.xdebug-bp__f').attributes('title')).toBe('/app/src/Services/CartService.php:40')
  })

  it('says how to add one when the list is empty', () => {
    expect(mk({ rows: [] }).text()).toContain('No breakpoints. When a session pauses, click a line number in the code, or type path:line below.')
  })

  it('tags agent breakpoints, hits, the moved line and a condition skipped with eval off', () => {
    const w = mk({
      rows: [row({ source: 'mcp', condition: '$a > 1', line: 22 }, { hits: 2, movedTo: 24 })],
      allowEval: false,
      showHits: true
    })
    expect(w.text()).toContain('agent')
    expect(w.text()).toContain('2×')
    expect(w.text()).toContain('Xdebug moved it: no code on line 22 → 24')
    expect(w.text()).toContain('skipped · eval off')
  })

  it('emits enable and remove', async () => {
    const w = mk()
    await w.find('input[type=checkbox]').setValue(false)
    await w.find('button[aria-label^="Remove breakpoint"]').trigger('click')
    expect(w.emitted('enable')).toEqual([[1, false]])
    expect(w.emitted('remove')).toEqual([[1]])
  })

  it('edits a condition, saves it and returns focus to its button', async () => {
    const saveCondition = vi.fn(async () => true)
    const w = mk({ saveCondition })
    const btn = w.find('button[aria-label^="Add condition"]')
    await btn.trigger('click')
    await flushPromises()
    const input = w.find('input[aria-label="Condition (PHP expression)"]')
    expect(document.activeElement).toBe(input.element)
    await input.setValue('$total > 100')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(saveCondition).toHaveBeenCalledWith(1, '$total > 100')
    expect(w.find('form').exists()).toBe(false)
    expect(document.activeElement).toBe(btn.element)
    w.unmount()
  })

  it('shows the eval lock instead of the editor when eval is off', async () => {
    const w = mk({ allowEval: false })
    await w.find('button[aria-label^="Add condition"]').trigger('click')
    expect(w.text()).toContain('Conditions run PHP, so they need xdebug.allow_eval: true.')
    expect(w.find('input[aria-label="Condition (PHP expression)"]').exists()).toBe(false)
    w.unmount()
  })

  it('is read-only while an IDE drives', () => {
    const w = mk({ readOnly: true })
    expect(w.find('input[type=checkbox]').attributes('disabled')).toBeDefined()
    expect(w.find('.xdebug-bp__acts').exists()).toBe(false)
    expect(w.text()).toContain('Your IDE sets the breakpoints of this session.')
    w.unmount()
  })
  it('shows an exception class without the leading backslash, and * as every exception', () => {
    const w = mk({ rows: [row({ id: 1, type: 'exception', file: undefined, line: undefined, exception: '\\RuntimeException' }), row({ id: 2, type: 'exception', file: undefined, line: undefined, exception: '*' })] })
    expect(w.findAll('.xdebug-bp__f').map((e) => e.text())).toEqual(['on RuntimeException', 'on every exception'])
    w.unmount()
  })

  it('locks the checkbox while its change is on the way', () => {
    const w = mk({ busy: new Set([1]) })
    expect(w.find('input[type=checkbox]').attributes('disabled')).toBeDefined()
    w.unmount()
  })
})
