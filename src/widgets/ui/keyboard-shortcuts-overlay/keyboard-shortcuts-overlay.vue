<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { ref, useId } from 'vue'
import { SHORTCUT_GROUPS, capsOf, shortcutsIn } from '@/shared/lib/shortcuts'
import { useDialogFocus } from '@/shared/lib/use-dialog-focus'
import { useSettingsStore } from '@/shared/stores'

const emit = defineEmits<{
  close: []
}>()

const modal = ref<HTMLElement | null>(null)
const titleId = useId()
useDialogFocus(modal, () => emit('close'))

const settingsStore = useSettingsStore()
const { isSingleKeyShortcutsEnabled, isKeyHintsEnabled } = storeToRefs(settingsStore)

// Read from the one registry the key handlers use.
const sections = SHORTCUT_GROUPS
  .map((group) => ({ title: group.title, shortcuts: shortcutsIn(group.id) }))
  .filter((section) => section.shortcuts.length > 0)
</script>

<template>
  <Teleport to="body">
    <Transition name="shortcuts-overlay">
      <div
        v-if="true"
        class="shortcuts-backdrop"
        @click.self="$emit('close')"
      >
        <div
          ref="modal"
          class="shortcuts-modal"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
        >
          <div class="shortcuts-modal__header">
            <h2
              :id="titleId"
              class="shortcuts-modal__title"
            >
              Keyboard shortcuts
            </h2>
            <button
              type="button"
              class="shortcuts-modal__close"
              aria-label="Close"
              @click="$emit('close')"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <p class="shortcuts-modal__note">
            Shortcuts work when the cursor is not in a text field.
            <template v-if="!isSingleKeyShortcutsEnabled">
              Single-key shortcuts are off: the dimmed ones do nothing.
            </template>
          </p>

          <div class="shortcuts-modal__body">
            <div
              v-for="section in sections"
              :key="section.title"
              class="shortcuts-section"
            >
              <h3 class="shortcuts-section__title">
                {{ section.title }}
              </h3>
              <div class="shortcuts-section__list">
                <div
                  v-for="shortcut in section.shortcuts"
                  :key="shortcut.id"
                  class="shortcuts-row"
                  :class="{ 'shortcuts-row--off': shortcut.singleKey && !isSingleKeyShortcutsEnabled }"
                >
                  <span class="shortcuts-row__keys">
                    <kbd
                      v-for="key in capsOf(shortcut)"
                      :key="key"
                      class="shortcuts-row__kbd"
                    >{{
                      key
                    }}</kbd>
                  </span>
                  <span class="shortcuts-row__desc">{{ shortcut.label }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="shortcuts-modal__footer">
            <label class="shortcuts-switch">
              <button
                type="button"
                role="switch"
                class="shortcuts-switch__track"
                :class="{ 'shortcuts-switch__track--on': isSingleKeyShortcutsEnabled }"
                :aria-checked="isSingleKeyShortcutsEnabled"
                aria-label="Single-key shortcuts"
                @click="settingsStore.changeSingleKeyShortcuts()"
              >
                <span class="shortcuts-switch__knob" />
              </button>
              <span aria-hidden="true">Single-key shortcuts</span>
            </label>

            <label class="shortcuts-switch">
              <button
                type="button"
                role="switch"
                class="shortcuts-switch__track"
                :class="{ 'shortcuts-switch__track--on': isKeyHintsEnabled }"
                :aria-checked="isKeyHintsEnabled"
                aria-label="Show key hints"
                @click="settingsStore.changeKeyHints()"
              >
                <span class="shortcuts-switch__knob" />
              </button>
              <span aria-hidden="true">Show key hints</span>
            </label>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.shortcuts-backdrop {
  @apply fixed inset-0 z-[9999];
  @apply flex items-center justify-center;
  @apply bg-black/50;
  backdrop-filter: blur(2px);
}

.shortcuts-modal {
  @apply rounded-xl shadow-2xl overflow-hidden;
  @apply bg-white dark:bg-gray-800;
  @apply border border-gray-200 dark:border-gray-700;
  @apply w-full max-w-2xl mx-4;
  animation: modal-in 0.15s ease-out;
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.shortcuts-modal__header {
  @apply flex items-center justify-between;
  @apply px-5 py-4;
  @apply border-b border-gray-200 dark:border-gray-700;
}

.shortcuts-modal__title {
  @apply text-sm font-semibold;
}

.shortcuts-modal__close {
  @apply w-7 h-7 flex items-center justify-center rounded;
  @apply text-gray-500 dark:text-gray-400;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700;
  @apply hover:text-gray-600 dark:hover:text-gray-300;
  @apply cursor-pointer transition-colors;
  @apply text-lg leading-none;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
}

.shortcuts-modal__note {
  @apply px-5 pt-3 text-xs text-gray-500 dark:text-gray-400;
}

.shortcuts-modal__footer {
  @apply flex flex-wrap items-center gap-x-6 gap-y-2;
  @apply px-5 py-3;
  @apply border-t border-gray-200 dark:border-gray-700;
}

.shortcuts-switch {
  @apply inline-flex items-center gap-2 cursor-pointer;
  @apply text-xs text-gray-600 dark:text-gray-300;
}

.shortcuts-switch__track {
  @apply relative inline-flex h-5 w-9 items-center rounded-full flex-shrink-0 cursor-pointer;
  @apply bg-gray-300 dark:bg-gray-600;
  @apply transition-colors duration-200;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
}

.shortcuts-switch__track--on {
  @apply bg-blue-500 dark:bg-blue-600;
}

.shortcuts-switch__knob {
  @apply inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm;
  @apply transition-transform duration-200 translate-x-[3px];

  .shortcuts-switch__track--on & {
    @apply translate-x-[19px];
  }
}

.shortcuts-modal__body {
  @apply px-5 py-4;
  @apply grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5;
  max-height: calc(100vh - 12rem);
  overflow-y: auto;
}

.shortcuts-section__title {
  @apply text-2xs font-semibold uppercase tracking-wider;
  @apply text-gray-500 dark:text-gray-400;
  @apply mb-2;
}

.shortcuts-section__list {
  @apply flex flex-col gap-1;
}

.shortcuts-row {
  @apply grid items-center gap-3;
  @apply py-0.5;
  grid-template-columns: 4.5rem 1fr;
}

.shortcuts-row--off {
  @apply opacity-40;
}

.shortcuts-row__keys {
  @apply flex items-center gap-1;
}

.shortcuts-row__kbd {
  @apply inline-flex items-center justify-center;
  @apply min-w-[24px] h-6 px-1.5;
  @apply rounded-md;
  @apply text-xs font-mono font-medium;
  @apply bg-gray-100 dark:bg-gray-700;
  @apply text-gray-600 dark:text-gray-300;
  @apply border border-gray-200 dark:border-gray-600;
  box-shadow: 0 1px 0 theme('colors.gray.300');

  .dark & {
    box-shadow: 0 1px 0 theme('colors.gray.600');
  }
}

.shortcuts-row__desc {
  @apply text-xs text-gray-600 dark:text-gray-300;
}

/* Transition */
.shortcuts-overlay-enter-active,
.shortcuts-overlay-leave-active {
  transition: opacity 0.15s ease;
}

.shortcuts-overlay-enter-from,
.shortcuts-overlay-leave-to {
  opacity: 0;
}
</style>
