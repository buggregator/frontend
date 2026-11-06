<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { foldFrames, shortFile } from '../../lib/xdebug-format'
import type { XdebugFrame } from '../../types'
import { XdebugIcon } from '../xdebug-icon'

const props = defineProps<{ frames: XdebugFrame[]; selected: number; disabled?: boolean }>()
const emit = defineEmits<{ select: [level: number] }>()

const expanded = ref<Set<number>>(new Set())
watch(() => props.frames, () => { expanded.value = new Set() })

const rows = computed(() => foldFrames(props.frames, props.selected, expanded.value))
const open = (first: number) => { expanded.value = new Set([...expanded.value, first]) }
</script>

<template>
  <ol
    class="xdebug-stack"
    aria-label="Call stack"
  >
    <li
      v-for="row in rows"
      :key="row.kind === 'frame' ? row.frame.level : `g${row.first}`"
    >
      <button
        v-if="row.kind === 'group'"
        type="button"
        class="xdebug-stack__grp"
        @click="open(row.first)"
      >
        <XdebugIcon name="layers" />
        {{ row.count }} framework {{ row.count === 1 ? 'frame' : 'frames' }}
      </button>
      <button
        v-else
        type="button"
        class="xdebug-stack__f"
        :class="{ 'is-selected': row.frame.level === selected, 'is-vendor': row.frame.vendor }"
        :aria-current="row.frame.level === selected ? 'true' : undefined"
        :title="`${row.frame.where} — ${row.frame.file}:${row.frame.line}`"
        :disabled="disabled"
        @click="emit('select', row.frame.level)"
      >
        <span class="xdebug-stack__fn">{{ row.frame.where || '{main}' }}</span>
        <span class="xdebug-stack__file">{{ shortFile(row.frame.file) }}:{{ row.frame.line }}</span>
      </button>
    </li>
  </ol>
</template>

<style lang="scss" scoped>
.xdebug-stack {
  @apply list-none m-0 py-1;
}

.xdebug-stack__f {
  @apply flex flex-col w-full gap-px px-3 py-1.5 text-left border-l-[3px] border-transparent;

  &:hover {
    @apply bg-gray-50 dark:bg-gray-700/50;
  }

  &:focus-visible {
    @apply outline-none ring-2 ring-inset ring-blue-500;
  }

  &.is-selected {
    @apply border-blue-500 bg-blue-50 dark:bg-blue-500/10;
  }

  &:disabled {
    @apply cursor-default opacity-70;
  }
}

.xdebug-stack__fn {
  @apply font-mono text-xs text-gray-900 dark:text-white truncate max-w-full;

  .is-vendor & {
    @apply text-gray-600 dark:text-gray-300;
  }
}

.xdebug-stack__file {
  @apply font-mono text-2xs text-gray-500 dark:text-gray-400 truncate max-w-full;
}

.xdebug-stack__grp {
  @apply inline-flex items-center gap-1.5 mx-2 my-0.5 px-2 h-6 rounded text-2xs text-gray-600 dark:text-gray-300;

  &:hover {
    @apply bg-gray-100 dark:bg-gray-700;
  }

  &:focus-visible {
    @apply outline-none ring-2 ring-blue-500;
  }
}
</style>
