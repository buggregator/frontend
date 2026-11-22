<script lang="ts" setup>
// The amber line over a trace view that points at one finding: an overrun
// service (#6533 A) or an N+1 query (#6715). One look for every such hint.

type Props = {
  // A short tag in front, e.g. «N+1».
  tag?: string
  actionLabel?: string
}

const props = withDefaults(defineProps<Props>(), { tag: '', actionLabel: '' })
const emit = defineEmits<{ action: [] }>()
</script>

<template>
  <div class="trace-hint">
    <span
      v-if="props.tag"
      class="trace-hint__tag"
    >{{ props.tag }}</span>
    <strong class="trace-hint__main"><slot /></strong>
    <span
      v-if="$slots.detail"
      class="trace-hint__detail"
    ><slot name="detail" /></span>
    <button
      v-if="props.actionLabel"
      type="button"
      class="trace-hint__link"
      @click="emit('action')"
    >
      {{ props.actionLabel }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
.trace-hint {
  @apply flex flex-none flex-wrap items-baseline gap-x-2 gap-y-1 px-4 py-2 text-xs;
  @apply border-b border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10;
}

.trace-hint__tag {
  @apply font-mono font-bold text-amber-800 dark:text-amber-300;
}

.trace-hint__main {
  @apply font-semibold text-gray-900 dark:text-gray-100;
}

.trace-hint__detail {
  @apply text-gray-700 dark:text-gray-300;
}

.trace-hint__link {
  @apply text-2xs text-blue-700 dark:text-blue-400 hover:underline;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60 rounded;
}
</style>
