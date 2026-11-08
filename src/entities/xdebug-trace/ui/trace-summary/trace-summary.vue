<script lang="ts" setup>
import { useIdeLink } from '@/shared/lib/helpers/use-ide-link'
import { formatMemoryDelta, formatSeconds } from '../../lib/trace-format'
import { shortPath } from '../../lib/trace-path'
import type { XdebugTraceSummary } from '../../types'

type Props = {
  summary: XdebugTraceSummary
}

defineProps<Props>()

const { buildLink } = useIdeLink()
</script>

<template>
  <div class="trace-summary">
    <section class="trace-summary__section">
      <h3 class="trace-summary__title">
        Top self-time
      </h3>
      <p class="trace-summary__hint">
        Functions by time spent in their own code, callees left out.
      </p>
      <div class="trace-summary__scroll">
        <table class="trace-summary__table">
          <thead>
            <tr>
              <th scope="col">
                Function
              </th>
              <th
                scope="col"
                class="trace-summary__num"
              >
                Calls
              </th>
              <th
                scope="col"
                class="trace-summary__num"
              >
                Self
              </th>
              <th
                scope="col"
                class="trace-summary__num"
              >
                Incl.
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="stat in summary.top"
              :key="stat.func"
            >
              <td
                class="trace-summary__func"
                :class="{ 'trace-summary__func--internal': !stat.user }"
              >
                {{ stat.func }}
              </td>
              <td class="trace-summary__num">
                {{ stat.count.toLocaleString('en-US') }}
              </td>
              <td class="trace-summary__num trace-summary__num--main">
                {{ formatSeconds(stat.self) }}
              </td>
              <td class="trace-summary__num">
                {{ formatSeconds(stat.incl) }}
              </td>
            </tr>
            <tr v-if="!summary.top.length">
              <td
                colspan="4"
                class="trace-summary__empty"
              >
                No calls recorded.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="trace-summary__section">
      <h3 class="trace-summary__title">
        Slowest calls
      </h3>
      <p class="trace-summary__hint">
        Single calls by inclusive time.
      </p>
      <div class="trace-summary__scroll">
        <table class="trace-summary__table">
          <thead>
            <tr>
              <th scope="col">
                Function
              </th>
              <th scope="col">
                File
              </th>
              <th
                scope="col"
                class="trace-summary__num"
              >
                Incl.
              </th>
              <th
                scope="col"
                class="trace-summary__num"
              >
                Self
              </th>
              <th
                scope="col"
                class="trace-summary__num"
              >
                Memory
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="call in summary.slowest"
              :key="call.offset"
            >
              <td class="trace-summary__func">
                {{ call.func }}
              </td>
              <td class="trace-summary__file">
                <a
                  v-if="buildLink(call.file, call.line)"
                  :href="buildLink(call.file, call.line) as string"
                  :title="`${call.file}:${call.line}`"
                >{{ shortPath(call.file) }}:{{ call.line }}</a>
                <span
                  v-else
                  :title="`${call.file}:${call.line}`"
                >{{ shortPath(call.file) }}:{{ call.line }}</span>
              </td>
              <td class="trace-summary__num trace-summary__num--main">
                {{ formatSeconds(call.incl) }}
              </td>
              <td class="trace-summary__num">
                {{ formatSeconds(call.self) }}
              </td>
              <td class="trace-summary__num">
                {{ formatMemoryDelta(call.memory) }}
              </td>
            </tr>
            <tr v-if="!summary.slowest.length">
              <td
                colspan="5"
                class="trace-summary__empty"
              >
                No calls recorded.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.trace-summary {
  @apply grid gap-6 xl:grid-cols-2;
}

.trace-summary__section {
  @apply min-w-0;
}

.trace-summary__title {
  @apply text-sm font-semibold text-gray-900 dark:text-gray-100;
}

.trace-summary__hint {
  @apply mb-2 text-xs text-gray-500 dark:text-gray-400;
}

.trace-summary__scroll {
  @apply overflow-x-auto;
}

.trace-summary__table {
  @apply w-full text-xs;

  th {
    @apply py-1 pr-3 text-left font-medium text-2xs uppercase tracking-wide text-gray-500 dark:text-gray-400;
    @apply border-b border-gray-200 dark:border-gray-700;
  }

  td {
    @apply py-1 pr-3 border-b border-gray-100 dark:border-gray-800 align-top;
  }
}

.trace-summary__func {
  @apply font-mono font-medium text-gray-900 dark:text-gray-100;
  // Long class names wrap only when they must, not at every column edge.
  min-width: 14rem;
  overflow-wrap: anywhere;
}

.trace-summary__func--internal {
  @apply font-normal text-gray-600 dark:text-gray-400;
}

.trace-summary__file {
  @apply font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap;

  a {
    @apply text-blue-700 dark:text-blue-400 hover:underline;
  }
}

.trace-summary__table .trace-summary__num {
  @apply text-right font-mono tabular-nums whitespace-nowrap text-gray-600 dark:text-gray-300;
}

.trace-summary__table .trace-summary__num--main {
  @apply font-medium text-gray-900 dark:text-gray-100;
}

.trace-summary__empty {
  @apply text-gray-500 dark:text-gray-400;
}
</style>
