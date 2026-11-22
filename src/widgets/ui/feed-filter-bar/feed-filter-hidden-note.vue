<script lang="ts" setup>
import { computed } from 'vue'
import { useEventsStore } from '@/shared/stores'
import type { PageEventTypes } from '@/shared/types'

// «3 new events arrived and are hidden by this filter» over the feed.
// The page's event type: the count is about what this page would show.
const props = defineProps<{ type?: PageEventTypes }>()

const store = useEventsStore()
const hiddenNew = computed(() => (store.filters.length ? store.hiddenCount(props.type) : 0))
</script>

<template>
  <p
    v-if="hiddenNew > 0"
    class="ffb-hidden"
    role="status"
  >
    <span><b>{{ hiddenNew }} new {{ hiddenNew === 1 ? 'event' : 'events' }}</b> arrived and {{ hiddenNew === 1 ? 'is' : 'are' }} hidden by this filter.</span>
    <button
      type="button"
      class="ffb-hidden__link"
      @click="store.setFilters([])"
    >
      Clear filters
    </button>
  </p>
</template>

<style lang="scss" scoped>
.ffb-hidden {
  --ffb-text: theme('colors.gray.800');
  --ffb-faint: theme('colors.gray.600');
  --ffb-link: theme('colors.blue.600');

  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
  margin: 0;
  padding: 6px 12px;
  color: var(--ffb-faint);
  font-size: 13px;

  .dark & {
    --ffb-text: theme('colors.gray.100');
    --ffb-faint: theme('colors.gray.400');
    --ffb-link: theme('colors.blue.300');
  }
}

.ffb-hidden b {
  color: var(--ffb-text);
}

.ffb-hidden__link {
  color: var(--ffb-link);
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
