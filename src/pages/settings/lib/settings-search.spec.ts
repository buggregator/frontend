import { describe, expect, it } from 'vitest'
import { SETTINGS_SECTIONS } from '@/shared/constants'
import { matchesQuery, matchingSettingIds } from './settings-search'

describe('matchingSettingIds', () => {
  it('finds a setting by part of its label, any case', () => {
    expect([...matchingSettingIds('SHORTCUT', SETTINGS_SECTIONS)]).toEqual([
      'single-key-shortcuts',
      'key-hints'
    ])
  })

  it('finds a setting by a word that is not shown', () => {
    expect([...matchingSettingIds('phpstorm', SETTINGS_SECTIONS)]).toEqual(['code-editor'])
  })

  it('finds a setting by its long explanation', () => {
    expect(matchingSettingIds('screen reader', SETTINGS_SECTIONS)).toEqual(
      new Set(['single-key-shortcuts'])
    )
  })

  it('brings the whole section when its title matches', () => {
    expect(matchingSettingIds('appearance', SETTINGS_SECTIONS)).toEqual(
      new Set(['theme', 'pin-header', 'event-counts'])
    )
  })

  it('matches nothing for an unknown word', () => {
    expect(matchingSettingIds('zzz', SETTINGS_SECTIONS).size).toBe(0)
  })

  it('matches everything for an empty or blank query', () => {
    const all = SETTINGS_SECTIONS.flatMap((s) => s.items).length
    expect(matchingSettingIds('  ', SETTINGS_SECTIONS).size).toBe(all)
  })
})

describe('matchesQuery', () => {
  it('ignores spaces around the query', () => {
    expect(matchesQuery('  dark ', ['Light', 'Dark'])).toBe(true)
  })
})
