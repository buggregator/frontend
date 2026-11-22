<script lang="ts" setup>
import { computed, ref } from 'vue'
import { copyTextToClipboard } from '@/shared/lib/clipboard'
import { RouteName, type ServerEvent } from '@/shared/types'
import { HighlightText } from '@/shared/ui'
import { ExpandableRow } from '@/shared/ui/expandable-row'
import {
  hasEntries,
  isMonologErrorLevel,
  monologClock,
  monologContextSummary,
  monologLevelKey,
  monologLineText,
  monologTraceId
} from '../../lib'
import type { Monolog } from '../../types'
import { MonologBody } from '../monolog-body'
import { MonologLevelBadge } from '../monolog-level'

// One Monolog record as a line of the Logs page: time, level, channel,
// message (search words marked), a short context. It unfolds into the whole
// message with context and extra, and «Same request» when the record carries
// a trace id.
type Props = {
  event: ServerEvent<Monolog>
  // Search words to mark in the message.
  terms?: string[]
  // How many lines this request wrote, when known.
  traceCount?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  terms: () => [],
  traceCount: null
})
const expanded = defineModel<boolean>('expanded', { default: false })

const payload = computed(() => props.event.payload)
const level = computed(() => monologLevelKey(payload.value.level, payload.value.level_name))
const time = computed(() => monologClock(payload.value.datetime, props.event.timestamp))
// The first line only: the row stays one line high.
const message = computed(() => (payload.value.message ?? '').split('\n', 1)[0])
const summary = computed(() => monologContextSummary(payload.value.context))
const traceId = computed(
  () => monologTraceId(payload.value) ?? props.event.facets?.trace?.[0] ?? null
)
const context = computed(() => (hasEntries(payload.value.context) ? payload.value.context : null))
const extra = computed(() => (hasEntries(payload.value.extra) ? payload.value.extra : null))

const linesLabel = computed(() =>
  props.traceCount ? `All ${props.traceCount} lines of this request` : 'All lines of this request'
)

const copied = ref<'idle' | 'done' | 'failed'>('idle')
let timer: ReturnType<typeof setTimeout> | undefined
const copy = async () => {
  clearTimeout(timer)
  try {
    await copyTextToClipboard(monologLineText(payload.value))
    copied.value = 'done'
  } catch {
    copied.value = 'failed'
  }
  timer = setTimeout(() => (copied.value = 'idle'), 2000)
}
</script>

<template>
  <ExpandableRow
    v-model:expanded="expanded"
    class="mlog-row"
    :class="{ 'mlog-row--error': isMonologErrorLevel(level) }"
    :data-level="level"
  >
    <div class="mlog-row__line">
      <time
        class="mlog-row__time"
        :datetime="payload.datetime"
      >{{ time }}</time>
      <MonologLevelBadge
        class="mlog-row__level"
        variant="inline"
        :level="payload.level"
        :name="payload.level_name"
      />
      <span
        class="mlog-row__channel"
        :title="payload.channel"
      >{{ payload.channel }}</span>
      <span
        class="mlog-row__message"
        data-test="mlog-message"
      ><HighlightText
        :text="message"
        :terms="terms"
      /></span>
      <span
        v-if="summary"
        class="mlog-row__summary"
        :title="summary"
      >{{ summary }}</span>
    </div>

    <template #details>
      <div
        class="mlog-row__details"
        data-test="mlog-details"
      >
        <MonologBody
          class="mlog-row__body"
          :message="payload.message"
          :context="context"
          :extra="extra"
        />

        <aside class="mlog-row__side">
          <section
            v-if="traceId"
            class="mlog-row__request"
            aria-label="Same request"
            data-test="mlog-same-request"
          >
            <h3 class="mlog-row__side-title">
              Same request
            </h3>
            <dl class="mlog-row__facts">
              <dt>trace</dt>
              <dd
                class="mlog-row__trace"
                :title="traceId"
              >
                {{ traceId }}
              </dd>
              <dt>logs</dt>
              <dd>
                <RouterLink
                  :to="{ name: RouteName.Logs, query: { trace: traceId, window: 'all' } }"
                  class="mlog-row__link"
                  data-test="mlog-trace-logs"
                >
                  {{ linesLabel }}
                </RouterLink>
              </dd>
              <dt>sentry</dt>
              <dd>
                <!-- Not checked first: asking for a trace Sentry lacks is a 404. -->
                <RouterLink
                  :to="{ name: RouteName.SentryTraceDetail, params: { traceId } }"
                  class="mlog-row__link"
                  title="The trace page, if the app sent this request to Sentry"
                  data-test="mlog-sentry-trace"
                >
                  This trace in Sentry
                </RouterLink>
              </dd>
            </dl>
          </section>

          <div class="mlog-row__buttons">
            <button
              type="button"
              class="mlog-row__button"
              data-test="mlog-copy"
              @click="copy"
            >
              {{
                copied === 'done' ? 'Copied' : copied === 'failed' ? 'Could not copy' : 'Copy line'
              }}
            </button>
          </div>
        </aside>
      </div>
    </template>
  </ExpandableRow>
