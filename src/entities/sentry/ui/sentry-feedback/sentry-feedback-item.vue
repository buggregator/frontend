<script lang="ts" setup>
import moment from 'moment'
import { computed } from 'vue'
import type { SentryFeedback } from '../../types'

type Props = {
  item: SentryFeedback
  // The Feedback tab links each entry to its error; the error page does not.
  showError?: boolean
}

const props = withDefaults(defineProps<Props>(), { showError: false })

const when = computed(() => moment(props.item.received_at))
const whenText = computed(() => when.value.fromNow())
const whenTitle = computed(() => when.value.format('DD.MM.YYYY HH:mm:ss'))

const who = computed(() => props.item.name || props.item.email || 'Anonymous')

// Only web addresses become links: the text came from a browser form.
const pageUrl = computed(() => (/^https?:\/\//i.test(props.item.url) ? props.item.url : ''))

// The error page route takes the event id without dashes.
const errorLink = computed(() =>
  props.item.event_id ? `/sentry/event/${props.item.event_id.replace(/-/g, '')}` : ''
)
</script>

<template>
  <article
    class="feedback-item"
    data-test="sentry-feedback-item"
  >
    <header class="feedback-item__head">
      <span
        class="feedback-item__avatar"
        aria-hidden="true"
      >{{ who.charAt(0).toUpperCase() }}</span>
      <span class="feedback-item__who">
        <span class="feedback-item__name">{{ who }}</span>
        <a
          v-if="item.email && item.name"
          :href="`mailto:${item.email}`"
          class="feedback-item__email"
        >{{ item.email }}</a>
      </span>
      <time
        class="feedback-item__time"
        :datetime="item.received_at"
        :title="whenTitle"
      >{{ whenText }}</time>
    </header>

    <p
      v-if="item.message"
      class="feedback-item__message"
    >
      {{ item.message }}
    </p>
    <p
      v-else
      class="feedback-item__message feedback-item__message--empty"
    >
      No message
    </p>

    <footer
      v-if="pageUrl || item.url || showError"
      class="feedback-item__foot"
    >
      <span
        v-if="item.url"
        class="feedback-item__url"
      >
        On
        <a
          v-if="pageUrl"
          :href="pageUrl"
          target="_blank"
          rel="noopener noreferrer"
        >{{ item.url }}</a>
        <span v-else>{{ item.url }}</span>
      </span>
      <template v-if="showError">
        <RouterLink
          v-if="errorLink"
          :to="errorLink"
          class="feedback-item__error"
          data-test="sentry-feedback-error-link"
        >
          Open the error
        </RouterLink>
        <span
          v-else
          class="feedback-item__standalone"
        >Sent without an error</span>
      </template>
      <span
        v-if="item.source === 'user_report'"
        class="feedback-item__badge"
        title="Sent by an older SDK as a user report"
      >user report</span>
    </footer>
  </article>
</template>

<style lang="scss" scoped>
.feedback-item {
  @apply p-3 rounded-lg;
  @apply bg-white dark:bg-gray-800;
  @apply border border-gray-200 dark:border-gray-700;
}

.feedback-item__head {
  @apply flex items-center gap-2 min-w-0;
}

.feedback-item__avatar {
  @apply flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0;
  @apply text-xs font-semibold;
  @apply bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300;
}

.feedback-item__who {
  @apply flex flex-wrap items-baseline gap-x-2 min-w-0 flex-1;
}

.feedback-item__name {
  @apply text-sm font-medium text-gray-900 dark:text-gray-100 truncate;
}

.feedback-item__email {
  @apply text-xs text-gray-600 dark:text-gray-300 truncate;
  @apply hover:underline;
}

.feedback-item__time {
  @apply text-xs text-gray-500 dark:text-gray-400 flex-shrink-0;
}

.feedback-item__message {
  @apply mt-2 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words;
}

.feedback-item__message--empty {
  @apply italic text-gray-500 dark:text-gray-400;
}

.feedback-item__foot {
  @apply mt-2 flex flex-wrap items-center gap-x-3 gap-y-1;
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.feedback-item__url {
  @apply min-w-0 break-all;

  a {
    @apply text-blue-700 dark:text-blue-300 hover:underline;
  }
}

.feedback-item__error {
  @apply font-medium text-blue-700 dark:text-blue-300 hover:underline;
}

.feedback-item__badge {
  @apply text-2xs font-mono px-1.5 py-0.5 rounded;
  @apply bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300;
}
</style>
