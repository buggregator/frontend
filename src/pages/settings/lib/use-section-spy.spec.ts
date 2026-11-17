import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { pickSection, useSectionSpy } from './use-section-spy'

// Settings at 1440×900: the whole page is barely taller than the view.
const boxes = (scroll: number) => [
  { id: 'appearance', top: 20 - scroll },
  { id: 'keyboard', top: 260 - scroll },
  { id: 'editor', top: 440 - scroll },
  { id: 'updates', top: 640 - scroll }
]

describe('pickSection', () => {
  it('marks the first section at the top', () => {
    expect(pickSection(boxes(0), { height: 900, progress: 0 })).toBe('appearance')
  })

  it('marks the last section at the end of a short page', () => {
    expect(pickSection(boxes(202), { height: 900, progress: 1 })).toBe('updates')
  })

  // 600 px high, 404 px to scroll: each section gets its turn on the way down.
  it('gives every section a turn while scrolling down', () => {
    const marks = new Set<string>()
    for (let scroll = 0; scroll <= 404; scroll += 20) {
      marks.add(pickSection(boxes(scroll), { height: 600, progress: scroll / 404 })!)
    }
    expect([...marks]).toEqual(['appearance', 'keyboard', 'editor', 'updates'])
  })

  it('marks nothing without sections', () => {
    expect(pickSection([], { height: 900, progress: 0 })).toBeUndefined()
  })
})

describe('useSectionSpy', () => {
  const mountSpy = (hash: ReturnType<typeof ref<string>>) => {
    let api!: ReturnType<typeof useSectionSpy>
    mount(
      defineComponent({
        setup() {
          api = useSectionSpy(() => ['appearance', 'keyboard', 'editor', 'updates'], () => hash.value ?? '')
          return () => h('div')
        }
      })
    )
    return api
  }

  // The header pill and the menu dot open /settings#updates.
  it('marks the section named in the address', () => {
    const spy = mountSpy(ref('#updates'))

    expect(spy.active.value).toBe('updates')
  })

  it('follows a change of the address', async () => {
    const hash = ref('')
    const spy = mountSpy(hash)
    expect(spy.active.value).toBe('appearance')

    hash.value = '#editor'
    await nextTick()

    expect(spy.active.value).toBe('editor')
  })

  it('ignores an address that names no section', () => {
    expect(mountSpy(ref('#nope')).active.value).toBe('appearance')
  })
})
