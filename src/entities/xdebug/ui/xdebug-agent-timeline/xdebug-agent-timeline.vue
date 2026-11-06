<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { shortFile } from '../../lib/xdebug-format'
import type { XdebugAgentCall, XdebugAgentCallStarted } from '../../types'
import { XdebugIcon } from '../xdebug-icon'

type Props = {
  calls: XdebugAgentCall[]
  inflight?: XdebugAgentCallStarted | null
  pausedAt?: string
  pausedFile?: string
  pausedLine?: number
}

const props = withDefaults(defineProps<Props>(), { inflight: null, pausedAt: '', pausedFile: '', pausedLine: 0 })

const time = (at: string) => {
  const d = new Date(at)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour12: false })
}

// Newest at the bottom, like a log. The live region gets a summary only.
const announce = ref('')
watch(() => props.calls.length, (now, before) => {
  const fresh = now - (before ?? now)
  if (fresh > 0) announce.value = fresh === 1 ? '1 new agent call' : `${fresh} new agent calls`
})

const empty = computed(() => !props.calls.length && !props.inflight)
</script>

<template>
  <div class="xdebug-tl">
    <p
      class="sr-only"
      aria-live="polite"
    >
      {{ announce }}
    </p>

    <ol
      class="xdebug-tl__list"
      aria-label="What the agent did in this session"
    >
      <li
        v-if="pausedAt"
        class="xdebug-tl__ev"
      >
        <span class="xdebug-tl__dot xdebug-tl__dot--pause"><XdebugIcon name="pause" /></span>
        <div>
          <div class="xdebug-tl__t">
            Paused at <b class="xdebug-tl__mono">{{ shortFile(pausedFile) }}:{{ pausedLine }}</b>
          </div>
          <div class="xdebug-tl__m">
            {{ time(pausedAt) }} · by the IDE
          </div>
        </div>
      </li>

      <li
        v-for="call in calls"
        :key="call.seq"
        class="xdebug-tl__ev"
      >
        <span
          class="xdebug-tl__dot"
          :class="{ 'xdebug-tl__dot--bad': !call.ok }"
        ><XdebugIcon :name="call.ok ? 'agent' : 'x'" /></span>
        <div class="min-w-0">
          <div class="xdebug-tl__t">
            <code class="xdebug-tl__tool">{{ call.tool }}</code>
            <span
              v-if="call.args"
              class="xdebug-tl__args"
            >{{ call.args }}</span>
          </div>
          <div class="xdebug-tl__m">
            {{ time(call.at) }} ·
            <span
              v-if="call.ok"
              class="xdebug-tl__res"
            >{{ call.result_summary }}</span>
            <span
              v-else
              class="xdebug-tl__refused"
            >refused: {{ call.result_summary.replace(/^refused\s*[—-]\s*/, '') }}</span>
          </div>
        </div>
      </li>

      <li
        v-if="inflight"
        class="xdebug-tl__ev is-live"
      >
        <span class="xdebug-tl__dot"><span class="xdebug-tl__spin" /></span>
        <div class="min-w-0">
          <div class="xdebug-tl__t">
            <code class="xdebug-tl__tool">{{ inflight.tool }}</code>
            <span
              v-if="inflight.args"
              class="xdebug-tl__args"
            >{{ inflight.args }}</span>
          </div>
          <div class="xdebug-tl__m">
            {{ time(inflight.at) }} · reading…
          </div>
        </div>
      </li>
    </ol>

    <p
      v-if="empty"
      class="xdebug-tl__empty"
    >
      The agent has not looked at this session.
    </p>
    <p class="xdebug-tl__hint">
      Read-only MCP calls an agent made in this session. Your IDE never sees them.
    </p>
  </div>
</template>

<style lang="scss" scoped>
.xdebug-tl__list {
  @apply list-none m-0 px-3 pt-2;
}

.xdebug-tl__ev {
  @apply relative grid gap-x-2.5 pb-3;

  grid-template-columns: 14px minmax(0, 1fr);

  &::before {
    @apply absolute bg-gray-200 dark:bg-gray-700;

    content: '';
    left: 6px;
    top: 14px;
    bottom: 0;
    width: 2px;
  }

  &:last-child::before {
    @apply hidden;
  }
}

.xdebug-tl__dot {
  @apply relative z-[1] grid place-items-center mt-0.5 w-3.5 h-3.5 rounded-full;
  @apply bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400;

  .xdebug-icon {
    @apply w-2.5 h-2.5;
  }
}

.xdebug-tl__dot--pause {
  @apply bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400;
}

.xdebug-tl__dot--bad {
  @apply bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400;
}

.xdebug-tl__t {
  @apply flex flex-wrap items-baseline gap-x-1.5 text-xs text-gray-800 dark:text-gray-200;

  .is-live & {
    @apply font-semibold;
  }
}

.xdebug-tl__mono,
.xdebug-tl__args {
  @apply font-mono;

  font-size: 11.5px;
}

.xdebug-tl__args {
  @apply min-w-0 truncate text-gray-600 dark:text-gray-300;
}

.xdebug-tl__tool {
  @apply font-mono font-semibold text-violet-700 dark:text-violet-400;

  font-size: 11.5px;
}

.xdebug-tl__m {
  @apply text-2xs text-gray-500 dark:text-gray-400;
}

.xdebug-tl__refused {
  @apply text-rose-700 dark:text-rose-400;
}

.xdebug-tl__spin {
  @apply block w-2 h-2 rounded-full border-[1.5px] border-current border-r-transparent animate-spin;

  @media (prefers-reduced-motion: reduce) {
    @apply animate-none border-r-current opacity-60;
  }
}

.xdebug-tl__empty {
  @apply px-3 py-2 text-xs text-gray-500 dark:text-gray-400;
}

.xdebug-tl__hint {
  @apply px-3 pb-3 m-0 text-2xs text-gray-500 dark:text-gray-400;
}
</style>
