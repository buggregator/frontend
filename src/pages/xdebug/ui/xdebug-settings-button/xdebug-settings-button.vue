<script lang="ts" setup>
import { onClickOutside } from '@vueuse/core'
import { computed, nextTick, ref, toRef } from 'vue'
import { useXdebugRequests, useXdebugSettings, XdebugIcon, XdebugSettingsDialog } from '@/entities/xdebug'
import type { XdebugConfig, XdebugSettings } from '@/entities/xdebug/types'

// «Mode: Auto» tag and the gear in the page header; both open the settings
// popover. Focus goes back to the button that opened it.
const props = defineProps<{ config: XdebugConfig }>()
const emit = defineEmits<{ saved: [settings: XdebugSettings] }>()

const settings = useXdebugSettings(useXdebugRequests(), toRef(props, 'config'), (s) => emit('saved', s))

const MODE_LABEL = { proxy: 'Proxy to IDE', auto: 'Auto', standalone: 'Standalone' } as const
const modeLabel = computed(() => MODE_LABEL[props.config.mode ?? 'auto'])

const open = ref(false)
const root = ref<HTMLElement | null>(null)
let opener: HTMLElement | null = null

const show = (event: Event) => {
  opener = event.currentTarget as HTMLElement
  settings.open()
  open.value = true
}

const close = async () => {
  if (!open.value) return
  open.value = false
  await nextTick()
  opener?.focus()
}

const save = async () => {
  if (await settings.save()) close()
}

onClickOutside(root, () => {
  if (open.value) open.value = false
})
</script>

<template>
  <span
    ref="root"
    class="xdebug-setbtn"
  >
    <button
      type="button"
      class="xdebug-setbtn__tag"
      :aria-expanded="open"
      aria-haspopup="dialog"
      title="How new debug sessions are driven"
      @click="show"
    >
      Mode: {{ modeLabel }}
    </button>
    <button
      type="button"
      class="xdebug-setbtn__gear"
      aria-label="Debugger settings"
      title="Debugger settings"
      :aria-expanded="open"
      aria-haspopup="dialog"
      @click="show"
    >
      <XdebugIcon name="settings" />
    </button>
    <XdebugSettingsDialog
      v-if="open"
      v-model:mode="settings.draft.value.mode"
      v-model:pause-on-first-line="settings.draft.value.pause_on_first_line"
      :allow-eval="config.allow_eval"
      :agent-control="config.allow_control === undefined ? '' : config.allow_control ? 'on' : 'off'"
      :idle-timeout-seconds="config.idle_timeout_seconds ?? 0"
      :saving="settings.saving.value"
      :error="settings.error.value"
      @save="save"
      @cancel="close"
    />
  </span>
</template>

<style lang="scss" scoped>
.xdebug-setbtn {
  @apply relative inline-flex items-center gap-1;
}

.xdebug-setbtn__tag {
  @apply inline-flex items-center h-6 px-2 rounded border text-2xs whitespace-nowrap;
  @apply border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;

  @media (max-width: 767px) {
    @apply hidden;
  }
}

.xdebug-setbtn__gear {
  @apply inline-flex items-center justify-center w-7 h-7 rounded text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;

  .xdebug-icon {
    @apply w-4 h-4;
  }

  // Phones: 44 px wide, as tall as the 36 px header allows.
  @media (max-width: 767px) {
    @apply w-11 h-9;
  }
}
</style>
