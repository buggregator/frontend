<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useEvents } from '@/shared/lib/use-events'
import { type RayLockStatus, lockStatusFromReply } from '../../lib/lock-status'
import type { RayContentLock, RayLockState } from '../../types'

// A `ray()->pause()`: Continue or Stop the waiting script.
// `state` comes from the server once the pause was released (this tab, another
// tab, or before a reload); until then the click's own reply sets it here.
type Props = {
  name: RayContentLock['name']
  state?: RayContentLock['state']
}

const props = defineProps<Props>()

const { rayExecution } = useEvents()

const pending = ref(false)
const failed = ref(false)
const released = ref<RayLockStatus | null>(null)

const status = computed<RayLockStatus>(() => props.state ?? released.value ?? 'active')
const disabled = computed(() => pending.value || status.value !== 'active')

const STATUS_TEXT: Record<RayLockStatus, string> = {
  active: 'Paused. The script waits for you.',
  continued: 'Continued. The script went on.',
  stopped: 'Stopped. The script was told to stop.',
  gone: 'This pause is no longer active: the server was restarted, the script does not wait.',
}

const release = async (asked: RayLockState) => {
  pending.value = true
  failed.value = false
  try {
    const reply = asked === 'stopped'
      ? await rayExecution.stop(props.name)
      : await rayExecution.continue(props.name)
    const next = lockStatusFromReply(reply, asked)
    if (next) {
      released.value = next
    } else {
      failed.value = true
    }
  } catch {
    failed.value = true
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="ray-lock">
    <div class="ray-lock__buttons">
      <button
        :disabled="disabled"
        class="ray-lock__button ray-lock__button--continue"
        @click="release('continued')"
      >
        <span class="ray-lock__button-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
            viewBox="0 0 20 20"
          >
            <path
              fill="green"
              fill-rule="evenodd"
              d="M16.75 10.83L4.55 19A1 1 0 0 1 3 18.13V1.87A1 1 0 0 1 4.55 1l12.2 8.13a1 1 0 0 1 0 1.7z"
            />
          </svg>
        </span>

        <span>Continue</span>
      </button>
      <button
        :disabled="disabled"
        class="ray-lock__button ray-lock__button--stop"
        @click="release('stopped')"
      >
        <span class="ray-lock__button-text" />
        <span>Stop execution</span>
      </button>
    </div>
    <p
      class="ray-lock__status"
      :class="`ray-lock__status--${failed ? 'error' : status}`"
      role="status"
    >
      {{ failed ? 'Could not reach the server. Try again.' : STATUS_TEXT[status] }}
    </p>
  </div>
</template>

<style lang="scss" scoped>
.ray-lock {
  @apply mt-3;
}

.ray-lock__buttons {
  @apply flex items-center;
}

.ray-lock__status {
  @apply mt-2 text-xs text-gray-600 dark:text-gray-400;
}

.ray-lock__status--continued {
  @apply text-green-700 dark:text-green-400;
}

.ray-lock__status--stopped,
.ray-lock__status--error {
  @apply text-red-700 dark:text-red-400;
}

.ray-lock__button {
  @apply px-5 py-2 flex items-center space-x-3 bg-gray-100 dark:bg-gray-800 border dark:border-gray-600 text-sm font-medium hover:bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100 dark:disabled:hover:bg-gray-800; // active:bg-grey-300;
}

.ray-lock__button--continue {
  @apply rounded-l-full;
}

.ray-lock__button--stop {
  @apply border-l-0 rounded-r-full; // active:bg-grey-300;
}

.ray-lock__button-text {
  @apply w-3 h-3 bg-red-700 block;
}

.ray-lock__button-icon {
  @apply w-3 h-3 block;
}
</style>
