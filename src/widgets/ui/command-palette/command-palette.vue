<script lang="ts" setup>
import { computed, nextTick, ref, useId, watch } from 'vue'
import { type Command, filterCommands, hiddenMatch } from '@/shared/lib/command-palette'
import { useDialogFocus } from '@/shared/lib/use-dialog-focus'
import { HighlightText, IconSvg } from '@/shared/ui'
import { usePaletteCommands } from './use-palette-commands'

const emit = defineEmits<{ close: [] }>()

const dialog = ref<HTMLElement | null>(null)
const list = ref<HTMLElement | null>(null)
useDialogFocus(dialog, () => emit('close'))

const uid = useId()
const listId = `${uid}-list`
const optionId = (index: number) => `${uid}-option-${index}`

const commands = usePaletteCommands()
const query = ref('')
const sections = computed(() => filterCommands(commands.value, query.value))
const flat = computed(() => sections.value.flatMap((section) => section.commands))
const activeIndex = ref(0)
const indexOf = (command: Command) => flat.value.indexOf(command)
// On the right: the hidden word a row was found by (it takes a setting's
// section place; a page keeps its «N new» after it), else the row's own note.
const noteOf = (command: Command) => {
  const word = hiddenMatch(command, query.value)
  if (!word) return command.note
  if (command.group === 'settings' || !command.note || command.note === word) return word
  return `${word} · ${command.note}`
}

watch(query, () => {
  activeIndex.value = 0
  list.value?.scrollTo?.({ top: 0 })
})

const status = computed(() => {
  const n = flat.value.length
  if (n === 0) return 'Nothing matches.'
  return n === 1 ? '1 result.' : `${n} results.`
})

const move = async (step: number) => {
  const n = flat.value.length
  if (!n) return
  activeIndex.value = (activeIndex.value + step + n) % n
  await nextTick()
  document.getElementById(optionId(activeIndex.value))?.scrollIntoView?.({ block: 'nearest' })
}