</template>

<style lang="scss" scoped>
.mlog-row {
  @apply py-1.5 border-l-2 border-l-transparent;
}

.mlog-row--error {
  @apply border-l-red-500;
}

.mlog-row__line {
  @apply grid flex-1 min-w-0 items-baseline gap-x-3 gap-y-0.5 text-xs;
  grid-template-columns: 6.75rem 6rem 6.5rem minmax(0, 1fr) auto;
}

.mlog-row__time {
  @apply font-mono text-gray-500 dark:text-gray-400 tabular-nums whitespace-nowrap;
}

.mlog-row__channel {
  @apply font-mono truncate text-gray-600 dark:text-gray-400;
}

.mlog-row__message {
  @apply font-mono truncate text-gray-800 dark:text-gray-200;
}

.mlog-row__summary {
  @apply font-mono truncate text-2xs text-gray-500 dark:text-gray-400 max-w-[16rem] text-right;
}

// Phones and narrow panes: time and level, then the message wrapped in full.
@media (max-width: 767px) {
  .mlog-row__line {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .mlog-row__channel,
  .mlog-row__summary {
    @apply hidden;
  }

  .mlog-row__message {
    @apply col-span-2 whitespace-normal break-words;
  }
}

.mlog-row__details {
  @apply grid gap-3 pb-1;
}

@media (min-width: 1024px) {
  .mlog-row__details {
    grid-template-columns: minmax(0, 1fr) 18rem;
  }
}

.mlog-row__body {
  @apply min-w-0;
}

.mlog-row__side {
  @apply flex flex-col gap-3 min-w-0 text-xs;
}

.mlog-row__side-title {
  @apply mb-1.5 text-2xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400;
}

.mlog-row__facts {
  @apply grid gap-x-3 gap-y-1;
  grid-template-columns: auto minmax(0, 1fr);

  dt {
    @apply text-gray-500 dark:text-gray-400;
  }

  dd {
    @apply min-w-0;
  }
}

.mlog-row__trace {
  @apply font-mono truncate text-gray-700 dark:text-gray-300;
}

.mlog-row__link {
  @apply text-blue-700 dark:text-blue-300 underline underline-offset-2 hover:text-blue-900 dark:hover:text-blue-200 rounded-sm;

  &:focus-visible {
    @apply outline-none ring-2 ring-blue-600 dark:ring-blue-400;
  }
}

.mlog-row__buttons {
  @apply flex flex-wrap gap-2;
}

.mlog-row__button {
  @apply h-7 px-2.5 rounded text-xs font-medium;
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200;
  @apply hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors;

  &:focus-visible {
    @apply outline-none ring-2 ring-blue-600 dark:ring-blue-400;
  }
}
</style>
