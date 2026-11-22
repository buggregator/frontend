<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useEventsStore } from '../../stores'
import { markSegments } from './mark-segments'

type Props = {
  text: string
  // What to mark; the event search when not given.
  query?: string
  // Words to mark each on its own, wherever they are (a search that matches
  // every word, not the phrase). Wins over `query`.
  terms?: string[]
}

const props = withDefaults(defineProps<Props>(), { query: undefined, terms: undefined })
const { searchQuery } = storeToRefs(useEventsStore())

const segments = computed(() =>
  markSegments(props.text, props.terms ?? [props.query ?? searchQuery.value])
)
</script>

<template>
  <template
    v-for="(seg, i) in segments"
    :key="i"
  >
    <mark
      v-if="seg.match"
      class="highlight-text__mark"
    >{{ seg.text }}</mark>
    <template v-else>
      {{ seg.text }}
    </template>
  </template>
</template>

<style lang="scss" scoped>
.highlight-text__mark {
  @apply bg-yellow-200 dark:bg-yellow-500/30;
  @apply text-inherit rounded-sm;
  padding: 0.05em 0.1em;
}
</style>
