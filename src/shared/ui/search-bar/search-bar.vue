<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { mountedSearchBoxes, shortcutFor, useKeyHints } from '../../lib/shortcuts'
import { hasCommandModifier, isTextFieldFocused } from '../../lib/use-keyboard-nav'
import { useSettingsStore } from '../../stores'
import { IconSvg } from '../icon-svg'
import { KeyHints } from '../key-hints'

const model = defineModel<string>({ default: '' })

const settingsStore = useSettingsStore()
const inputRef = ref<HTMLInputElement | null>(null)
const isFocused = ref(false)
const { showInputHints } = useKeyHints()

const focus = () => inputRef.value?.focus()
const clear = () => {
  model.value = ''
  focus()
}

// Keys come from the shortcut registry (group «search»).
const onKeydown = (e: KeyboardEvent) => {
  if (!settingsStore.isSingleKeyShortcutsEnabled || hasCommandModifier(e)) return
  if (shortcutFor('search', e.key) === 'search-focus' && !isTextFieldFocused()) {
    e.preventDefault()
    focus()
  }
}

const onInputKeydown = (e: KeyboardEvent) => {
  if (shortcutFor('search', e.key) === 'search-clear') {
    clear()
    inputRef.value?.blur()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  mountedSearchBoxes.value++
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  mountedSearchBoxes.value--
})
</script>

<!--TODO: move svg to icon component-->
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
      @focus="isFocused = true"
      @blur="isFocused = false"
    >

    <KeyHints
      v-if="showInputHints && isFocused"
      class="search-bar__hints"
      :hints="[{ caps: ['Esc'], label: model ? 'clear' : 'leave' }]"
    />

    <kbd
      v-if="!model && !isFocused"
      class="search-bar__shortcut"
      title="Press / to search"
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
  @apply text-gray-500 dark:text-gray-400;
}

.search-bar__input {
  @apply bg-transparent outline-none text-xs flex-1 min-w-0;
  @apply text-gray-800 dark:text-gray-200;
  @apply placeholder-gray-400 dark:placeholder-gray-500;
}

.search-bar__hints {
  @apply flex-shrink-0 flex-nowrap;
}

.search-bar__shortcut {
  @apply text-2xs px-1 rounded leading-none;
  @apply bg-gray-200 dark:bg-gray-600;
  @apply text-gray-600 dark:text-gray-400;
  @apply font-mono;
  padding-top: 1px;
  padding-bottom: 1px;
  font-size: 10px;
}

.search-bar__clear {
  @apply flex-shrink-0 cursor-pointer;
  @apply text-gray-500 dark:text-gray-400;
  @apply hover:text-gray-600 dark:hover:text-gray-300;
  @apply transition-colors;
}

.search-bar__clear-icon {
  @apply w-3.5 h-3.5;
}
</style>
