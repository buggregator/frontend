<script lang="ts" setup>
import type { SentryLog } from '../../types'
import SentryLogRow from './sentry-log-row.vue'

type Props = {
  logs: SentryLog[]
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false
})

// The level filter sits in the Sentry header (#5980); the server applies it.
</script>

<template>
  <div class="logs-list">
    <div class="logs-list__rows">
      <SentryLogRow
        v-for="log in logs"
        :key="log.id"
        :log="log"
      />

      <div
        v-if="loading"
        class="logs-list__status"
      >
        Loading...
      </div>

      <div
        v-if="!loading && logs.length === 0"
        class="logs-list__status"
      >
        No logs match the selected filter.
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.logs-list {
  @apply flex flex-col;
}

.logs-list__rows {
  @apply flex-1 overflow-auto;
}

.logs-list__status {
  @apply flex items-center justify-center py-8 text-xs text-gray-500 dark:text-gray-400;
}
</style>
