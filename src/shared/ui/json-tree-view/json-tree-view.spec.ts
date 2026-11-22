import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import JsonTreeView from './json-tree-view.vue'

const value = { order: { id: 1, items: [{ sku: 'A' }] }, user: 5 }
const collapsed = (wrapper: ReturnType<typeof mount>) =>
  wrapper.findAll('.json-node__collapsed').map((n) => n.text())

describe('JsonTreeView: how deep it opens', () => {
  it('opens two levels by default', () => {
    const wrapper = mount(JsonTreeView, { props: { value } })

    expect(wrapper.text()).toContain('id')
    expect(collapsed(wrapper)).toEqual(['{1 keys}'])
  })

  it('openDepth -1 folds every top-level value: a big context stays one line per key', () => {
    const wrapper = mount(JsonTreeView, { props: { value, openDepth: -1 } })

    expect(wrapper.text()).not.toContain('id')
    expect(collapsed(wrapper)).toEqual(['{2 keys}'])
    expect(wrapper.text()).toContain('user')
  })
})
