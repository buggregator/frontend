import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { MapNode } from '../../lib/service-map/service-map-model'
import ServiceMapPicker from './service-map-picker.vue'

const nodes = Array.from({ length: 12 }, (_, i) => ({ id: `svc-${i}`, label: `svc-${i}`, inCount: 100 - i, external: false }) as MapNode)

describe('ServiceMapPicker (#6549)', () => {
  it('keeps the active option in view while the arrows move it', async () => {
    const scroll = vi.fn()
    Element.prototype.scrollIntoView = scroll
    const w = mount(ServiceMapPicker, { props: { nodes, colors: new Map(), selected: null }, attachTo: document.body })
    await w.get('[data-test="svc-picker"]').trigger('click')
    await flushPromises()
    const input = w.get('input')
    for (let i = 0; i < 5; i++) await input.trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    expect(scroll).toHaveBeenLastCalledWith({ block: 'nearest' })
    expect((scroll.mock.contexts.at(-1) as HTMLElement).textContent).toContain('svc-4')
    w.unmount()
    Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
  })
})
