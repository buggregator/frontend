<script lang="ts" setup>
import { nextTick, ref } from 'vue'
import { COMMAND_LABEL } from '../../lib/use-xdebug-control'
import type { XdebugCommand } from '../../types'
import { XdebugIcon, type XdebugIconName } from '../xdebug-icon'

// The row above the code when Buggregator drives the session (#4526 §3).
// Buttons are `aria-disabled`, not `disabled`, while the script runs: a step
// pressed from the keyboard keeps focus on its button for the next one. The
// reason is always written on the right side, not only in a tooltip.
const props = defineProps<{
  canControl: boolean
  pending: XdebugCommand | null
  drivenByIde: boolean
  running: boolean
  agentDriving: boolean
  idleLeft: string
  // «You» or «agent <name>»: who sent the last continuation.
  lastBy: string
}>()
const emit = defineEmits<{ command: [command: XdebugCommand] }>()

const steps: { command: XdebugCommand; icon: XdebugIconName }[] = [
  { command: 'step-over', icon: 'stepover' },
  { command: 'step-into', icon: 'stepinto' },
  { command: 'step-out', icon: 'stepout' }
]

const confirming = ref(false)
const stopButton = ref<HTMLButtonElement | null>(null)
const cancelButton = ref<HTMLButtonElement | null>(null)

const openConfirm = async () => {
  if (!props.canControl) return
  confirming.value = true
  await nextTick()
  cancelButton.value?.focus()
}

const closeConfirm = async (command?: XdebugCommand) => {
  confirming.value = false
  if (command) {
    emit('command', command)
    return
  }
  await nextTick()
  stopButton.value?.focus()
}

const send = (command: XdebugCommand) => {
  if (props.canControl) emit('command', command)
}
</script>

<template>
  <div
    class="xdebug-ctl"
    @keydown.esc="confirming && closeConfirm()"
  >
    <div
      class="xdebug-ctl__bar"
      role="toolbar"
      aria-label="Debugger controls"
    >
      <template v-if="!drivenByIde">
        <button
          type="button"
          class="xdebug-ctl__btn xdebug-ctl__btn--primary"
          :aria-disabled="!canControl"
          aria-label="Continue"
          title="Continue to the next breakpoint"
          @click="send('run')"
        >
          <XdebugIcon name="play" /><span class="xdebug-ctl__label">Continue</span>
        </button>
        <button
          v-for="s in steps"
          :key="s.command"
          type="button"
          class="xdebug-ctl__btn xdebug-ctl__btn--icon"
          :aria-disabled="!canControl"
          :aria-label="COMMAND_LABEL[s.command]"
          :title="COMMAND_LABEL[s.command]"
          @click="send(s.command)"
        >
          <XdebugIcon :name="s.icon" />
        </button>
        <span
          class="xdebug-ctl__sep"
          aria-hidden="true"
        />
        <button
          type="button"
          class="xdebug-ctl__btn"
          :aria-disabled="!canControl"
          aria-label="Release"
          title="Let the script run to the end without stopping again"
          @click="send('detach')"
        >
          <XdebugIcon name="ext" /><span class="xdebug-ctl__label">Release</span>
        </button>
        <button
          ref="stopButton"
          type="button"
          class="xdebug-ctl__btn xdebug-ctl__btn--stop"
          :aria-disabled="!canControl"
          aria-label="Stop"
          title="Stop the request"
          :aria-expanded="confirming"
          aria-haspopup="dialog"
          @click="openConfirm"
        >
          <XdebugIcon name="stop" /><span class="xdebug-ctl__label">Stop</span>
        </button>
      </template>

      <span class="xdebug-ctl__who">
        <span
          v-if="drivenByIde"
          class="xdebug-ctl__chip xdebug-ctl__chip--ide"
          title="An IDE is attached to this session. Two drivers would disagree, so stepping stays in the IDE."
        ><XdebugIcon name="lock" /><span class="xdebug-ctl__long">Driven by your IDE</span><span class="xdebug-ctl__short">IDE drives</span></span>
        <span
          v-else-if="agentDriving"
          class="xdebug-ctl__chip xdebug-ctl__chip--agent"
        ><XdebugIcon name="agent" />Agent is driving</span>
        <span
          v-else-if="running || pending"
          class="xdebug-ctl__running"
          role="status"
        ><span
          class="xdebug-ctl__spin"
          aria-hidden="true"
        />Running…</span>
        <span
          v-if="lastBy && !drivenByIde && !running && !pending"
          class="xdebug-ctl__last"
        >Last step: {{ lastBy }}</span>
        <span
          v-if="idleLeft && !drivenByIde && !agentDriving && !running && !pending"
          class="xdebug-ctl__idle"
          title="A paused script holds a PHP worker, the session file and any open transaction. Buggregator releases it after this long without a command."
        ><XdebugIcon name="clock" /><span class="xdebug-ctl__idle-label">auto-release in</span>{{ idleLeft }}</span>
      </span>
    </div>

    <div
      v-if="confirming"
      class="xdebug-ctl__confirm"
      role="alertdialog"
      aria-modal="false"
      aria-labelledby="xdebug-stop-title"
      aria-describedby="xdebug-stop-text"
    >
      <h4 id="xdebug-stop-title">
        Stop this request?
      </h4>
      <p id="xdebug-stop-text">
        The script ends here: an open transaction rolls back, a file may stay half written, and the client gets no full
        response. To let the script finish without pausing again, use Release.
      </p>
      <div class="xdebug-ctl__acts">
        <button
          ref="cancelButton"
          type="button"
          class="xdebug-ctl__btn"
          @click="closeConfirm()"
        >
          Cancel
        </button>
        <button
          type="button"
          class="xdebug-ctl__btn xdebug-ctl__btn--secondary"
          @click="closeConfirm('detach')"
        >
          Release instead
        </button>
        <button
          type="button"
          class="xdebug-ctl__btn xdebug-ctl__btn--danger"
          @click="closeConfirm('stop')"
        >
          Stop request
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.xdebug-ctl {
  @apply relative flex-none;

  @media (max-width: 767px) {
    @apply sticky top-0 z-[3];
  }
}

