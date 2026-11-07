<script lang="ts" setup>
import { useResizeObserver } from '@vueuse/core'
import { computed, nextTick, ref, watch } from 'vue'
import type { GutterMark } from '../../lib/xdebug-breakpoints'
import { highlightPhp, shortFile } from '../../lib/xdebug-format'
import type { XdebugSource } from '../../types'
import { XdebugIcon } from '../xdebug-icon'

type Props = {
  source: XdebugSource | null
  line: number | null
  // The paused line of the top frame; another frame's line is marked lighter.
  isTopFrame?: boolean
  // Read-only dots (an IDE's breakpoints).
  breakpointLines?: number[]
  // Buggregator drives: the gutter toggles saved breakpoints, `marks` shows them.
  editable?: boolean
  marks?: Map<number, GutterMark>
  loading?: boolean
  error?: string
  stale?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isTopFrame: true,
  breakpointLines: () => [],
  editable: false,
  marks: () => new Map(),
  loading: false,
  error: '',
  stale: false
})

const emit = defineEmits<{ toggle: [line: number] }>()

const root = ref<HTMLElement | null>(null)
const lineMarks = computed(() => props.editable
  ? props.marks
  : new Map(props.breakpointLines.map((n) => [n, 'on' as GutterMark])))
const rows = computed(() => (props.source?.lines ?? []).map(({ line, text }) => ({
  line,
  tokens: highlightPhp(text),
  current: line === props.line,
  mark: lineMarks.value.get(line)
})))

const MARK_TEXT: Record<GutterMark, string> = {
  on: 'breakpoint',
  cond: 'conditional breakpoint',
  off: 'disabled breakpoint',
  unres: 'breakpoint Xdebug has not set here'
}
const gutLabel = (line: number, mark: GutterMark | undefined) =>
  `Line ${line}${mark ? `, ${MARK_TEXT[mark]}` : ''} — press to ${mark ? 'remove the' : 'add a'} breakpoint`
const gutTitle = (line: number, mark: GutterMark | undefined) =>
  mark ? `Remove breakpoint · line ${line}` : `Add breakpoint · line ${line}`

const label = computed(() => {
  const name = shortFile(props.source?.file)
  const lines = [...lineMarks.value.keys()].sort((a, b) => a - b)
  const marks = lines.length ? `, breakpoints on lines ${lines.join(', ')}` : ''
  return name ? `Source of ${name}${marks}` : 'Source'
})

// Every pause and frame change puts the paused line at a third of the view.
const scrollToLine = async () => {
  await nextTick()
  const el = root.value
  const cur = el?.querySelector<HTMLElement>('[aria-current="step"]')
  if (!el || !cur) return
  el.scrollTop = Math.max(0, cur.offsetTop - el.clientHeight / 3)
}

watch(() => [props.source, props.line], scrollToLine, { immediate: true })
// A new height (phone ↔ desktop, a panel opened) keeps the paused line in view.
useResizeObserver(root, () => scrollToLine())
</script>

<template>
  <div
    ref="root"
    class="xdebug-code"
    :class="{ 'xdebug-code--stale': stale, 'xdebug-code--edit': editable }"
    role="region"
    :aria-label="label"
    :aria-busy="loading || undefined"
    tabindex="0"
  >
    <div
      v-if="loading && !source"
      class="xdebug-code__skeleton"
    >
      <span
        v-for="w in [60, 45, 72, 38, 55, 66, 30]"
        :key="w"
        :style="{ width: `${w}%` }"
      />
    </div>

    <p
      v-else-if="error"
      class="xdebug-code__message"
      role="status"
    >
      <XdebugIcon name="warn" />
      {{ error }}
    </p>

    <template v-else>
      <div
        v-for="row in rows"
        :key="row.line"
        class="xdebug-code__ln"
        :class="{ 'is-cur': row.current, 'is-other-frame': row.current && !isTopFrame }"
        :aria-current="row.current ? 'step' : undefined"
      >
        <button
          v-if="editable"
          type="button"
          class="xdebug-code__gut"
          :aria-label="gutLabel(row.line, row.mark)"
          :title="gutTitle(row.line, row.mark)"
          @click="emit('toggle', row.line)"
        >
          <span
            class="xdebug-code__slot"
            :class="row.mark ? `is-${row.mark}` : undefined"
          />
          <span
            v-if="row.current"
            class="xdebug-code__arrow"
          >
            <XdebugIcon name="right" />
          </span>
          <span class="xdebug-code__no">{{ row.line }}</span>
        </button>
        <span
          v-else
          class="xdebug-code__gut"
        >
          <span
            v-if="row.mark"
            class="xdebug-code__bp"
            title="Breakpoint (set in the IDE)"
          />
          <span
            v-if="row.current"
            class="xdebug-code__arrow"
            :title="isTopFrame ? 'Paused here' : 'This frame is here'"
          >
            <XdebugIcon name="right" />
          </span>
          <span class="xdebug-code__no">{{ row.line }}</span>
        </span>
        <code class="xdebug-code__text"><span
          v-for="(t, i) in row.tokens"
          :key="i"
          :class="t.kind ? `hl-${t.kind}` : undefined"
        >{{ t.text }}</span>{{ row.tokens.length ? '' : ' ' }}</code>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.xdebug-code {
  --gut-bg: theme('colors.white');
  --cur: theme('colors.amber.600');

  @apply relative overflow-auto font-mono bg-white text-gray-800;

  font-size: 12.5px;
  line-height: 20px;
  font-variant-ligatures: none;

  &:focus-visible {
    @apply outline-none ring-2 ring-inset ring-blue-500;
  }
}

