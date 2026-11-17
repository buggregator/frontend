<script lang="ts" setup>
import { useNow } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useXdebugEnabled } from '@/entities/xdebug/lib'
import { useEvents } from '@/shared/lib/use-events'
import { useEventsStore, useSettingsStore } from '@/shared/stores'
import { useConnectionStore } from '@/shared/stores/connections'
import { useSetupValues } from '../setup-guide'
import ChannelCard from './channel-card.vue'
import { buildChannelGroups, type Channel } from './channels'

// The home page while the project has no events (#6012, design #6005
// variant 2): every way into this server as a card, counts filling in live.
// It stays while the person is on it after the first event; `open-list`
// asks the page for the usual list.
const emit = defineEmits<{ 'open-list': [] }>()

const { availableEvents, hiddenMenuItems, apiVersion } = storeToRefs(useSettingsStore())
const { activeProject } = storeToRefs(useEventsStore())
const { isConnectedWS } = storeToRefs(useConnectionStore())
const { getItemsCount } = useEvents()
const xdebugEnabled = useXdebugEnabled()
const { resolved, values } = useSetupValues()

const groups = computed(() =>
  buildChannelGroups({
    availableEvents: availableEvents.value,
    hidden: hiddenMenuItems.value,
    xdebugEnabled: xdebugEnabled.value,
    off: resolved.value.off,
    values: values.value,
    connected: isConnectedWS.value
  })
)
const channels = computed(() => groups.value.flatMap((g) => g.channels))
const listening = computed(() => channels.value.filter((c) => c.state === 'listening').length)

const countOf = (c: Channel) => (c.eventType ? getItemsCount.value(c.eventType) : null)
const total = computed(() => getItemsCount.value())

// «just now» for a minute after a channel's count grew; one polite line for
// screen readers instead of live cards.
const RECENT_MS = 60_000
const lastArrival = ref<Record<string, number>>({})
const liveNote = ref('')
const now = useNow({ interval: 15_000 })
watch(
  () => channels.value.map((c) => [c.id, countOf(c)] as const),
  (next, prev) => {
    const before = new Map(prev ?? [])
    for (const [id, n] of next) {
      const was = before.get(id) ?? 0
      if (n !== null && was !== null && n > was) {
        lastArrival.value = { ...lastArrival.value, [id]: Date.now() }
        const title = channels.value.find((c) => c.id === id)?.title ?? id
        const added = n - was
        liveNote.value = `${added} new ${title} ${added === 1 ? 'event' : 'events'}`
      }
    }
  }
)
const isRecent = (c: Channel) => now.value.getTime() - (lastArrival.value[c.id] ?? 0) < RECENT_MS

const projectName = computed(() => activeProject.value?.name ?? 'Default')
const projectKey = computed(() => activeProject.value?.key ?? 'default')
const eventsWord = (n: number) => `${n} ${n === 1 ? 'event' : 'events'}`
</script>