.xdebug-ctl__bar {
  @apply flex items-center gap-1 h-10 px-2 min-w-0 border-b border-gray-200 bg-white;
  @apply dark:border-gray-700 dark:bg-[#111a2a];

  @media (max-width: 767px) {
    @apply h-[52px] gap-1.5;
  }
}

.xdebug-ctl__btn {
  @apply inline-flex items-center justify-center gap-1.5 h-7 px-2.5 rounded border text-xs font-medium whitespace-nowrap;
  @apply border-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;

  &[aria-disabled='true'] {
    @apply opacity-40 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent;
  }

  .xdebug-icon {
    @apply w-3.5 h-3.5;
  }

  @media (max-width: 767px) {
    @apply h-11 min-w-[44px] px-0;
  }
}

.xdebug-ctl__btn--icon {
  @apply w-7 px-0;

  @media (max-width: 767px) {
    @apply w-11;
  }
}

.xdebug-ctl__btn--primary {
  @apply bg-blue-600 text-white border-blue-600 hover:bg-blue-700 dark:text-white dark:hover:bg-blue-700;

  &[aria-disabled='true'] {
    @apply bg-transparent text-gray-700 border-gray-300 dark:text-gray-200 dark:border-gray-600;
  }
}

.xdebug-ctl__btn--secondary {
  @apply border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800;
}

.xdebug-ctl__btn--stop {
  @apply text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10;
}

.xdebug-ctl__btn--danger {
  @apply bg-rose-600 border-rose-600 text-white hover:bg-rose-700 dark:text-white dark:hover:bg-rose-700;
}

// Labels show from 1180 px; below, the buttons are icon-only with aria-labels.
.xdebug-ctl__label {
  @media (max-width: 1179px) {
    @apply sr-only;
  }
}

.xdebug-ctl__sep {
  @apply w-px h-[18px] mx-1.5 flex-none bg-gray-200 dark:bg-gray-700;

  @media (max-width: 767px) {
    @apply hidden;
  }
}

.xdebug-ctl__who {
  @apply ml-auto inline-flex items-center min-w-0 text-2xs font-semibold text-gray-600 dark:text-gray-300;

  .xdebug-icon {
    @apply w-3 h-3;
  }
}

.xdebug-ctl__chip {
  @apply inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full whitespace-nowrap;
}

.xdebug-ctl__chip--ide {
  @apply border border-dashed border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200;
}

.xdebug-ctl__chip--agent {
  @apply bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300;
}

.xdebug-ctl__short {
  @apply hidden;
}

.xdebug-ctl__long {
  @media (max-width: 767px) {
    @apply hidden;
  }
}

.xdebug-ctl__chip--ide .xdebug-ctl__short {
  @media (max-width: 767px) {
    @apply inline;
  }
}

.xdebug-ctl__idle {
  @apply inline-flex items-center gap-1 font-normal whitespace-nowrap text-gray-600 dark:text-gray-300;

  // Below 1440 only the clock and m:ss show; the words stay for screen readers.
  .xdebug-ctl__idle-label {
    @apply mr-0.5;

    @media (max-width: 1439px) {
      @apply sr-only;
    }
  }
}

.xdebug-ctl__last {
  @apply mr-2.5 font-normal whitespace-nowrap truncate;

  @media (max-width: 1179px) {
    @apply hidden;
  }
}

.xdebug-ctl__running {
  @apply inline-flex items-center gap-1.5 whitespace-nowrap;
}

.xdebug-ctl__spin {
  @apply inline-block w-2.5 h-2.5 rounded-full border-[1.5px] border-green-700 border-r-transparent animate-spin;
  @apply dark:border-green-400 dark:border-r-transparent motion-reduce:animate-none;
}

.xdebug-ctl__confirm {
  @apply absolute z-30 top-full left-2 mt-1 w-[340px] max-w-[calc(100vw-24px)] p-3.5 rounded-lg border shadow-xl text-xs;

  // Below `sm`: the content column's full width, 8 px from each edge
  // (the app sidebar stays at the left of the screen).
  @media (max-width: 639px) {
    @apply left-2 right-2 w-auto max-w-none;
  }
  @apply border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200;

  h4 {
    @apply mb-1.5 text-sm font-semibold text-gray-900 dark:text-white;
  }

  p {
    @apply mb-2.5 leading-normal;
  }
}

.xdebug-ctl__acts {
  @apply flex flex-wrap justify-end gap-1.5;

  .xdebug-ctl__btn {
    @apply h-8 px-3;
  }

  // Phones: stacked, 44 px tall, «Stop request» last.
  @media (max-width: 639px) {
    @apply flex-col items-stretch;

    .xdebug-ctl__btn {
      @apply h-11;
    }
  }
}
</style>
