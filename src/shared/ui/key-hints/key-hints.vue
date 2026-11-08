<script lang="ts" setup>
import KeyCaps from './key-caps.vue'
import type { KeyHint } from './types'

type Props = {
  hints: KeyHint[]
  label?: string // read by screen readers instead of the badges
}

withDefaults(defineProps<Props>(), {
  label: 'Keyboard hints',
})
</script>

<template>
  <p
    class="key-hints"
    :aria-label="label"
  >
    <template
      v-for="(hint, i) in hints"
      :key="hint.label"
    >
      <span
        v-if="i > 0"
        class="key-hints__sep"
        aria-hidden="true"
      >·</span>
      <span class="key-hints__item">
        <KeyCaps :caps="hint.caps" />
        <span class="key-hints__label">{{ hint.label }}</span>
      </span>
    </template>
  </p>
</template>

<style lang="scss" scoped>
.key-hints {
  @apply flex flex-wrap items-center gap-x-2 gap-y-1;
  @apply text-2xs text-gray-500 dark:text-gray-400;
}

.key-hints__item {
  @apply inline-flex items-center gap-1 whitespace-nowrap;
}

.key-hints__sep {
  @apply text-gray-300 dark:text-gray-600;
}
</style>
