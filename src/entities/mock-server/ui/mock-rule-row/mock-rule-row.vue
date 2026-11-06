<script lang="ts" setup>
import { computed } from 'vue'
import { delayText } from '../../lib/mock-format'
import type { MockRule } from '../../types'
import { MockBadge } from '../mock-badge'
import { MockPath } from '../mock-path'

type Props = {
  rule: MockRule
  order: number
  hits?: number
  selected?: boolean
  answered?: boolean
  near?: boolean
  canMoveUp?: boolean
  canMoveDown?: boolean
}

const props = withDefaults(defineProps<Props>(), { hits: 0 })

const emit = defineEmits<{
  select: [rule: MockRule]
  edit: [rule: MockRule]
  toggle: [rule: MockRule]
  move: [rule: MockRule, delta: -1 | 1]
}>()

const label = computed(() => props.rule.name || `${props.rule.method} ${props.rule.path}`)
</script>

<template>
  <div
    class="mock-rule-row"
    :class="{
      'mock-rule-row--selected': selected,
      'mock-rule-row--disabled': !rule.enabled
    }"
  >
    <button
      type="button"
      role="switch"
      class="mock-rule-row__switch"
      :aria-checked="rule.enabled"
      :aria-label="`Enabled: ${label}`"
      :disabled="rule.read_only"
      :title="
        rule.read_only ? 'Defined in buggregator.yaml' : rule.enabled ? 'Turn off' : 'Turn on'
      "
      @click="emit('toggle', rule)"
    >
      <span class="mock-rule-row__knob" />
    </button>

    <button
      type="button"
      class="mock-rule-row__main"
      :aria-pressed="selected"
      :title="rule.read_only ? 'Show its requests' : 'Show its requests · double-click to edit'"
      @click="emit('select', rule)"
      @dblclick="emit('edit', rule)"
    >
      <span class="mock-rule-row__top">
        <span class="mock-rule-row__order">{{ order }}</span>
        <MockBadge :method="rule.method" />
        <MockPath
          class="mock-rule-row__path"
          :path="rule.path"
          truncate
        />
      </span>
      <span class="mock-rule-row__sub">
        <span
          v-if="rule.read_only"
          class="mock-rule-row__tag mock-rule-row__tag--yaml"
        >yaml</span>
        <span
          v-if="rule.name"
          class="mock-rule-row__name"
        >{{ rule.name }}</span>
        <i
          v-else
          class="mock-rule-row__name"
        >no name</i>
        <span
          v-if="rule.project"
          class="mock-rule-row__tag"
        >{{ rule.project }}</span>
        <span
          v-if="rule.delay_ms"
          class="mock-rule-row__tag"
        >{{ delayText(rule.delay_ms) }}</span>
        <span
          v-if="answered"
          class="mock-rule-row__flag mock-rule-row__flag--ok"
        >✓ answered this</span>
        <span
          v-if="near"
          class="mock-rule-row__flag mock-rule-row__flag--near"
        >close, didn't match</span>
      </span>
    </button>

    <span class="mock-rule-row__right">
      <MockBadge :status="rule.status" />
      <span
        class="mock-rule-row__hits"
        title="Requests answered (stored events)"
      >{{ hits }} {{ hits === 1 ? 'hit' : 'hits' }}</span>
    </span>

    <span class="mock-rule-row__actions">
      <button
        type="button"
        class="mock-rule-row__icon"
        :aria-label="rule.read_only ? `Open ${label}` : `Edit ${label}`"
        :title="rule.read_only ? 'Open (read-only)' : 'Edit'"
        @click="emit('edit', rule)"
      >
        ✎
      </button>
      <template v-if="!rule.read_only">
        <button
          type="button"
          class="mock-rule-row__icon"
          :aria-label="`Move ${label} up`"
          title="Move up"
          :disabled="!canMoveUp"
          @click="emit('move', rule, -1)"
        >
          ↑
        </button>
        <button
          type="button"
          class="mock-rule-row__icon"
          :aria-label="`Move ${label} down`"
          title="Move down"
          :disabled="!canMoveDown"
          @click="emit('move', rule, 1)"
        >
          ↓
        </button>
      </template>
    </span>
  </div>
</template>

<style lang="scss" scoped>
.mock-rule-row {
  @apply relative grid items-center gap-x-2 px-3 py-2;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply hover:bg-gray-100 dark:hover:bg-white/5;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas:
    'switch main right'
    'switch main actions';
}

.mock-rule-row--selected {
  @apply bg-blue-50 dark:bg-blue-500/10;
  box-shadow: inset 3px 0 0 theme('colors.blue.600');
}

.mock-rule-row--disabled {
  .mock-rule-row__main,
  .mock-rule-row__right {
    @apply opacity-60;
  }

  .mock-rule-row__path {
    @apply line-through;
  }
}

.mock-rule-row__switch {
  grid-area: switch;
  @apply relative w-7 h-4 rounded-full shrink-0;
  @apply border border-gray-500 bg-gray-200 dark:bg-gray-700;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;

  &[aria-checked='true'] {
    @apply bg-blue-600 border-blue-600;
  }
}

.mock-rule-row__knob {
  @apply absolute top-px left-px w-3 h-3 rounded-full bg-white shadow transition-transform;

  [aria-checked='true'] > & {
    @apply translate-x-3;
  }
}

.mock-rule-row__main {
  grid-area: main;
  @apply flex flex-col gap-1 min-w-0 text-left rounded;
}

.mock-rule-row__top {
  @apply flex items-center gap-2 min-w-0;
}

.mock-rule-row__order {
  @apply w-4 text-right text-2xs font-mono text-gray-500 dark:text-gray-400 shrink-0;
}

.mock-rule-row__sub {
  @apply flex flex-wrap items-center gap-1.5 pl-6 text-xs text-gray-600 dark:text-gray-300;
}

.mock-rule-row__name {
  @apply truncate max-w-[12rem];
}

.mock-rule-row__tag {
  @apply px-1 rounded text-2xs bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300;
}

.mock-rule-row__tag--yaml {
  @apply bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400;
}

.mock-rule-row__flag {
  @apply px-1 rounded text-2xs font-medium;
}

.mock-rule-row__flag--ok {
  @apply bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400;
}

.mock-rule-row__flag--near {
  @apply bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400;
}

.mock-rule-row__right {
  grid-area: right;
  @apply flex flex-col items-end gap-0.5;
}

.mock-rule-row__hits {
  @apply text-2xs font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap;
}

.mock-rule-row__actions {
  grid-area: actions;
  @apply flex justify-end gap-0.5;
}

.mock-rule-row__icon {
  @apply w-6 h-6 rounded text-xs text-gray-600 dark:text-gray-300;
  @apply hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed;

  @media (max-width: 639px) {
    @apply w-10 h-10;
  }
}

// phone: a 44 px hit area around the small switch
@media (max-width: 639px) {
  .mock-rule-row__switch::before {
    content: '';
    @apply absolute -inset-3.5;
  }
}
</style>
