<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue'
import type { PageContext } from '@/shared/lib/assist'
import { MdText } from '@/shared/ui/md-text'
import type { AssistStatus, AssistThread } from './assist-api'
import { emptyAbilities, emptyTitle, initialsOf, SETUP_GUIDE_URL, suggestionsFor, timeOf } from './assist-texts'
import type { AssistState } from './use-assist-thread'

// The thread of the page on screen, or what the panel offers before the
// first question: the not-set-up help, or the empty state with three ready
// questions. The first message is the context we sent, folded.

type Props = {
  context: PageContext | null
  state: AssistState
  status: AssistStatus | null
  thread: AssistThread | null
  loading: boolean
  pending: string
  sending: boolean
  error: string
  waiting: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{ ask: [text: string]; retry: [] }>()

const messages = computed(() => props.thread?.messages ?? [])
const hasTalk = computed(() => messages.value.length > 0 || !!props.pending)
const project = computed(() => props.status?.project || 'your project')
// Agents can look themselves only through Buggregator's MCP, on and read-only.
const canLook = computed(() => !!(props.status?.mcp?.on && props.status?.mcp?.read_only))
const mcpOff = computed(() => props.state === 'connected' && !canLook.value)

// New words at the end: keep the end in view.
const scroller = ref<HTMLElement | null>(null)
watch(
  () => [messages.value.length, props.pending, props.waiting, props.error],
  async () => {
    await nextTick()
    const el = scroller.value
    if (el) el.scrollTop = el.scrollHeight
  },
  { immediate: true }
)
</script>

<template>
  <div
    ref="scroller"
    class="ap-talk"
  >
    <!-- Not set up: what this is and how to turn it on. -->
    <section
      v-if="state === 'off'"
      class="ap-talk__intro"
      aria-labelledby="ap-off-title"
    >
      <span
        class="ap-talk__badge"
        aria-hidden="true"
      >
        <svg viewBox="0 0 16 16"><path d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5c0 3.3 4.5 8.5 4.5 8.5s4.5-5.2 4.5-8.5A4.5 4.5 0 0 0 8 1.5Zm0 6.2a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4Z" /></svg>
      </span>
      <h3
        id="ap-off-title"
        class="ap-talk__title"
      >
        Agents are not connected
      </h3>
      <p class="ap-talk__text">
        This panel lets you ask your project's AI agents about what you see in Buggregator. It works through
        <strong>harnsy</strong> — the agent bus your agents run on.
      </p>
      <p class="ap-talk__note">
        Set <code>EXPLAIN_H2A_URL</code> and <code>EXPLAIN_H2A_TOKEN</code> (harnsy → Services) and restart.
      </p>
      <dl class="ap-talk__keys">
        <dt><code>explain.url</code></dt>
        <dd>or <code>EXPLAIN_H2A_URL</code> — harnsy address</dd>
        <dt><code>explain.token</code></dt>
        <dd>or <code>EXPLAIN_H2A_TOKEN</code> — token from harnsy → Services</dd>
      </dl>
      <a
        class="ap-talk__guide"
        :href="SETUP_GUIDE_URL"
        target="_blank"
        rel="noopener noreferrer"
      >Open setup guide<span class="sr-only"> (opens in a new tab)</span> ↗</a>
    </section>

    <p
      v-else-if="loading && !hasTalk"
      class="ap-talk__loading"
      role="status"
    >
      Loading the thread…
    </p>

    <!-- Before the first question. -->
    <section
      v-else-if="!hasTalk"
      class="ap-talk__intro"
      aria-labelledby="ap-empty-title"
    >
      <span
        class="ap-talk__badge"
        aria-hidden="true"
      >
        <svg viewBox="0 0 16 16"><path d="M8 1l1.6 4.4L14 7l-4.4 1.6L8 13l-1.6-4.4L2 7l4.4-1.6Z" /></svg>
      </span>
      <h3
        id="ap-empty-title"
        class="ap-talk__title"
      >
        {{ emptyTitle(context) }}
      </h3>
      <p class="ap-talk__text">
        Agents of project <strong>{{ project }}</strong> read this {{ context?.kind === 'event' ? 'event' : 'page' }}
        in Buggregator and answer here.
      </p>
      <p class="ap-talk__label">
        On this page they can
      </p>
      <ul class="ap-talk__abilities">
        <li
          v-for="a in emptyAbilities(context, canLook)"
          :key="a"
        >
          {{ a }}
        </li>
      </ul>
      <p class="ap-talk__label">
        Try
      </p>
      <div class="ap-talk__prompts">
        <button
          v-for="q in suggestionsFor(context, canLook)"
          :key="q"
          type="button"
          class="ap-talk__prompt"
          :disabled="state !== 'connected' || sending"
          @click="emit('ask', q)"
        >
          <span>{{ q }}</span>
          <span aria-hidden="true">›</span>
        </button>
      </div>
      <p
        v-if="mcpOff"
        class="ap-talk__hint"
      >
        Agents see only what this panel sends. Turn on Buggregator's MCP in read-only mode to let them look up other
        events themselves —
        <a
          :href="SETUP_GUIDE_URL"
          target="_blank"
          rel="noopener noreferrer"
        >how<span class="sr-only"> (opens in a new tab)</span></a>.
      </p>
    </section>

    <!-- The thread. -->
    <ol
      v-else
      class="ap-talk__list"
      aria-label="Conversation"
    >
      <li
        v-for="(m, i) in messages"
        :key="`${i}-${m.at}`"
        class="ap-msg"
        :class="`ap-msg--${m.context ? 'context' : m.from}`"
      >
        <details
          v-if="m.context"
          class="ap-msg__context"
        >
          <summary>
            <span class="ap-msg__context-label">Context sent: <strong>{{ thread?.title || context?.title }}</strong></span>
            <time
              class="ap-msg__time"
              :datetime="m.at"
            >{{ timeOf(m.at) }}</time>
          </summary>
          <pre class="ap-msg__context-text">{{ m.text }}</pre>
        </details>

        <template v-else-if="m.from === 'you'">
          <div class="ap-msg__head">
            <span
              class="ap-msg__avatar ap-msg__avatar--you"
              aria-hidden="true"
            >ME</span>
            <span class="ap-msg__who">You</span>
            <time
              class="ap-msg__time"
              :datetime="m.at"
            >{{ timeOf(m.at) }}</time>
          </div>
          <p class="ap-msg__you">
            {{ m.text }}
          </p>
        </template>

        <template v-else>
          <div class="ap-msg__head">
            <span
              class="ap-msg__avatar"
              aria-hidden="true"
            >{{ initialsOf(m.role) }}</span>
            <span class="ap-msg__who">{{ m.role || 'agent' }}</span>
            <time
              class="ap-msg__time"
              :datetime="m.at"
            >{{ timeOf(m.at) }}</time>
          </div>
          <MdText
            class="ap-msg__agent"
            :text="m.text"
          />
        </template>
      </li>

      <!-- Being sent, or failed: stays with its error and «Try again». -->
      <li
        v-if="pending"
        class="ap-msg ap-msg--you"
      >
        <div class="ap-msg__head">
          <span
            class="ap-msg__avatar ap-msg__avatar--you"
            aria-hidden="true"
          >ME</span>
          <span class="ap-msg__who">You</span>
          <span
            v-if="sending"
            class="ap-msg__time"
          >sending…</span>
        </div>
        <p class="ap-msg__you">
          {{ pending }}
        </p>
        <p
          v-if="error"
          class="ap-msg__error"
          role="alert"
        >
          <span>{{ error }}</span>
          <button
            type="button"
            class="ap-msg__retry"
            :disabled="sending || state !== 'connected'"
            @click="emit('retry')"
          >
            Try again
          </button>
        </p>
      </li>

      <li
        v-if="waiting && !pending"
        class="ap-msg ap-msg--waiting"
        role="status"
      >
        <span
          class="ap-spin"
          aria-hidden="true"
        />
        Waiting for an answer…
      </li>
    </ol>

    <!-- An error before any thread (the very first question). -->
    <p
      v-if="error && !pending && hasTalk === false"
      class="ap-msg__error"
      role="alert"
    >
      {{ error }}
    </p>
  </div>
</template>
