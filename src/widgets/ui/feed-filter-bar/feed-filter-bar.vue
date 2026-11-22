<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed, defineAsyncComponent, nextTick, ref, shallowRef } from 'vue'
import { copyTextToClipboard } from '@/shared/lib/clipboard'
import { facetLabel, withFilter, withoutFilter, type FeedFilter } from '@/shared/lib/feed-filters'
import { useEventsRequests } from '@/shared/lib/io'
import { showToast } from '@/shared/lib/use-keyboard-nav'
import { useEventsStore } from '@/shared/stores'
import { FilterChip } from '@/shared/ui'
import type { BarChip } from './types'

// The filters of a list in row 2 of the page header (frontend#225, design
// #6679 A, header #6737 A): chips in one line, the ones past `max` behind
// «+N», then «+ Add filter» with values and counts from the server. On a
// phone one «Filters N» button opens them all as a sheet.
// - `facets`: the feed filters of the events store apply to this list (they
//   do to the feeds, not to Sentry traces, logs or metrics);
// - `extra`: the page's own filters as chips (✕ emits `remove-extra`);
// - #add: the page's own way to add them, after «+ Add filter» (on a phone
//   inside the «Filters N» sheet).
const FeedFilterPopover = defineAsyncComponent(() => import('./feed-filter-popover.vue').then((m) => m.default))
const FeedFilterChips = defineAsyncComponent(() => import('./feed-filter-chips.vue').then((m) => m.default))

const props = withDefaults(defineProps<{ facets?: boolean; extra?: BarChip[]; max?: number }>(), {
  facets: true,
  extra: () => [],
  max: 3
})
const emit = defineEmits<{ 'remove-extra': [id: string] }>()

const store = useEventsStore()
const { filters } = storeToRefs(store)
const { getFacets } = useEventsRequests()

const facetChip = (f: FeedFilter): BarChip => ({
  id: `facet|${f.not}|${f.key}|${f.value}`,
  name: facetLabel(f.key),
  value: f.value,
  not: f.not
})

// The page's own filters first: they are the list's, the feed ones are shared.
const chips = computed<BarChip[]>(() => [...props.extra, ...(props.facets ? filters.value.map(facetChip) : [])])
const shown = computed(() => chips.value.slice(0, props.max))
const rest = computed(() => chips.value.slice(props.max))

const removeChip = (chip: BarChip) => {
  const facet = filters.value.find((f) => facetChip(f).id === chip.id)
  if (facet) store.setFilters(withoutFilter(filters.value, facet))
  else emit('remove-extra', chip.id)
}

const addButton = ref<HTMLButtonElement | null>(null)
const moreButton = ref<HTMLButtonElement | null>(null)
const phoneButton = ref<HTMLButtonElement | null>(null)
const chipsList = ref<HTMLElement | null>(null)

// One overlay at a time: the value picker, «+N» or the phone sheet.
const open = ref<'' | 'add' | 'more' | 'sheet'>('')
// Where the focus goes back when the overlay closes.
const opener = shallowRef<HTMLElement | null>(null)

const toggle = (what: 'add' | 'more' | 'sheet', from: HTMLElement | null) => {
  if (open.value === what) return close()
  opener.value = from
  open.value = what
}

const close = async () => {
  open.value = ''
  await nextTick()
  // On a phone the row's own buttons are hidden: back to «Filters N».
  const phone = window.matchMedia?.('(max-width: 639px)').matches
  ;(phone ? phoneButton.value : opener.value)?.focus()
}

const add = (filter: FeedFilter) => {
  store.setFilters(withFilter(filters.value, filter))
  close()
}

// «Add filter» in the phone sheet: the value picker takes the sheet's place.
const addFromSheet = () => {
  opener.value = phoneButton.value
  open.value = 'add'
}

// Focus stays in the row: on the next chip's ✕, else on «+N» or «Add filter».
const remove = async (chip: BarChip, index: number) => {
  removeChip(chip)
  await nextTick()
  const buttons = chipsList.value?.querySelectorAll<HTMLButtonElement>('.filter-chip__remove')
  const next = buttons?.[Math.min(index, (buttons?.length ?? 0) - 1)]
  ;(next ?? moreButton.value ?? addButton.value)?.focus()
}

const removeHidden = (chip: BarChip) => {
  removeChip(chip)
  // The last hidden one gone: «+N» is gone too.
  if (rest.value.length === 0 && open.value === 'more') close()
}

const clear = () => {
  if (props.facets) store.setFilters([])
  props.extra.forEach((c) => emit('remove-extra', c.id))
  close()
}

const copyLink = () => {
  copyTextToClipboard(window.location.href)
    .then(() => showToast('Link to this filter copied'))
    .catch(() => showToast('Could not copy the link'))
}
</script>

