<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import type { FeedFilter } from '@/shared/lib/feed-filters'
import type { FacetCounts } from '@/shared/lib/io'
import { useFacetPicker } from './use-facet-picker'

// «Add filter»: pick a field, then a value. Enter includes the value,
// Shift+Enter (or the ≠ button) excludes it. Counts come from the server.
const props = defineProps<{
  load: () => Promise<FacetCounts>
  // The «Add filter» button: a click on it is not a click outside.
  anchor?: HTMLElement | null
}>()

const emit = defineEmits<{
  pick: [filter: FeedFilter]
  close: []
}>()

const picker = useFacetPicker(props.load)
const { status, fields, field, current, values, maxCount, query, active } = picker

const root = ref<HTMLElement | null>(null)
const search = ref<HTMLInputElement | null>(null)
const firstField = ref<HTMLButtonElement | null>(null)
const uid = useId()

// A typed value nobody sent yet can still be a filter: it matches new events.
const typed = computed(() => {
  const text = query.value.trim()
  return text && !values.value.some(({ value }) => value === text) ? text : ''
})

const optionCount = computed(() => values.value.length + (typed.value ? 1 : 0))
const optionId = (i: number) => `${uid}-opt-${i}`

const pick = (value: string, not: boolean) => {
  if (field.value) emit('pick', { key: field.value, value, not })
}

const pickActive = (not: boolean) => {
  const option = values.value[active.value]
  if (option) pick(option.value, not)
  else if (typed.value) pick(typed.value, not)
}

const moveActive = (delta: number) => {
  const n = optionCount.value
  if (n) active.value = (active.value + delta + n) % n
}

const chooseField = async (key: string) => {
  picker.chooseField(key)
  await nextTick()
  search.value?.focus()
}

const back = async () => {
  picker.back()
  await nextTick()
  firstField.value?.focus()
}

const onSearchKey = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') moveActive(1)
  else if (e.key === 'ArrowUp') moveActive(-1)
  else if (e.key === 'Enter') pickActive(e.shiftKey)
  else if (e.key === 'Backspace' && !query.value) back()
  else return
  e.preventDefault()
}

const onOutside = (e: PointerEvent) => {
  const target = e.target as Node
  if (root.value?.contains(target) || props.anchor?.contains(target)) return
  emit('close')
}

onMounted(async () => {
  document.addEventListener('pointerdown', onOutside)
  await nextTick()
  firstField.value?.focus()
  await picker.reload()
})

onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside))

const formatCount = (n: number) => n.toLocaleString('en-US')
</script>

<template>
  <!-- Phone only: the scrim under the bottom sheet; a tap on it is a click outside. -->
  <div
    class="ffp__scrim"
    aria-hidden="true"
  />
  <div
    ref="root"
    class="ffp"
    role="dialog"
    :aria-label="current ? `Filter by ${current.label}` : 'Add filter'"
    @keydown.esc.stop.prevent="emit('close')"
  >
    <template v-if="!current">
      <div class="ffp__head">
        Filter by
      </div>
      <ul class="ffp__list">
        <li
          v-for="(f, i) in fields"
          :key="f.key"
        >
          <button
            :ref="(el) => { if (i === 0) firstField = el as HTMLButtonElement }"
            type="button"
            class="ffp__field"
            @click="chooseField(f.key)"
          >
            <span class="ffp__field-label">{{ f.label }}</span>
            <span class="ffp__field-sent">{{ f.sentBy }}</span>
            <span
              v-if="status === 'ready'"
              class="ffp__field-count"
            >{{ f.values ? `${f.values} ${f.values === 1 ? 'value' : 'values'}` : 'none yet' }}</span>
            <span
              class="ffp__chevron"
              aria-hidden="true"
            >›</span>
          </button>
        </li>
      </ul>
      <p
        v-if="status === 'error'"
        class="ffp__note ffp__note--error"
        role="alert"
      >
        Could not load the values.
        <button
          type="button"
          class="ffp__link"
          @click="picker.reload()"
        >
          Try again
        </button>
      </p>
      <p class="ffp__note">
        SMTP, SMS, CSP, broadcast and Xdebug traces have no fields to filter by.
      </p>
    </template>

    <template v-else>
      <div class="ffp__head">
        <span>{{ current.label }}<span
          v-if="status === 'ready'"
          class="ffp__faint"
        > · {{ current.values }} {{ current.values === 1 ? 'value' : 'values' }}</span></span>
        <button
          type="button"
          class="ffp__link"
          @click="back"
        >
          ← All fields
        </button>
      </div>

      <input
        ref="search"
        :value="query"
        class="ffp__search"
        type="text"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="optionCount > 0"
        :aria-controls="`${uid}-list`"
        :aria-activedescendant="optionCount ? optionId(active) : undefined"
        :aria-describedby="`${uid}-keys`"
        :aria-label="`Find a ${current.label.toLowerCase()} value`"
        :placeholder="`Find or type a ${current.label.toLowerCase()}…`"
        autocomplete="off"
        spellcheck="false"
        @input="picker.setQuery(($event.target as HTMLInputElement).value)"
        @keydown="onSearchKey"
      >

      <p
        v-if="status === 'loading'"
        class="ffp__note"
      >
        Loading values…
      </p>

      <ul
        :id="`${uid}-list`"
        class="ffp__list ffp__list--values"
        role="listbox"
        :aria-label="`${current.label} values`"
      >
        <li
          v-for="(v, i) in values"
          :id="optionId(i)"
          :key="v.value"
          role="option"
          :aria-selected="i === active"
          class="ffp__value"
          :class="{ 'ffp__value--active': i === active }"
          @mousedown.prevent
          @mousemove="active = i"
          @click="pick(v.value, false)"
        >
          <span class="ffp__value-text">{{ v.value }}</span>
          <span
            class="ffp__bar"
            aria-hidden="true"
          ><i :style="{ width: `${(v.count / maxCount) * 100}%` }" /></span>
          <span class="ffp__count">{{ formatCount(v.count) }}</span>
          <button
            type="button"
            class="ffp__not"
            tabindex="-1"
            :aria-label="`Exclude ${v.value}`"
            title="Exclude (⇧ Enter)"
            @click.stop="pick(v.value, true)"
          >
            ≠
          </button>
        </li>
        <li
          v-if="typed"
          :id="optionId(values.length)"
          role="option"
          :aria-selected="active === values.length"
          class="ffp__value"
          :class="{ 'ffp__value--active': active === values.length }"
          @mousedown.prevent
          @mousemove="active = values.length"
          @click="pick(typed, false)"
        >
          <span class="ffp__value-text">Use “{{ typed }}”</span>
          <span class="ffp__count">no events yet</span>
        </li>
      </ul>

      <p
        v-if="status === 'ready' && !current.values && !typed"
        class="ffp__note"
      >
        No event has sent this field yet. It comes from {{ current.sentBy }}.
      </p>

      <div
        :id="`${uid}-keys`"
        class="ffp__foot"
      >
        <span><kbd>Enter</kbd> include</span>
        <span><kbd>⇧ Enter</kbd> exclude</span>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.ffp {
  --ffp-bg: theme('colors.white');
  --ffp-border: theme('colors.gray.300');
  --ffp-hover: theme('colors.gray.100');
  --ffp-text: theme('colors.gray.800');
  --ffp-faint: theme('colors.gray.500');
  --ffp-bar: theme('colors.blue.200');
  --ffp-neg: #b91c1c;

  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 40;
  width: 340px;
  max-height: min(440px, 70vh);
  display: flex;
  flex-direction: column;
  border: 1px solid var(--ffp-border);
  border-radius: 6px;
  background: var(--ffp-bg);
  color: var(--ffp-text);
  box-shadow: 0 12px 32px rgb(0 0 0 / 0.18);
  font-size: 13px;
  overflow: hidden;

  .dark & {
    --ffp-bg: theme('colors.gray.800');
    --ffp-border: theme('colors.gray.600');
    --ffp-hover: theme('colors.gray.700');
    --ffp-text: theme('colors.gray.100');
    --ffp-faint: theme('colors.gray.400');
    --ffp-bar: theme('colors.blue.800');
    --ffp-neg: #fca5a5;
  }
}

