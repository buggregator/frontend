<script lang="ts" setup>
import { ref } from 'vue'
import { copyTextToClipboard } from '../../lib/clipboard'

type Props = {
  title?: string
  copyValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  copyValue: ''
})

const isCopied = ref(false)

const copyRow = () => {
  if (!props.copyValue) return
  isCopied.value = true
  copyTextToClipboard(props.copyValue).catch(console.error)
  setTimeout(() => {
    isCopied.value = false
  }, 1500)
}
</script>

<template>
  <div class="table-row group">
    <div class="table-row__name">
      <span :title="title">{{ title }}</span>
    </div>
    <div class="table-row__value">
      <slot />
      <button
        v-if="copyValue"
        class="table-row__copy"
        :class="{ 'table-row__copy--active': isCopied }"
        :title="isCopied ? 'Copied!' : 'Copy value'"
        @click.stop="copyRow"
      >
        <svg
          class="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            v-if="isCopied"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M5 13l4 4L19 7"
          />
          <path
            v-else
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.table-row {
  @apply flex flex-col md:flex-row md:items-center;
  @apply py-1.5 px-3 text-xs;
  @apply bg-white dark:bg-gray-800;

  &:nth-child(even) {
    @apply bg-gray-50 dark:bg-gray-800/50;
  }
}

.table-row__name {
  @apply font-medium text-gray-500 dark:text-gray-400;
  @apply md:w-1/4 md:pr-3 truncate flex-shrink-0;
  @apply md:border-r md:border-gray-200 md:dark:border-gray-700;
}

.table-row__value {
  @apply break-all md:w-3/4 md:pl-3 font-mono text-gray-700 dark:text-gray-200;
  @apply flex items-center gap-1;
}

.table-row__copy {
  @apply opacity-0 flex-shrink-0 p-0.5 rounded cursor-pointer;
  @apply text-gray-400 dark:text-gray-500;
  @apply hover:text-gray-600 dark:hover:text-gray-300;
  @apply transition-opacity duration-150;

  .group:hover & {
    @apply opacity-100;
  }
}

.table-row__copy--active {
  @apply opacity-100 text-green-600 dark:text-green-400;
}
</style>
