<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useServerUpdateStore } from '@/entities/server-update/lib'

// Top of the page, under the header, while the server restarts into the new version: the
// socket is down on purpose, the page reloads by itself.
const store = useServerUpdateStore()
const { status, restartGaveUp } = storeToRefs(store)

const isRestarting = computed(() => store.phase === 'restarting')
const target = computed(() => status.value?.state.version || status.value?.latest || '')
</script>

<template>
  <section
    v-if="isRestarting"
    class="update-strip"
    :class="{ 'update-strip--bad': restartGaveUp }"
    :role="restartGaveUp ? 'alert' : 'status'"
    data-test="update-restart-strip"
  >
    <template v-if="restartGaveUp">
      <span><b>The server has not come back after 90 seconds.</b> Check the window or the log where
        Buggregator runs; if it stopped, start it again.</span>
      <button
        type="button"
        class="update-strip__btn"
        @click="store.reload()"
      >
        Reload
      </button>
    </template>
    <template v-else>
      <span
        class="update-strip__spinner"
        aria-hidden="true"
      />
      <span><b>Restarting with {{ target }}.</b> Back in a few seconds; events sent now are not
        received. The page reloads by itself.</span>
    </template>
  </section>
</template>

<style lang="scss" scoped>
.update-strip {
  @apply flex items-center gap-2.5 px-4 py-2 text-[13px];
  @apply bg-amber-50 text-amber-900 border-b border-amber-200;
  @apply dark:bg-amber-500/10 dark:text-amber-100 dark:border-amber-400/30;

  b {
    @apply font-semibold;
  }
}

.update-strip--bad {
  @apply bg-red-50 text-red-900 border-red-200;
  @apply dark:bg-red-500/10 dark:text-red-100 dark:border-red-400/30;
}

.update-strip__btn {
  @apply ml-auto flex-none min-h-[32px] px-3 rounded-md text-sm font-medium;
  @apply bg-white text-gray-900 border border-gray-300 hover:bg-gray-50;
  @apply dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-700;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400;

  @media (max-width: 639px) {
    @apply min-h-[44px];
  }
}

.update-strip__spinner {
  @apply inline-block flex-none rounded-full text-amber-600 dark:text-amber-400;
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  animation: update-strip-spin 0.9s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

@keyframes update-strip-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
