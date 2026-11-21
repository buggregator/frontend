<script lang="ts" setup>
import { computed, reactive, watch } from 'vue'
import { copyTextToClipboard } from '@/shared/lib/clipboard'
import { formatFileSize } from '@/shared/lib/formats/format-file-size'
import { REST_API_URL } from '@/shared/lib/io'
import { useEvents } from '@/shared/lib/use-events'
import { showToast } from '@/shared/lib/use-keyboard-nav'
import { CodeSnippet, EventDetailSection, TableBase, TableBaseRow } from '@/shared/ui'
import { formatClock } from '../../lib/format'
import { buildBroadcastCurl, dataBytes, hasJsonData, isDataCut } from '../../lib/payload'
import { diffPayload, jsonShort, lostValuePaths } from '../../lib/payload-diff'
import type { BroadcastEvent, BroadcastPayload } from '../../types'
import { BroadcastChannelTag } from '../broadcast-channel-tag'
import { BroadcastProblems } from '../broadcast-problems'
import '../broadcast-theme.css'

// An unfolded row of the console (#6614): the data, what changed since the
// previous event of this name on this channel, the problems and the details.
type Props = {
  event: BroadcastEvent
  previous?: BroadcastEvent | null
  // The channel the two are compared on.
  channel?: string | null
}

const props = withDefaults(defineProps<Props>(), { previous: null, channel: null })

const { events } = useEvents()

// A preview keeps 2 KB of the data: the full events, when cut.
const full = reactive<Record<string, BroadcastPayload | 'loading' | 'failed'>>({})
const load = async (e: BroadcastEvent | null) => {
  if (!e || !isDataCut(e.payload) || full[e.uuid]) return
  full[e.uuid] = 'loading'
  try {
    const got = (await events.getItem(e.uuid)) as BroadcastEvent | null
    full[e.uuid] = got?.payload ?? 'failed'
  } catch {
    full[e.uuid] = 'failed'
  }
}
// Started in setup (no first render that takes the cut data for the event),
// and again for every event or previous one the row is given.
watch(
  () => [props.event, props.previous] as const,
  ([event, previous]) => {
    load(event)
    load(previous)
  },
  { immediate: true }
)

const payloadOf = (e: BroadcastEvent): BroadcastPayload => {
  const f = full[e.uuid]
  return typeof f === 'object' ? f : e.payload
}
const isLoading = computed(
  () => full[props.event.uuid] === 'loading' || (!!props.previous && full[props.previous.uuid] === 'loading')
)
const loadFailed = computed(
  () => full[props.event.uuid] === 'failed' || (!!props.previous && full[props.previous.uuid] === 'failed')
)
const payload = computed(() => payloadOf(props.event))
const isJson = computed(() => hasJsonData(payload.value))
const isCut = computed(() => isDataCut(payload.value))
// Only the whole data is copied: not the 2 KB of a preview.
const canCopy = computed(() => !isCut.value)
// The shared viewer: pretty JSON, or the data as it came.
const code = computed(() =>
  isJson.value ? JSON.stringify(payload.value.data_json, null, 2) : `${payload.value.data}${isCut.value ? '…' : ''}`
)

const previousPayload = computed(() => (props.previous ? payloadOf(props.previous) : null))
const canCompare = computed(
  () => !!previousPayload.value && isJson.value && hasJsonData(previousPayload.value) && !isCut.value && !isDataCut(previousPayload.value)
)
const changes = computed(() =>
  canCompare.value ? diffPayload(previousPayload.value?.data_json, payload.value.data_json) : []
)
const lost = computed(() => lostValuePaths(changes.value))

const name = computed(() => props.event.payload.name)

const signature = computed(
  () =>
    ({
      valid: '✓ valid',
      invalid: '✕ does not match the configured secret',
      not_checked: 'not checked (no secret for this key in broadcast.apps)'
    })[payload.value.signature] ?? payload.value.signature
)

const upstreamText = computed(() => {
  const u = payload.value.upstream
  if (!u) return ''
  if (u.error) return `✕ ${u.url}: ${u.error}`
  return `${u.url}: ${u.status ?? '?'}, ${u.time_ms} ms`
})

