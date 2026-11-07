<script lang="ts" setup>
import { computed } from 'vue'
import { isLive, sessionTitle, shortFile } from '../../lib/xdebug-format'
import type { XdebugSession } from '../../types'
import { XdebugIcon } from '../xdebug-icon'
import { XdebugStateBadge } from '../xdebug-state-badge'

const props = defineProps<{ session: XdebugSession; selected: boolean; stepping?: boolean; ideAddr: string }>()
const emit = defineEmits<{ select: []; dismiss: [] }>()

const where = computed(() => {
  const s = props.session
  if (s.closed_reason === 'ide_unreachable') return 'IDE not reachable'
  return s.last_file ? `${shortFile(s.last_file)}:${s.last_line}` : shortFile(s.entry_file)
})

// Tombstones released from here (UI, agent, idle guard) say so; a step sent
// from here reads «Running…», one from the IDE «Stepping in IDE…».
const badge = computed(() => {
  const s = props.session
  if (s.closed_reason === 'detached' || s.closed_reason === 'idle_detached') return 'released'
  if (props.stepping) return s.driver === 'here' ? 'stepping-here' : 'stepping'
  return s.state
})

const started = computed(() => {
  const d = props.session.started_at ? new Date(props.session.started_at) : null
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleTimeString([], { hour12: false }) : ''
})
</script>

<template>
  <div
    class="xdebug-sess"
    :class="{ 'is-selected': selected }"
  >
    <button
      type="button"
      class="xdebug-sess__main"
      :aria-current="selected ? 'true' : undefined"
      @click="emit('select')"
    >
      <XdebugStateBadge
        class="xdebug-sess__state"
        :state="badge"
      />
      <span class="xdebug-sess__t">{{ sessionTitle(session) }}</span>
      <span class="xdebug-sess__m">
        <span
          v-if="where"
          class="font-mono"
        >{{ where }}</span>
        <span
          v-if="session.driver === 'here'"
          class="xdebug-sess__tag xdebug-sess__tag--here"
          title="Buggregator drives this session: step it here"
        >here</span>
        <span
          v-else-if="session.ide_connected"
          class="xdebug-sess__tag"
          :title="`IDE connected at ${ideAddr}`"
        ><XdebugIcon name="check" />IDE</span>
        <span
          v-else
          class="xdebug-sess__tag xdebug-sess__tag--bad"
          title="IDE not connected"
        ><XdebugIcon name="x" />no IDE</span>
        <span
          v-if="session.agent_calls"
          class="xdebug-sess__tag xdebug-sess__tag--agent"
          :title="`${session.agent_calls} agent calls`"
        ><XdebugIcon name="agent" />{{ session.agent_calls }}</span>
        <span>#{{ session.id }}<template v-if="started"> · {{ started }}</template></span>
      </span>
    </button>
    <button
      v-if="!isLive(session)"
      type="button"
      class="xdebug-sess__dismiss"
      :aria-label="`Dismiss session #${session.id}`"
      title="Dismiss"
      @click="emit('dismiss')"
    >
      <XdebugIcon name="x" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
.xdebug-sess {
  @apply relative flex border-l-[3px] border-transparent;

  &:hover {
    @apply bg-gray-50 dark:bg-gray-700/50;
  }

  &.is-selected {
    @apply border-blue-500 bg-blue-50/60 dark:bg-blue-500/10;
  }
}

.xdebug-sess__main {
  @apply grid flex-1 min-w-0 gap-x-2 gap-y-0.5 px-3 py-1.5 text-left;

  grid-template-columns: auto minmax(0, 1fr);

  &:focus-visible {
    @apply outline-none ring-2 ring-inset ring-blue-500;
  }
}

.xdebug-sess__state {
  @apply row-span-2 self-start mt-px;
}

.xdebug-sess__t {
  @apply font-mono text-xs truncate text-gray-900 dark:text-white;
}

.xdebug-sess__m {
  @apply col-start-2 flex flex-wrap items-center gap-1.5 text-2xs text-gray-500 dark:text-gray-400;
}

.xdebug-sess__tag {
  @apply inline-flex items-center gap-0.5 px-1 rounded border border-gray-200 dark:border-gray-600;

  .xdebug-icon {
    @apply w-2.5 h-2.5;
  }
}

.xdebug-sess__tag--here {
  @apply font-semibold text-blue-700 dark:text-blue-300;
}

.xdebug-sess__tag--bad {
  @apply text-rose-700 dark:text-rose-400;
}

.xdebug-sess__tag--agent {
  @apply text-violet-700 dark:text-violet-400;
}

.xdebug-sess__dismiss {
  @apply self-start m-1 p-1.5 rounded text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
}
</style>
