<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { SOURCE_LABEL, formatAttrValue, otelException, splitOtelAttributes } from '../../lib/otel'
import type { SentrySpan } from '../../types'

// One span opened in the waterfall (#6523, design A-2 / A-5 / A-6): the
// exception first, then Attributes / Events / Links / Resource. On a phone it
// is a full-screen sheet over the list.
type Props = {
  span: SentrySpan
  traceId?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

type Tab = 'overview' | 'attributes' | 'events' | 'links' | 'resource'

const parts = computed(() => splitOtelAttributes(props.span.attributes))
const exception = computed(() => otelException(parts.value.events))
// Go and Java stacks run to dozens of lines: the first few, the rest on demand.
const STACK_PREVIEW = 8
const stackLines = computed(() => (exception.value?.stacktrace ?? '').split('\n'))
const fullStack = ref(false)
const stackShown = computed(() =>
  fullStack.value ? stackLines.value.join('\n') : stackLines.value.slice(0, STACK_PREVIEW).join('\n')
)

const sourceLabel = computed(() => (props.span.source ? SOURCE_LABEL[props.span.source] : ''))

const attrEntries = computed(() => Object.entries(parts.value.attributes))
const resourceEntries = computed(() => Object.entries(parts.value.resource))

const RESOURCE_PREVIEW = 4
const ATTR_PREVIEW = 8

const spanRows = computed(() =>
  [
    ['trace_id', props.traceId ?? ''],
    ['span_id', props.span.span_id],
    ['parent_span_id', props.span.parent_span_id ?? ''],
    ['kind', parts.value.kind ?? ''],
    ['status', props.span.status ?? ''],
    ['peer_address', props.span.peer_address ?? ''],
    ['start', `+${props.span.start_offset_ms} ms`],
    ['duration', `${props.span.duration_ms} ms`],
    ['scope', parts.value.scope ? [parts.value.scope.name, parts.value.scope.version].filter(Boolean).join(' ') : '']
  ].filter(([, v]) => v !== '')
)

const tabs = computed(() => {
  const list: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'attributes', label: 'Attributes', count: attrEntries.value.length }
  ]
  // A Sentry SDK span has no events, links or resource: no empty tabs for it.
  if (props.span.source === 'otel') {
    list.push(
      { id: 'events', label: 'Events', count: parts.value.events.length },
      { id: 'links', label: 'Links', count: parts.value.links.length },
      { id: 'resource', label: 'Resource', count: resourceEntries.value.length }
    )
  }
  return list
})

const active = ref<Tab>('overview')
const uid = useId()
const tabButtons = ref<HTMLButtonElement[]>([])

const select = (id: Tab) => {
  active.value = id
}

// Arrow keys move between tabs, as in the setup help tabs.
const onTabKey = async (e: KeyboardEvent, i: number) => {
  const n = tabs.value.length
  let next = -1
  if (e.key === 'ArrowRight') next = (i + 1) % n
  else if (e.key === 'ArrowLeft') next = (i - 1 + n) % n
  else if (e.key === 'Home') next = 0
  else if (e.key === 'End') next = n - 1
  if (next < 0) return
  e.preventDefault()
  select(tabs.value[next].id)
  await nextTick()
  tabButtons.value[next]?.focus()
}

const title = computed(() => props.span.description || props.span.op)
const subtitle = computed(() =>
  [props.span.service_name, parts.value.kind, `${props.span.duration_ms} ms`].filter(Boolean).join(' · ')
)

