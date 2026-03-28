<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { IconSvg } from '../icon-svg'

const model = defineModel<string>({ default: '' })

const inputRef = ref<HTMLInputElement | null>(null)

const focus = () => inputRef.value?.focus()
const clear = () => {
  model.value = ''
  focus()
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === '/' && !isInputFocused()) {
    e.preventDefault()
    focus()
  }
}

const onInputKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    clear()
    inputRef.value?.blur()
  }
}

const isInputFocused = () => {
  const active = document.activeElement
  return active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<!--TODO: move svg to icon commponent-->
<template>
  <div class="search-bar">
    <svg
      class="search-bar__icon"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fill-rule="evenodd"
        d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
        clip-rule="evenodd"
      />
    </svg>

    <input
      ref="inputRef"
      v-model="model"
      type="text"
      class="search-bar__input"
      placeholder="Search events..."
      aria-label="Search events"
      @keydown="onInputKeydown"
    >

    <kbd
      v-if="!model"
      class="search-bar__shortcut"
    >/</kbd>

    <button
      v-else
      class="search-bar__clear"
      title="Clear search (Escape)"
      aria-label="Clear search"
      @click="clear"
    >
      <IconSvg
        name="times"
        class="search-bar__clear-icon"
      />
    </button>
  </div>
</template>

<style lang="scss" scoped>
.search-bar {
  @apply flex items-center gap-2 px-2.5 h-7 rounded flex-1;
  @apply bg-gray-100 dark:bg-gray-700/60;
  @apply border border-transparent;
  @apply transition-colors;

  &:focus-within {
    @apply border-blue-400 dark:border-blue-500;
    @apply bg-white dark:bg-gray-800;
  }
}

.search-bar__icon {
  @apply w-3.5 h-3.5 flex-shrink-0;
  @apply text-gray-400 dark:text-gray-500;
}

.search-bar__input {
  @apply bg-transparent outline-none text-xs flex-1 min-w-0;
  @apply text-gray-800 dark:text-gray-200;
  @apply placeholder-gray-400 dark:placeholder-gray-500;
}

.search-bar__shortcut {
  @apply text-2xs px-1 rounded leading-none;
  @apply bg-gray-200 dark:bg-gray-600;
  @apply text-gray-400 dark:text-gray-500;
  @apply font-mono;
  padding-top: 1px;
  padding-bottom: 1px;
  font-size: 10px;
}

.search-bar__clear {
  @apply flex-shrink-0 cursor-pointer;
  @apply text-gray-400 dark:text-gray-500;
  @apply hover:text-gray-600 dark:hover:text-gray-300;
  @apply transition-colors;
}

.search-bar__clear-icon {
  @apply w-3.5 h-3.5;
}
</style>
