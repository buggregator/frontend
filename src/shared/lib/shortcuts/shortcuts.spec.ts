import { describe, expect, it } from 'vitest'
import { HINT_BARS, SHORTCUTS, hintsOf, mountedSearchBoxes, shortcutById } from './shortcuts'

describe('shortcut registry', () => {
  it('has unique ids', () => {
    const ids = SHORTCUTS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('hint bars name only registered shortcuts', () => {
    const ids = Object.values(HINT_BARS).flatMap((bar) => bar.flatMap((spec) => spec.ids))
    expect(ids.filter((id) => !shortcutById(id))).toEqual([])
  })

  it('shows «/ find» only while a search box is on the page', () => {
    mountedSearchBoxes.value = 0
    expect(hintsOf('event-list').map((h) => h.label)).not.toContain('find')
    mountedSearchBoxes.value = 1
    expect(hintsOf('event-list').map((h) => h.label)).toContain('find')
    mountedSearchBoxes.value = 0
  })

  it('shows the event list hints with their keys', () => {
    expect(hintsOf('event-list').slice(0, 2)).toEqual([
      { caps: ['j', 'k'], label: 'events' },
      { caps: ['Enter'], label: 'open' },
    ])
  })
})
