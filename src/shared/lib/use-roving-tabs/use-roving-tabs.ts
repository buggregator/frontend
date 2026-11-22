import { computed, nextTick, toValue, type MaybeRefOrGetter, type Ref } from 'vue'

export type RovingItem = { id: string; disabled?: boolean }

// 'automatic': an arrow key selects the tab it moves to (the default of the
// kit's Tabs); 'manual': arrows only move focus, Enter or Space selects.
export type RovingActivation = 'automatic' | 'manual'

type Options = {
  items: MaybeRefOrGetter<readonly RovingItem[]>
  current: MaybeRefOrGetter<string | undefined>
  onSelect: (id: string) => void
  activation?: MaybeRefOrGetter<RovingActivation>
  // The focusable items inside root, in the order of `items`.
  selector?: string
}

// The WAI-ARIA tabs keyboard contract: ← → move and wrap, Home and End jump
// to the ends, disabled items are skipped. One tab stop (roving tabindex):
// the current item, or the first enabled one when the current is missing.
export const useRovingTabs = (root: Ref<HTMLElement | null | undefined>, options: Options) => {
  const selector = options.selector ?? '[role="tab"]'
  const items = () => toValue(options.items)

  const stopId = computed(() => {
    const list = items()
    const current = toValue(options.current)
    const on = list.find((item) => item.id === current && !item.disabled)
    return (on ?? list.find((item) => !item.disabled))?.id
  })

  const tabindexOf = (id: string) => (id === stopId.value ? 0 : -1)

  const elements = () => Array.from(root.value?.querySelectorAll<HTMLElement>(selector) ?? [])

  const focusId = async (id: string | undefined) => {
    await nextTick()
    const index = items().findIndex((item) => item.id === id)
    elements()[index]?.focus()
  }

  const step = (from: number, delta: 1 | -1) => {
    const list = items()
    for (let n = 1; n <= list.length; n++) {
      const i = (((from + delta * n) % list.length) + list.length) % list.length
      if (!list[i].disabled) return i
    }
    return -1
  }

  const onKeydown = (e: KeyboardEvent) => {
    const list = items()
    const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(selector)
    const at = target ? elements().indexOf(target) : -1
    if (at < 0 || !list.length) return

    const moves: Record<string, () => number> = {
      ArrowRight: () => step(at, 1),
      ArrowLeft: () => step(at, -1),
      Home: () => step(-1, 1),
      End: () => step(list.length, -1)
    }
    if (!(e.key in moves)) return
    const next = moves[e.key]()

    e.preventDefault()
    if (next < 0) return
    const id = list[next].id
    if ((toValue(options.activation) ?? 'automatic') === 'automatic' && id !== toValue(options.current)) {
      options.onSelect(id)
    }
    focusId(id)
  }

  const focusCurrent = () => focusId(stopId.value)

  return { tabindexOf, onKeydown, focusCurrent }
}
