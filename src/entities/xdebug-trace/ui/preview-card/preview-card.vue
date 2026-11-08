<script lang="ts" setup>
import { computed } from 'vue'
import { formatFileSize } from '@/shared/lib/formats/format-file-size'
import type { NormalizedEvent } from '@/shared/types'
import { PreviewCard } from '@/shared/ui'
import { formatSeconds, traceTitle } from '../../lib/trace-format'
import type { XdebugTrace } from '../../types'

type Props = {
  event: NormalizedEvent<XdebugTrace>
}

const props = defineProps<Props>()

const eventLink = computed(() => `/xdebug-trace/${props.event.id}`)
const title = computed(() => traceTitle(props.event.payload))
// The script goes under the title when the title is something else.
const script = computed(() => {
  const { main } = props.event.payload
  return main && main !== title.value ? main : ''
})
</script>

<template>
  <PreviewCard :event="event">
    <RouterLink
      :to="eventLink"
      class="trace-card"
    >
      <div class="trace-card__head">
        <span class="trace-card__title">{{ title }}</span>
        <span
          v-if="event.payload.truncated"
          class="trace-card__cut"
          title="The trace was cut: it hit the size limit or has no end"
        >cut</span>
      </div>
      <p
        v-if="script"
        class="trace-card__script"
      >
        {{ script }}
      </p>
      <dl class="trace-card__stats">
        <div class="trace-card__stat">
          <dt>Duration</dt>
          <dd>{{ formatSeconds(event.payload.duration) }}</dd>
        </div>
        <div class="trace-card__stat">
          <dt>Peak memory</dt>
          <dd>{{ formatFileSize(event.payload.peak_memory) }}</dd>
        </div>
        <div class="trace-card__stat">
          <dt>Calls</dt>
          <dd>{{ event.payload.calls.toLocaleString('en-US') }}</dd>
        </div>
        <div class="trace-card__stat">
          <dt>Depth</dt>
          <dd>{{ event.payload.max_depth }}</dd>
        </div>
      </dl>
    </RouterLink>
  </PreviewCard>
</template>

<style lang="scss" scoped>
.trace-card {
  @apply block p-3 rounded cursor-pointer;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border border-gray-200 dark:border-gray-700;
  @apply hover:border-gray-300 dark:hover:border-gray-600 transition-colors;
}

.trace-card__head {
  @apply flex items-start justify-between gap-2;
}

.trace-card__title {
  @apply text-sm font-mono font-medium text-gray-800 dark:text-gray-200 break-all;
}

.trace-card__cut {
  @apply text-2xs font-mono font-medium px-1.5 py-0.5 rounded flex-shrink-0;
  @apply bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400;
}

.trace-card__script {
  @apply mt-0.5 text-xs font-mono text-gray-500 dark:text-gray-400 truncate;
}

.trace-card__stats {
  @apply mt-2 flex flex-wrap gap-x-5 gap-y-1;
}

.trace-card__stat {
  @apply flex items-baseline gap-1.5 text-xs;

  dt {
    @apply text-gray-500 dark:text-gray-400;
  }

  dd {
    @apply font-mono font-medium text-gray-800 dark:text-gray-200;
  }
}
</style>
