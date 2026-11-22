<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { defineAsyncComponent, ref, watch } from 'vue'
import { useServerUpdateStore } from '@/entities/server-update/lib'
import { isCommandPaletteOpen } from '@/shared/lib/command-palette'
import { filtersKey } from '@/shared/lib/feed-filters'
import { useEvents } from '@/shared/lib/use-events'
import { useGlobalShortcuts } from '@/shared/lib/use-global-shortcuts'
import { toastMessage } from '@/shared/lib/use-keyboard-nav'
import { useEventsStore } from '@/shared/stores'
import { useConnectionStore } from '@/shared/stores/connections'
import { KeyboardShortcutsOverlay } from '../keyboard-shortcuts-overlay'

type Props = {
  // The page's h1. Pages with a visible h1 of their own leave it out.
  heading?: string
}

const props = withDefaults(defineProps<Props>(), { heading: '' })

const { activeProjectKey, period, filters } = storeToRefs(useEventsStore())
const { isConnectedWS } = storeToRefs(useConnectionStore())
const { events } = useEvents()
// A self-update restarts the server: the socket drop is expected then, and the
// restart strip explains it instead of the red banner.
const updateStore = useServerUpdateStore()
// Loaded only while an update runs: their styles stay out of the first load.
const loadUpdateProgress = () => import('../update-progress')
const UpdatePill = defineAsyncComponent(() => loadUpdateProgress().then((m) => m.UpdatePill))
const UpdateTopline = defineAsyncComponent(() => loadUpdateProgress().then((m) => m.UpdateTopline))
const UpdateRestartStrip = defineAsyncComponent(() =>
  loadUpdateProgress().then((m) => m.UpdateRestartStrip)
)
const { isShortcutsOverlayOpen } = useGlobalShortcuts()
// Ctrl/⌘+K: loaded on first open, its styles stay out of the first load.
const CommandPalette = defineAsyncComponent(() =>
  import('../command-palette').then((m) => m.CommandPalette)
)

// The skip link moves focus by hand: following its href would leave
// #main-content in the URL (and in the history).
const mainRef = ref<HTMLElement | null>(null)
const skipToContent = () => mainRef.value?.focus()

const isDismissed = ref(false)
const showBanner = ref(false)
let disconnectTimer: ReturnType<typeof setTimeout> | null = null

watch(
  isConnectedWS,
  (connected) => {
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
  },
  { immediate: true }
)

