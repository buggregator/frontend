<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { THEME_MODES, useSettingsStore } from '../../stores'
import { IconSvg } from '../icon-svg'

const settingsStore = useSettingsStore()
const { themeType } = storeToRefs(settingsStore)
const isDarkMode = computed(() => themeType.value === THEME_MODES.DARK)
</script>

<template>
  <header class="header">
    <nav class="header__nav">
      <slot />
    </nav>

    <div class="header__actions">
      <slot name="controls" />

      <button
        class="header__action-btn"
        :title="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
        :aria-label="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="settingsStore.changeTheme()"
      >
        <IconSvg
          :name="isDarkMode ? 'sun' : 'moon'"
          class="header__action-icon"
        />
      </button>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.header {
  @apply flex items-center justify-between h-full px-1;
}

.header__nav {
  @apply hidden sm:flex items-center;
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.header__actions {
  @apply flex items-center gap-1.5;
}

.header__action-btn {
  @apply h-7 w-7 flex items-center justify-center rounded;
  @apply text-gray-500 dark:text-gray-400;
  @apply bg-gray-100 dark:bg-gray-700;
  @apply hover:text-gray-700 dark:hover:text-gray-200;
  @apply hover:bg-gray-200 dark:hover:bg-gray-600;
  @apply transition-colors cursor-pointer;
}

.header__action-icon {
  @apply w-4 h-4;
}
</style>
