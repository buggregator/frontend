<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue'
import { copyTextToClipboard } from '@/shared/lib/clipboard'
import type { UpdateCommand } from '../../types'
import { UpdateIcon } from '../update-icon'

const props = defineProps<{ commands: UpdateCommand[] }>()

const selected = ref(0)
const copied = ref(false)
const tabRefs = ref<HTMLButtonElement[]>([])
const uid = `update-cmd-${Math.random().toString(36).slice(2, 8)}`

const current = computed(() => props.commands[selected.value] ?? props.commands[0])

watch(
  () => props.commands,
  () => {
    selected.value = 0
  }
)

const select = (index: number) => {
  selected.value = index
  copied.value = false
}

// Arrow keys move between tabs (WAI-ARIA tabs pattern).
const onKeydown = async (event: KeyboardEvent, index: number) => {
  const count = props.commands.length
  const moves: Record<string, number> = {
    ArrowRight: (index + 1) % count,
    ArrowLeft: (index - 1 + count) % count,
    Home: 0,
    End: count - 1
  }
  const next = moves[event.key]
  if (next === undefined) return
  event.preventDefault()
  select(next)
  await nextTick()
  tabRefs.value[next]?.focus()
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
    <div
      v-if="commands.length > 1"
      class="update-commands__tabs"
      role="tablist"
      aria-label="How you run Buggregator"
    >
      <button
        v-for="(command, index) in commands"
        :id="`${uid}-tab-${index}`"
        :key="command.id"
        ref="tabRefs"
        type="button"
        role="tab"
        class="update-commands__tab"
        :aria-selected="index === selected ? 'true' : 'false'"
        :aria-controls="`${uid}-panel`"
        :tabindex="index === selected ? 0 : -1"
        @click="select(index)"
        @keydown="onKeydown($event, index)"
      >
        {{ command.label }}
      </button>
    </div>

    <div
      :id="`${uid}-panel`"
      class="update-commands__box"
      :role="commands.length > 1 ? 'tabpanel' : undefined"
      :aria-labelledby="commands.length > 1 ? `${uid}-tab-${selected}` : undefined"
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
  @apply flex gap-1 mb-2 overflow-x-auto;
  @apply border-b border-gray-200 dark:border-gray-700;
}

.update-commands__tab {
  @apply px-2.5 py-1.5 min-h-[32px] text-[13px] -mb-px;
  @apply text-gray-500 dark:text-gray-400 border-b-2 border-transparent;
  @apply hover:text-gray-800 dark:hover:text-gray-200;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400 rounded-t;

  &[aria-selected='true'] {
    @apply font-medium text-gray-900 dark:text-gray-100 border-blue-700 dark:border-blue-400;
  }

  @media (max-width: 639px) {
    @apply min-h-[44px];
  }
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
