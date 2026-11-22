<script lang="ts" setup>
import { useResizeObserver } from '@vueuse/core'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRovingTabs, type RovingActivation } from '../../lib/use-roving-tabs'
import { IconSvg } from '../icon-svg'
import { tabIdOf, type TabItem } from './types'

// The kit's tabs (#6628), drawn as a track (design #6737 A).
// - default: role="tablist", ← → Home End; an arrow selects the tab it moves
//   to (activation "automatic"), "manual" waits for Enter or Space;
// - as="link": a <nav> of router links, the current one aria-current="page".
// Too many tabs scroll sideways: an edge fades where more hide, and the
// selected tab is brought to the middle.
type Props = {
  tabs: TabItem[]
  // The selected tab: v-model, or `current` with @select.
  modelValue?: string
  current?: string
  // The name of the tab list for a screen reader.
  label: string
  // The element showing the selected tab (role="tabpanel"); its
  // aria-labelledby is `tabIdOf(panelId, selected)`.
  panelId?: string
  as?: 'tabs' | 'link'
  activation?: RovingActivation
  size?: 'md'
  variant?: 'track'
  // data-test of a tab: `${testPrefix}${id}`.
  testPrefix?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  current: undefined,
  panelId: undefined,
  as: 'tabs',
  activation: 'automatic',
  size: 'md',
  variant: 'track',
  testPrefix: 'tab-'
})
const emit = defineEmits<{ 'update:modelValue': [id: string]; select: [id: string] }>()

const selected = computed(() => props.modelValue ?? props.current)

const select = (tab: TabItem) => {
  if (tab.disabled || tab.id === selected.value) return
  emit('update:modelValue', tab.id)
  emit('select', tab.id)
}

const list = ref<HTMLElement | null>(null)

const { tabindexOf, onKeydown, focusCurrent } = useRovingTabs(list, {
  items: () => props.tabs,
  current: selected,
  activation: () => props.activation,
  onSelect: (id) => {
    const tab = props.tabs.find((t) => t.id === id)
    if (tab) select(tab)
  }
})

// Sideways scroll: an edge fades where more tabs hide.
const fadeStart = ref(false)
const fadeEnd = ref(false)
const updateFades = () => {
  const el = list.value
  if (!el) return
  fadeStart.value = el.scrollLeft > 1
  fadeEnd.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}
useResizeObserver(list, updateFades)

const centre = (smooth: boolean) => {
  const el = list.value
  const tab = el?.querySelector<HTMLElement>('[aria-selected="true"], [aria-current="page"]')
  if (!el || !tab || el.scrollWidth <= el.clientWidth) return
  el.scrollTo({
    left: tab.offsetLeft - (el.clientWidth - tab.offsetWidth) / 2,
    behavior: smooth ? 'smooth' : 'auto'
  })
}

onMounted(() => nextTick(() => centre(false)))
watch([selected, () => props.tabs.length], () => nextTick(() => centre(true)))

defineExpose({ focusSelected: focusCurrent })
</script>

<template>
  <div
    class="ui-tabs"
    data-test="tabs"
  >
    <nav
      v-if="as === 'link'"
      ref="list"
      class="ui-tabs__track"
      :class="{ 'ui-tabs__track--fade-start': fadeStart, 'ui-tabs__track--fade-end': fadeEnd }"
      :aria-label="label"
      @scroll.passive="updateFades"
    >
      <RouterLink
        v-for="tab in tabs"
        :key="tab.id"
        :to="tab.to ?? ''"
        class="ui-tabs__tab"
        :class="{ 'ui-tabs__tab--on': tab.id === selected }"
        :aria-current="tab.id === selected ? 'page' : undefined"
        :data-test="`${testPrefix}${tab.id}`"
      >
        <slot
          name="icon"
          :tab="tab"
        >
          <IconSvg
            v-if="tab.icon"
            :name="tab.icon"
            class="ui-tabs__icon"
          />
        </slot>
        {{ tab.label }}
        <span
          v-if="tab.count != null"
          class="ui-tabs__count"
        >{{ tab.count }}</span>
      </RouterLink>
    </nav>

    <div
      v-else
      ref="list"
      class="ui-tabs__track"
      :class="{ 'ui-tabs__track--fade-start': fadeStart, 'ui-tabs__track--fade-end': fadeEnd }"
      role="tablist"
      :aria-label="label"
      @scroll.passive="updateFades"
      @keydown="onKeydown"
    >
      <button
        v-for="tab in tabs"
        :id="panelId ? tabIdOf(panelId, tab.id) : undefined"
        :key="tab.id"
        type="button"
        role="tab"
        class="ui-tabs__tab"
        :class="{ 'ui-tabs__tab--on': tab.id === selected }"
        :aria-selected="tab.id === selected"
        :aria-controls="panelId"
        :aria-disabled="tab.disabled || undefined"
        :tabindex="tabindexOf(tab.id)"
        :data-test="`${testPrefix}${tab.id}`"
        @click="select(tab)"
      >
        <slot
          name="icon"
          :tab="tab"
        >
          <IconSvg
            v-if="tab.icon"
            :name="tab.icon"
            class="ui-tabs__icon"
          />
        </slot>
        {{ tab.label }}
        <span
          v-if="tab.count != null"
          class="ui-tabs__count"
        >{{ tab.count }}</span>
      </button>
    </div>

    <div
      v-if="$slots.info"
      class="ui-tabs__info"
    >
      <slot name="info" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use 'src/assets/seg-tokens' as seg;

.ui-tabs {
  @include seg.tokens;

  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.ui-tabs__track {
  @include seg.track;

  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.ui-tabs__track--fade-end {
  mask-image: linear-gradient(to right, #000 calc(100% - 24px), transparent);
}

.ui-tabs__track--fade-start {
  mask-image: linear-gradient(to right, transparent, #000 24px);
}

.ui-tabs__track--fade-start.ui-tabs__track--fade-end {
  mask-image: linear-gradient(to right, transparent, #000 24px, #000 calc(100% - 24px), transparent);
}

.ui-tabs__tab {
  @include seg.item;

  // The track scrolls, so it clips: the ring stays inside its padding.
  &:focus-visible {
    outline-offset: 0;
  }
}

.ui-tabs__tab--on {
  @include seg.item-on;
}

.ui-tabs__icon,
.ui-tabs__tab :slotted(svg) {
  @include seg.icon;
}

.ui-tabs__count {
  @include seg.count;

  .ui-tabs__tab--on & {
    color: var(--seg-on-text);
  }
}

.ui-tabs__info {
  display: none;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
  flex: none;
  font-size: 12px;
  white-space: nowrap;
  color: var(--seg-text);

  @media (min-width: 640px) {
    display: flex;
  }
}
</style>