const copyCurl = () =>
  copyTextToClipboard(buildBroadcastCurl(REST_API_URL || window.location.origin, payload.value)).then(() =>
    showToast('cURL copied')
  )
</script>

<template>
  <div class="bc-detail">
    <EventDetailSection
      class="bc-detail__col"
      title="Payload"
    >
      <template #actions>
        <span class="bc-detail__faint">{{ formatFileSize(payload.size) }}</span>
      </template>
      <BroadcastProblems
        class="bc-detail__problems"
        :payload="payload"
      />
      <!-- A cut preview is not copied: its copy button is hidden. -->
      <CodeSnippet
        class="bc-detail__code"
        :class="{ 'bc-detail__code--cut': isCut }"
        :code="code"
        :language="isJson ? 'json' : 'plaintext'"
        data-test="bc-payload"
      />
      <p
        v-if="isCut && !isLoading"
        class="bc-detail__faint"
      >
        The first {{ formatFileSize(dataBytes(payload.data)) }} of {{ formatFileSize(payload.size) }}: the full event did not load.
      </p>
    </EventDetailSection>

    <EventDetailSection
      class="bc-detail__col"
      title="Changes"
    >
      <p
        v-if="previous && channel"
        class="bc-detail__faint"
      >
        vs the previous {{ name }} on {{ channel }}, {{ formatClock(previous.timestamp) }}
      </p>
      <p
        v-if="isLoading"
        class="bc-detail__note"
      >
        Loading the full events…
      </p>
      <p
        v-else-if="!previous"
        class="bc-detail__note"
        data-test="bc-first"
      >
        The first {{ name }}<template v-if="channel">
          on {{ channel }}
        </template>: nothing to compare with yet.
      </p>
      <p
        v-else-if="loadFailed"
        class="bc-detail__note"
        data-test="bc-load-failed"
      >
        Could not load the full event: only the first 2 KB are here, nothing to compare.
      </p>
      <p
        v-else-if="!canCompare"
        class="bc-detail__note"
      >
        One of the two is not JSON: compare them by eye.
      </p>
      <p
        v-else-if="!changes.length"
        class="bc-detail__note"
        data-test="bc-same"
      >
        Same data as the previous {{ name }}.
      </p>
      <template v-else>
        <ul
          class="bc-detail__changes"
          data-test="bc-changes"
        >
          <li
            v-for="c in changes"
            :key="c.path"
            :class="`bc-detail__change--${c.kind}`"
          >
            <span
              class="bc-detail__change-mark"
              aria-hidden="true"
            >{{ c.kind === 'changed' ? '~' : c.kind === 'added' ? '+' : '−' }}</span>
            <span class="bc-detail__change-path">{{ c.path || '(payload)' }}</span>:
            <template v-if="c.kind === 'changed'">
              <span class="bc-detail__change-old">{{ jsonShort(c.before) }}</span> → {{ jsonShort(c.after) }}
            </template>
            <template v-else-if="c.kind === 'added'">
              added {{ jsonShort(c.after) }}
            </template>
            <template v-else>
              removed, was {{ jsonShort(c.before) }}
            </template>
          </li>
        </ul>
        <p
          v-if="lost.length"
          class="bc-detail__lost"
        >
          <span
            class="bc-detail__lost-icon"
            aria-hidden="true"
          >!</span>
          <span>A listener that reads
            <code
              v-for="(p, i) in lost"
              :key="p"
            >e.{{ p }}<template v-if="i < lost.length - 1">, </template></code>
            gets nothing to show.</span>
        </p>
      </template>
    </EventDetailSection>

    <EventDetailSection
      class="bc-detail__full"
      title="Details"
    >
      <template #actions>
        <button
          type="button"
          class="bc-detail__btn"
          :disabled="!canCopy"
          @click="copyCurl"
        >
          Copy as cURL
        </button>
      </template>
      <TableBase class="bc-detail__meta">
        <TableBaseRow
          v-if="payload.channels.length > 1"
          title="Sent to"
        >
          <span class="bc-detail__tags">
            <BroadcastChannelTag
              v-for="c in payload.channels"
              :key="c"
              :channel="c"
            />
          </span>
        </TableBaseRow>
        <TableBaseRow
          v-if="payload.socket_id"
          title="Except socket"
        >
          {{ payload.socket_id }} <span class="bc-detail__faint">(toOthers)</span>
        </TableBaseRow>
        <TableBaseRow
          v-if="payload.batch_size"
          title="Batch"
        >
          one of {{ payload.batch_size }} events of one batch_events call
        </TableBaseRow>
        <TableBaseRow title="Signature">
          <span :class="{ 'bc-detail__bad': payload.signature === 'invalid' }">{{ signature }}</span>
        </TableBaseRow>
        <TableBaseRow title="App / key">
          {{ payload.app_id }} / {{ payload.auth_key || '—' }}
        </TableBaseRow>
        <TableBaseRow
          v-if="payload.library"
          title="Sent by"
        >
          {{ payload.library }}
        </TableBaseRow>
        <TableBaseRow
          v-if="payload.info"
          title="Info"
        >
          {{ payload.info }}
        </TableBaseRow>
        <TableBaseRow
          v-if="payload.upstream"
          title="Forwarded"
        >
          <span :class="{ 'bc-detail__bad': !!payload.upstream.error }">{{ upstreamText }}</span>
        </TableBaseRow>
      </TableBase>
    </EventDetailSection>
  </div>
