<script lang="ts" setup>
import { computed } from 'vue'
import { MONOLOG_LEVEL_KEYS, monologLevelLabel } from '@/entities/monolog'
import { isLevelOn, toggleLevel } from '../../lib'

// «✓ Info 1208»: one toggle per level with its count. All on is no pick.
// The six common levels always; alert and emergency once there are some.
type Props = { counts: Record<string, number> }

const props = defineProps<Props>()
const levels = defineModel<string[]>({ default: () => [] })

const COMMON = ['debug', 'info', 'notice', 'warning', 'error', 'critical']
const shown = computed(() =>
  MONOLOG_LEVEL_KEYS.filter(
    (l) => COMMON.includes(l) || props.counts[l] || levels.value.includes(l)
  )
)
const toggle = (level: string) => (levels.value = toggleLevel(levels.value, level, shown.value))
const fmt = (n = 0) => n.toLocaleString('en-US')
</script>

<template>
  <div
    class="level-chips"
    role="group"
    aria-label="Levels"
  >
    <button
      v-for="level in shown"
      :key="level"
      type="button"
      class="level-chips__chip"
      :class="[
        `level-chips__chip--${level}`,
        { 'level-chips__chip--on': isLevelOn(levels, level) }
      ]"
      :aria-pressed="isLevelOn(levels, level)"
      :aria-label="`${monologLevelLabel(level)}, ${fmt(counts[level])} lines`"
      :data-level="level"
      @click="toggle(level)"
    >
      <span
        class="level-chips__check"
        aria-hidden="true"
      >{{
        isLevelOn(levels, level) ? '✓' : ''
      }}</span>
      {{ monologLevelLabel(level) }}
      <span class="level-chips__count">{{ fmt(counts[level]) }}</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.level-chips {
  @apply flex min-w-0 rounded overflow-x-auto;
  @apply border border-gray-200 dark:border-gray-700;
  scrollbar-width: thin;
}

.level-chips__chip {
  @apply inline-flex flex-shrink-0 items-center gap-1 h-7 px-2 whitespace-nowrap;
  @apply text-xs text-gray-500 dark:text-gray-400;
  @apply border-r last:border-r-0 border-gray-200 dark:border-gray-700;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors;

  &:focus-visible {
    @apply outline-none ring-2 ring-inset ring-blue-600 dark:ring-blue-400;
  }
}

.level-chips__chip--on {
  @apply font-medium text-gray-800 dark:text-gray-100;
}

.level-chips__check {
  @apply w-2.5 text-center;
}

.level-chips__count {
  @apply font-mono tabular-nums text-2xs text-gray-500 dark:text-gray-400;
}

.level-chips__chip--on.level-chips__chip--warning .level-chips__count {
  @apply text-amber-700 dark:text-amber-400;
}

.level-chips__chip--on.level-chips__chip--error .level-chips__count,
.level-chips__chip--on.level-chips__chip--critical .level-chips__count,
.level-chips__chip--on.level-chips__chip--emergency .level-chips__count {
  @apply text-red-700 dark:text-red-400;
}
</style>
