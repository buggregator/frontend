<script lang="ts" setup>
import { ref } from 'vue'
import type { SmtpFinding, FindingSeverity } from '../../lib/use-smtp-analytics'

type InsightGroup = {
  title: string
  findings: SmtpFinding[]
}

type Props = {
  groups: InsightGroup[]
}

defineProps<Props>()

const openSections = ref<Record<string, boolean>>({})

const toggle = (title: string) => {
  openSections.value[title] = !openSections.value[title]
}

const worstSeverity = (findings: SmtpFinding[]): FindingSeverity => {
  if (findings.some((f) => f.severity === 'error')) return 'error'
  if (findings.some((f) => f.severity === 'warning')) return 'warning'
  if (findings.some((f) => f.severity === 'info')) return 'info'
  return 'pass'
}

const issueCount = (findings: SmtpFinding[]): number =>
  findings.filter((f) => f.severity !== 'pass').length
</script>

<template>
  <div class="insights">
    <div
      v-for="group in groups"
      :key="group.title"
      class="insights__group"
    >
      <button
        class="insights__group-header"
        @click="toggle(group.title)"
      >
        <span
          class="insights__severity-dot"
          :class="`insights__severity-dot--${worstSeverity(group.findings)}`"
        />
        <span class="insights__group-title">{{ group.title }}</span>
        <span
          v-if="issueCount(group.findings) > 0"
          class="insights__group-count"
          :class="`insights__group-count--${worstSeverity(group.findings)}`"
        >{{ issueCount(group.findings) }}</span>
        <svg
          class="insights__chevron"
          :class="{ 'insights__chevron--open': openSections[group.title] }"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div
        v-if="openSections[group.title]"
        class="insights__findings"
      >
        <div
          v-for="(finding, idx) in group.findings"
          :key="idx"
          class="insights__finding"
        >
          <span
            class="insights__finding-icon"
            :class="`insights__finding-icon--${finding.severity}`"
          >
            <template v-if="finding.severity === 'pass'">&#10003;</template>
            <template v-else-if="finding.severity === 'error'">&#10007;</template>
            <template v-else-if="finding.severity === 'warning'">!</template>
            <template v-else>i</template>
          </span>
          <div class="insights__finding-body">
            <span class="insights__finding-title">{{ finding.title }}</span>
            <span
              v-if="finding.detail"
              class="insights__finding-detail"
            >{{ finding.detail }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.insights__group {
  @apply border-b border-gray-100 dark:border-gray-700/50;

  &:last-child {
    @apply border-b-0;
  }
}

.insights__group-header {
  @apply w-full flex items-center gap-2 px-4 py-2.5;
  @apply text-xs font-medium;
  @apply hover:bg-gray-50 dark:hover:bg-gray-800/50;
  @apply cursor-pointer transition-colors;
}

.insights__severity-dot {
  @apply w-2 h-2 rounded-full flex-shrink-0;
}

.insights__severity-dot--pass {
  @apply bg-green-500;
}

.insights__severity-dot--info {
  @apply bg-blue-500;
}

.insights__severity-dot--warning {
  @apply bg-amber-500;
}

.insights__severity-dot--error {
  @apply bg-red-500;
}

.insights__group-title {
  @apply flex-1 text-left;
}

.insights__group-count {
  @apply inline-flex items-center justify-center;
  @apply text-[10px] font-semibold leading-none;
  @apply min-w-[18px] h-[18px] px-1 rounded-full;
}

.insights__group-count--warning {
  @apply bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400;
}

.insights__group-count--error {
  @apply bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400;
}

.insights__group-count--info {
  @apply bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400;
}

.insights__group-count--pass {
  @apply bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-400;
}

.insights__chevron {
  @apply w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0;
  transition: transform 0.15s ease;
}

.insights__chevron--open {
  transform: rotate(180deg);
}

.insights__findings {
  @apply divide-y divide-gray-100 dark:divide-gray-700/30;
}

.insights__finding {
  @apply flex gap-2.5 items-start;
  @apply px-4 py-2;
}

.insights__finding-icon {
  @apply w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0;
  @apply text-[9px] font-bold leading-none;
  margin-top: 2px;
}

.insights__finding-icon--pass {
  @apply bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-400;
}

.insights__finding-icon--info {
  @apply bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400;
}

.insights__finding-icon--warning {
  @apply bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400;
}

.insights__finding-icon--error {
  @apply bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400;
}

.insights__finding-body {
  @apply flex flex-col gap-0.5;
}

.insights__finding-title {
  @apply text-xs;
}

.insights__finding-detail {
  @apply text-2xs text-gray-500 dark:text-gray-400;
}
</style>
