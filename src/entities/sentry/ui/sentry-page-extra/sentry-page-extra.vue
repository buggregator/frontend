<script lang="ts" setup>
import { ref } from 'vue'
import { IconSvg, TableBase, TableBaseRow } from '@/shared/ui'
import type { Sentry } from '../../types'

type Props = {
  extra: Sentry['extra']
}

const props = defineProps<Props>()

const ddStates = ref(
  Object.keys(props.extra || {}).reduce(
    (acc, key) => {
      acc[key] = false
      return acc
    },
    {} as Record<string, boolean>
  )
)
</script>

<template>
  <section>
    <h3 class="section-title">
      Extra
    </h3>

    <div class="extra-groups">
      <div
        v-for="(value, key) in extra"
        :key="key"
        class="extra-group"
      >
        <button
          class="extra-group__header"
          @click="ddStates[key] = !ddStates[key]"
        >
          <span class="extra-group__name">{{ key }}</span>
          <IconSvg
            class="extra-group__chevron"
            :class="{ 'extra-group__chevron--open': ddStates[key] }"
            name="collapsed"
          />
        </button>

        <div
          v-if="ddStates[key] && value"
          class="extra-group__content"
        >
          <TableBase>
            <TableBaseRow
              v-for="(v, t) in value"
              :key="t"
              :title="String(t || '')"
            >
              {{ JSON.stringify(v) }}
            </TableBaseRow>
          </TableBase>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.section-title {
  @apply text-xs font-mono font-semibold uppercase tracking-wider;
  @apply text-gray-500 dark:text-gray-400 mb-3;
}

.extra-groups {
  @apply rounded overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
  @apply divide-y divide-gray-200 dark:divide-gray-700;
}

.extra-group__header {
  @apply w-full flex items-center justify-between;
  @apply px-3 py-2.5 text-xs font-medium;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors;
  @apply cursor-pointer;
}

.extra-group__name {
  @apply font-semibold;
}

.extra-group__chevron {
  @apply w-3.5 h-3.5 text-gray-400 dark:text-gray-500;
  transition: transform 0.15s ease;
}

.extra-group__chevron--open {
  transform: rotate(180deg);
}

.extra-group__content {
  @apply p-3;
}
</style>
