<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useEventsStore } from '../../stores'

type Props = {
  text: string
}

const props = defineProps<Props>()
const { searchQuery } = storeToRefs(useEventsStore())

const segments = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query || !props.text) {
    return [{ text: props.text, match: false }]
  }

  const result: { text: string; match: boolean }[] = []
  const lower = props.text.toLowerCase()
  let lastIndex = 0

  let pos = lower.indexOf(query, lastIndex)
  while (pos !== -1) {
    if (pos > lastIndex) {
      result.push({ text: props.text.slice(lastIndex, pos), match: false })
    }
    result.push({ text: props.text.slice(pos, pos + query.length), match: true })
    lastIndex = pos + query.length
    pos = lower.indexOf(query, lastIndex)
  }

  if (lastIndex < props.text.length) {
    result.push({ text: props.text.slice(lastIndex), match: false })
  }

  return result
})
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
