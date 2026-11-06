<script lang="ts" setup>
import { computed } from 'vue'
import type { XdebugSessionState } from '../../types'
import { XdebugIcon, type XdebugIconName } from '../xdebug-icon'

const props = defineProps<{ state: XdebugSessionState | 'stepping' }>()

// Always icon + word: the state never reads by colour alone.
const view = computed((): { label: string; icon: XdebugIconName | null; tone: string; title: string } => {
  switch (props.state) {
    case 'break':
      return { label: 'Paused', icon: 'pause', tone: 'paused', title: 'Paused at a breakpoint' }
    case 'running':
      return { label: 'Running', icon: 'play', tone: 'running', title: 'The script is running' }
    case 'starting':
      return { label: 'Starting', icon: 'play', tone: 'running', title: 'Waiting for the first pause' }
    case 'stepping':
      return { label: 'Stepping in IDE…', icon: null, tone: 'running', title: 'The IDE sent a step; waiting for the next pause' }
    case 'stopping':
      return { label: 'Stopping', icon: 'x', tone: 'off', title: 'The script is finishing' }
    case 'stopped':
      return { label: 'Stopped', icon: 'x', tone: 'off', title: 'The session has ended' }
    default:
      return { label: 'Detached', icon: 'x', tone: 'off', title: 'The script ran on without debugging' }
  }
})
</script>

<template>
  <span
    class="xdebug-state"
    :class="`xdebug-state--${view.tone}`"
    :title="view.title"
  >
    <span
      v-if="!view.icon"
      class="xdebug-state__spin"
      aria-hidden="true"
    />
    <XdebugIcon
      v-else
      :name="view.icon"
      class="xdebug-state__icon"
    />
    {{ view.label }}
  </span>
</template>

<style lang="scss" scoped>
.xdebug-state {
  @apply inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-2xs font-bold whitespace-nowrap;
}

.xdebug-state__icon {
  @apply w-2.5 h-2.5;
}

.xdebug-state--paused {
  @apply text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10;
}

.xdebug-state--running {
  @apply text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-500/10;
}

.xdebug-state--off {
  @apply text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700;
}

.xdebug-state__spin {
  @apply inline-block w-2 h-2 rounded-full border-[1.5px] border-current border-r-transparent animate-spin;

  @media (prefers-reduced-motion: reduce) {
    @apply animate-none border-r-current opacity-60;
  }
}
</style>