</template>

<style lang="scss" scoped>
.bc-detail {
  @apply grid gap-3 px-4 pt-3 pb-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  column-gap: 16px;

  @media (max-width: 767px) {
    @apply px-3;
    grid-template-columns: minmax(0, 1fr);
  }
}

.bc-detail__col {
  @apply min-w-0;

  :deep(.event-section__content) {
    @apply gap-2;
  }
}

.bc-detail__faint {
  @apply text-xs font-normal text-gray-600 dark:text-gray-400;
}

.bc-detail__note {
  @apply text-xs text-gray-600 dark:text-gray-400;
}

.bc-detail__code :deep(pre) {
  max-height: 420px;
  overflow: auto;
}

// The 2 KB of a preview are not copied.
.bc-detail__code--cut :deep(.code-snippet__copy) {
  display: none;
}

.bc-detail__changes {
  @apply font-mono rounded border py-2 pr-3;
  @apply bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200;
  font-size: 12px;
  line-height: 1.65;
  word-break: break-word;

  li {
    padding-left: 22px;
    text-indent: -22px;
  }
}

.bc-detail__change-mark {
  @apply font-bold inline-block text-center;
  width: 22px;
  text-indent: 0;
}

.bc-detail__change--changed {
  background: var(--bc-chg);

  .bc-detail__change-mark {
    color: var(--bc-chg-mark);
  }
}

.bc-detail__change--added {
  background: var(--bc-add);

  .bc-detail__change-mark {
    color: var(--bc-add-mark);
  }
}

.bc-detail__change--removed .bc-detail__change-mark {
  color: var(--bc-err);
}

.bc-detail__change-path {
  color: var(--bc-key);
  font-weight: 600;
}

.bc-detail__change-old {
  @apply line-through text-gray-600 dark:text-gray-400;
}

.bc-detail__lost {
  @apply flex gap-2 items-start px-2.5 py-1.5 rounded border text-xs text-gray-800 dark:text-gray-200;
  border-color: var(--bc-warn);

  code {
    @apply font-mono;
  }
}

.bc-detail__lost-icon {
  @apply font-mono font-bold flex-none;
  color: var(--bc-warn);
}

.bc-detail__full {
  @apply min-w-0;
  grid-column: 1 / -1;
}

.bc-detail__tags {
  @apply flex flex-wrap gap-1;
}

.bc-detail__bad {
  color: var(--bc-err);
}

.bc-detail__btn {
  @apply inline-flex items-center h-8 px-3 rounded border text-xs font-medium;
  @apply bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700;

  &:focus-visible {
    outline: 2px solid var(--bc-focus);
    outline-offset: 2px;
  }

  &:disabled {
    @apply opacity-50 cursor-not-allowed;
  }

  @media (max-width: 639px) {
    @apply h-11;
  }
}
</style>
