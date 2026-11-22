<script lang="ts" setup>
import { computed } from 'vue'
import { monologLevelKey } from '../../lib/log-line'

// The level of a record in its colour: a badge on the record page, a mark
// and the word in a log line. One palette for both.
type Props = {
  level: number
  name?: string
  variant?: 'badge' | 'inline'
}

const props = withDefaults(defineProps<Props>(), { name: '', variant: 'badge' })

const key = computed(() => monologLevelKey(props.level, props.name))
const MARKS: Record<string, string> = { warning: '▲', notice: '●' }
const mark = computed(() =>
  ['error', 'critical', 'alert', 'emergency'].includes(key.value) ? '✕' : (MARKS[key.value] ?? '·')
)
</script>

<template>
  <span
    class="monolog-level"
    :class="[`monolog-level--${variant}`, `monolog-level--${key}`]"
    :data-level="key"
  >
    <span
      v-if="variant === 'inline'"
      class="monolog-level__mark"
      aria-hidden="true"
    >{{
      mark
    }}</span>
    {{ name || key.toUpperCase() }}
  </span>
</template>

<style lang="scss" scoped>
// One colour pair per level: --lvl for the text, --lvl-bg for the badge.
.monolog-level {
  @apply inline-flex items-center uppercase;
  color: var(--lvl);
}

.monolog-level--badge {
  @apply self-start px-2.5 py-1 rounded text-xs font-bold tracking-wide;
  background: var(--lvl-bg);
}

.monolog-level--inline {
  @apply gap-1.5 text-2xs font-semibold tracking-wide whitespace-nowrap;
}

.monolog-level__mark {
  @apply w-2.5 text-center;
}

.monolog-level--debug {
  --lvl: theme('colors.gray.600');
  --lvl-bg: theme('colors.gray.100');
}
.monolog-level--info {
  --lvl: theme('colors.blue.600');
  --lvl-bg: theme('colors.blue.50');
}
.monolog-level--notice {
  --lvl: theme('colors.cyan.700');
  --lvl-bg: theme('colors.cyan.50');
}
.monolog-level--warning {
  --lvl: theme('colors.amber.700');
  --lvl-bg: theme('colors.amber.50');
}
.monolog-level--error {
  --lvl: theme('colors.red.700');
  --lvl-bg: theme('colors.red.50');
}
.monolog-level--alert {
  --lvl: theme('colors.orange.700');
  --lvl-bg: theme('colors.orange.50');
}
.monolog-level--critical,
.monolog-level--emergency {
  --lvl: theme('colors.red.700');
  --lvl-bg: theme('colors.red.100');
}

// Dark theme: the same pairs, lighter.
.monolog-level--debug:is(.dark *) {
  --lvl: theme('colors.gray.400');
  --lvl-bg: rgb(75 85 99 / 0.5);
}
.monolog-level--info:is(.dark *) {
  --lvl: theme('colors.blue.400');
  --lvl-bg: rgb(59 130 246 / 0.1);
}
.monolog-level--notice:is(.dark *) {
  --lvl: theme('colors.cyan.400');
  --lvl-bg: rgb(6 182 212 / 0.1);
}
.monolog-level--warning:is(.dark *) {
  --lvl: theme('colors.amber.400');
  --lvl-bg: rgb(245 158 11 / 0.1);
}
.monolog-level--error:is(.dark *) {
  --lvl: theme('colors.red.400');
  --lvl-bg: rgb(239 68 68 / 0.1);
}
.monolog-level--alert:is(.dark *) {
  --lvl: theme('colors.orange.400');
  --lvl-bg: rgb(249 115 22 / 0.1);
}
.monolog-level--critical:is(.dark *),
.monolog-level--emergency:is(.dark *) {
  --lvl: theme('colors.red.300');
  --lvl-bg: rgb(239 68 68 / 0.2);
}

.monolog-level--badge.monolog-level--emergency {
  animation: pulse-emergency 2s ease-in-out infinite;
}

@keyframes pulse-emergency {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
