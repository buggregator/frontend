<script lang="ts" setup>
import { computed, nextTick, ref, useId } from 'vue'
import type { MapNode } from '../../lib/service-map/service-map-model'

// «Service: All services ▾» (#6540, like Zipkin's picker): picking a service
// is the same as clicking it on the map. Combobox keys: arrows, Enter, Esc.

type Props = { nodes: MapNode[]; colors: Map<string, string>; selected: string | null }

const props = defineProps<Props>()
const emit = defineEmits<{ pick: [id: string | null] }>()

const uid = useId()
const open = ref(false)
const query = ref('')
const active = ref(0)
const button = ref<HTMLButtonElement>()
const input = ref<HTMLInputElement>()

type Option = { id: string | null; label: string; count: number | null }
const options = computed<Option[]>(() => {
  const q = query.value.trim().toLowerCase()
  const list = [...props.nodes]
    .sort((a, b) => Number(a.external) - Number(b.external) || b.inCount - a.inCount || a.label.localeCompare(b.label))
    .filter((n) => !q || n.label.toLowerCase().includes(q))
    .map((n) => ({ id: n.id, label: n.label, count: n.inCount }))
  return q ? list : [{ id: null, label: 'All services', count: null }, ...list]
})
const current = computed(() => props.nodes.find((n) => n.id === props.selected)?.label ?? 'All services')
const optionId = (i: number) => `${uid}-opt-${i}`

const show = async () => {
  open.value = true
  query.value = ''
  active.value = Math.max(0, options.value.findIndex((o) => o.id === props.selected))
  await nextTick()
  input.value?.focus()
}
const close = (focusButton = true) => {
  open.value = false
  if (focusButton) nextTick(() => button.value?.focus())
}
const pick = (o: Option | undefined) => {
  if (!o) return
  emit('pick', o.id)
  close()
}
const onKey = (e: KeyboardEvent) => {
  const n = options.value.length
  if (e.key === 'ArrowDown') active.value = (active.value + 1) % Math.max(1, n)
  else if (e.key === 'ArrowUp') active.value = (active.value - 1 + n) % Math.max(1, n)
  else if (e.key === 'Enter') pick(options.value[active.value])
  else if (e.key === 'Escape') {
    // Esc closes the list only, not the map selection.
    e.stopPropagation()
    close()
  } else return
  e.preventDefault()
}
const onFocusOut = (e: FocusEvent) => {
  const root = (e.currentTarget as HTMLElement | null) ?? null
  if (root && e.relatedTarget instanceof Node && root.contains(e.relatedTarget)) return
  close(false)
}
</script>

<template>
  <div
    class="svc-picker"
    @focusout="onFocusOut"
  >
    <button
      ref="button"
      type="button"
      class="svc-picker__button"
      :aria-expanded="open"
      aria-haspopup="listbox"
      data-test="svc-picker"
      @click="open ? close() : show()"
    >
      <span class="svc-picker__label">Service</span>
      <span class="svc-picker__value">{{ current }}</span>
      <svg
        viewBox="0 0 16 16"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"
      ><path d="m4 6 4 4 4-4" /></svg>
    </button>

    <div
      v-if="open"
      class="svc-picker__pop"
    >
      <input
        ref="input"
        v-model="query"
        class="svc-picker__search"
        type="text"
        role="combobox"
        aria-label="Find a service"
        aria-autocomplete="list"
        :aria-expanded="true"
        :aria-controls="`${uid}-list`"
        :aria-activedescendant="options.length ? optionId(active) : undefined"
        placeholder="Find a service"
        @input="active = 0"
        @keydown="onKey"
      >
      <ul
        :id="`${uid}-list`"
        class="svc-picker__list"
        role="listbox"
        aria-label="Services"
      >
        <li
          v-for="(o, i) in options"
          :id="optionId(i)"
          :key="o.id ?? '*'"
          role="option"
          class="svc-picker__option"
          :class="{ 'svc-picker__option--active': i === active }"
          :aria-selected="o.id === selected"
          @mousedown.prevent
          @mouseenter="active = i"
          @click="pick(o)"
        >
          <span
            v-if="o.id"
            class="svc-picker__swatch"
            :style="{ background: colors.get(o.id) ?? 'var(--tg-node-line)' }"
          />
          <span class="svc-picker__name">{{ o.label }}</span>
          <span
            v-if="o.count != null"
            class="svc-picker__count"
          >{{ o.count }}</span>
        </li>
        <li
          v-if="!options.length"
          class="svc-picker__none"
        >
          No service by that name
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.svc-picker {
  @apply relative w-60 max-sm:w-full;
}

.svc-picker__button {
  @apply flex items-center gap-2 w-full h-8 max-sm:h-11 px-2.5 rounded text-xs;
  border: 1px solid var(--tg-pill-line);
  background: var(--tg-node);
  color: var(--tg-muted);

  &:focus-visible {
    @apply outline-none ring-2 ring-blue-600 dark:ring-blue-400;
  }
}

.svc-picker__value {
  @apply flex-1 min-w-0 truncate text-left font-mono font-semibold;
  color: var(--tg-strong);
}

.svc-picker__pop {
  @apply absolute left-0 right-0 top-full mt-1 z-20 rounded shadow-lg overflow-hidden;
  border: 1px solid var(--tg-pill-line);
  background: var(--tg-node);
}

.svc-picker__search {
  @apply w-full h-9 px-2.5 text-xs bg-transparent outline-none;
  border-bottom: 1px solid var(--tg-pill-line);
  color: var(--tg-strong);
}

.svc-picker__list {
  @apply max-h-64 overflow-auto py-1;
}

.svc-picker__option {
  @apply flex items-center gap-2 px-2.5 h-8 max-sm:h-11 text-xs cursor-pointer;
  color: var(--tg-strong);

  &[aria-selected='true'] {
    @apply font-semibold;
  }
}

.svc-picker__option--active {
  @apply bg-gray-100 dark:bg-gray-700;
}

.svc-picker__swatch {
  @apply w-2 h-2 rounded-sm flex-none;
}

.svc-picker__name {
  @apply flex-1 min-w-0 truncate font-mono;
}

.svc-picker__count {
  @apply font-mono tabular-nums;
  color: var(--tg-muted);
}

.svc-picker__none {
  @apply px-2.5 py-2 text-xs;
  color: var(--tg-muted);
}
</style>
