<script lang="ts" setup>
import { ref } from 'vue'
import { Device } from './types'

type Props = {
  device?: Device
}

const props = withDefaults(defineProps<Props>(), {
  device: Device.Desktop
})

const currentDevice = ref(props.device)

const devices = [
  { id: Device.Desktop, label: 'Desktop', width: '100%' },
  { id: Device.Tablet, label: 'Tablet', width: '768px' },
  { id: Device.Mobile, label: 'Mobile', width: '375px' },
]
</script>

<template>
  <div class="ep">
    <!-- Device toolbar -->
    <div class="ep__toolbar">
      <div class="ep__devices">
        <button
          v-for="d in devices"
          :key="d.id"
          class="ep__device-btn"
          :class="{ 'ep__device-btn--active': currentDevice === d.id }"
          :title="d.label"
          @click="currentDevice = d.id"
        >
          <!-- Mobile icon -->
          <svg
            v-if="d.id === Device.Mobile"
            class="ep__device-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="7" y="2" width="10" height="20" rx="2" />
            <line x1="10" y1="18" x2="14" y2="18" />
          </svg>

          <!-- Tablet icon -->
          <svg
            v-else-if="d.id === Device.Tablet"
            class="ep__device-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="5" y="2" width="14" height="20" rx="2" />
            <circle cx="12" cy="18" r="1" />
          </svg>

          <!-- Desktop icon -->
          <svg
            v-else
            class="ep__device-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>

          <span class="ep__device-label">{{ d.label }}</span>
        </button>
      </div>

      <span class="ep__size-hint">
        {{ devices.find((d) => d.id === currentDevice)?.width }}
      </span>
    </div>

    <!-- Preview area -->
    <div class="ep__viewport">
      <div
        class="ep__frame"
        :class="`ep__frame--${currentDevice}`"
      >
        <slot />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
iframe {
  @apply w-full h-full min-h-[60vh];
}
</style>

<style lang="scss" scoped>
.ep {
  @apply flex flex-col h-full;
}

/* Toolbar */
.ep__toolbar {
  @apply flex items-center justify-between;
  @apply px-3 py-2;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply bg-gray-50 dark:bg-gray-900;
}

.ep__devices {
  @apply flex gap-1;
}

.ep__device-btn {
  @apply flex items-center gap-1.5;
  @apply px-2.5 py-1.5 rounded-md;
  @apply text-xs font-medium;
  @apply text-gray-400 dark:text-gray-500;
  @apply hover:text-gray-600 dark:hover:text-gray-300;
  @apply hover:bg-gray-100 dark:hover:bg-gray-800;
  @apply transition-all duration-100 cursor-pointer;
}

.ep__device-btn--active {
  @apply text-blue-600 dark:text-blue-400;
  @apply bg-blue-50 dark:bg-blue-500/10;

  &:hover {
    @apply text-blue-600 dark:text-blue-400;
    @apply bg-blue-50 dark:bg-blue-500/10;
  }
}

.ep__device-icon {
  @apply w-4 h-4 flex-shrink-0;
}

.ep__device-label {
  @apply hidden sm:inline;
}

.ep__size-hint {
  @apply text-2xs font-mono text-gray-400 dark:text-gray-500;
}

/* Viewport */
.ep__viewport {
  @apply flex-1 flex justify-center;
  @apply p-4;
  @apply bg-gray-100 dark:bg-gray-800/50;
  @apply overflow-auto;
}

.ep__frame {
  @apply bg-white rounded-lg shadow-sm overflow-hidden;
  @apply transition-all duration-200 ease-out;
}

.ep__frame--desktop {
  @apply w-full h-full;
}

.ep__frame--tablet {
  width: 768px;
  max-width: 100%;
  min-height: 500px;
  @apply border border-gray-200 dark:border-gray-600;
  @apply rounded-xl;
}

.ep__frame--mobile {
  width: 375px;
  max-width: 100%;
  min-height: 500px;
  @apply border-2 border-gray-300 dark:border-gray-600;
  @apply rounded-2xl;
}
</style>
