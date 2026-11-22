<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { FilterChip } from '@/shared/ui'
import type { BarChip } from './types'

// The filters that do not fit the header row (design #6737 A): «+N» opens
// the rest under it; on a phone «Filters N» opens all of them as a sheet from
// the bottom, with «Add filter», «Copy link» and «Clear all».
const props = defineProps<{
  chips: BarChip[]
  title: string
  // The button that opened it: a click on it is not a click outside.
  anchor?: HTMLElement | null
  canAdd?: boolean
  canCopy?: boolean
}>()

const emit = defineEmits<{
  remove: [chip: BarChip]
  add: []
  copy: []
  clear: []
  close: []
}>()

const root = ref<HTMLElement | null>(null)

const onOutside = (e: PointerEvent) => {
  const target = e.target as Node
  if (root.value?.contains(target) || props.anchor?.contains(target)) return
  emit('close')
}

// Focus stays in the sheet: on the next chip's ✕, else on the first button.
const remove = async (chip: BarChip, index: number) => {
  emit('remove', chip)
  await nextTick()
  const buttons = root.value?.querySelectorAll<HTMLButtonElement>('button')
  buttons?.[Math.min(index, buttons.length - 1)]?.focus()
}

onMounted(async () => {
  document.addEventListener('pointerdown', onOutside)
  await nextTick()
  root.value?.querySelector<HTMLButtonElement>('button')?.focus()
})

onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside))
</script>

<template>
  <!-- Phone only: the scrim under the sheet; a tap on it is a click outside. -->
  <div
    class="ffc__scrim"
    aria-hidden="true"
  />
  <div
    ref="root"
    class="ffc"
    role="dialog"
    :aria-label="title"
    data-test="feed-filter-chips"
    @keydown.esc.stop.prevent="emit('close')"
  >
    <div class="ffc__head">
      {{ title }}
    </div>
    <ul
      v-if="chips.length"
      class="ffc__list"
      aria-label="Active filters"
    >
      <li
        v-for="(chip, i) in chips"
        :key="chip.id"
      >
        <FilterChip
          :name="chip.name"
          :value="chip.value"
          :not="chip.not"
          @remove="remove(chip, i)"
        />
      </li>
    </ul>
    <p
      v-else
      class="ffc__none"
    >
      No filters: every event shows.
    </p>
    <div class="ffc__foot">
      <slot name="add" />
      <button
        v-if="canAdd"
        type="button"
        class="ffc__btn ffc__btn--add"
        @click="emit('add')"
      >
        <span aria-hidden="true">+</span> Add filter
      </button>
      <button
        v-if="canCopy && chips.length"
        type="button"
        class="ffc__btn"
        @click="emit('copy')"
      >
        Copy link
      </button>
      <button
        v-if="chips.length"
        type="button"
        class="ffc__btn"
        @click="emit('clear')"
      >
        Clear all
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ffc {
  --ffc-bg: theme('colors.white');
  --ffc-border: theme('colors.gray.300');
  --ffc-hover: theme('colors.gray.100');
  --ffc-text: theme('colors.gray.800');
  --ffc-faint: theme('colors.gray.600');

  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 240px;
  max-width: 360px;
  padding: 8px;
  border: 1px solid var(--ffc-border);
  border-radius: 6px;
  background: var(--ffc-bg);
  color: var(--ffc-text);
  box-shadow: 0 12px 32px rgb(0 0 0 / 0.18);
  font-size: 13px;

  .dark & {
    --ffc-bg: theme('colors.gray.800');
    --ffc-border: theme('colors.gray.600');
    --ffc-hover: theme('colors.gray.700');
    --ffc-text: theme('colors.gray.100');
    --ffc-faint: theme('colors.gray.400');
  }
}

.ffc__head {
  padding: 2px 2px 0;
  color: var(--ffc-faint);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.ffc__list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ffc__none {
  margin: 0;
  color: var(--ffc-faint);
}

.ffc__foot {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding-top: 6px;
  border-top: 1px solid var(--ffc-border);

  &:empty {
    display: none;
  }
}

.ffc__btn {
  height: 28px;
  padding: 0 8px;
  border-radius: 3px;
  color: var(--ffc-faint);
  white-space: nowrap;

  &:hover {
    background: var(--ffc-hover);
  }
}

.ffc__btn--add {
  color: var(--ffc-text);
  font-weight: 500;
}

/* Phone: a sheet from the bottom of the screen, like «Add filter». */
.ffc__scrim {
  display: none;
}

@media (max-width: 639px) {
  .ffc__scrim {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 60;
    background: rgb(3 7 18 / 50%);
  }

  .ffc {
    position: fixed;
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 61;
    max-width: none;
    max-height: 75vh;
    padding: 12px 16px 16px;
    overflow-y: auto;
    border-radius: 12px 12px 0 0;
  }

  .ffc__btn {
    height: 44px;
    padding: 0 12px;
  }
}
</style>
