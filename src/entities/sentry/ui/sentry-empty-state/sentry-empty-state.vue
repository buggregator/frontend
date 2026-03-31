<script lang="ts" setup>
import { computed } from 'vue'

type Props = {
  type: 'exceptions' | 'traces' | 'logs'
}

const props = defineProps<Props>()

const content = computed(() => {
  switch (props.type) {
    case 'exceptions':
      return {
        title: 'Waiting for exceptions',
        description: "Send your app's Sentry DSN to Buggregator and exceptions will appear here.",
        snippet: 'SENTRY_DSN=http://sentry@127.0.0.1:8000/1',
        docsUrl: ''
      }
    case 'traces':
      return {
        title: 'No traces yet',
        description: 'Enable performance tracing in your Sentry SDK to see transactions and spans.',
        snippet: `# Laravel / PHP\nSENTRY_TRACES_SAMPLE_RATE=1.0\n\n# Python\ntraces_sample_rate=1.0\n\n# JavaScript\ntracesSampleRate: 1.0`,
        docsUrl: 'https://docs.sentry.io/platforms/php/performance/'
      }
    case 'logs':
      return {
        title: 'No Sentry logs yet',
        description: 'Sentry logs (distinct from Monolog) require enable_logs in your SDK.',
        snippet: `# PHP SDK >= 4.10\n'enable_logs' => true,\n\n# JavaScript SDK\nSentry.init({\n  _experiments: { enableLogs: true }\n})`,
        docsUrl: 'https://develop.sentry.dev/sdk/telemetry/logs/'
      }
    default:
      return {
        title: 'No data yet',
        description: '',
        snippet: '',
        docsUrl: ''
      }
  }
})
</script>

<template>
  <div class="sentry-empty">
    <div class="sentry-empty__hero">
      <!-- Icon -->
      <div class="sentry-empty__icon">
        <svg
          class="sentry-empty__svg"
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-dasharray="4 3"
          />
          <path
            d="M24 16v10M24 30v2"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </div>

      <h3 class="sentry-empty__title">
        {{ content.title }}
      </h3>
      <p class="sentry-empty__desc">
        {{ content.description }}
      </p>
    </div>

    <!-- Code snippet card -->
    <div
      v-if="content.snippet"
      class="sentry-empty__snippet"
    >
      <div class="sentry-empty__snippet-header">
        Configuration
      </div>
      <pre class="sentry-empty__code">{{ content.snippet }}</pre>
    </div>

    <a
      v-if="content.docsUrl"
      :href="content.docsUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="sentry-empty__link"
    >
      Read the docs &rarr;
    </a>
  </div>
</template>

<style lang="scss" scoped>
.sentry-empty {
  @apply flex flex-col items-center justify-center py-16 px-8 text-center;
}

.sentry-empty__hero {
  @apply flex flex-col items-center text-center mb-6;
}

.sentry-empty__icon {
  @apply mb-4;
}

.sentry-empty__svg {
  @apply w-12 h-12 text-gray-300 dark:text-gray-600;
}

.sentry-empty__title {
  @apply text-sm font-semibold mb-2;
  @apply text-gray-700 dark:text-gray-200;
}

.sentry-empty__desc {
  @apply text-xs text-gray-500 dark:text-gray-400 max-w-md leading-relaxed;
}

/* Snippet card - follows monolog block pattern */
.sentry-empty__snippet {
  @apply w-full max-w-lg rounded overflow-hidden mb-4;
  @apply border border-gray-200 dark:border-gray-700;
}

.sentry-empty__snippet-header {
  @apply px-3 py-1.5;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply text-2xs font-medium text-gray-500 dark:text-gray-400;
}

.sentry-empty__code {
  @apply text-xs font-mono p-4 text-left whitespace-pre-wrap leading-relaxed;
  @apply bg-white dark:bg-gray-800;
  @apply text-gray-700 dark:text-gray-300;
}

.sentry-empty__link {
  @apply text-xs font-medium px-3 py-1.5 rounded;
  @apply text-blue-600 dark:text-blue-400;
  @apply bg-blue-50 dark:bg-blue-500/10;
  @apply hover:bg-blue-100 dark:hover:bg-blue-500/20;
  @apply transition-colors duration-100;
}
</style>
