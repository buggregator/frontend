<script lang="ts" setup>
import { computed } from 'vue'

// An active filter, «key = value ✕» or «key ≠ value ✕» (#6628, design #6737).
// A screen reader hears «is» / «is not» for the sign; ✕ removes the filter.
type Props = {
  name: string
  value: string
  not?: boolean
  // The name of ✕; by default «Remove filter host is anna-mbp».
  removeLabel?: string
}

const props = withDefaults(defineProps<Props>(), { not: false, removeLabel: undefined })
const emit = defineEmits<{ remove: [] }>()

const sign = computed(() => (props.not ? '≠' : '='))
const removeName = computed(
  () => props.removeLabel ?? `Remove filter ${props.name} ${props.not ? 'is not' : 'is'} ${props.value}`
)
</script>

<template>
  <span
    class="filter-chip"
    :class="{ 'filter-chip--not': not }"
  >
    <span class="filter-chip__name">{{ name }}</span>
    <span
      class="filter-chip__op"
      aria-hidden="true"
    >{{ sign }}</span>
    <span class="sr-only">{{ not ? 'is not' : 'is' }}</span>
    <span class="filter-chip__value">{{ value }}</span>
    <button
      type="button"
      class="filter-chip__remove"
      :aria-label="removeName"
      @click="emit('remove')"
    >
      <span aria-hidden="true">✕</span>
    </button>
  </span>
</template>

<style lang="scss" scoped>
// Plain CSS with tokens: Tailwind dark variants would double every rule in
// the first-load stylesheet (bundle budget).
.filter-chip {
  --chip-line: #6b7280;
  --chip-bg: #fff;
  --chip-text: #4b5563;
  --chip-strong: #111827;
  --chip-hover: #e5e7eb;
  --chip-neg: #b91c1c;
  --chip-focus: #2563eb;

  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  max-width: 100%;
  padding: 0 3px 0 8px;
  border: 1px solid var(--chip-line);
  border-radius: 3px;
  background: var(--chip-bg);
  color: var(--chip-text);
  font: 12px 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-variant-ligatures: none;
  white-space: nowrap;

  .dark & {
    --chip-bg: #111827;
    --chip-text: #9ca3af;
    --chip-strong: #f3f4f6;
    --chip-hover: #1f2937;
    --chip-neg: #fca5a5;
    --chip-focus: #60a5fa;
  }
}

.filter-chip__value {
  min-width: 0;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--chip-strong);
  font-weight: 600;
}

.filter-chip--not .filter-chip__op {
  color: var(--chip-neg);
  font-weight: 700;
}

.filter-chip__remove {
  display: inline-grid;
  place-items: center;
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: 3px;
  font-size: 11px;
  color: var(--chip-text);

  &:hover {
    background: var(--chip-hover);
    color: var(--chip-strong);
  }

  &:focus-visible {
    outline: 2px solid var(--chip-focus);
    outline-offset: 0;
  }
}

/* Phone: finger room. */
@media (max-width: 639px) {
  .filter-chip {
    height: 36px;
  }

  .filter-chip__remove {
    width: 36px;
    height: 34px;
  }
}
</style>