.ffp__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px 6px;
  font-weight: 600;
}

.ffp__faint,
.ffp__field-sent,
.ffp__count,
.ffp__note {
  color: var(--ffp-faint);
  font-weight: 400;
}

.ffp__list {
  margin: 0;
  padding: 0 0 4px;
  list-style: none;
  overflow-y: auto;
}

.ffp__field {
  display: grid;
  grid-template-columns: 1fr auto 12px;
  grid-template-areas: 'label count chevron' 'sent sent sent';
  column-gap: 8px;
  width: 100%;
  min-height: 44px;
  padding: 6px 12px;
  text-align: left;
}

.ffp__field:hover,
.ffp__field:focus-visible {
  background: var(--ffp-hover);
}

.ffp__field-label { grid-area: label; }
.ffp__field-count { grid-area: count; font-size: 12px; color: var(--ffp-faint); }
.ffp__chevron { grid-area: chevron; color: var(--ffp-faint); }
.ffp__field-sent { grid-area: sent; font-size: 12px; }

.ffp__search {
  margin: 0 12px 6px;
  padding: 6px 8px;
  border: 1px solid var(--ffp-border);
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-variant-ligatures: none;
}

.ffp__value {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 60px auto 28px;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 4px 0 12px;
  cursor: pointer;
}

.ffp__value--active {
  background: var(--ffp-hover);
}

.ffp__value-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-variant-ligatures: none;
}

.ffp__bar {
  height: 4px;
  border-radius: 2px;
  background: var(--ffp-hover);
  overflow: hidden;
}

.ffp__bar i {
  display: block;
  height: 100%;
  background: var(--ffp-bar);
}

.ffp__count {
  font-size: 12px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.ffp__not {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  color: var(--ffp-neg);
}

.ffp__not:hover {
  background: var(--ffp-bg);
}

.ffp__note {
  margin: 0;
  padding: 6px 12px 10px;
  font-size: 12px;
}

.ffp__note--error {
  color: var(--ffp-neg);
}

.ffp__link {
  color: theme('colors.blue.600');
  font-size: 12px;
  font-weight: 400;
  text-decoration: underline;
  text-underline-offset: 2px;

  .dark & {
    color: theme('colors.blue.300');
  }
}

.ffp__foot {
  display: flex;
  gap: 16px;
  padding: 8px 12px;
  border-top: 1px solid var(--ffp-border);
  color: var(--ffp-faint);
  font-size: 12px;
}

.ffp__foot kbd {
  padding: 0 4px;
  border: 1px solid var(--ffp-border);
  border-radius: 3px;
  font-family: inherit;
}

/* Phone: a sheet from the bottom of the screen. */
.ffp__scrim {
  display: none;
}

@media (max-width: 639px) {
  .ffp__scrim {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 60;
    background: rgb(3 7 18 / 50%);
  }

  .ffp {
    position: fixed;
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    width: auto;
    /* Over the scrim and the fixed sidebar (z 50), like the Sentry filter sheet. */
    z-index: 61;
    max-height: 75vh;
    border-radius: 12px 12px 0 0;
  }

  .ffp__value {
    min-height: 44px;
  }

  .ffp__not {
    width: 36px;
    height: 36px;
  }

  .ffp__foot {
    display: none;
  }
}
</style>
