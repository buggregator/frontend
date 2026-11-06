<script lang="ts" setup>
import { computed } from 'vue'
import { methodTone, statusTone } from '../../lib/mock-format'

type Props = {
  method?: string
  status?: number
}

const props = defineProps<Props>()

const tone = computed(() =>
  props.status !== undefined ? statusTone(props.status) : methodTone(props.method || '')
)
const text = computed(() =>
  props.status !== undefined ? String(props.status) : (props.method || '').toUpperCase()
)
</script>

<template>
  <span
    class="mock-badge"
    :class="tone"
  >{{ text }}</span>
</template>

<style lang="scss" scoped>
.mock-badge {
  @apply inline-flex items-center justify-center shrink-0 px-1.5 rounded;
  @apply font-mono text-2xs font-semibold leading-[18px] min-w-[2.75rem];
}
</style>
