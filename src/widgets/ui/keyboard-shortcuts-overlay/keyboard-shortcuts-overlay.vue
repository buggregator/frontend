<script lang="ts" setup>
defineEmits<{
  close: []
}>()

const sections = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['0'], desc: 'All events' },
      { keys: ['1'], desc: 'Sentry' },
      { keys: ['2'], desc: 'Profiler' },
      { keys: ['3'], desc: 'SMTP' },
      { keys: ['4'], desc: 'HTTP Dump' },
      { keys: ['5'], desc: 'Inspector' },
      { keys: ['6'], desc: 'VarDump' },
      { keys: ['7'], desc: 'Monolog' },
      { keys: ['8'], desc: 'Ray' },
    ]
  },
  {
    title: 'Event List',
    shortcuts: [
      { keys: ['j', '↓'], desc: 'Next event' },
      { keys: ['k', '↑'], desc: 'Previous event' },
      { keys: ['Enter'], desc: 'Open event' },
      { keys: ['Esc'], desc: 'Clear focus' },
    ]
  },
  {
    title: 'General',
    shortcuts: [
      { keys: ['?'], desc: 'Toggle this overlay' },
    ]
  },
]
</script>

<template>
  <Teleport to="body">
    <Transition name="shortcuts-overlay">
      <div
        class="shortcuts-backdrop"
        @click.self="$emit('close')"
        @keydown.escape="$emit('close')"
      >
        <div class="shortcuts-modal">
          <div class="shortcuts-modal__header">
            <h2 class="shortcuts-modal__title">
              Keyboard Shortcuts
            </h2>
            <button
              class="shortcuts-modal__close"
              @click="$emit('close')"
            >
              <span>&times;</span>
            </button>
          </div>

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
                  :key="shortcut.desc"
                  class="shortcuts-row"
                >
                  <span class="shortcuts-row__keys">
                    <kbd
                      v-for="key in shortcut.keys"
                      :key="key"
                      class="shortcuts-row__kbd"
                    >{{ key }}</kbd>
                  </span>
                  <span class="shortcuts-row__desc">{{ shortcut.desc }}</span>
                </div>
              </div>
            </div>
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
  @apply w-full max-w-lg mx-4;
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
  @apply text-gray-400 dark:text-gray-500;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700;
  @apply hover:text-gray-600 dark:hover:text-gray-300;
  @apply cursor-pointer transition-colors;
  @apply text-lg leading-none;
}

.shortcuts-modal__body {
  @apply px-5 py-4;
  @apply grid grid-cols-1 sm:grid-cols-2 gap-5;
  max-height: 70vh;
  overflow-y: auto;
}

.shortcuts-section__title {
  @apply text-2xs font-semibold uppercase tracking-wider;
  @apply text-gray-400 dark:text-gray-500;
  @apply mb-2;
}

.shortcuts-section__list {
  @apply flex flex-col gap-1;
}

.shortcuts-row {
  @apply flex items-center justify-between gap-3;
  @apply py-1;
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
