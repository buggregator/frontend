<script lang="ts" setup>
import { ref } from 'vue'
import { EventDetailSection } from '@/shared/ui'
import { useExplain } from '../../lib/use-explain'

// «Explain this error» (concept): a button under the error, the agents'
// answers as a plain list, and a field for the next question. Hidden when
// the server has the feature off.
type Props = { eventUuid: string }

const props = defineProps<Props>()

const { status, thread, sending, error, waiting, explain, followUp } = useExplain(() => props.eventUuid)

const question = ref('')
const draft = ref('')

const start = async () => {
  if (await explain(question.value)) question.value = ''
}

const send = async () => {
  if (await followUp(draft.value)) draft.value = ''
}

const author = (m: { from: string; role?: string; project?: string }) => {
  if (m.from === 'you') return 'You'
  return [m.role, m.project].filter(Boolean).join(' · ') || 'Agent'
}

const time = (at: string) => {
  const d = new Date(at)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString()
}
</script>

<template>
  <EventDetailSection
    v-if="status?.enabled"
    title="Explain this error"
    class="explain"
    data-test="sentry-explain"
  >
    <form
      v-if="!thread"
      class="explain__form"
      @submit.prevent="start"
    >
      <input
        v-model="question"
        class="explain__input"
        type="text"
        placeholder="Optional: what do you want to know?"
        aria-label="Question for the agents"
        :disabled="sending"
      >
      <button
        class="explain__button"
        type="submit"
        :disabled="sending || status.status !== 'connected'"
        data-test="sentry-explain-start"
      >
        {{ sending ? 'Sending…' : 'Explain' }}
      </button>
    </form>

    <p
      v-if="!thread && status.status !== 'connected'"
      class="explain__hint"
    >
      harnsy is {{ status.status }}{{ status.reason ? `: ${status.reason}` : '' }}.
    </p>

    <ol
      v-if="thread"
      class="explain__messages"
      aria-live="polite"
    >
      <li
        v-for="(m, i) in thread.messages"
        :key="`${i}-${m.at}`"
        class="explain__message"
        :class="`explain__message--${m.from}`"
        data-test="sentry-explain-message"
      >
        <div class="explain__meta">
          <span class="explain__author">{{ author(m) }}</span>
          <span class="explain__time">{{ time(m.at) }}</span>
        </div>
        <!-- The first message is the whole error as sent: folded. -->
        <details v-if="i === 0 && m.from === 'you'">
          <summary class="explain__summary">
            The error sent to harnsy
          </summary>
          <pre class="explain__text">{{ m.text }}</pre>
        </details>
        <!-- Agent text comes from outside: plain text, escaped. -->
        <pre
          v-else
          class="explain__text"
        >{{ m.text }}</pre>
      </li>
      <li
        v-if="waiting"
        class="explain__waiting"
      >
        Waiting for an answer…
      </li>
    </ol>

    <form
      v-if="thread"
      class="explain__form"
      @submit.prevent="send"
    >
      <input
        v-model="draft"
        class="explain__input"
        type="text"
        placeholder="Ask a follow-up question"
        aria-label="Follow-up question"
        :disabled="sending"
      >
      <button
        class="explain__button"
        type="submit"
        :disabled="sending || !draft.trim()"
        data-test="sentry-explain-send"
      >
        {{ sending ? 'Sending…' : 'Send' }}
      </button>
    </form>

    <p
      v-if="error"
      class="explain__error"
      role="alert"
    >
      {{ error }}
    </p>
  </EventDetailSection>
</template>

<style lang="scss" scoped>
.explain {
  @apply mb-4 p-3 rounded-lg border border-gray-200 dark:border-gray-700;
}

.explain__form {
  @apply flex gap-2 mt-2;
}

.explain__input {
  @apply flex-1 min-w-0 px-2 py-1.5 text-sm rounded border;
  @apply bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600;
}

.explain__button {
  @apply px-3 py-1.5 text-sm rounded font-medium text-white bg-blue-600 hover:bg-blue-700;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.explain__hint,
.explain__waiting {
  @apply text-xs text-gray-500 dark:text-gray-400 mt-2;
}

.explain__messages {
  @apply flex flex-col gap-2;
}

.explain__message {
  @apply p-2 rounded text-sm;
}

.explain__message--you {
  @apply bg-gray-50 dark:bg-gray-800;
}

.explain__message--agent {
  @apply bg-blue-50 dark:bg-blue-500/10;
}

.explain__meta {
  @apply flex gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1;
}

.explain__author {
  @apply font-semibold;
}

.explain__text {
  @apply whitespace-pre-wrap break-words font-sans m-0;
}

.explain__summary {
  @apply cursor-pointer text-xs text-gray-600 dark:text-gray-300;
}

.explain__error {
  @apply text-xs text-red-700 dark:text-red-300 mt-2;
}
</style>
