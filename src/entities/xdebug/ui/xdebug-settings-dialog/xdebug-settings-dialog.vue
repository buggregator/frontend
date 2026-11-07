<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import type { XdebugMode } from '../../types'

// Settings popover (#4526 §5): how a new session is driven and whether it
// stops at the first line. Native radios and a checkbox switch, so arrow keys
// and Space work without extra code. Esc or Cancel closes.
defineProps<{
  mode: XdebugMode
  pauseOnFirstLine: boolean
  allowEval: boolean
  // 'on' / 'off'; '' on servers without agent control (Vue would cast a missing boolean to false).
  agentControl: '' | 'on' | 'off'
  idleTimeoutSeconds: number
  saving: boolean
  error: string
}>()
const emit = defineEmits<{
  'update:mode': [mode: XdebugMode]
  'update:pauseOnFirstLine': [value: boolean]
  save: []
  cancel: []
}>()

const MODES: { id: XdebugMode; title: string; text: string; recommended?: boolean }[] = [
  { id: 'proxy', title: 'Proxy to IDE', text: 'Your IDE steps. If no IDE is listening, the script runs on without pausing.' },
  {
    id: 'auto',
    title: 'Auto',
    text: 'IDE listening → your IDE steps. No IDE → Buggregator pauses and you step here.',
    recommended: true
  },
  { id: 'standalone', title: 'Standalone', text: 'Never call the IDE. You always step here.' }
]

const idleText = (seconds: number) => {
  if (!seconds) return 'off'
  return seconds % 60 === 0 ? `${seconds / 60} min` : `${seconds} s`
}

const root = ref<HTMLElement | null>(null)
onMounted(() => root.value?.querySelector<HTMLInputElement>('input[type=radio]:checked')?.focus())
</script>

<template>
  <div
    ref="root"
    class="xdebug-set"
    role="dialog"
    aria-labelledby="xdebug-set-title"
    @keydown.esc.stop="emit('cancel')"
  >
    <h4 id="xdebug-set-title">
      Debugger settings
    </h4>
    <fieldset class="xdebug-set__modes">
      <legend>When a script starts debugging</legend>
      <label
        v-for="m in MODES"
        :key="m.id"
        class="xdebug-set__opt"
        :class="{ 'is-on': m.id === mode }"
      >
        <input
          type="radio"
          name="xdebug-mode"
          :value="m.id"
          :checked="m.id === mode"
          @change="emit('update:mode', m.id)"
        >
        <span class="xdebug-set__t">
          {{ m.title }}
          <span
            v-if="m.recommended"
            class="xdebug-set__rec"
          >recommended</span>
        </span>
        <span class="xdebug-set__d">{{ m.text }}</span>
      </label>
    </fieldset>

    <label class="xdebug-set__row">
      <span>
        <b>Pause on the first line</b>
        <span class="xdebug-set__d">A session driven here stops before the first line runs, even with no breakpoint.</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        class="xdebug-set__switch"
        :checked="pauseOnFirstLine"
        @change="emit('update:pauseOnFirstLine', ($event.target as HTMLInputElement).checked)"
      >
    </label>

    <dl class="xdebug-set__ro">
      <dt>Eval (<code>xdebug.allow_eval</code>)</dt>
      <dd>{{ allowEval ? 'on' : 'off' }}</dd>
      <template v-if="agentControl">
        <dt>Agent control (<code>xdebug.allow_control</code>)</dt>
        <dd>{{ agentControl }}</dd>
      </template>
      <dt>Idle release (<code>xdebug.idle_timeout</code>)</dt>
      <dd>{{ idleText(idleTimeoutSeconds) }}</dd>
    </dl>

    <p class="xdebug-set__d">
      Applies to new sessions. Paused ones keep how they started.
    </p>
    <p
      v-if="error"
      class="xdebug-set__err"
      role="alert"
    >
      {{ error }}
    </p>

    <div class="xdebug-set__acts">
      <button
        type="button"
        class="xdebug-set__btn"
        @click="emit('cancel')"
      >
        Cancel
      </button>
      <button
        type="button"
        class="xdebug-set__btn xdebug-set__btn--primary"
        :disabled="saving"
        @click="emit('save')"
      >
        {{ saving ? 'Saving…' : 'Save' }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.xdebug-set {
  @apply absolute z-30 right-0 top-full mt-1 w-[380px] max-w-[calc(100vw-24px)] p-3.5 rounded-lg border shadow-xl text-left text-xs;
  @apply border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200;

  // On phones the gear sits at the left edge: the popover spans the screen instead.
  @media (max-width: 767px) {
    @apply fixed left-3 right-3 top-14 w-auto max-w-none max-h-[calc(100vh-72px)] overflow-auto;
  }

  h4 {
    @apply mb-2 text-sm font-semibold text-gray-900 dark:text-white;
  }
}

.xdebug-set__modes {
  @apply grid gap-1.5 mb-3;

  legend {
    @apply mb-1.5 font-semibold text-gray-900 dark:text-white;
  }
}

.xdebug-set__opt {
  @apply grid gap-x-2.5 gap-y-0.5 px-2.5 py-2 rounded-md border cursor-pointer border-gray-200 dark:border-gray-700;

  grid-template-columns: 16px minmax(0, 1fr);

  &.is-on {
    @apply border-blue-500 bg-blue-50 dark:bg-blue-500/10;
  }

  &:focus-within {
    @apply ring-2 ring-blue-500;
  }

  input {
    @apply mt-0.5 w-3.5 h-3.5 accent-blue-600 focus:outline-none;
  }
}

.xdebug-set__t {
  @apply flex items-center gap-1.5 font-semibold text-gray-900 dark:text-white;
}

.xdebug-set__rec {
  @apply px-1.5 py-px rounded text-[10px] font-semibold text-green-800 bg-green-100 dark:text-green-300 dark:bg-green-500/15;
}

.xdebug-set__d {
  @apply block leading-snug text-gray-600 dark:text-gray-300;

  .xdebug-set__opt & {
    @apply col-start-2;
  }
}

.xdebug-set__row {
  @apply flex items-start gap-2.5 py-2 border-t border-gray-200 dark:border-gray-700 cursor-pointer;

  > span {
    @apply flex-1 min-w-0;
  }

  b {
    @apply font-semibold text-gray-900 dark:text-white;
  }
}

.xdebug-set__switch {
  @apply relative flex-none w-8 h-[18px] mt-0.5 rounded-full appearance-none cursor-pointer bg-gray-300 dark:bg-gray-600;
  @apply transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-500;

  &::after {
    @apply absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform motion-reduce:transition-none;

    content: '';
  }

  &:checked {
    @apply bg-blue-600;

    &::after {
      @apply translate-x-3.5;
    }
  }
}

.xdebug-set__ro {
  @apply grid gap-x-2.5 gap-y-1 py-2 mb-2 border-t border-gray-200 dark:border-gray-700 text-2xs text-gray-600 dark:text-gray-300;

  grid-template-columns: minmax(0, 1fr) auto;

  code {
    @apply font-mono;
  }

  dd {
    @apply font-semibold text-gray-800 dark:text-gray-100;
  }
}

.xdebug-set__err {
  @apply mt-2 text-rose-700 dark:text-rose-300;
}

.xdebug-set__acts {
  @apply flex justify-end gap-1.5 mt-3;
}

.xdebug-set__btn {
  @apply inline-flex items-center h-8 px-3 rounded border text-xs font-medium;
  @apply border-gray-300 bg-white text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60;
}

.xdebug-set__btn--primary {
  @apply bg-blue-600 border-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700;
}
</style>
