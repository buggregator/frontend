<script lang="ts" setup>
import { computed } from 'vue'
import { pixelBug } from '../../lib/project-avatar'

type Props = {
  projectKey: string
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 28
})

// 7 cells of 4 in a 28 box: whole 4 px cells at the usual 28 px, sharp at 2×.
const CELL = 4
const OFFSET = 0
const square = (x: number, y: number) =>
  `M${OFFSET + x * CELL} ${OFFSET + y * CELL}h${CELL}v${CELL}h-${CELL}z`

const bug = computed(() => pixelBug(props.projectKey))
const inkPath = computed(() => bug.value.cells.map(([x, y]) => square(x, y)).join(''))
const eyePath = computed(() => square(2, bug.value.eyeRow) + square(4, bug.value.eyeRow))

// Both themes' colours as variables: the theme switch needs no re-render.
const colors = computed(() => {
  const { light, dark } = bug.value.hue
  return {
    '--pa-tile-light': light.tile,
    '--pa-ink-light': light.ink,
    '--pa-eye-light': light.eye,
    '--pa-tile-dark': dark.tile,
    '--pa-ink-dark': dark.ink,
    '--pa-eye-dark': dark.eye
  }
})
</script>

<template>
  <svg
    class="project-avatar"
    :width="size"
    :height="size"
    viewBox="0 0 28 28"
    aria-hidden="true"
    focusable="false"
    shape-rendering="crispEdges"
    data-test="project-avatar"
    :style="colors"
  >
    <rect
      class="project-avatar__tile"
      width="28"
      height="28"
    />
    <path
      class="project-avatar__ink"
      :d="inkPath"
    />
    <path
      class="project-avatar__eye"
      :d="eyePath"
    />
  </svg>
</template>

<style lang="scss" scoped>
.project-avatar {
  --pa-tile: var(--pa-tile-light);
  --pa-ink: var(--pa-ink-light);
  --pa-eye: var(--pa-eye-light);

  @apply block flex-shrink-0 rounded overflow-hidden;
}

.dark .project-avatar {
  --pa-tile: var(--pa-tile-dark);
  --pa-ink: var(--pa-ink-dark);
  --pa-eye: var(--pa-eye-dark);
}

.project-avatar__tile {
  fill: var(--pa-tile);
}

.project-avatar__ink {
  fill: var(--pa-ink);
}

.project-avatar__eye {
  fill: var(--pa-eye);
}
</style>
