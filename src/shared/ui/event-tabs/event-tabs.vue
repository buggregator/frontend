<script lang="ts" setup>
import { computed, ref, useId, watch } from 'vue'
import { HeaderToolbarPortal } from '../app-header'
import { Tabs, tabIdOf, type TabItem } from '../tabs'

// The tabs of an event page (design #6737 A): in row 2 of the page header,
// the shared Tabs (tablist, ← → Home End select at once); the panel stays
// here. Without a header row 2 (a story, a test) the tabs stay above the panel.
// - `urlFragment`: the tab is in the address (#raw), so a link opens it;
//   the hash changes in place, adding no history entry.
type Props = {
  tabs: TabItem[]
  label?: string
  urlFragment?: boolean
}

const props = withDefaults(defineProps<Props>(), { label: 'Event sections', urlFragment: false })
const emit = defineEmits<{ change: [id: string] }>()

const panelId = `event-tabs-${useId()}`

const fromHash = () => {
  if (!props.urlFragment) return ''
  const id = decodeURIComponent(window.location.hash.slice(1))
  return props.tabs.some((t) => t.id === id) ? id : ''
}

const picked = ref(fromHash())
// A tab that went away (or none picked yet): the first one.
const active = computed(() =>
  props.tabs.some((t) => t.id === picked.value && !t.disabled)
    ? picked.value
    : (props.tabs[0]?.id ?? '')
)

const select = (id: string) => {
  picked.value = id
  if (props.urlFragment) {
    const url = new URL(window.location.href)
    url.hash = id
    window.history.replaceState(window.history.state, '', url)
  }
}

watch(active, (id) => emit('change', id), { immediate: true })
</script>

<template>
  <!-- One root: the page's class (margins, flex sizing) and its scoped styles
       land here. With the portal beside the panel the root was a fragment, and
       a scoped page class never matched (frontend#391). -->
  <div class="event-tabs">
    <HeaderToolbarPortal>
      <Tabs
        class="event-tabs__bar"
        :tabs="tabs"
        :current="active"
        :label="label"
        :panel-id="panelId"
        test-prefix="event-tab-"
        @select="select"
      />
    </HeaderToolbarPortal>

    <div
      :id="panelId"
      role="tabpanel"
      :aria-labelledby="tabIdOf(panelId, active)"
      class="event-tabs__panel"
      data-test="event-tabs-panel"
    >
      <slot :tab="active" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.event-tabs {
  @apply flex flex-col;
}

/* Fills the root, so a page that bounds the root's height (the profiler)
   bounds the panel too. */
.event-tabs__panel {
  @apply flex-1 min-h-0;
}

.event-tabs__bar {
  @apply min-w-0;
}

.event-tabs__panel:focus-visible {
  @apply outline-none;
}
</style>
