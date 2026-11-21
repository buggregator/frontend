<script lang="ts" setup>
import type { CronStripCell } from '../../lib/crons'

// The recent runs, oldest first: filled = OK, red = failed or timed out,
// hollow amber = missed, blue = running, dashed = unknown or no runs yet.
defineProps<{ cells: CronStripCell[]; summary: string; bad?: boolean }>()
</script>

<template>
  <div class="cron-strip">
    <div
      class="cron-strip__cells"
      role="img"
      :aria-label="`Recent runs: ${summary}`"
    >
      <template v-if="cells.length">
        <span
          v-for="cell in cells"
          :key="cell.key"
          class="cron-strip__cell"
          :class="[`cron-strip__cell--${cell.tone}`, `cron-strip__cell--${cell.status}`]"
          :title="cell.title"
        />
      </template>
      <template v-else>
        <span
          v-for="i in 6"
          :key="i"
          class="cron-strip__cell cron-strip__cell--none"
        />
      </template>
    </div>
    <div
      class="cron-strip__summary"
      :class="{ 'cron-strip__summary--bad': bad }"
    >
      {{ summary }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use 'src/entities/sentry/ui/sentry-crons/cron-tokens' as cr;

.cron-strip {
  @include cr.tokens;
}

.cron-strip__cells {
  display: flex;
  gap: 2px;
  align-items: flex-end;
}

.cron-strip__cell {
  flex: none;
  width: 8px;
  height: 16px;
  border-radius: 2px;
  box-sizing: border-box;
}

.cron-strip__cell--ok {
  background: var(--cr-ok);
  opacity: 0.85;
}

.cron-strip__cell--err {
  background: var(--cr-err);
}

.cron-strip__cell--miss {
  border: 1.5px solid var(--cr-miss);
}

.cron-strip__cell--run {
  background: var(--cr-run);
  animation: cron-pulse 1.4s ease-in-out infinite;
}

.cron-strip__cell--wait,
.cron-strip__cell--none {
  background: var(--cr-track);
  border: 1px dashed var(--cr-future);
}

@keyframes cron-pulse {
  50% {
    opacity: 0.4;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cron-strip__cell--run {
    animation: none;
  }
}

.cron-strip__summary {
  @apply text-gray-500 dark:text-gray-400;

  margin-top: 4px;
  font-size: 11px;
  white-space: nowrap;
}

.cron-strip__summary--bad {
  color: var(--cr-err);
  font-weight: 600;
}
</style>
