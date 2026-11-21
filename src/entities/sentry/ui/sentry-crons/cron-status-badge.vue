<script lang="ts" setup>
import { computed } from 'vue'
import { CRON_STATUS, type CronDisplayStatus } from '../../lib/crons'

// A status as an icon and a word (#6600): ✓ OK, ✕ Failed, ! Missed …
const props = defineProps<{ status: CronDisplayStatus }>()
const meta = computed(() => CRON_STATUS[props.status])
</script>

<template>
  <span
    class="cron-status"
    :class="`cron-status--${meta.tone}`"
    :title="meta.hint"
    :data-status="status"
  >
    <span
      class="cron-status__icon"
      aria-hidden="true"
    >{{ meta.icon }}</span>{{ meta.label }}
  </span>
</template>

<style lang="scss" scoped>
@use 'src/entities/sentry/ui/sentry-crons/cron-tokens' as cr;

.cron-status {
  @include cr.tokens;

  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.cron-status__icon {
  width: 14px;
  text-align: center;
  font-family: 'JetBrains Mono Variable', ui-monospace, monospace;
  font-weight: 700;
  font-variant-ligatures: none;
}

.cron-status--ok {
  color: var(--cr-ok);
}

.cron-status--err {
  color: var(--cr-err);
}

.cron-status--miss {
  color: var(--cr-miss);
}

.cron-status--run {
  color: var(--cr-run);
}

.cron-status--wait {
  color: var(--cr-wait);
}
</style>
