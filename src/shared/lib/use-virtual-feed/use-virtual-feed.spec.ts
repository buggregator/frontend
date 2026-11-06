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

const setup = async (initial: string[]) => {
  const keys = ref(initial)
  let api!: ReturnType<typeof useVirtualFeed>
  const Host = defineComponent({
    setup() {
      api = useVirtualFeed(keys, { overscan: 0, estimate: ITEM, firstPage: 2 })
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

  // every rendered item and the scroller report their sizes
  const measureAll = async () => {
    const sizes = new Map<Element, number>([[scroller, VIEWPORT]])
    scroller.querySelectorAll('[data-virtual-item]').forEach((el) => sizes.set(el, ITEM))
    observers.at(-1)!.fire(sizes)
    await settle()
  }
  const scrollTo = async (top: number) => {
    scroller.scrollTop = top
    scroller.dispatchEvent(new Event('scroll'))
    await settle()
  }
  const rendered = () => [...scroller.querySelectorAll('[data-virtual-item]')].map((el) => el.id)
  return { wrapper, keys, api: () => api, scroller, measureAll, scrollTo, rendered }
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
})
