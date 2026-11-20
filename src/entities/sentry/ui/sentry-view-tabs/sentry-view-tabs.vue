<script lang="ts" setup>
import { nextTick, ref } from 'vue'
import { VIEW_ICONS, type ViewIcon } from '../../lib/view-icons'
import { tabIdOf } from './tab-id'

// A row of view tabs under the header (#6543 variant B): Traces (List /
// Service map), Exceptions (Timeline / Grouped) and the trace page (Waterfall
// / Flame graph / Call graph / Sequence / related lists) use the same row.
// Tablist keys: arrows move focus, Enter or Space opens the tab.

export type SentryViewTab = { id: string; label: string; icon?: ViewIcon; count?: number | null }

// panelId: the element showing the current tab's content (role="tabpanel");
// its aria-labelledby is `tabIdOf(panelId, current)`.
type Props = { tabs: SentryViewTab[]; current: string; label: string; panelId?: string }
const props = defineProps<Props>()
const emit = defineEmits<{ select: [id: string] }>()

const buttons = ref<HTMLButtonElement[]>([])

const focusAt = async (i: number) => {
  await nextTick()
  buttons.value[(i + props.tabs.length) % props.tabs.length]?.focus()
}

const onKey = (e: KeyboardEvent, i: number) => {
  const moves: Record<string, number> = {
    ArrowRight: i + 1,
    ArrowLeft: i - 1,
    Home: 0,
    End: props.tabs.length - 1
  }
  if (!(e.key in moves)) return
  e.preventDefault()
  focusAt(moves[e.key])
}
</script>

<template>
  <div
    class="sentry-view-tabs"
    data-test="sentry-view-tabs"
  >
    <div
      class="sentry-view-tabs__list"
      role="tablist"
      :aria-label="label"
    >
      <button
        v-for="(tab, i) in tabs"
        :id="panelId ? tabIdOf(panelId, tab.id) : undefined"
        :key="tab.id"
        ref="buttons"
        type="button"
        role="tab"
        class="sentry-view-tabs__tab"
        :class="{ 'sentry-view-tabs__tab--on': tab.id === current }"
        :aria-selected="tab.id === current"
        :aria-controls="panelId"
        :tabindex="tab.id === current ? 0 : -1"
        :data-test="`view-tab-${tab.id}`"
        @click="emit('select', tab.id)"
        @keydown="onKey($event, i)"
      >
        <!-- eslint-disable vue/no-v-html -- fixed icon paths from lib/view-icons, no user text -->
        <svg
          v-if="tab.icon"
          viewBox="0 0 16 16"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
          v-html="VIEW_ICONS[tab.icon]"
        />
        <!-- eslint-enable vue/no-v-html -->
        {{ tab.label }}
        <span
          v-if="tab.count != null"
          class="sentry-view-tabs__count"
        >{{ tab.count }}</span>
      </button>
    </div>

    <div
      v-if="$slots.info"
      class="sentry-view-tabs__info"
    >
      <slot name="info" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
// Plain CSS with tokens: Tailwind dark variants would double every rule in
// the first-load stylesheet (bundle budget).
.sentry-view-tabs {
  --vt-off: #6b7280;
  --vt-on: #1f2937;
  --vt-line: #e5e7eb;
  --vt-bg: #fff;
  display: flex;
  flex: none;
  gap: 1rem;
  min-width: 0;
  padding: 0 1rem;
  background: var(--vt-bg);
  border-bottom: 1px solid var(--vt-line);
}

.dark .sentry-view-tabs {
  --vt-off: #9ca3af;
  --vt-on: #f3f4f6;
  --vt-line: #374151;
  --vt-bg: #1f2937;
}

.sentry-view-tabs__list {
  display: flex;
  gap: 1.25rem;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.sentry-view-tabs__tab {
  display: flex;
  flex: none;
  align-items: center;
  gap: 0.375rem;
  padding: 9px 2px;
  font-size: 13px;
  line-height: 20px;
  white-space: nowrap;
  color: var(--vt-off);
  border-bottom: 2px solid transparent;

  &:hover {
    color: var(--vt-on);
  }

  &:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: -2px;
  }

  @media (max-width: 639px) {
    min-height: 44px;
  }
}

.sentry-view-tabs__tab--on {
  font-weight: 500;
  color: var(--vt-on);
  border-bottom-color: var(--vt-on);
}

.sentry-view-tabs__count {
  font: 400 12px ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--vt-off);
}

.sentry-view-tabs__info {
  display: none;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
  flex: none;
  font-size: 12px;
  white-space: nowrap;
  color: var(--vt-off);

  @media (min-width: 640px) {
    display: flex;
  }
}
</style>
