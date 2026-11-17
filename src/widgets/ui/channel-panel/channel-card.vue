<script lang="ts" setup>
import { computed, ref } from 'vue'
import { IconSvg } from '@/shared/ui'
import { SetupHelpPanel } from '../setup-guide'
import type { Channel } from './channels'

// One channel of the empty home (#6012): where to point the app, whether this
// server listens, and its count filling in. The whole card opens its page;
// «How to set up» sits above that link.
type Props = {
  channel: Channel
  // null: the channel has no events of its own (tools).
  count: number | null
  // An event came in the last minute.
  recent?: boolean
}

const props = withDefaults(defineProps<Props>(), { recent: false })

const isHelpOpen = ref(false)

const hasEvents = computed(() => (props.count ?? 0) > 0)
const statusText = computed(
  () =>
    ({ listening: 'Listening', off: 'Off on this server', offline: 'Not connected' })[
      props.channel.state
    ]
)
const countText = computed(() => {
  if (props.count === null || props.channel.state === 'off') return ''
  const n = `${props.count} ${props.count === 1 ? 'event' : 'events'}`
  return props.recent ? `${n} · just now` : n
})
</script>

<template>
  <article
    class="channel-card"
    :class="{
      'channel-card--events': hasEvents,
      'channel-card--off': channel.state !== 'listening'
    }"
    :data-test="`channel-${channel.id}`"
  >
    <div class="channel-card__head">
      <IconSvg
        class="channel-card__icon"
        :name="channel.icon"
      />
      <h3 class="channel-card__name">
        <RouterLink
          v-if="channel.to"
          :to="channel.to"
          class="channel-card__link"
        >
          {{ channel.title }}
        </RouterLink>
        <template v-else>
          {{ channel.title }}
        </template>
      </h3>
      <button
        type="button"
        class="channel-card__help"
        :aria-label="`How to set up ${channel.title}`"
        title="How to set up"
        aria-haspopup="dialog"
        :aria-expanded="isHelpOpen"
        data-test="channel-help"
        @click="isHelpOpen = true"
      >
        <!-- The open book of «How to set up» (#5999). -->
        <svg
          class="channel-card__help-icon"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <path
            d="M2.5 3.5h4a1.5 1.5 0 0 1 1.5 1.5v8a1 1 0 0 0-1-1h-4.5zM13.5 3.5h-4A1.5 1.5 0 0 0 8 5v8a1 1 0 0 1 1-1h4.5z"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <p
      class="channel-card__address"
      :title="channel.offHint ?? channel.address"
    >
      {{ channel.offHint ?? channel.address }}
    </p>

    <p class="channel-card__foot">
      <span
        class="channel-card__status"
        data-test="channel-status"
      >
        <span
          class="channel-card__dot"
          aria-hidden="true"
        />
        {{ statusText }}
      </span>
      <span
        v-if="countText"
        class="channel-card__count"
        data-test="channel-count"
      >
        {{ countText }}
      </span>
    </p>

    <SetupHelpPanel
      v-if="isHelpOpen"
      :section-id="channel.id"
      :section-title="channel.title"
      @close="isHelpOpen = false"
    />
  </article>
</template>

<style lang="scss" scoped>
.channel-card {
  @apply relative flex flex-col gap-2 rounded-md border;
  @apply border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800;
  @apply hover:border-gray-300 dark:hover:border-gray-600 transition-colors;
  padding: 12px 8px 12px 14px;

  @media (max-width: 639px) {
    padding: 8px 4px 10px 12px;
  }

  // Keyboard focus on the stretched link rings the whole card.
  &:has(.channel-card__link:focus-visible) {
    @apply ring-2 ring-blue-600 dark:ring-blue-400;
  }
}

.channel-card--events {
  @apply bg-blue-50 dark:bg-blue-400/[.12];
}

.channel-card__head {
  @apply flex items-center gap-2 min-h-7;
}

.channel-card__icon {
  @apply w-[18px] h-[18px] flex-shrink-0 text-gray-600 dark:text-gray-400;
}

.channel-card__name {
  @apply flex-1 min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-gray-100;

  .channel-card--off & {
    @apply text-gray-600 dark:text-gray-400;
  }
}

.channel-card__link {
  @apply focus-visible:outline-none;

  // Stretched over the card: the whole card opens the page.
  &::after {
    content: '';
    @apply absolute inset-0 rounded-md;
  }
}

.channel-card__help {
  @apply relative z-10 inline-flex items-center justify-center w-7 h-7 rounded flex-shrink-0;
  @apply text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700;
  @apply hover:text-gray-900 dark:hover:text-gray-100 transition-colors;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400;

  @media (max-width: 639px) {
    @apply w-11 h-11 -my-2;
  }
}

.channel-card__help-icon {
  @apply w-4 h-4;
}

.channel-card__address {
  @apply truncate text-xs text-gray-600 dark:text-gray-400;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-variant-ligatures: none;
}

.channel-card__foot {
  @apply flex items-center justify-between gap-2 text-xs;
}

.channel-card__status {
  @apply inline-flex items-center gap-1.5 font-medium text-green-700 dark:text-green-400;

  .channel-card--off & {
    @apply font-normal text-gray-600 dark:text-gray-400;
  }
}

.channel-card__dot {
  @apply w-1.5 h-1.5 rounded-full bg-current;

  .channel-card--off & {
    @apply bg-transparent border border-gray-500;
  }
}

.channel-card__count {
  @apply text-gray-500 dark:text-gray-400 tabular-nums;
  font-family: 'JetBrains Mono', ui-monospace, monospace;

  .channel-card--events & {
    @apply font-semibold text-gray-900 dark:text-gray-100;
  }
}
</style>
