<script lang="ts" setup>
import { useResizeObserver } from '@vueuse/core'
import { nextTick, onMounted, ref, watch } from 'vue'

// Stack tabs: plain underline tabs on one track (#5936's language), ARIA tabs
// with roving tabindex, ← → Home End; too many scroll sideways with a fade.
type Props = {
  stacks: { id: string; label: string }[]
  selected: string
  idPrefix: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ select: [id: string] }>()

const list = ref<HTMLElement | null>(null)
const moreLeft = ref(false)
const moreRight = ref(false)

const updateFades = () => {
  const el = list.value
  if (!el) return
  moreLeft.value = el.scrollLeft > 1
  moreRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}
useResizeObserver(list, updateFades)

const tabEl = (id: string) => list.value?.querySelector<HTMLElement>(`[data-stack="${id}"]`)

const centre = (id: string, smooth = false) => {
  const el = list.value
  const tab = tabEl(id)
  if (!el || !tab || el.scrollWidth <= el.clientWidth) return
  el.scrollTo({
    left: tab.offsetLeft - (el.clientWidth - tab.offsetWidth) / 2,
    behavior: smooth ? 'smooth' : 'auto'
  })
}

onMounted(() => nextTick(() => centre(props.selected)))
watch(
  () => props.selected,
  (id) => nextTick(() => centre(id, true))
)

const onKeydown = (e: KeyboardEvent) => {
  const ids = props.stacks.map((s) => s.id)
  const i = ids.indexOf(props.selected)
  let next = -1
  if (e.key === 'ArrowRight') next = (i + 1) % ids.length
  else if (e.key === 'ArrowLeft') next = (i - 1 + ids.length) % ids.length
  else if (e.key === 'Home') next = 0
  else if (e.key === 'End') next = ids.length - 1
  if (next < 0) return
  e.preventDefault()
  emit('select', ids[next])
  nextTick(() => tabEl(ids[next])?.focus())
}

defineExpose({ focusSelected: () => tabEl(props.selected)?.focus() })
</script>

<template>
  <div
    class="setup-tabs"
    :class="{ 'setup-tabs--more-left': moreLeft, 'setup-tabs--more-right': moreRight }"
  >
    <div
      ref="list"
      role="tablist"
      aria-label="Stack"
      class="setup-tabs__list"
      @scroll="updateFades"
      @keydown="onKeydown"
    >
      <button
        v-for="stack in stacks"
        :id="`${idPrefix}-tab-${stack.id}`"
        :key="stack.id"
        type="button"
        role="tab"
        class="setup-tabs__tab"
        :class="{ 'setup-tabs__tab--on': stack.id === selected }"
        :data-stack="stack.id"
        :aria-selected="stack.id === selected"
        :aria-controls="`${idPrefix}-panel`"
        :tabindex="stack.id === selected ? 0 : -1"
        @click="emit('select', stack.id)"
      >
        {{ stack.label }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.setup-tabs {
  @apply relative;

  &::before,
  &::after {
    content: '';
    @apply absolute top-0 bottom-px w-8 pointer-events-none opacity-0 transition-opacity;
  }

  &::before {
    @apply left-0;
    background: linear-gradient(to right, var(--setup-surface), transparent);
  }

  &::after {
    @apply right-0;
    background: linear-gradient(to left, var(--setup-surface), transparent);
  }
}

.setup-tabs--more-left::before,
.setup-tabs--more-right::after {
  @apply opacity-100;
}

.setup-tabs__list {
  @apply flex gap-5 overflow-x-auto border-b border-gray-200 dark:border-gray-700;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 639px) {
    @apply gap-1;
  }
}

.setup-tabs__tab {
  @apply flex-none -mb-px border-b-2 border-transparent py-2 text-sm font-normal whitespace-nowrap;
  @apply text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200;
  @apply transition-colors;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400;

  @media (max-width: 639px) {
    @apply min-h-[45px] min-w-[44px] px-2 py-3;
  }
}

.setup-tabs__tab--on {
  @apply font-medium border-current text-gray-800 dark:text-gray-100;
  @apply hover:text-gray-800 dark:hover:text-gray-100;
}
</style>
