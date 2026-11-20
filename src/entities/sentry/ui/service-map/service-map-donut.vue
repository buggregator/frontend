<script lang="ts" setup>
import { computed } from 'vue'

// A ring of calls per service, total in the middle (the drawer's Uses / Used).

type Slice = { service: string; count: number }
type Props = { slices: Slice[]; colors: Map<string, string>; label: string }

const props = defineProps<Props>()

const R = 44
const C = 2 * Math.PI * R
const total = computed(() => props.slices.reduce((n, s) => n + s.count, 0))
const arcs = computed(() => {
  let offset = 0
  return props.slices.map((s) => {
    const len = total.value ? (s.count / total.value) * C : 0
    const arc = { service: s.service, dash: `${Math.max(0, len - 1.5)} ${C}`, offset: -offset }
    offset += len
    return arc
  })
})
</script>

<template>
  <svg
    class="svc-donut"
    viewBox="0 0 112 112"
    width="112"
    height="112"
    role="img"
    :aria-label="`${label}: ${total} calls`"
  >
    <circle
      cx="56"
      cy="56"
      :r="R"
      class="svc-donut__track"
    />
    <circle
      v-for="a in arcs"
      :key="a.service"
      cx="56"
      cy="56"
      :r="R"
      fill="none"
      stroke-width="16"
      :stroke="colors.get(a.service) ?? '#9ca3af'"
      :stroke-dasharray="a.dash"
      :stroke-dashoffset="a.offset"
      transform="rotate(-90 56 56)"
    />
    <text
      x="56"
      y="56"
      class="svc-donut__total"
    >{{ total }}</text>
    <text
      x="56"
      y="72"
      class="svc-donut__unit"
    >calls</text>
  </svg>
</template>

<style lang="scss" scoped>
.svc-donut {
  @apply flex-none;
}

.svc-donut__track {
  fill: none;
  stroke-width: 16;
  stroke: var(--tg-canvas-dot);
}

.svc-donut__total {
  text-anchor: middle;
  font: 600 15px 'JetBrains Mono', ui-monospace, monospace;
  fill: var(--tg-strong);
}

.svc-donut__unit {
  text-anchor: middle;
  font-size: 10px;
  fill: var(--tg-muted);
}
</style>
