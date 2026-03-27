import { ref, computed } from 'vue'

const compareBase = ref<string | null>(null)
const compareTarget = ref<string | null>(null)

export const useProfilerCompare = () => {
  const isSelecting = computed(() => compareBase.value !== null && compareTarget.value === null)
  const isReady = computed(() => compareBase.value !== null && compareTarget.value !== null)

  const selectForCompare = (id: string) => {
    if (compareBase.value === null) {
      compareBase.value = id
    } else if (compareBase.value !== id) {
      compareTarget.value = id
    }
  }

  const reset = () => {
    compareBase.value = null
    compareTarget.value = null
  }

  return {
    compareBase,
    compareTarget,
    isSelecting,
    isReady,
    selectForCompare,
    reset,
  }
}
