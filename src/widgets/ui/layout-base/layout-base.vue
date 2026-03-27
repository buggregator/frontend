<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import { useEvents } from '@/shared/lib/use-events'
import { useEventsStore } from '@/shared/stores'
import { useConnectionStore } from '@/shared/stores/connections'

const { activeProjectKey } = storeToRefs(useEventsStore())
const { isConnectedWS } = storeToRefs(useConnectionStore())
const { events } = useEvents()

const isDismissed = ref(false)
const showBanner = ref(false)
let disconnectTimer: ReturnType<typeof setTimeout> | null = null

watch(isConnectedWS, (connected) => {
  if (connected) {
    if (disconnectTimer) {
      clearTimeout(disconnectTimer)
      disconnectTimer = null
    }
    showBanner.value = false
  } else {
    isDismissed.value = false
    disconnectTimer = setTimeout(() => {
      if (!isConnectedWS.value) {
        showBanner.value = true
      }
    }, 3000)
  }
}, { immediate: true })

watch(
  () => activeProjectKey.value,
  () => {
    events.getAll()
  },
  { immediate: true }
)
</script>

<template>
  <div
    class="layout-base"
    :class="{
      'layout-base--no-sidebar': !$slots.sidebar,
      'layout-base--no-header': !$slots.header
    }"
  >
    <div
      v-if="$slots.sidebar"
      class="layout-base__sidebar"
    >
      <slot name="sidebar" />
    </div>

    <div
      v-if="$slots.header"
      class="layout-base__header"
    >
      <slot name="header" />
    </div>

    <transition name="banner">
      <div
        v-if="showBanner && !isDismissed && $slots.sidebar"
        class="layout-base__connection-banner"
      >
        <span>WebSocket disconnected. Events will not stream until connection is restored.</span>
        <button
          class="layout-base__connection-banner-close"
          @click="isDismissed = true"
        >
          &times;
        </button>
      </div>
    </transition>

    <div class="layout-base__content">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use 'src/assets/mixins' as mixins;

.layout-base {
  @apply flex min-h-screen items-stretch relative;
}

.layout-base__sidebar {
  @apply flex-none border-r border-gray-200 dark:border-gray-700 z-50 w-full h-full sticky top-0 h-screen max-h-screen;
  @include mixins.layout-sidebar;
}

.layout-base__header {
  @include mixins.layout-head;

  .layout-base--no-sidebar & {
    @apply left-0;
  }
}

.layout-base__connection-banner {
  @apply fixed top-0 left-10 md:left-14 lg:left-16 xl:left-48 right-0 z-[60];
  @apply bg-red-600 text-white text-xs md:text-sm px-4 py-2;
  @apply flex items-center justify-between;
  transition: left 0.2s ease;

  :global(html.sidebar-collapsed) & {
    @apply xl:left-16;
  }
}

.layout-base__connection-banner-close {
  @apply text-white text-lg leading-none px-2 hover:opacity-70;
}

.banner-enter-active,
.banner-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.banner-enter-from,
.banner-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.layout-base__content {
  @include mixins.layout-body;

  & > div {
    @apply flex flex-col h-full flex-1;
  }

  .layout-base--no-sidebar & {
    @apply pl-0;
  }

  .layout-base--no-header & {
    @apply pt-0;
  }
}
</style>
