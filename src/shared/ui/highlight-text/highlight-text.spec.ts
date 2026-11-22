import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import HighlightText from './highlight-text.vue'
import { markSegments } from './mark-segments'

describe('markSegments', () => {
  it('marks a phrase wherever it occurs, ignoring case', () => {
    expect(markSegments('Order A-1 order', ['order'])).toEqual([
      { text: 'Order', match: true },
      { text: ' A-1 ', match: false },
      { text: 'order', match: true }
    ])
  })

  it('marks every word on its own and merges overlaps', () => {
    expect(markSegments('OrderFailedException', ['failed', 'order', 'derfa'])).toEqual([
      { text: 'OrderFailed', match: true },
      { text: 'Exception', match: false }
    ])
  })

  it('leaves the text whole without words', () => {
    expect(markSegments('cart', ['', '  '])).toEqual([{ text: 'cart', match: false }])
  })
})

describe('HighlightText', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('marks each of the terms', () => {
    const wrapper = mount(HighlightText, {
      props: { text: 'Charging card for order', terms: ['card', 'order'] }
    })
    expect(wrapper.findAll('mark').map((m) => m.text())).toEqual(['card', 'order'])
  })

  it('marks the query as one phrase', () => {
    const wrapper = mount(HighlightText, { props: { text: 'card for order', query: 'for order' } })
    expect(wrapper.findAll('mark').map((m) => m.text())).toEqual(['for order'])
  })
})