<template>
  <section
    class="channel-panel"
    aria-labelledby="channel-panel-title"
    data-test="channel-panel"
  >
    <p
      v-if="isConnectedWS"
      class="channel-panel__status"
      role="status"
    >
      <span
        class="channel-panel__status-dot"
        aria-hidden="true"
      />
      <b class="channel-panel__status-word">Listening</b>
      <span class="channel-panel__status-project">
        · project {{ projectName }} <span class="channel-panel__mono">({{ projectKey }})</span>
      </span>
    </p>
    <p
      v-else
      class="channel-panel__status channel-panel__status--offline"
      role="status"
      data-test="channel-panel-offline"
    >
      <span
        class="channel-panel__status-dot"
        aria-hidden="true"
      />
      <b class="channel-panel__status-word">Not connected</b>
      <span class="channel-panel__status-project">· reconnecting…</span>
    </p>

    <h1
      id="channel-panel-title"
      class="channel-panel__title"
    >
      {{
        isConnectedWS
          ? `Listening on ${listening} ${listening === 1 ? 'channel' : 'channels'}`
          : 'Waiting for the server'
      }}
    </h1>

    <div class="channel-panel__lead">
      <p v-if="total === 0">
        Nothing has arrived in {{ projectName }} yet. Each card shows where to point your app;
        counts fill in as events come.
      </p>
      <template v-else>
        <p>{{ eventsWord(total) }} so far.</p>
        <button
          type="button"
          class="channel-panel__open"
          data-test="channel-panel-open-list"
          @click="emit('open-list')"
        >
          Open all events ({{ total }})
        </button>
      </template>
    </div>

    <p
      class="sr-only"
      aria-live="polite"
    >
      {{ liveNote }}
    </p>

    <div
      v-for="group in groups"
      :key="group.id"
      class="channel-panel__group"
    >
      <h2 class="channel-panel__group-title">
        {{ group.title }}
      </h2>
      <div class="channel-panel__grid">
        <ChannelCard
          v-for="channel in group.channels"
          :key="channel.id"
          :channel="channel"
          :count="countOf(channel)"
          :recent="isRecent(channel)"
        />
      </div>
    </div>

    <nav
      class="channel-panel__foot"
      aria-label="Links"
    >
      <a
        href="https://docs.buggregator.dev"
        target="_blank"
        rel="noopener"
      >Documentation</a>
      <a
        href="https://github.com/buggregator"
        target="_blank"
        rel="noopener"
      >GitHub</a>
      <a
        href="https://discord.gg/vDsCD3EKUB"
        target="_blank"
        rel="noopener"
      >Discord</a>
      <span
        v-if="apiVersion"
        class="channel-panel__version channel-panel__mono"
      >v{{ apiVersion }}</span>
    </nav>
  </section>
</template>

<style lang="scss" scoped>
.channel-panel {
  @apply w-full max-w-[1040px] mx-auto px-8 pt-12 pb-10;

  @media (max-width: 639px) {
    @apply px-4 pt-6;
  }
}

.channel-panel__mono {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-variant-ligatures: none;
  @apply text-xs;
}

.channel-panel__status {
  @apply flex flex-wrap items-center gap-x-1.5 text-[13px] leading-5;
}

.channel-panel__status-dot {
  @apply w-2 h-2 rounded-full bg-green-600 dark:bg-green-400;

  .channel-panel__status--offline & {
    @apply bg-transparent border border-amber-700 dark:border-amber-400;
  }
}

.channel-panel__status-word {
  @apply font-medium text-green-700 dark:text-green-400;

  .channel-panel__status--offline & {
    @apply text-amber-700 dark:text-amber-400;
  }
}

.channel-panel__status-project {
  @apply text-gray-600 dark:text-gray-400;
}

.channel-panel__title {
  @apply mt-2 text-2xl leading-8 font-semibold text-gray-900 dark:text-gray-100;

  @media (max-width: 639px) {
    @apply text-xl leading-7;
  }
}

.channel-panel__lead {
  @apply mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-gray-600 dark:text-gray-400;
  max-width: 60ch;
}

.channel-panel__open {
  @apply inline-flex items-center h-10 px-3 rounded-md border text-sm font-medium;
  @apply border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800;
  @apply text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400;

  @media (max-width: 639px) {
    @apply w-full h-11 justify-center;
  }
}

.channel-panel__group {
  @apply mt-7;

  @media (max-width: 639px) {
    @apply mt-5;
  }
}

.channel-panel__group-title {
  @apply mb-2.5 text-xs leading-4 font-medium text-gray-600 dark:text-gray-400;
}

.channel-panel__grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3;
}

.channel-panel__foot {
  @apply mt-10 pt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-gray-200 dark:border-gray-700;
  @apply text-[13px] text-gray-600 dark:text-gray-400;

  a {
    @apply hover:text-gray-900 dark:hover:text-gray-100 underline-offset-2 hover:underline;
    @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400 rounded;
  }
}

.channel-panel__version {
  @apply ml-auto;
}
</style>