// Phone: a sheet over the list; Esc and the close button bring focus back.
const closeBtn = ref<HTMLButtonElement | null>(null)
const isPhone = () => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 639px)').matches
const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => {
  document.addEventListener('keydown', onKey)
  if (isPhone()) closeBtn.value?.focus()
})
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <section
    class="span-details"
    :aria-label="`Span ${title}`"
    data-test="span-details"
  >
    <header class="span-details__head">
      <button
        ref="closeBtn"
        type="button"
        class="span-details__close"
        aria-label="Close span details"
        @click="emit('close')"
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M10 3L5 8l5 5"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span>Spans</span>
      </button>
      <div class="span-details__heading">
        <span class="span-details__title">{{ title }}</span>
        <span class="span-details__sub">{{ subtitle }}</span>
        <span
          v-if="span.is_error"
          class="span-details__error"
        >Error</span>
      </div>
      <span
        v-if="sourceLabel"
        class="span-details__source"
        data-test="span-source"
      >{{ sourceLabel }}</span>
    </header>

    <div
      class="span-details__tabs"
      role="tablist"
      aria-label="Span details"
    >
      <button
        v-for="(tab, i) in tabs"
        :id="`${uid}-tab-${tab.id}`"
        :key="tab.id"
        ref="tabButtons"
        type="button"
        role="tab"
        class="span-details__tab"
        :class="{ 'span-details__tab--active': active === tab.id }"
        :aria-selected="active === tab.id"
        :aria-controls="`${uid}-panel`"
        :tabindex="active === tab.id ? 0 : -1"
        :data-test="`span-tab-${tab.id}`"
        @click="select(tab.id)"
        @keydown="onTabKey($event, i)"
      >
        {{ tab.label }}<span
          v-if="tab.count !== undefined"
          class="span-details__count"
        >{{ tab.count }}</span>
      </button>
    </div>

    <div
      :id="`${uid}-panel`"
      role="tabpanel"
      :aria-labelledby="`${uid}-tab-${active}`"
      class="span-details__panel"
    >
      <!-- Overview: the exception large, then attributes | span + resource -->
      <div
        v-if="active === 'overview'"
        class="span-details__overview"
      >
        <div class="span-details__col">
          <div
            v-if="exception"
            class="span-details__exception"
            data-test="span-exception"
          >
            <div class="span-details__ex-type">
              exception · {{ exception.type }}
            </div>
            <div class="span-details__ex-msg">
              {{ exception.message }}
            </div>
            <pre
              v-if="exception.stacktrace"
              class="span-details__ex-stack"
              data-test="span-stack"
            >{{ stackShown }}</pre>
            <button
              v-if="stackLines.length > STACK_PREVIEW"
              type="button"
              class="span-details__more"
              :aria-expanded="fullStack"
              @click="fullStack = !fullStack"
            >
              {{ fullStack ? 'Show less' : `Show full stack (${stackLines.length} lines)` }}
            </button>
            <div class="span-details__ex-note">
              span event «exception»
            </div>
          </div>

          <div
            v-if="attrEntries.length"
            class="span-details__block"
          >
            <div class="span-details__block-title">
              Attributes
            </div>
            <dl class="span-details__table">
              <div
                v-for="[key, val] in attrEntries.slice(0, ATTR_PREVIEW)"
                :key="key"
                class="span-details__row"
              >
                <dt>{{ key }}</dt>
                <dd>{{ formatAttrValue(val) }}</dd>
              </div>
            </dl>
            <button
              v-if="attrEntries.length > ATTR_PREVIEW"
              type="button"
              class="span-details__more"
              @click="select('attributes')"
            >
              +{{ attrEntries.length - ATTR_PREVIEW }} more in Attributes
            </button>
          </div>
        </div>

        <div class="span-details__col">
          <div class="span-details__block">
            <div class="span-details__block-title">
              Span
            </div>
            <dl class="span-details__table">
              <div
                v-for="[key, val] in spanRows"
                :key="key"
                class="span-details__row"
              >
                <dt>{{ key }}</dt>
                <dd>{{ val }}</dd>
              </div>
            </dl>
          </div>

          <div
            v-if="resourceEntries.length"
            class="span-details__block"
          >
            <div class="span-details__block-title">
              Resource
            </div>
            <dl class="span-details__table">
              <div
                v-for="[key, val] in resourceEntries.slice(0, RESOURCE_PREVIEW)"
                :key="key"
                class="span-details__row"
              >
                <dt>{{ key }}</dt>
                <dd>{{ formatAttrValue(val) }}</dd>
              </div>
            </dl>
            <button
              v-if="resourceEntries.length > RESOURCE_PREVIEW"
              type="button"
              class="span-details__more"
              @click="select('resource')"
            >
              +{{ resourceEntries.length - RESOURCE_PREVIEW }} more in Resource
            </button>
          </div>
        </div>
      </div>

      <dl
        v-else-if="active === 'attributes' || active === 'resource'"
        class="span-details__table span-details__block"
      >
        <div
          v-for="[key, val] in active === 'attributes' ? attrEntries : resourceEntries"
          :key="key"
          class="span-details__row"
        >
          <dt>{{ key }}</dt>
          <dd>{{ formatAttrValue(val) }}</dd>
        </div>
        <p
          v-if="!(active === 'attributes' ? attrEntries : resourceEntries).length"
          class="span-details__none"
        >
          None.
        </p>
      </dl>

      <div
        v-else-if="active === 'events'"
        class="span-details__list"
      >
        <div
          v-for="(ev, i) in parts.events"
          :key="i"
          class="span-details__block"
        >
          <div class="span-details__block-title">
            {{ ev.name }}<span
              v-if="ev.time"
              class="span-details__time"
            > · {{ ev.time }}</span>
          </div>
          <dl class="span-details__table">
            <div
              v-for="(val, key) in ev.attributes"
              :key="String(key)"
              class="span-details__row"
            >
              <dt>{{ key }}</dt>
              <dd>{{ formatAttrValue(val) }}</dd>
            </div>
          </dl>
        </div>
        <p
          v-if="!parts.events.length"
          class="span-details__none"
        >
          No events.
        </p>
      </div>

      <div
        v-else
        class="span-details__list"
      >
        <div
          v-for="(link, i) in parts.links"
          :key="i"
          class="span-details__block"
        >
          <dl class="span-details__table">
            <div class="span-details__row">
              <dt>trace_id</dt>
              <dd>{{ link.trace_id }}</dd>
            </div>
            <div class="span-details__row">
              <dt>span_id</dt>
              <dd>{{ link.span_id }}</dd>
            </div>
            <div
              v-for="(val, key) in link.attributes"
              :key="String(key)"
              class="span-details__row"
            >
              <dt>{{ key }}</dt>
              <dd>{{ formatAttrValue(val) }}</dd>
            </div>
          </dl>
        </div>
        <p
          v-if="!parts.links.length"
          class="span-details__none"
        >
          No links.
        </p>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.span-details {
  @apply rounded border border-gray-200 dark:border-gray-700;
  @apply bg-white dark:bg-gray-800 text-xs cursor-auto;
}