<template>
  <div
    class="ffb"
    data-test="feed-filter-bar"
  >
    <!-- Wide screens: the chips in the row. -->
    <ul
      v-if="shown.length"
      ref="chipsList"
      class="ffb__chips"
      aria-label="Active filters"
    >
      <li
        v-for="(chip, i) in shown"
        :key="chip.id"
        class="ffb__chip"
      >
        <FilterChip
          :name="chip.name"
          :value="chip.value"
          :not="chip.not"
          @remove="remove(chip, i)"
        />
      </li>
    </ul>

    <div
      v-if="rest.length"
      class="ffb__wrap ffb__wide"
    >
      <button
        ref="moreButton"
        type="button"
        class="ffb__more"
        aria-haspopup="dialog"
        :aria-expanded="open === 'more'"
        :aria-label="`${rest.length} more ${rest.length === 1 ? 'filter' : 'filters'}`"
        data-test="feed-filter-more"
        @click="toggle('more', moreButton)"
      >
        +{{ rest.length }}
      </button>
      <FeedFilterChips
        v-if="open === 'more'"
        :chips="rest"
        :title="`${rest.length} more ${rest.length === 1 ? 'filter' : 'filters'}`"
        :anchor="moreButton"
        :can-copy="facets && filters.length > 0"
        @remove="removeHidden"
        @copy="copyLink"
        @clear="clear"
        @close="close"
      />
    </div>

    <div
      v-if="facets"
      class="ffb__wrap ffb__wide"
    >
      <button
        ref="addButton"
        type="button"
        class="ffb__add"
        aria-haspopup="dialog"
        :aria-expanded="open === 'add' && opener === addButton"
        @click="toggle('add', addButton)"
      >
        <span aria-hidden="true">+</span> Add filter
      </button>
      <FeedFilterPopover
        v-if="open === 'add' && opener === addButton"
        :load="getFacets"
        :anchor="addButton"
        @pick="add"
        @close="close"
      />
    </div>

    <!-- Phone: one button for all the filters. -->
    <div class="ffb__wrap ffb__phone">
      <button
        v-if="facets || chips.length || $slots.add"
        ref="phoneButton"
        type="button"
        class="ffb__phone-btn"
        :class="{ 'ffb__phone-btn--on': chips.length > 0 }"
        aria-haspopup="dialog"
        :aria-expanded="open === 'sheet'"
        :aria-label="`Filters, ${chips.length} on`"
        data-test="feed-filter-phone"
        @click="toggle('sheet', phoneButton)"
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <path
            d="M2 3h12l-4.5 5.5V13l-3-1.5v-3z"
            stroke-linejoin="round"
          />
        </svg>
        Filters <b v-if="chips.length">{{ chips.length }}</b>
      </button>
      <FeedFilterChips
        v-if="open === 'sheet'"
        :chips="chips"
        title="Filters"
        :anchor="phoneButton"
        :can-add="facets"
        :can-copy="facets && filters.length > 0"
        @remove="removeChip"
        @add="addFromSheet"
        @copy="copyLink"
        @clear="clear"
        @close="close"
      >
        <template
          v-if="$slots.add"
          #add
        >
          <slot name="add" />
        </template>
      </FeedFilterChips>
      <!-- The value picker from the sheet: a sheet too. -->
      <FeedFilterPopover
        v-if="open === 'add' && opener === phoneButton"
        :load="getFacets"
        :anchor="phoneButton"
        @pick="add"
        @close="close"
      />
    </div>

    <!-- The page's own «add»; on a phone it is in the sheet. -->
    <div
      v-if="$slots.add"
      class="ffb__wrap ffb__wide"
    >
      <slot name="add" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
// Plain CSS with tokens: Tailwind dark variants would double every rule.
.ffb {
  --ffb-line: #6b7280;
  --ffb-bg: #fff;
  --ffb-text: #1f2937;
  --ffb-hover: #e5e7eb;
  --ffb-on-bg: #dbeafe;
  --ffb-on-line: #2563eb;
  --ffb-on-text: #1d4ed8;
  --ffb-focus: #2563eb;

  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: var(--ffb-text);
  font-size: 12px;

  .dark & {
    --ffb-bg: #111827;
    --ffb-text: #f3f4f6;
    --ffb-hover: #1f2937;
    --ffb-on-bg: #172554;
    --ffb-on-line: #3b82f6;
    --ffb-on-text: #93c5fd;
    --ffb-focus: #60a5fa;
  }
}

.ffb__chips {
  display: flex;
  gap: 6px;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow: hidden;
}

.ffb__chip {
  display: flex;
  min-width: 0;
}

.ffb__wrap {
  position: relative;
  flex: none;
}

.ffb__more,
.ffb__add {
  height: 26px;
  padding: 0 8px;
  border: 1px solid var(--ffb-line);
  border-radius: 3px;
  white-space: nowrap;
  font-weight: 500;

  &:hover {
    background: var(--ffb-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--ffb-focus);
    outline-offset: 1px;
  }
}

.ffb__more {
  background: var(--ffb-bg);
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 600;
}

.ffb__add {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-style: dashed;
}

.ffb__phone {
  display: none;
}

.ffb__phone-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 38px;
  min-width: 44px;
  padding: 0 12px;
  border: 1px solid var(--ffb-line);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;

  position: relative;

  svg {
    width: 14px;
    height: 14px;
  }

  // A 44 px tap area.
  &::before {
    content: '';
    position: absolute;
    inset: -3px -1px;
  }

  &:focus-visible {
    outline: 2px solid var(--ffb-focus);
    outline-offset: 1px;
  }
}

.ffb__phone-btn--on {
  border-color: var(--ffb-on-line);
  background: var(--ffb-on-bg);
  color: var(--ffb-on-text);
}

/* Phone: «Filters N» instead of the chips. */
@media (max-width: 639px) {
  .ffb__chips,
  .ffb__wide {
    display: none;
  }

  .ffb__phone {
    display: block;
  }
}
</style>
