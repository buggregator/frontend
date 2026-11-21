<script lang="ts" setup>
import '../broadcast-theme.css'

// No broadcast yet (#6614, design #6598): where to point the app, what
// Buggregator does with the events, and the way to the full setup help.
type Props = {
  host: string
  port: string | number
  connected: boolean
}

defineProps<Props>()
defineEmits<{ help: [] }>()
</script>

<template>
  <section
    class="bc-empty"
    data-test="bc-empty"
  >
    <p
      class="bc-empty__live"
      :class="{ 'bc-empty__live--off': !connected }"
    >
      <i aria-hidden="true" />{{ connected ? 'Waiting for broadcasts on' : 'Offline: not connected to' }}
      <code>http://{{ host }}:{{ port }}</code>
    </p>
    <h2 class="bc-empty__title">
      No broadcasts yet
    </h2>
    <p class="bc-empty__text">
      Point your app's Pusher connection at Buggregator: Laravel Reverb, Pusher and soketi clients all
      call the same HTTP API.
    </p>
    <pre class="bc-empty__code"><span class="bc-empty__comment"># .env (Laravel)</span>
BROADCAST_CONNECTION=reverb
REVERB_HOST={{ host }}
REVERB_PORT={{ port }}
REVERB_SCHEME=http</pre>
    <p class="bc-empty__note">
      <span
        class="bc-empty__note-icon"
        aria-hidden="true"
      >i</span>
      <span>Buggregator records each broadcast. Without <code>BROADCAST_UPSTREAM</code> it does not
        deliver them, so live updates in your app stop while it points here. Set it to your Reverb to
        have both.</span>
    </p>
    <button
      type="button"
      class="bc-empty__btn"
      data-test="bc-setup-help"
      @click="$emit('help')"
    >
      How to set up broadcasts
    </button>
  </section>
</template>

<style lang="scss" scoped>
.bc-empty {
  @apply flex flex-col items-start gap-3 px-6 py-10;
  max-width: 680px;

  @media (max-width: 639px) {
    @apply px-4 py-6;
  }
}

.bc-empty__live {
  @apply inline-flex flex-wrap items-center gap-1.5 text-xs text-gray-800 dark:text-gray-200;

  i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--bc-live);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--bc-live) 25%, transparent);
    animation: bc-empty-live 1.6s ease-in-out infinite;
  }

  code {
    @apply font-mono;
  }
}

.bc-empty__live--off i {
  @apply bg-gray-500 dark:bg-gray-400;
  box-shadow: none;
  animation: none;
}

@keyframes bc-empty-live {
  50% {
    opacity: 0.35;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bc-empty__live i {
    animation: none;
  }
}

.bc-empty__title {
  @apply text-lg font-semibold text-gray-900 dark:text-gray-100;
}

.bc-empty__text {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.bc-empty__code {
  @apply w-full font-mono rounded border px-3 py-2.5 overflow-auto;
  @apply bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200;
  font-size: 12px;
  line-height: 1.6;
}

.bc-empty__comment {
  @apply text-gray-500 dark:text-gray-400;
}

.bc-empty__note {
  @apply flex gap-2 items-start px-2.5 py-2 rounded border text-xs;
  @apply bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200;

  code {
    @apply font-mono;
  }
}

.bc-empty__note-icon {
  @apply font-mono font-bold flex-none;
  color: var(--bc-info);
}

.bc-empty__btn {
  @apply inline-flex items-center h-8 px-3 rounded border text-sm font-medium;
  @apply bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700;

  &:focus-visible {
    outline: 2px solid var(--bc-focus);
    outline-offset: 2px;
  }

  @media (max-width: 639px) {
    @apply h-11;
  }
}
</style>
