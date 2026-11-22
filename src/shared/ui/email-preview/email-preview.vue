<script lang="ts" setup>
import { ref } from 'vue'
import { SegmentedControl } from '../segmented-control'
import { Device } from './types'

type Props = {
  device?: Device
}

const props = withDefaults(defineProps<Props>(), {
  device: Device.Desktop
})

const currentDevice = ref(props.device)

const devices = [
  { value: Device.Desktop, label: 'Desktop', icon: 'desktop-device', width: '100%' },
  { value: Device.Tablet, label: 'Tablet', icon: 'tablet-device', width: '768px' },
  { value: Device.Mobile, label: 'Mobile', icon: 'mobile-device', width: '375px' }
]
</script>

<template>
  <div class="ep">
    <!-- Device toolbar -->
    <div class="ep__toolbar">
      <SegmentedControl
        v-model="currentDevice"
        :options="devices"
        label="Preview width"
        icon-only-on-phone
      />

      <span class="ep__size-hint">
        {{ devices.find((d) => d.value === currentDevice)?.width }}
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

.ep__size-hint {
  @apply text-2xs font-mono text-gray-500 dark:text-gray-400;
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
