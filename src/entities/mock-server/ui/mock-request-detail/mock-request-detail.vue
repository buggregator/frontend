<script lang="ts" setup>
import { computed, ref } from 'vue'
import { copyTextToClipboard } from '@/shared/lib/clipboard'
import { delayText, formatJson, NEAR_REASON_TEXT, toCurl } from '../../lib/mock-format'
import { draftFromRequest, requestPath, withQuery } from '../../lib/mock-rule'
import type { MockRequestEvent, MockRule, MockRuleInput } from '../../types'
import { MockBadge } from '../mock-badge'
import { MockPath } from '../mock-path'

type Props = {
  event: MockRequestEvent
  // the rules as they are now, in match order
  rules: MockRule[]
  origin: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'edit-rule': [rule: MockRule]
  'create-rule': [draft: MockRuleInput, from: string]
}>()

const req = computed(() => props.event.payload.request)
const mock = computed(() => props.event.payload.mock)
const path = computed(() =>
  withQuery(requestPath(props.event.payload.request.uri), props.event.payload.request.query)
)
const time = computed(() =>
  new Date(props.event.timestamp * 1000).toLocaleTimeString([], { hour12: false })
)

const ruleIndex = computed(() => props.rules.findIndex((r) => r.id === mock.value.rule_id))
const rule = computed(() => props.rules[ruleIndex.value])

const near = computed(() =>
  (mock.value.near || []).map((n) => ({
    ...n,
    rule: props.rules.find((r) => r.id === n.rule_id),
    text: NEAR_REASON_TEXT[n.reason] ?? n.reason
  }))
)

const draft = computed(() =>
  draftFromRequest(req.value.method, req.value.uri, props.event.project || '')
)

const headerList = (headers: Record<string, string | string[]>) =>
  Object.entries(headers || {}).map(
    ([name, v]) => [name, Array.isArray(v) ? v.join(', ') : v] as const
  )

const query = computed(() =>
  Object.entries(req.value.query || {}).map(
    ([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)] as const
  )
)

const show = (body: string) => formatJson(body) ?? body