// Close first: focus goes back to where it was, then the command moves on.
const run = (command: Command | undefined) => {
  if (!command) return
  emit('close')
  command.run()
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    move(1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    move(-1)
  } else if (e.key === 'Enter' && !e.isComposing) {
    e.preventDefault()
    run(flat.value[activeIndex.value])
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      class="palette-backdrop"
      data-test="command-palette"
      @click.self="$emit('close')"
    >
      <div
        ref="dialog"
        class="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Go to"
      >
        <div class="palette__search">
          <svg
            class="palette__search-icon"
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
            v-model="query"
            class="palette__input"
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            :aria-controls="listId"
            :aria-activedescendant="flat.length ? optionId(activeIndex) : undefined"
            aria-label="Go to a page, project, setting or action"
            placeholder="Go to a page, project, setting or action…"
            autocomplete="off"
            spellcheck="false"
            @keydown="onKeydown"
          >
          <button
            type="button"
            class="palette__close"
            aria-label="Close"
            @click="$emit('close')"
          >
            Esc
          </button>
        </div>

        <div
          :id="listId"
          ref="list"
          class="palette__list"
          role="listbox"
          aria-label="Results"
        >
          <div
            v-for="section in sections"
            :key="section.id"
            role="group"
            :aria-labelledby="`${uid}-${section.id}`"
          >
            <div
              :id="`${uid}-${section.id}`"
              class="palette__group"
            >
              {{ section.title }}
            </div>
            <div
              v-for="command in section.commands"
              :id="optionId(indexOf(command))"
              :key="command.id"
              class="palette__item"
              :class="{ 'palette__item--active': indexOf(command) === activeIndex }"
              role="option"
              :aria-selected="indexOf(command) === activeIndex"
              :data-command="command.id"
              @click="run(command)"
              @mousemove="activeIndex = indexOf(command)"
            >
              <span class="palette__item-icon">
                <IconSvg
                  v-if="command.icon"
                  :name="command.icon"
                  class="palette__icon"
                />
              </span>
              <span class="palette__item-label">
                <HighlightText
                  :text="command.label"
                  :query="query"
                />
              </span>
              <span
                v-if="noteOf(command)"
                class="palette__item-note"
              >{{ noteOf(command) }}</span>
            </div>
          </div>

          <p
            v-if="!flat.length"
            class="palette__empty"
          >
            Nothing matches «{{ query.trim() }}».
          </p>
        </div>

        <div
          class="palette__footer"
          aria-hidden="true"
        >
          <span><kbd class="palette__kbd">↑↓</kbd> choose</span>
          <span><kbd class="palette__kbd">Enter</kbd> open</span>
          <span><kbd class="palette__kbd">Esc</kbd> close</span>
        </div>

        <p
          class="sr-only"
          role="status"
        >
          {{ status }}
        </p>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.palette-backdrop {
  @apply fixed inset-0 z-[9999] flex justify-center items-start;
  @apply bg-gray-950/60;
  padding: 12vh 1rem 1rem;
}

.palette {
  @apply w-full max-w-xl flex flex-col overflow-hidden rounded-xl shadow-2xl;
  @apply bg-white dark:bg-gray-800;
  @apply border border-gray-200 dark:border-gray-700;
  max-height: min(32rem, 76vh);
}

.palette__search {
  @apply flex items-center gap-3 px-4 h-12 flex-none;
  @apply border-b border-gray-200 dark:border-gray-700;
}

.palette__search-icon {
  @apply w-4 h-4 flex-none text-gray-500 dark:text-gray-400;
}

.palette__input {
  @apply flex-1 min-w-0 bg-transparent outline-none text-sm;
  @apply text-gray-900 dark:text-gray-100;
  @apply placeholder-gray-500 dark:placeholder-gray-400;
}

.palette__close {
  @apply flex-none font-mono text-2xs px-1.5 py-0.5 rounded;
  @apply text-gray-600 dark:text-gray-300;
  @apply border border-gray-300 dark:border-gray-600;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700;
}

.palette__list {
  @apply flex-1 overflow-y-auto py-1;
  overscroll-behavior: contain;
}

.palette__group {
  @apply px-4 pt-3 pb-1 text-2xs font-semibold uppercase tracking-wider;
  @apply text-gray-500 dark:text-gray-400;
}

.palette__item {
  @apply flex items-center gap-3 mx-2 px-2 py-2 rounded-md cursor-pointer text-sm;
  @apply text-gray-800 dark:text-gray-200;
}

.palette__item--active {
  @apply bg-blue-50 text-gray-900 dark:bg-gray-700 dark:text-gray-100;
  box-shadow: inset 2px 0 0 theme('colors.blue.500');
}

.palette__item-icon {
  @apply w-4 h-4 flex-none flex items-center justify-center;
}

.palette__icon {
  @apply w-4 h-4 text-gray-500 dark:text-gray-400;
}

.palette__item-label {
  @apply flex-1 min-w-0 truncate;
}

.palette__item-note {
  @apply flex-none text-xs text-gray-500 dark:text-gray-400;
}

.palette__empty {
  @apply px-4 py-6 text-sm text-center text-gray-500 dark:text-gray-400;
}

.palette__footer {
  @apply flex gap-5 px-4 py-2 flex-none text-xs;
  @apply text-gray-500 dark:text-gray-400;
  @apply border-t border-gray-200 dark:border-gray-700;
}

.palette__kbd {
  @apply font-mono text-2xs px-1 mr-1 rounded;
  @apply border border-gray-300 dark:border-gray-600 border-b-2;
}

// Phone: at the top, 44 px rows; no key hints (no keyboard).
@media (max-width: 639px) {
  .palette-backdrop {
    padding: 0.5rem;
  }

  .palette {
    max-height: calc(100dvh - 1rem);
  }

  .palette__search {
    @apply h-12;
  }

  .palette__input {
    @apply text-base;
  }

  .palette__close {
    @apply min-h-[44px] min-w-[44px];
  }

  .palette__item {
    @apply min-h-[44px];
  }

  .palette__footer {
    @apply hidden;
  }
}
</style>
