import { computed, ref, type Ref } from 'vue'

export const useJsonTree = (raw: Ref<string | null>) => {
  const parseError = ref<string | null>(null)

  const parsed = computed(() => {
    if (!raw.value) return null
    try {
      parseError.value = null
      return JSON.parse(raw.value)
    } catch (e) {
      parseError.value = String(e)
      return null
    }
  })

  const isJson = computed(() => parsed.value !== null)

  return { parsed, parseError, isJson }
}
