import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { useVirtualFeed } from './use-virtual-feed'

// jsdom has no layout: the scroller's height and the item heights are fed
// through a fake ResizeObserver, scrolling through scrollTop + a scroll event.
let observers: FakeObserver[] = []
class FakeObserver {
  targets = new Set<Element>()
  constructor(private cb: ResizeObserverCallback) {
    observers.push(this)
  }
  observe(el: Element) {
    this.targets.add(el)
  }
  unobserve(el: Element) {
    this.targets.delete(el)
  }
  disconnect() {
    this.targets.clear()
  }
  fire(sizes: Map<Element, number>) {
    const entries = [...sizes].map(([target, blockSize]) => ({ target, borderBoxSize: [{ blockSize }] }))
    this.cb(entries as unknown as ResizeObserverEntry[], this as unknown as ResizeObserver)
  }
}

const VIEWPORT = 300
const ITEM = 100

const settle = async () => {
  for (let i = 0; i < 4; i++) await nextTick()
}

const setup = async (initial: string[], overscan = 0) => {
  const keys = ref(initial)
  let api!: ReturnType<typeof useVirtualFeed>
  const Host = defineComponent({
    setup() {
      api = useVirtualFeed(keys, { overscan, estimate: ITEM, firstPage: 2 })
      return () =>
        h('div', { ref: api.scroller, class: 'scroller' }, [
          h(
            'div',
            { style: { paddingTop: `${api.padTop.value}px` } },
            keys.value
              .slice(api.range.value.start, api.range.value.end)
              .map((k) => h('div', { id: k, key: k, 'data-virtual-item': '' }))
          ),
        ])
    },
  })
  const wrapper = mount(Host, { attachTo: document.body })
  const scroller = wrapper.element as HTMLElement
  await settle()
  // the scroller gets its height from the first ResizeObserver report
  Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: VIEWPORT })

  // every rendered item and the scroller report their sizes; `height` picks
  // an item's height by its key (default: the estimate)
  const measureAll = async (height: (key: string) => number = () => ITEM) => {
    for (let round = 0; round < 5; round++) {
      const sizes = new Map<Element, number>([[scroller, VIEWPORT]])
      scroller.querySelectorAll('[data-virtual-item]').forEach((el) => sizes.set(el, height(el.id)))
      observers.at(-1)!.fire(sizes)
      await settle()
    }
  }
  // where a rendered item's top is on screen
  const screenTop = (key: string) => offsetOf(key) - scroller.scrollTop
  const scrollTo = async (top: number) => {
    scroller.scrollTop = top
    scroller.dispatchEvent(new Event('scroll'))
    await settle()
  }
  const rendered = () => [...scroller.querySelectorAll('[data-virtual-item]')].map((el) => el.id)
  let heightOf: (key: string) => number = () => ITEM
  // the item's top inside the list as rendered: the top padding plus the
  // rendered items before it
  const offsetOf = (key: string) => {
    let top = api.padTop.value
    for (const k of rendered()) {
      if (k === key) return top
      top += heightOf(k)
    }
    return NaN
  }
  const setHeights = (fn: (key: string) => number) => (heightOf = fn)
  return { wrapper, keys, api: () => api, scroller, measureAll, scrollTo, rendered, screenTop, setHeights }
}

const ids = (n: number, prefix = 'e') => Array.from({ length: n }, (_, i) => `${prefix}${i}`)

describe('useVirtualFeed', () => {
  beforeEach(() => {
    observers = []
    vi.stubGlobal('ResizeObserver', FakeObserver)
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => {})
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('renders a first page before the scroller has a height', async () => {
    const { rendered } = await setup(ids(100))
    expect(rendered()).toEqual(['e0', 'e1'])
  })

  it('renders only the items in the viewport and moves with the scroll', async () => {
    const { measureAll, scrollTo, rendered, api } = await setup(ids(100))
    await measureAll()
    expect(rendered()).toEqual(['e0', 'e1', 'e2'])

    await scrollTo(1050)
    expect(rendered()).toEqual(['e10', 'e11', 'e12', 'e13'])
    expect(api().padTop.value).toBe(1000)
    expect(api().padBottom.value).toBe(100 * 100 - 1400)
  })

  it('keeps the first visible item in place when items arrive above it', async () => {
    const { keys, measureAll, scrollTo, scroller } = await setup(ids(100))
    await measureAll()
    await scrollTo(550)

    keys.value = [...ids(3, 'new'), ...keys.value]
    await settle()

    // e5 was 50 px above the top of the screen; it still is, 300 px lower
    expect(scroller.scrollTop).toBe(850)
  })

  it('stays at the very top when items arrive, so the new ones show', async () => {
    const { keys, measureAll, scroller, rendered } = await setup(ids(100))
    await measureAll()

    keys.value = [...ids(2, 'new'), ...keys.value]
    await settle()

    expect(scroller.scrollTop).toBe(0)
    expect(rendered().slice(0, 2)).toEqual(['new0', 'new1'])
  })

  it('scrolls to an item that is not rendered', async () => {
    const { measureAll, scroller, api, rendered } = await setup(ids(100))
    await measureAll()

    api().scrollToKey('e50')
    await settle()

    // e50 spans 5000..5100: its bottom lines up with the bottom of the screen
    expect(scroller.scrollTop).toBe(5100 - VIEWPORT)
    expect(rendered()).toContain('e50')
  })

  // Review of #313: an anchor whose card left the list went stale, and live
  // events then pushed the view down on every batch.
  it('hands the anchor to the next card when the anchor card is deleted', async () => {
    const { keys, measureAll, scrollTo, screenTop } = await setup(ids(100))
    await measureAll()
    await scrollTo(520) // e5 is the first card on screen, 20 px of it above
    const e6 = screenTop('e6')

    keys.value = keys.value.filter((k) => k !== 'e5')
    await settle()
    keys.value = ['new0', 'new1', ...keys.value]
    await measureAll()

    expect(screenTop('e6')).toBe(e6)
  })

  // A measured height that differs from the estimate moves the cards below
  // it; the card on screen stays put.
  it('keeps the card on screen while cards above it are measured', async () => {
    const { keys, measureAll, scrollTo, screenTop, setHeights, rendered } = await setup(ids(100))
    const height = (k: string) => (k.startsWith('new') ? 250 : Number(k.slice(1)) % 2 ? 60 : 140)
    setHeights(height)
    await measureAll(height)
    await scrollTo(1000)
    const firstOnScreen = rendered().find((k) => screenTop(k) + height(k) > 0)!
    const before = screenTop(firstOnScreen)

    // three new cards arrive, rendered first at the estimate, then measured
    keys.value = ['new0', 'new1', 'new2', ...keys.value]
    await measureAll(height)

    // scrollTop is whole pixels, the average height is not
    expect(screenTop(firstOnScreen)).toBeCloseTo(before, 0)
  })

  // A card above the screen grows (rendered in the overscan, then measured
  // again): the card on screen stays put.
  it('keeps the card on screen when a card above it grows', async () => {
    const { measureAll, scrollTo, screenTop, setHeights, rendered } = await setup(ids(100), 200)
    await measureAll()
    await scrollTo(1050)
    await measureAll()
    expect(rendered()).toContain('e9')
    const before = screenTop('e10')

    const grown = (k: string) => (k === 'e9' ? 400 : ITEM)
    setHeights(grown)
    await measureAll(grown)

    expect(screenTop('e10')).toBeCloseTo(before, 0)
  })
})