// One-off code background between gray-900 and gray-950 (design spec #4413).
:global(.dark .xdebug-code) {
  --gut-bg: #0d1320;
  --cur: theme('colors.amber.400');

  color: theme('colors.gray.200');
  background: #0d1320;
}

.xdebug-code--stale {
  @apply opacity-60;
}

.xdebug-code__ln {
  @apply flex min-w-max;

  &:hover {
    @apply bg-gray-50 dark:bg-gray-800/60;
  }

  &.is-cur {
    background: rgb(245 158 11 / 12%);
    box-shadow: inset 3px 0 0 var(--cur);
  }

  &.is-other-frame {
    background: rgb(245 158 11 / 6%);
  }
}

.xdebug-code__gut {
  @apply sticky left-0 flex-none flex items-center justify-end gap-1 pr-3 select-none text-gray-500 dark:text-gray-400;

  width: 64px;
  background: var(--gut-bg);

  @media (max-width: 767px) {
    width: 48px;
  }

  .is-cur & {
    @apply font-bold text-gray-900 dark:text-white;

    background: color-mix(in srgb, theme('colors.amber.500') 12%, var(--gut-bg));
  }
}

.xdebug-code__no {
  @apply text-right;

  min-width: 22px;
  font-size: 11.5px;
}

.xdebug-code__bp {
  @apply rounded-full bg-rose-500;

  width: 9px;
  height: 9px;
  box-shadow: 0 0 0 2px var(--gut-bg);
}

// Buggregator drives: the whole gutter toggles a breakpoint (design #4526 §4.1).
button.xdebug-code__gut {
  @apply border-0 cursor-pointer;

  font: inherit;

  &:focus-visible {
    @apply outline-none ring-2 ring-inset ring-blue-500;
  }
}

.xdebug-code__slot {
  @apply flex-none grid place-items-center rounded-full;

  width: 11px;
  height: 11px;

  .xdebug-code__ln:hover &:not([class*='is-']),
  .xdebug-code__gut:focus-visible &:not([class*='is-']) {
    box-shadow: inset 0 0 0 1.5px rgb(244 63 94 / 70%);
  }

  &.is-on,
  &.is-cond {
    @apply bg-rose-500;

    box-shadow: 0 0 0 2px var(--gut-bg);
  }

  // The «=» mark of a condition, cut in the gutter colour.
  &.is-cond::after {
    content: '';
    width: 5px;
    height: 2px;
    margin-top: 2px;
    border-radius: 1px;
    background: var(--gut-bg);
    box-shadow: 0 -2.5px 0 var(--gut-bg);
  }

  &.is-off {
    box-shadow: inset 0 0 0 2px theme('colors.rose.500');
  }

  &.is-unres {
    @apply text-gray-500 dark:text-gray-400;

    box-shadow: inset 0 0 0 2px currentcolor;
  }
}

@media (max-width: 767px) {
  .xdebug-code--edit {
    line-height: 26px;
  }

  .xdebug-code__slot {
    width: 13px;
    height: 13px;
  }
}

.xdebug-code__arrow {
  @apply flex;

  color: var(--cur);

  .xdebug-icon {
    @apply w-3.5 h-3.5;
  }
}

.xdebug-code__text {
  @apply whitespace-pre pl-1 pr-4;

  font: inherit;
}

.hl-k { @apply text-violet-600 dark:text-violet-300; }
.hl-s { @apply text-green-700 dark:text-green-300; }
.hl-v { @apply text-blue-700 dark:text-blue-300; }
.hl-n { @apply text-amber-700 dark:text-amber-300; }
.hl-c { @apply italic text-gray-500 dark:text-gray-400; }

.xdebug-code__message {
  @apply flex items-center gap-2 m-4 text-sm font-sans text-gray-600 dark:text-gray-300;
}

.xdebug-code__skeleton {
  @apply flex flex-col gap-2.5 p-4;

  span {
    @apply block h-3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse;
  }
}
</style>
