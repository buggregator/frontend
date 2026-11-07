import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { GutterMark } from '../../lib/xdebug-breakpoints'
import XdebugCodeView from './xdebug-code-view.vue'

const source = { file: 'file:///app/Cart.php', begin: 40, lines: [40, 41, 42, 43].map((line) => ({ line, text: '$a = 1;' })) }

describe('XdebugCodeView', () => {
  it('keeps a read-only gutter with the IDE dots', () => {
    const w = mount(XdebugCodeView, { props: { source, line: 41, breakpointLines: [40] } })
    expect(w.findAll('button')).toHaveLength(0)
    expect(w.findAll('.xdebug-code__bp')).toHaveLength(1)
  })

  it('makes every line number a toggle when Buggregator drives', async () => {
    const marks = new Map<number, GutterMark>([[40, 'on'], [43, 'cond'], [42, 'off']])
    const w = mount(XdebugCodeView, { props: { source, line: 41, editable: true, marks } })
    const buttons = w.findAll('button.xdebug-code__gut')
    expect(buttons).toHaveLength(4)
    expect(buttons[3].attributes('aria-label')).toBe('Line 43, conditional breakpoint — press to remove the breakpoint')
    expect(buttons[1].attributes('aria-label')).toBe('Line 41 — press to add a breakpoint')
    expect(buttons[2].find('.xdebug-code__slot').classes()).toContain('is-off')

    await buttons[1].trigger('click')
    expect(w.emitted('toggle')).toEqual([[41]])
  })
})
