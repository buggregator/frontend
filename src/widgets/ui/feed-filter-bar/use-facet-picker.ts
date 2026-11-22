import { computed, ref } from 'vue'
import { FACET_FIELDS, facetLabel, isTagKey, type FacetField } from '@/shared/lib/feed-filters'
import type { FacetCounts } from '@/shared/lib/io'

export type PickerField = FacetField & { values: number }

// The «Add filter» list: first the fields, then one field's values with
// their counts. The counts are asked from the server when the list opens.
export const useFacetPicker = (load: () => Promise<FacetCounts>) => {
  const facets = ref<FacetCounts>({})
  const status = ref<'loading' | 'ready' | 'error'>('loading')
  const field = ref<string | null>(null)
  const query = ref('')
  const active = ref(0)
  let seq = 0

  const reload = async () => {
    const mine = ++seq
    status.value = 'loading'
    try {
      const data = await load()
      if (mine !== seq) return
      facets.value = data
      status.value = 'ready'
    } catch {
      if (mine === seq) status.value = 'error'
    }
  }

  const fields = computed<PickerField[]>(() => {
    const tags = Object.keys(facets.value)
      .filter(isTagKey)
      .sort()
      .map((key) => ({ key, label: `Tag: ${facetLabel(key)}`, sentBy: 'Sentry, Profiler, Inspector' }))
    return [...FACET_FIELDS, ...tags].map((f) => ({ ...f, values: facets.value[f.key]?.length ?? 0 }))
  })

  const current = computed(() => fields.value.find((f) => f.key === field.value) ?? null)

  const values = computed(() => {
    const all = field.value ? facets.value[field.value] ?? [] : []
    const q = query.value.trim().toLowerCase()
    return q ? all.filter(({ value }) => value.toLowerCase().includes(q)) : all
  })

  const maxCount = computed(() => Math.max(1, ...values.value.map(({ count }) => count)))

  const chooseField = (key: string) => {
    field.value = key
    query.value = ''
    active.value = 0
  }

  const back = () => {
    field.value = null
    query.value = ''
    active.value = 0
  }

  // Arrow keys over the visible values; stays inside the list.
  const move = (delta: number) => {
    const n = values.value.length
    if (!n) return
    active.value = (active.value + delta + n) % n
  }

  const setQuery = (text: string) => {
    query.value = text
    active.value = 0
  }

  return { facets, status, fields, field, current, values, maxCount, query, active, reload, chooseField, back, move, setQuery }
}
