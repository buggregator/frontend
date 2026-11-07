<script lang="ts" setup>
import { useDebounceFn } from '@vueuse/core'
import { computed, nextTick, ref, useId } from 'vue'
import { filePath, parseBreakpointInput } from '../../lib/xdebug-breakpoints'
import type { XdebugBreakpointDraft } from '../../types'
import { XdebugIcon } from '../xdebug-icon'

type Props = {
  // Resolves true when saved: the field empties.
  add: (draft: XdebugBreakpointDraft) => Promise<boolean>
  findFiles: (q: string) => Promise<string[]>
  adding?: boolean
  // The server's answer to the last add.
  serverError?: string
}
const props = withDefaults(defineProps<Props>(), { adding: false, serverError: '' })
// The user typed again: the last server error no longer applies.
const emit = defineEmits<{ edit: [] }>()

const uid = useId()
const listId = `${uid}-files`
const errId = `${uid}-err`

const text = ref('')
const localError = ref('')
const files = ref<string[]>([])
const open = ref(false)
const active = ref(-1)
const input = ref<HTMLInputElement | null>(null)
let asked = 0
// Set by typing, cleared by close: a late or debounced reply opens nothing.
let wanted = false

const error = computed(() => localError.value || props.serverError)
// Suggestions only while the path is typed, not after the colon.
const query = computed(() => (text.value.includes(':') && !/^[A-Za-z]:[\\/]/.test(text.value) ? null : text.value.trim()))

const fetchFiles = useDebounceFn(async () => {
  const q = query.value
  if (q === null) return
  const n = ++asked
  try {
    const found = await props.findFiles(q)
    if (n !== asked) return
    files.value = found
    active.value = -1
    open.value = wanted && found.length > 0 && document.activeElement === input.value
  } catch {
    if (n === asked) files.value = []
  }
}, 150)

const onInput = () => {
  localError.value = ''
  wanted = true
  if (props.serverError) emit('edit')
  if (query.value === null) {
    open.value = false
    return
  }
  fetchFiles()
}

const close = () => {
  wanted = false
  open.value = false
  active.value = -1
}

const pick = async (uri: string) => {
  text.value = `${filePath(uri)}:`
  close()
  await nextTick()
  const el = input.value
  el?.focus()
  el?.setSelectionRange(text.value.length, text.value.length)
}

const move = (step: number) => {
  if (!open.value) {
    if (files.value.length && query.value !== null) open.value = true
    return
  }
  const n = files.value.length
  active.value = (active.value + step + n) % n
}

const submit = async () => {
  if (open.value && active.value >= 0) {
    await pick(files.value[active.value])
    return
  }
  const { draft, error: bad } = parseBreakpointInput(text.value)
  if (bad) {
    localError.value = bad
    return
  }
  if (!draft) return
  close()
  if (await props.add(draft)) text.value = ''
}

// The matched part of a suggestion, for the highlight.
const parts = (uri: string) => {
  const path = filePath(uri)
  const q = query.value ?? ''
  const at = q ? path.toLowerCase().indexOf(q.toLowerCase()) : -1
  if (at < 0) return { before: path, match: '', after: '' }
  return { before: path.slice(0, at), match: path.slice(at, at + q.length), after: path.slice(at + q.length) }
}
</script>

<template>
  <form
    class="xdebug-bpadd"
    @submit.prevent="submit"
  >
    <div class="xdebug-bpadd__row">
      <input
        ref="input"
        v-model="text"
        class="xdebug-bpadd__input"
        :class="{ 'is-error': error }"
        role="combobox"
        aria-label="Add breakpoint: path:line or exception class"
        aria-autocomplete="list"
        :aria-expanded="open"
        :aria-controls="listId"
        :aria-activedescendant="open && active >= 0 ? `${listId}-${active}` : undefined"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? errId : undefined"
        placeholder="/path/to/File.php:42"
        spellcheck="false"
        autocomplete="off"
        @input="onInput"
        @focus="onInput"
        @blur="close"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.esc="open && ($event.preventDefault(), close())"
      >
      <button
        type="submit"
        class="xdebug-bpadd__btn"
        :disabled="adding || !text.trim()"
      >
        <XdebugIcon name="plus" />Add
      </button>

      <ul
        v-show="open"
        :id="listId"
        class="xdebug-bpadd__list"
        role="listbox"
        aria-label="Files from earlier stacks"
      >
        <li
          class="xdebug-bpadd__h"
          role="presentation"
        >
          Files from earlier stacks
        </li>
        <li
          v-for="(f, i) in files"
          :id="`${listId}-${i}`"
          :key="f"
          role="option"
          :aria-selected="i === active"
          class="xdebug-bpadd__opt"
          :title="filePath(f)"
          @mousedown.prevent="pick(f)"
        >
          {{ parts(f).before }}<mark>{{ parts(f).match }}</mark>{{ parts(f).after }}<span class="xdebug-bpadd__colon">:</span>
        </li>
      </ul>
    </div>
    <p
      v-if="error"
      :id="errId"
      class="xdebug-bpadd__err"
    >
      {{ error }}
    </p>
  </form>
</template>

<style lang="scss" scoped>
.xdebug-bpadd {
  @apply px-2 pt-2 pb-1 pl-3;
}

.xdebug-bpadd__row {
  @apply relative flex gap-1.5;
}

.xdebug-bpadd__input {
  @apply flex-1 min-w-0 h-7 px-2 rounded border font-mono text-xs;
  @apply border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;

  &.is-error {
    @apply border-rose-500 dark:border-rose-400;
  }
}

.xdebug-bpadd__btn {
  @apply inline-flex items-center gap-1 h-7 px-2.5 rounded border text-xs font-medium whitespace-nowrap;
  @apply border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;

  .xdebug-icon {
    @apply w-3.5 h-3.5;
  }
}

@media (max-width: 767px) {
  .xdebug-bpadd__input,
  .xdebug-bpadd__btn {
    @apply h-11;
  }
}

.xdebug-bpadd__list {
  @apply absolute left-0 right-0 z-20 m-0 py-1 list-none rounded-md border shadow-lg;
  @apply border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800;

  top: calc(100% + 4px);
  max-height: 240px;
  overflow-y: auto;
}

.xdebug-bpadd__h {
  @apply px-2.5 py-1 text-2xs text-gray-500 dark:text-gray-400;
}

.xdebug-bpadd__opt {
  @apply px-2.5 py-1 font-mono text-xs truncate cursor-pointer text-gray-800 dark:text-gray-200;

  &[aria-selected='true'],
  &:hover {
    @apply bg-blue-50 text-gray-900 dark:bg-gray-700 dark:text-white;
  }

  mark {
    @apply bg-transparent font-bold text-blue-700 dark:text-blue-300;
  }
}

.xdebug-bpadd__colon {
  @apply text-gray-500 dark:text-gray-400;
}

.xdebug-bpadd__err {
  @apply pt-1 text-2xs text-rose-700 dark:text-rose-300;
}
</style>