// The period and the feed filters are inputs of the query just like the
// project: when any of them changes, the feed is fetched again.
//
// The getter returns a string rather than an array: an array is a fresh object
// every time and watch would compare it by reference, so re-setting the same
// project (when the project list refreshes, say) would refetch the whole feed —
// which is visible as a flicker.
watch(
  () => `${activeProjectKey.value ?? ''}|${period.value}|${filtersKey(filters.value)}`,
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
    <a
      href="#main-content"
      class="layout-base__skip"
      @click.prevent="skipToContent"
    >Skip to content</a>

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
      <div class="layout-base__header-slot">
        <slot name="header" />
      </div>
      <template v-if="updateStore.isActive">
        <UpdatePill class="layout-base__update-pill" />
        <UpdateTopline />
      </template>
    </div>

    <transition name="banner">
      <div
        v-if="showBanner && !isDismissed && $slots.sidebar && updateStore.phase !== 'restarting'"
        class="layout-base__connection-banner"
      >
        <span>WebSocket disconnected. Events will not stream until connection is restored.</span>
        <button
          type="button"
          class="layout-base__connection-banner-close"
          aria-label="Dismiss"
          @click="isDismissed = true"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    </transition>

    <main
      id="main-content"
      ref="mainRef"
      class="layout-base__content"
      tabindex="-1"
    >
      <UpdateRestartStrip
        v-if="$slots.sidebar && updateStore.phase === 'restarting'"
        class="layout-base__update-strip"
      />
      <h1
        v-if="props.heading"
        class="sr-only"
      >
        {{ props.heading }}
      </h1>
      <slot />
    </main>

    <KeyboardShortcutsOverlay
      v-if="isShortcutsOverlayOpen"
      @close="isShortcutsOverlayOpen = false"
    />

    <CommandPalette
      v-if="isCommandPaletteOpen"
      @close="isCommandPaletteOpen = false"
    />

    <!-- Action toast. The live region stays in the DOM, so a screen reader
         hears each new message («Event deleted»). -->
    <Teleport to="body">
      <div
        role="status"
        aria-live="polite"
        class="action-toast-region"
      >
        <transition name="toast">
          <div
            v-if="toastMessage"
            class="action-toast"
          >
            {{ toastMessage }}
          </div>
        </transition>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
@use 'src/assets/mixins' as mixins;

.layout-base {
  @apply flex min-h-screen items-stretch relative;
}

.layout-base__skip {
  @apply sr-only;

  &:focus {
    @apply not-sr-only fixed top-2 left-2 z-[100] px-3 py-2 rounded-md;
    @apply bg-blue-600 text-white text-sm font-medium;
    @apply outline-none ring-2 ring-blue-300;
  }
}

.layout-base__content:focus {
  outline: none;
}

.layout-base__sidebar {
  @apply flex-none border-r border-gray-200 dark:border-gray-700 z-50 w-full h-full sticky top-0 h-screen max-h-screen;
  @include mixins.layout-sidebar;
}

/* The sidebar's menu is open over the page (below 1280 px): above the header
   and the connection banner. The whole selector sits in :global() — in a
   scoped style `:global(html.x) &` drops the `&`. */
:global(html.sidebar-overlay .layout-base__sidebar) {
  z-index: 70;
}

.layout-base__header {
  @include mixins.layout-head;
  @apply flex items-center;

  .layout-base--no-sidebar & {
    @apply left-0;
  }
}

.layout-base__header-slot {
  @apply flex-1 min-w-0 h-full;
}

.layout-base__update-pill {
  @apply ml-2;
}

/* First in the page, kept in view under the header while it scrolls. A
   <section>: the page's own root is the <div> styled below. */
.layout-base__update-strip {
  @apply sticky top-0 z-40 flex-none;
}

.layout-base__connection-banner {
  @apply fixed top-0 left-10 md:left-14 lg:left-16 xl:left-56 right-0 z-[60];
  @apply bg-red-600 text-white text-xs md:text-sm px-4 py-2;
  @apply flex items-center justify-between;
  transition: left 0.2s ease;
}

/* The whole selector in :global(): `:global(html.x) &` drops the `&`. */
:global(html.sidebar-collapsed .layout-base__connection-banner) {
  @media (min-width: 1280px) {
    left: 4rem;
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
  @apply overflow-y-auto;

  & > div {
    @apply flex flex-col min-h-full flex-1;
  }

  .layout-base--no-sidebar & {
    @apply pl-0;
  }

  .layout-base--no-header & {
    @apply pt-0;
  }
}
</style>

<style lang="scss">
// The header's rows (design #6737 A): row 1 36/40/56 px; a header with a
// toolbar (AppHeader #toolbar) adds row 2, 44 px (52 on a phone, where row 1
// grows to 48 for 44 px targets). --hdr-pad is the header's side padding.
.layout-base {
  --hdr-row: 2.25rem;
  --hdr-bar: 0px;
  --hdr-pad: 0.5rem;

  @media (min-width: 640px) {
    --hdr-row: 2.5rem;
  }

  @media (min-width: 768px) {
    --hdr-row: 3.5rem;
    --hdr-pad: 1rem;
  }
}

.layout-base:has(.app-header--two-rows) {
  --hdr-row: 3rem;
  --hdr-bar: 44px;

  @media (max-width: 639px) {
    --hdr-bar: 52px;
  }
}

.action-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  background: theme('colors.gray.800');
  color: theme('colors.gray.100');
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: none;

  .dark & {
    background: theme('colors.gray.200');
    color: theme('colors.gray.800');
  }
}

.toast-enter-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-4px);
}
</style>
