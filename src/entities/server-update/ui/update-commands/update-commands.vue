<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { copyTextToClipboard } from '@/shared/lib/clipboard'
import { Tabs, tabIdOf } from '@/shared/ui'
import type { UpdateCommand } from '../../types'
import { UpdateIcon } from '../update-icon'

const props = defineProps<{ commands: UpdateCommand[] }>()

const selected = ref(0)
const copied = ref(false)
const uid = `update-cmd-${Math.random().toString(36).slice(2, 8)}`

const current = computed(() => props.commands[selected.value] ?? props.commands[0])
const tabs = computed(() => props.commands.map((c) => ({ id: c.id, label: c.label })))

watch(
  () => props.commands,
  () => {
    selected.value = 0
  }
)

const select = (id: string) => {
  selected.value = Math.max(
    props.commands.findIndex((c) => c.id === id),
    0
  )
  copied.value = false
}

const copy = async () => {
  if (!current.value) return
  try {
    await copyTextToClipboard(current.value.command)
    copied.value = true
  } catch (e) {
    console.error('Copy failed', e)
  }
}
</script>

<template>
  <div
    v-if="current"
    class="update-commands"
  >
    <Tabs
      v-if="commands.length > 1"
      class="update-commands__tabs"
      :tabs="tabs"
      :current="current.id"
      label="How you run Buggregator"
      :panel-id="`${uid}-panel`"
      @select="select"
    />

    <div
      :id="`${uid}-panel`"
      class="update-commands__box"
      :role="commands.length > 1 ? 'tabpanel' : undefined"
      :aria-labelledby="commands.length > 1 ? tabIdOf(`${uid}-panel`, current.id) : undefined"
    >
      <pre class="update-commands__pre"><code>{{ current.command }}</code></pre>
      <button
        type="button"
        class="update-commands__copy"
        data-test="copy-command"
        @click="copy"
      >
        <UpdateIcon :name="copied ? 'check' : 'copy'" />
        {{ copied ? 'Copied' : 'Copy' }}
      </button>
    </div>
    <span
      class="sr-only"
      aria-live="polite"
    >{{ copied ? 'Command copied' : '' }}</span>
  </div>
</template>

<style lang="scss" scoped>
@use 'src/entities/server-update/ui/update-buttons' as b;

.update-commands__tabs {
  @apply mb-2;
}

.update-commands__box {
  @apply flex items-start gap-2 rounded-md pl-3 pr-2 py-2;
  @apply bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700;
}

.update-commands__pre {
  @apply m-0 flex-1 min-w-0 pt-1 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap;
  @apply text-gray-900 dark:text-gray-100;
  overflow-wrap: anywhere;
}

.update-commands__copy {
  @include b.btn;
  @include b.btn-ghost;
  @apply flex-none;

  @media (max-width: 639px) {
    @apply min-w-[44px];
  }
}
</style>