const copied = ref(false)
const copyCurl = async () => {
  await copyTextToClipboard(toCurl(props.origin, req.value))
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <article class="mock-request-detail">
    <header class="mock-request-detail__title">
      <MockBadge :method="req.method" />
      <MockPath
        :path="path"
        prefix
        class="mock-request-detail__path"
      />
      <span aria-hidden="true">→</span>
      <MockBadge :status="mock.status" />
      <span class="mock-request-detail__meta">
        {{ time
        }}<template v-if="mock.delay_ms"> · {{ delayText(mock.delay_ms) }} delay</template> ·
        project {{ event.project || 'default' }}
      </span>
    </header>

    <div
      v-if="mock.matched"
      class="mock-request-detail__answer"
    >
      <span class="mock-request-detail__ok">✓ Answered by</span>
      <template v-if="rule">
        <b>#{{ ruleIndex + 1 }} {{ rule.name || mock.rule_name || 'no name' }}</b>
        <MockBadge :method="rule.method" />
        <MockPath :path="rule.path" />
        <span
          v-if="rule.read_only"
          class="mock-request-detail__yaml"
        >yaml</span>
        <span class="mock-request-detail__spacer" />
        <button
          type="button"
          class="mock-request-detail__btn"
          @click="emit('edit-rule', rule)"
        >
          {{ rule.read_only ? 'Open rule' : 'Edit rule' }}
        </button>
      </template>
      <span v-else> {{ mock.rule_name || 'a rule' }} <i>(deleted since)</i> </span>
    </div>

    <p
      v-if="mock.matched && mock.template_error"
      class="mock-request-detail__template-error"
      role="alert"
    >
      <span><b>The rule's template failed</b>, so the client got {{ mock.status }}.</span>
      <code>{{ mock.template_error }}</code>
    </p>

    <template v-else>
      <div
        class="mock-request-detail__callout"
        role="note"
      >
        <b>No rule matched.</b> The client got <b>{{ mock.status }}</b> with a JSON error.
        <template v-if="near.length">
          Below: rules whose path fits, and why they did not answer.
        </template>
      </div>
      <ul
        v-if="near.length"
        class="mock-request-detail__near"
        aria-label="Why no rule matched"
      >
        <li
          v-for="n in near"
          :key="n.rule_id"
        >
          <span
            class="mock-request-detail__x"
            aria-hidden="true"
          >×</span>
          <template v-if="n.rule">
            <MockBadge :method="n.rule.method" />
            <MockPath :path="n.rule.path" />
          </template>
          <span v-else>{{ n.rule_name || n.rule_id }}</span>
          <span class="mock-request-detail__why">— {{ n.text }}</span>
        </li>
      </ul>
      <div class="mock-request-detail__actions">
        <button
          type="button"
          class="mock-request-detail__btn mock-request-detail__btn--primary"
          @click="emit('create-rule', draft, `${req.method.toUpperCase()} /mock${path}`)"
        >
          + Create rule for {{ draft.method }} {{ draft.path }}
        </button>
      </div>
    </template>

    <div class="mock-request-detail__cols">
      <section aria-label="Request">
        <h3 class="mock-request-detail__h">
          Request
        </h3>
        <template v-if="query.length">
          <h4 class="mock-request-detail__label">
            Query
          </h4>
          <dl class="mock-request-detail__kv">
            <template
              v-for="[k, v] in query"
              :key="k"
            >
              <dt>{{ k }}</dt>
              <dd>{{ v }}</dd>
            </template>
          </dl>
        </template>
        <h4 class="mock-request-detail__label">
          Headers
        </h4>
        <dl class="mock-request-detail__kv">
          <template
            v-for="[k, v] in headerList(req.headers)"
            :key="k"
          >
            <dt>{{ k }}</dt>
            <dd>{{ v }}</dd>
          </template>
        </dl>
        <template v-if="req.body">
          <h4 class="mock-request-detail__label">
            Body
          </h4>
          <pre class="mock-request-detail__code">{{ show(req.body) }}</pre>
        </template>
        <p
          v-else
          class="mock-request-detail__hint"
        >
          No body
        </p>
      </section>

      <section aria-label="Response">
        <h3 class="mock-request-detail__h">
          Response
        </h3>
        <h4 class="mock-request-detail__label">
          Headers
        </h4>
        <dl class="mock-request-detail__kv">
          <template
            v-for="[k, v] in headerList(mock.headers)"
            :key="k"
          >
            <dt>{{ k }}</dt>
            <dd>
              {{ v }}
              <span
                v-if="
                  ['content-security-policy', 'x-content-type-options'].includes(k.toLowerCase())
                "
                class="mock-request-detail__added"
              >added by Buggregator</span>
            </dd>
          </template>
        </dl>
        <h4 class="mock-request-detail__label">
          Body
        </h4>
        <pre
          v-if="mock.body"
          class="mock-request-detail__code"
        >{{ show(mock.body) }}</pre>
        <p
          v-else
          class="mock-request-detail__hint"
        >
          No body
        </p>
        <p
          v-if="mock.body_truncated"
          class="mock-request-detail__hint"
        >
          Showing the first 64 KB of {{ Math.round(mock.body_size / 1024) }} KB.
        </p>
      </section>
    </div>

    <div class="mock-request-detail__actions">
      <button
        type="button"
        class="mock-request-detail__btn"
        @click="copyCurl"
      >
        {{ copied ? 'Copied' : 'Copy as cURL' }}
      </button>
      <RouterLink
        class="mock-request-detail__btn"
        :to="`/http-dump/${event.uuid}`"
      >
        Open as HTTP dump
      </RouterLink>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.mock-request-detail {
  @apply flex flex-col gap-4 p-4 md:p-5 text-sm text-gray-800 dark:text-gray-100;
}

.mock-request-detail__title {
  @apply flex flex-wrap items-center gap-2;
}

.mock-request-detail__path {
  @apply text-sm;
}

.mock-request-detail__meta {
  @apply font-mono text-xs text-gray-500 dark:text-gray-400;
}

.mock-request-detail__answer {
  @apply flex flex-wrap items-center gap-2 p-2 rounded border border-gray-200 dark:border-gray-700 text-xs;
}

.mock-request-detail__ok {
  @apply text-green-700 dark:text-green-400;
}

.mock-request-detail__yaml {
  @apply px-1 rounded text-2xs bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400;
}

.mock-request-detail__spacer {
  @apply flex-1;
}

.mock-request-detail__callout {
  @apply p-3 rounded text-xs border border-amber-300 bg-amber-50 text-amber-900;
  @apply dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200;
}

.mock-request-detail__template-error {
  @apply flex flex-col gap-1 p-2 rounded text-xs;
  @apply bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-300;

  code {
    @apply font-mono [overflow-wrap:anywhere];
  }
}

.mock-request-detail__near {
  @apply flex flex-col rounded border border-gray-200 dark:border-gray-700;

  li {
    @apply flex flex-wrap items-center gap-2 px-3 py-2 text-xs;
    @apply border-b last:border-b-0 border-gray-200 dark:border-gray-700;
  }
}

.mock-request-detail__x {
  @apply text-red-700 dark:text-red-400 font-bold;
}

.mock-request-detail__why {
  @apply text-gray-600 dark:text-gray-300;
}

.mock-request-detail__actions {
  @apply flex flex-wrap gap-2;
}

.mock-request-detail__btn {
  @apply inline-flex items-center h-7 px-3 rounded text-xs font-medium;
  @apply border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900;
  @apply text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700;
}

.mock-request-detail__btn--primary {
  @apply bg-blue-600 border-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500;
}

.mock-request-detail__cols {
  @apply grid gap-4 lg:grid-cols-2;

  section {
    @apply flex flex-col gap-2 min-w-0;
  }
}

.mock-request-detail__h {
  @apply text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300;
}

.mock-request-detail__label {
  @apply text-xs font-medium text-gray-600 dark:text-gray-300;
}

.mock-request-detail__kv {
  @apply grid gap-x-3 rounded border border-gray-200 dark:border-gray-700 font-mono text-xs;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);

  dt,
  dd {
    @apply px-2 py-1 border-b border-gray-200 dark:border-gray-700 min-w-0;
    overflow-wrap: anywhere;
  }

  dt {
    @apply text-gray-600 dark:text-gray-300;
  }
}

.mock-request-detail__added {
  @apply ml-1 px-1 rounded font-sans text-2xs bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300;
}

.mock-request-detail__code {
  @apply p-3 rounded font-mono text-xs overflow-auto max-h-96 whitespace-pre-wrap;
  @apply bg-gray-100 dark:bg-gray-900;
  overflow-wrap: anywhere;
}

.mock-request-detail__hint {
  @apply text-xs text-gray-500 dark:text-gray-400;
}
</style>