.span-details__head {
  @apply flex items-start gap-2 px-3 py-2;
  @apply border-b border-gray-200 dark:border-gray-700;
}

.span-details__close {
  @apply hidden;
}

.span-details__heading {
  @apply flex flex-wrap items-baseline gap-x-2 gap-y-0.5 flex-1 min-w-0;
}

.span-details__title {
  @apply font-mono font-semibold text-gray-900 dark:text-gray-100 break-all;
}

.span-details__sub {
  @apply font-mono text-2xs text-gray-600 dark:text-gray-400;
}

.span-details__error {
  @apply text-2xs font-semibold text-red-600 dark:text-red-400;
}

.span-details__source {
  @apply flex-shrink-0 px-1.5 py-0.5 rounded font-mono text-2xs;
  @apply text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600;
}

.span-details__tabs {
  @apply flex gap-1 px-2 overflow-x-auto;
  @apply border-b border-gray-200 dark:border-gray-700;
}

.span-details__tab {
  @apply px-2 py-2 -mb-px whitespace-nowrap border-b-2 border-transparent;
  @apply text-gray-600 dark:text-gray-400;
  @apply hover:text-gray-900 dark:hover:text-gray-100;
  @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500;
}

.span-details__tab--active {
  @apply border-blue-500 text-gray-900 dark:text-gray-100 font-medium;
}

.span-details__count {
  @apply ml-1 text-gray-600 dark:text-gray-400 font-normal;
}

.span-details__panel {
  @apply p-3;
}

.span-details__overview {
  @apply grid gap-3;
}

@media (min-width: 1024px) {
  .span-details__overview {
    @apply grid-cols-2;
  }
}

.span-details__col,
.span-details__list {
  @apply flex flex-col gap-3 min-w-0;
}

.span-details__exception {
  @apply rounded p-3;
  @apply bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30;
}

.span-details__ex-type {
  @apply font-mono font-semibold text-sm text-red-700 dark:text-red-300 break-all;
}

.span-details__ex-msg {
  @apply mt-1 font-mono text-sm text-gray-900 dark:text-gray-100 break-words;
}

.span-details__ex-stack {
  @apply mt-2 mb-0 font-mono text-2xs whitespace-pre-wrap break-all;
  @apply text-gray-700 dark:text-gray-300;
}

.span-details__ex-note {
  @apply mt-2 text-2xs text-gray-600 dark:text-gray-400;
}

.span-details__block-title {
  @apply mb-1 text-2xs font-medium text-gray-600 dark:text-gray-400;
}

.span-details__time {
  @apply font-mono;
}

.span-details__table {
  @apply m-0 divide-y divide-gray-200 dark:divide-gray-700;
}

.span-details__row {
  @apply flex gap-3 py-1.5 text-2xs;

  dt {
    @apply w-2/5 flex-shrink-0 font-mono text-gray-600 dark:text-gray-400 break-all;
  }

  dd {
    @apply m-0 flex-1 min-w-0 font-mono text-gray-800 dark:text-gray-200 break-all;
  }
}

.span-details__more {
  @apply mt-1 text-2xs text-blue-600 dark:text-blue-400 hover:underline;
}

.span-details__none {
  @apply m-0 py-2 text-2xs text-gray-600 dark:text-gray-400;
}

/* Phone: a full-screen sheet over the span list (A-6). */
@media (max-width: 639px) {
  .span-details {
    @apply fixed inset-0 z-50 overflow-y-auto rounded-none border-0;
  }

  .span-details__head {
    @apply sticky top-0 z-10 flex-wrap bg-white dark:bg-gray-800;
  }

  .span-details__close {
    @apply inline-flex items-center gap-1 min-h-[44px] pr-2 -ml-1 w-full;
    @apply text-sm text-blue-600 dark:text-blue-400;

    svg {
      @apply w-4 h-4;
    }
  }
}
</style>
