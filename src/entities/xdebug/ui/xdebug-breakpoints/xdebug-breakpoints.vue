<script lang="ts" setup>
import { nextTick, ref } from 'vue'
import { type BreakpointRow, exceptionName, filePath } from '../../lib/xdebug-breakpoints'
import { splitPath } from '../../lib/xdebug-format'
import type { XdebugSavedBreakpoint } from '../../types'
import { XdebugIcon } from '../xdebug-icon'

type Props = {
  rows: BreakpointRow[]
  // An IDE drives the selected session: the saved list is shown, not changed.
  readOnly?: boolean
  allowEval: boolean
  // Hit counts mean something only while a session driven here is paused.
  showHits?: boolean
  busy?: Set<number>
  rowError?: Record<number, string>
  loadError?: boolean
  // Resolves true when saved, so the editor closes.
  saveCondition: (id: number, condition: string) => Promise<boolean>
}

const props = withDefaults(defineProps<Props>(), {
  readOnly: false,
  showHits: false,
  busy: () => new Set(),
  rowError: () => ({}),
  loadError: false
})
const emit = defineEmits<{ enable: [id: number, enabled: boolean]; remove: [id: number]; retry: [] }>()

const where = (bp: XdebugSavedBreakpoint) => {
  if (bp.type === 'exception') return bp.exception === '*' ? 'every exception' : exceptionName(bp.exception)
  const { name } = splitPath(bp.file)
  return `${name}:${bp.line}`
}
const dir = (bp: XdebugSavedBreakpoint) => splitPath(bp.file).dir.replace(/^file:\/\//, '').replace(/\/$/, '')

// One condition editor at a time; focus goes back to its button on close.
const editing = ref<number | null>(null)
const draft = ref('')
const saving = ref(false)
// Inside v-for a plain template ref would be an array: one editor, one element.
let input: HTMLInputElement | null = null
const inputRef = (el: unknown) => { input = el as HTMLInputElement | null }
const condButtons = new Map<number, HTMLButtonElement>()
const condRef = (id: number) => (el: unknown) => {
  if (el) condButtons.set(id, el as HTMLButtonElement)
  else condButtons.delete(id)
}

const openCondition = async (bp: XdebugSavedBreakpoint) => {
  editing.value = bp.id
  draft.value = bp.condition ?? ''
  await nextTick()
  input?.focus()
}
const closeCondition = async () => {
  const id = editing.value
  editing.value = null
  await nextTick()
  if (id !== null) condButtons.get(id)?.focus()
}
const submitCondition = async (id: number, value = draft.value) => {
  saving.value = true
  try {
    if (await props.saveCondition(id, value)) await closeCondition()
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="xdebug-bp">
    <p
      v-if="loadError"
      class="xdebug-bp__err xdebug-bp__err--block"
      role="alert"
    >
      <XdebugIcon name="warn" />Could not load the breakpoints.
      <button
        type="button"
        class="xdebug-bp__link"
        @click="emit('retry')"
      >
        Try again
      </button>
    </p>

    <p
      v-else-if="!rows.length"
      class="xdebug-bp__note"
    >
      {{ readOnly ? 'No saved breakpoints.' : 'No breakpoints. When a session pauses, click a line number in the code, or type path:line below.' }}
    </p>

    <ul
      v-else
      class="xdebug-bp__list"
      aria-label="Breakpoints"
    >
      <li
        v-for="row in rows"
        :key="row.bp.id"
        class="xdebug-bp__row"
        :class="{ 'is-off': !row.bp.enabled }"
      >
        <label class="xdebug-bp__cbcell">
          <input
            type="checkbox"
            class="xdebug-bp__cb"
            :checked="row.bp.enabled"
            :disabled="readOnly || busy.has(row.bp.id)"
            :aria-label="`Enabled: ${where(row.bp)}`"
            @change="emit('enable', row.bp.id, ($event.target as HTMLInputElement).checked)"
          >
        </label>
        <span class="xdebug-bp__loc">
          <template v-if="row.bp.type === 'exception'">
            <span
              class="xdebug-bp__ex"
              title="Pause when this exception is thrown"
            ><XdebugIcon name="bolt" /></span>
            <span class="xdebug-bp__f">on {{ where(row.bp) }}</span>
          </template>
          <template v-else>
            <span
              class="xdebug-bp__f"
              :title="`${filePath(row.bp.file)}:${row.bp.line}`"
            >{{ where(row.bp) }}</span>
            <span
              class="xdebug-bp__dir"
              :title="filePath(row.bp.file)"
            >{{ dir(row.bp) }}</span>
          </template>
          <span
            v-if="row.bp.source === 'mcp'"
            class="xdebug-bp__tag xdebug-bp__tag--agent"
            title="Set by an agent over MCP"
          ><XdebugIcon name="agent" />agent</span>
          <span
            v-if="showHits && row.hits"
            class="xdebug-bp__hits"
            title="Hits in this session"
          >{{ row.hits }}×</span>
          <span
            v-if="busy.has(row.bp.id)"
            class="xdebug-bp__sync"
            role="status"
          ><span class="xdebug-bp__spin" />sending</span>
          <span
            v-else-if="row.state === 'pending'"
            class="xdebug-bp__tag"
            title="Saved while the script ran: sent when it pauses next"
          >next pause</span>
        </span>
        <span
          v-if="!readOnly"
          class="xdebug-bp__acts"
        >
          <button
            v-if="row.bp.type === 'line'"
            :ref="condRef(row.bp.id)"
            type="button"
            class="xdebug-bp__act"
            :aria-label="`${row.bp.condition ? 'Edit' : 'Add'} condition: ${where(row.bp)}`"
            :title="`${row.bp.condition ? 'Edit' : 'Add'} condition`"
            :aria-expanded="editing === row.bp.id"
            @click="editing === row.bp.id ? closeCondition() : openCondition(row.bp)"
          >
            <XdebugIcon name="filter" />
          </button>
          <button
            type="button"
            class="xdebug-bp__act"
            :aria-label="`Remove breakpoint ${where(row.bp)}`"
            title="Remove"
            :disabled="busy.has(row.bp.id)"
            @click="emit('remove', row.bp.id)"
          >
            <XdebugIcon name="trash" />
          </button>
        </span>

        <span
          v-if="row.bp.condition"
          class="xdebug-bp__sub"
        >
          <span class="xdebug-bp__k">when</span>{{ row.bp.condition }}
          <span
            v-if="!allowEval"
            class="xdebug-bp__tag"
            title="Saved while eval was on. Conditions run PHP and need xdebug.allow_eval; with it off this breakpoint is skipped (not sent)."
          ><XdebugIcon name="lock" />skipped · eval off</span>
        </span>
        <span
          v-if="row.movedTo"
          class="xdebug-bp__warn"
        >
          <XdebugIcon name="warn" />Xdebug moved it: no code on line {{ row.bp.line }} → {{ row.movedTo }}
        </span>
        <span
          v-if="rowError[row.bp.id]"
          class="xdebug-bp__err"
          role="alert"
        >
          <XdebugIcon name="warn" />{{ rowError[row.bp.id] }}
        </span>

        <div
          v-if="editing === row.bp.id && !allowEval"
          class="xdebug-bp__lock"
        >
          <XdebugIcon name="lock" />
          <span>Conditions run PHP, so they need <code>xdebug.allow_eval: true</code>. Turn it on to add one.</span>
          <button
            v-if="row.bp.condition"
            type="button"
            class="xdebug-bp__link"
            :disabled="saving"
            @click="submitCondition(row.bp.id, '')"
          >
            Remove condition
          </button>
        </div>
        <form
          v-else-if="editing === row.bp.id"
          class="xdebug-bp__cond"
          @submit.prevent="submitCondition(row.bp.id)"
          @keydown.esc.prevent="closeCondition()"
        >
          <input
            :ref="inputRef"
            v-model="draft"
            class="xdebug-bp__input"
            aria-label="Condition (PHP expression)"
            placeholder="$total > 100"
            spellcheck="false"
            autocomplete="off"
          >
          <button
            type="submit"
            class="xdebug-bp__btn xdebug-bp__btn--primary"
            :disabled="saving"
          >
            Save
          </button>
          <button
            type="button"
            class="xdebug-bp__btn"
            @click="closeCondition()"
          >
            Cancel
          </button>
        </form>
      </li>
    </ul>

    <slot />

    <p class="xdebug-bp__note">
      <template v-if="readOnly">
        Your IDE sets the breakpoints of this session. These saved ones apply to sessions without an IDE.
      </template>
      <template v-else>
        Or an exception class, e.g. Throwable (* for every exception). Absolute paths as PHP sees them (inside the container). Saved, sent to every new session and to the paused one right away.
      </template>
    </p>
  </div>
</template>

<style lang="scss" scoped>
.xdebug-bp__list {
  @apply list-none m-0 py-1;
}

.xdebug-bp__row {
  @apply grid items-center gap-x-2 py-1 pl-3 pr-2;

  grid-template-columns: 16px minmax(0, 1fr) auto;

  @media (max-width: 639px) {
    grid-template-columns: 44px minmax(0, 1fr) auto;

    @apply pl-0;
  }

  &:hover,
  &:focus-within {
    @apply bg-gray-50 dark:bg-gray-800/60;
  }

  @media (max-width: 767px) {
    @apply py-2;
  }
}

.xdebug-bp__cbcell {
  @apply grid place-items-center;

  // A 44 px tap target on phones; the row grows with it.
  @media (max-width: 639px) {
    @apply min-w-11 min-h-11 -my-2;
  }
}

.xdebug-bp__cb {
  @apply m-0 w-3.5 h-3.5 disabled:opacity-60;

  accent-color: theme('colors.rose.500');
}

.xdebug-bp__loc {
  @apply flex items-center gap-1.5 min-w-0 font-mono text-xs whitespace-nowrap text-gray-900 dark:text-white;

  .is-off & {
    @apply text-gray-600 dark:text-gray-300;
  }
}

.xdebug-bp__f {
  @apply flex-none;

  .is-off & {
    @apply line-through decoration-gray-400;
  }
}

.xdebug-bp__dir {
  @apply min-w-0 truncate text-gray-500 dark:text-gray-400;

  font-size: 11px;
}

.xdebug-bp__ex {
  @apply flex-none inline-flex text-amber-700 dark:text-amber-300;

  .xdebug-icon {
    @apply w-3 h-3;
  }
}

.xdebug-bp__tag {
  @apply flex-none inline-flex items-center gap-1 px-1.5 rounded font-sans text-2xs font-semibold;
  @apply bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200;

  .xdebug-icon {
    @apply w-2.5 h-2.5;
  }
}

.xdebug-bp__tag--agent {
  @apply bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300;
}

.xdebug-bp__hits {
  @apply flex-none font-sans text-2xs text-gray-500 dark:text-gray-400;
}

.xdebug-bp__sync {
  @apply flex-none inline-flex items-center gap-1 font-sans text-2xs text-gray-500 dark:text-gray-400;
}

.xdebug-bp__spin {
  @apply inline-block w-2.5 h-2.5 rounded-full border-[1.5px] border-gray-500 border-r-transparent animate-spin;

  @media (prefers-reduced-motion: reduce) {
    @apply animate-none;
  }
}

.xdebug-bp__acts {
  @apply flex gap-0.5 opacity-0;

  .xdebug-bp__row:hover &,
  .xdebug-bp__row:focus-within & {
    @apply opacity-100;
  }

  @media (max-width: 767px), (hover: none) {
    @apply opacity-100;
  }
}

.xdebug-bp__act {
  @apply inline-grid place-items-center w-6 h-6 rounded text-gray-600 dark:text-gray-300;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;

  .xdebug-icon {
    @apply w-3.5 h-3.5;
  }

  &[aria-expanded='true'] {
    @apply text-blue-700 dark:text-blue-300;
  }

  @media (max-width: 767px) {
    @apply w-9 h-9;
  }
}

.xdebug-bp__sub {
  @apply flex flex-wrap items-center gap-1.5 font-mono text-gray-600 dark:text-gray-300;

  grid-column: 2 / span 2;
  font-size: 11px;
}

.xdebug-bp__k {
  @apply font-sans text-gray-500 dark:text-gray-400;
}

.xdebug-bp__warn,
.xdebug-bp__err {
  @apply flex items-center gap-1 text-2xs;

  grid-column: 2 / span 2;

  .xdebug-icon {
    @apply flex-none w-3 h-3;
  }
}

.xdebug-bp__warn {
  @apply text-amber-700 dark:text-amber-300;
}

.xdebug-bp__err {
  @apply text-rose-700 dark:text-rose-300;
}

.xdebug-bp__err--block {
  @apply m-2 flex-wrap;
}

.xdebug-bp__lock {
  @apply flex flex-wrap items-center gap-1 pt-1.5 text-2xs text-gray-600 dark:text-gray-300;

  grid-column: 2 / span 2;

  .xdebug-icon {
    @apply flex-none w-3 h-3;
  }

  code {
    @apply font-mono;
  }
}

.xdebug-bp__cond {
  @apply flex gap-1.5 pt-1.5;

  grid-column: 2 / span 2;
}

.xdebug-bp__input {
  @apply flex-1 min-w-0 h-7 px-2 rounded border font-mono text-xs;
  @apply border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;

  @media (max-width: 767px) {
    @apply h-11;
  }
}

.xdebug-bp__btn {
  @apply inline-flex items-center h-7 px-2.5 rounded border text-xs font-medium whitespace-nowrap;
  @apply border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;

  @media (max-width: 767px) {
    @apply h-11;
  }
}

.xdebug-bp__btn--primary {
  @apply border-blue-600 bg-blue-600 text-white hover:bg-blue-700 dark:text-white dark:hover:bg-blue-700;
}

.xdebug-bp__link {
  @apply underline text-blue-700 dark:text-blue-300 disabled:opacity-50;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded;
}

.xdebug-bp__note {
  @apply px-3 pt-0.5 pb-2 text-2xs text-gray-500 dark:text-gray-400;
}
</style>
