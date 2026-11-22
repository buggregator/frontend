<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed, defineAsyncComponent, nextTick, ref } from 'vue'
import { copyTextToClipboard } from '@/shared/lib/clipboard'
import { facetLabel, withFilter, withoutFilter, type FeedFilter } from '@/shared/lib/feed-filters'
import { useEventsRequests } from '@/shared/lib/io'
import { showToast } from '@/shared/lib/use-keyboard-nav'
import { useEventsStore } from '@/shared/stores'
import type { PageEventTypes } from '@/shared/types'

// Feed filters for a shared dev server (frontend#225, design A of #6679):
// the active filters as chips, «Add filter» with values and counts from the
// server, a link to the same selection and Clear.
const FeedFilterPopover = defineAsyncComponent(() =>
  import('./feed-filter-popover.vue').then((m) => m.default)
)

// The page's event type: the hidden count is about what this page would show.
const props = defineProps<{ type?: PageEventTypes }>()

const store = useEventsStore()
const { filters } = storeToRefs(store)
const hiddenNew = computed(() => store.hiddenCount(props.type))
const { getFacets } = useEventsRequests()

const isOpen = ref(false)
const addButton = ref<HTMLButtonElement | null>(null)
const chipsList = ref<HTMLElement | null>(null)

const describe = (f: FeedFilter) => `${facetLabel(f.key)} ${f.not ? 'is not' : 'is'} ${f.value}`

const close = async () => {
  isOpen.value = false
  await nextTick()
  addButton.value?.focus()
}

const add = (filter: FeedFilter) => {
  store.setFilters(withFilter(filters.value, filter))
  close()
}

// Focus stays in the row: on the next chip's ✕, else on «Add filter».
const remove = async (filter: FeedFilter, index: number) => {
  store.setFilters(withoutFilter(filters.value, filter))
  await nextTick()
  const buttons = chipsList.value?.querySelectorAll<HTMLButtonElement>('.ffb__remove')
  const next = buttons?.[Math.min(index, buttons.length - 1)]
  ;(next ?? addButton.value)?.focus()
}

const clear = async () => {
  store.setFilters([])
  await nextTick()
  addButton.value?.focus()
}

const copyLink = () => {
  copyTextToClipboard(window.location.href)
    .then(() => showToast('Link to this filter copied'))
    .catch(() => showToast('Could not copy the link'))
}
</script>

<template>
  <div class="ffb">
    <div class="ffb__row">
      <ul
        v-if="filters.length"
        ref="chipsList"
        class="ffb__chips"
        aria-label="Active filters"
      >
        <li
          v-for="(f, i) in filters"
          :key="`${f.not}|${f.key}|${f.value}`"
          class="ffb__chip"
          :class="{ 'ffb__chip--not': f.not }"
        >
          <span class="ffb__key">{{ facetLabel(f.key) }}</span>
          <span
            class="ffb__op"
            :aria-label="f.not ? 'is not' : 'is'"
          >{{ f.not ? '≠' : '=' }}</span>
          <span class="ffb__value">{{ f.value }}</span>
          <button
            type="button"
            class="ffb__remove"
            :aria-label="`Remove filter: ${describe(f)}`"
            @click="remove(f, i)"
          >
            ✕
          </button>
        </li>
      </ul>

      <div class="ffb__add-wrap">
        <button
          ref="addButton"
          type="button"
          class="ffb__add"
          aria-haspopup="dialog"
          :aria-expanded="isOpen"
          @click="isOpen = !isOpen"
        >
          <span aria-hidden="true">+</span> Add filter
        </button>
        <FeedFilterPopover
          v-if="isOpen"
          :load="getFacets"
          :anchor="addButton"
          @pick="add"
          @close="close"
        />
      </div>

      <div
        v-if="filters.length"
        class="ffb__actions"
      >
        <button
          type="button"
          class="ffb__action"
          title="Copy a link to this filter"
          @click="copyLink"
        >
          Copy link
        </button>
        <button
          type="button"
          class="ffb__action"
          @click="clear"
        >
          Clear
        </button>
      </div>
    </div>

    <p
      v-if="filters.length && hiddenNew > 0"
      class="ffb__hidden"
      role="status"
    >
      <span><b>{{ hiddenNew }} new {{ hiddenNew === 1 ? 'event' : 'events' }}</b> arrived and {{ hiddenNew === 1 ? 'is' : 'are' }} hidden by this filter.</span>
      <button
        type="button"
        class="ffb__link"
        @click="clear"
      >
        Clear filters
      </button>
    </p>
  </div>
</template>

<style lang="scss" scoped>
.ffb {
  --ffb-border: theme('colors.gray.300');
  --ffb-key-bg: theme('colors.gray.100');
  --ffb-text: theme('colors.gray.800');
  --ffb-faint: theme('colors.gray.600');
  --ffb-neg: #b91c1c;
  --ffb-link: theme('colors.blue.600');

  padding: 8px 12px;
  border-bottom: 1px solid var(--ffb-border);
  color: var(--ffb-text);
  font-size: 13px;

  .dark & {
    --ffb-border: theme('colors.gray.700');
    --ffb-key-bg: theme('colors.gray.800');
    --ffb-text: theme('colors.gray.100');
    --ffb-faint: theme('colors.gray.400');
    --ffb-neg: #fca5a5;
    --ffb-link: theme('colors.blue.300');
  }
}

.ffb__row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.ffb__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ffb__chip {
  display: inline-flex;
  align-items: center;
  height: 28px;
  border: 1px solid var(--ffb-border);
  border-radius: 3px;
  overflow: hidden;
  white-space: nowrap;
}

.ffb__key {
  align-self: stretch;
  display: inline-flex;
  align-items: center;
  padding: 0 8px;
  background: var(--ffb-key-bg);
  color: var(--ffb-faint);
}

.ffb__op {
  padding: 0 6px;
  color: var(--ffb-faint);
}

.ffb__value {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  font-variant-ligatures: none;
}

.ffb__chip--not .ffb__op,
.ffb__chip--not .ffb__value {
  color: var(--ffb-neg);
}

.ffb__chip--not .ffb__value {
  text-decoration: line-through;
}

.ffb__remove {
  align-self: stretch;
  width: 28px;
  margin-left: 4px;
  color: var(--ffb-faint);
}

.ffb__remove:hover {
  background: var(--ffb-key-bg);
  color: var(--ffb-text);
}

.ffb__add-wrap {
  position: relative;
  flex: none;
}

.ffb__add {
  height: 28px;
  padding: 0 8px;
  border-radius: 3px;
  white-space: nowrap;
}

.ffb__add:hover,
.ffb__action:hover {
  background: var(--ffb-key-bg);
}

.ffb__actions {
  display: flex;
  gap: 4px;
  margin-left: auto;
  flex: none;
}

.ffb__action {
  height: 28px;
  padding: 0 8px;
  border-radius: 3px;
  color: var(--ffb-faint);
  white-space: nowrap;
}

.ffb__hidden {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
  margin: 8px 0 0;
  color: var(--ffb-faint);
}

.ffb__hidden b {
  color: var(--ffb-text);
}

.ffb__link {
  color: var(--ffb-link);
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* Phone: the chips scroll in one line, buttons get finger room. */
@media (max-width: 639px) {
  .ffb__chips {
    flex-wrap: nowrap;
    overflow-x: auto;
  }

  .ffb__chip,
  .ffb__add,
  .ffb__action {
    height: 36px;
  }

  .ffb__remove {
    width: 36px;
  }
}
</style>
