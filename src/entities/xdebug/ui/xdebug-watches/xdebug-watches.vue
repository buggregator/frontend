<script lang="ts" setup>
import { ref } from 'vue'
import type { WatchRow } from '../../lib/use-xdebug-debugger'
import { varSummary } from '../../lib/xdebug-format'
import { XdebugIcon } from '../xdebug-icon'

defineProps<{ rows: WatchRow[]; allowEval: boolean; paused: boolean }>()
const emit = defineEmits<{ add: [expression: string]; remove: [expression: string] }>()

const draft = ref('')
const submit = () => {
  if (!draft.value.trim()) return
  emit('add', draft.value)
  draft.value = ''
}
</script>

<template>
  <div class="xdebug-watch">
    <div
      v-if="!allowEval"
      class="xdebug-watch__off"
    >
      <XdebugIcon name="lock" />
      <p>
        <b>Evaluate is off.</b> It runs PHP inside your app and can change data.
        Turn it on with <code>xdebug.allow_eval: true</code>
        (or <code>XDEBUG_PROXY_ALLOW_EVAL=true</code>) and restart.
      </p>
    </div>

    <form
      class="xdebug-watch__in"
      @submit.prevent="submit"
    >
      <input
        v-model="draft"
        class="xdebug-watch__input"
        :placeholder="allowEval ? 'Expression, e.g. count($items)' : 'Evaluate is off'"
        :disabled="!allowEval"
        aria-label="Watch expression"
        spellcheck="false"
        autocomplete="off"
      >
      <button
        type="submit"
        class="xdebug-watch__btn"
        :disabled="!allowEval || !draft.trim()"
      >
        <XdebugIcon name="plus" />
        Add watch
      </button>
    </form>

    <ul
      v-if="rows.length"
      class="xdebug-watch__list"
    >
      <li
        v-for="row in rows"
        :key="row.expression"
        class="xdebug-watch__row"
        :class="{ 'is-off': !allowEval }"
      >
        <span class="xdebug-watch__e">{{ row.expression }}</span>
        <span class="xdebug-watch__eq">=</span>
        <span
          v-if="!allowEval || !paused || row.state === 'idle'"
          class="xdebug-watch__na"
        >—</span>
        <span
          v-else-if="row.state === 'loading'"
          class="xdebug-watch__na"
        >…</span>
        <span
          v-else-if="row.state === 'error'"
          class="xdebug-watch__err"
        >
          <XdebugIcon name="warn" />{{ row.error }}
        </span>
        <template v-else-if="row.result">
          <span
            class="xdebug-watch__val"
            :class="`xdebug-watch__val--${row.result.type}`"
          >{{ varSummary(row.result).text }}{{ varSummary(row.result).count }}</span>
          <span class="xdebug-watch__type">{{ row.result.type }}</span>
        </template>
        <button
          type="button"
          class="xdebug-watch__rm"
          :aria-label="`Remove watch ${row.expression}`"
          @click="emit('remove', row.expression)"
        >
          <XdebugIcon name="x" />
        </button>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.xdebug-watch__off {
  @apply flex gap-2 m-2 p-2.5 rounded border text-xs;
  @apply border-blue-200 bg-blue-50 text-gray-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-gray-200;

  .xdebug-icon {
    @apply mt-0.5 text-blue-700 dark:text-blue-300;
  }

  code {
    @apply font-mono text-2xs px-1 rounded bg-white/70 dark:bg-gray-900/50;
  }
}

.xdebug-watch__in {
  @apply flex gap-1.5 p-2;
}

.xdebug-watch__input {
  @apply flex-1 min-w-0 h-8 px-2 rounded border font-mono text-xs;
  @apply border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white;
  @apply disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.xdebug-watch__btn {
  @apply inline-flex items-center gap-1 h-8 px-2.5 rounded border text-xs font-medium whitespace-nowrap;
  @apply border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
}

.xdebug-watch__list {
  @apply list-none m-0 pb-1.5 font-mono text-xs;

  line-height: 18px;
}

.xdebug-watch__row {
  @apply flex items-baseline gap-1.5 px-3 py-0.5;

  &.is-off {
    @apply opacity-60;
  }
}

.xdebug-watch__e {
  @apply text-gray-900 dark:text-white truncate;
}

.xdebug-watch__eq,
.xdebug-watch__na,
.xdebug-watch__type {
  @apply text-gray-500 dark:text-gray-400;
}

.xdebug-watch__type {
  font-size: 11px;
}

.xdebug-watch__val {
  @apply min-w-0 truncate text-gray-800 dark:text-gray-200;
}

.xdebug-watch__val--string { @apply text-green-700 dark:text-green-300; }

.xdebug-watch__val--int,
.xdebug-watch__val--float { @apply text-amber-700 dark:text-amber-300; }

.xdebug-watch__err {
  @apply inline-flex items-center gap-1 min-w-0 font-sans text-rose-700 dark:text-rose-400;
}

.xdebug-watch__rm {
  @apply ml-auto p-1 rounded text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
}
</style>
