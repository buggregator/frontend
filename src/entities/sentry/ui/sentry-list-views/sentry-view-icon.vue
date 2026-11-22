<script lang="ts" setup>
import { computed } from 'vue'
import { VIEW_ICONS, type ViewIcon } from '../../lib/view-icons'

// A stroke icon (16 px grid, drawn at 14) of a Sentry view, for the kit's Tabs #icon slot.
// name: a key of VIEW_ICONS (TabItem.icon is a plain string).
const props = defineProps<{ name: string }>()
const paths = computed(() => VIEW_ICONS[props.name as ViewIcon] ?? '')
</script>

<template>
  <!-- eslint-disable vue/no-v-html -- fixed icon paths from lib/view-icons, no user text -->
  <svg
    viewBox="0 0 16 16"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    aria-hidden="true"
    v-html="paths"
  />
  <!-- eslint-enable vue/no-v-html -->
</template>
