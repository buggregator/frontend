import { computed, inject, ref, type ComputedRef, type InjectionKey, type Ref } from 'vue'
import type { SettingItem, SettingsSection } from '../config/settings-catalog'

const normalize = (query: string) => query.trim().toLowerCase()

const itemTexts = (item: SettingItem) => [
  item.label,
  item.hint,
  item.more ?? '',
  ...(item.keywords ?? [])
]

// An empty query matches everything.
export const matchesQuery = (query: string, texts: readonly string[]): boolean => {
  const q = normalize(query)
  return !q || texts.some((text) => text.toLowerCase().includes(q))
}

// The ids of the settings that match; a section whose title matches brings
// all its settings.
export const matchingSettingIds = (
  query: string,
  sections: readonly SettingsSection[]
): Set<string> => {
  const ids = new Set<string>()
  for (const section of sections) {
    const wholeSection = !!normalize(query) && matchesQuery(query, [section.title])
    for (const item of section.items) {
      if (wholeSection || matchesQuery(query, itemTexts(item))) ids.add(item.id)
    }
  }
  return ids
}

export type SettingsSearch = {
  query: Ref<string>
  matches: ComputedRef<Set<string>>
}

export const SETTINGS_SEARCH: InjectionKey<SettingsSearch> = Symbol('settings-search')

// For a row: the page's query and whether this setting matches it.
export const useSettingMatch = (id: () => string) => {
  const search = inject(SETTINGS_SEARCH, null)
  const query = computed(() => search?.query.value ?? '')
  const isMatch = computed(() => !search || !query.value.trim() || search.matches.value.has(id()))
  return { query, isMatch }
}

export const useSettingsSearch = (sections: () => readonly SettingsSection[]): SettingsSearch => {
  const query = ref('')
  const matches = computed(() => matchingSettingIds(query.value, sections()))
  return { query, matches }
}
