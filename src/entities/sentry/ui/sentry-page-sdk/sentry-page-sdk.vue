<script lang="ts" setup>
import type { Sentry } from '../../types'

type Props = {
  sdk: NonNullable<Sentry['sdk']>
}

defineProps<Props>()
</script>

<template>
  <section class="sdk-section">
    <!-- SDK info box -->
    <div class="sdk-section__info">
      <span class="sdk-section__name">{{ sdk.name }}</span>
      <span class="sdk-section__version">{{ sdk.version }}</span>
    </div>

    <!-- Integrations -->
    <div
      v-if="sdk.integrations && sdk.integrations.length"
      class="sdk-section__group"
    >
      <h4 class="sdk-section__subtitle">
        Integrations
        <span class="sdk-section__count">{{ sdk.integrations.length }}</span>
      </h4>
      <div class="sdk-section__pills">
        <span
          v-for="integration in sdk.integrations"
          :key="integration"
          class="sdk-section__pill"
        >{{ integration }}</span>
      </div>
    </div>

    <!-- Packages -->
    <div
      v-if="sdk.packages && sdk.packages.length"
      class="sdk-section__group"
    >
      <h4 class="sdk-section__subtitle">
        Packages
      </h4>
      <div class="sdk-section__pills">
        <span
          v-for="pkg in sdk.packages"
          :key="pkg.name"
          class="sdk-section__pill-kv"
        >
          <span class="sdk-section__pill-key">{{ pkg.name }}</span>
          <span class="sdk-section__pill-value">{{ pkg.version }}</span>
        </span>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.sdk-section__info {
  @apply flex items-baseline gap-2 p-3 rounded mb-4;
  @apply border border-gray-200 dark:border-gray-700;
  @apply bg-gray-50 dark:bg-gray-900;
}

.sdk-section__name {
  @apply font-semibold text-sm;
}

.sdk-section__version {
  @apply font-mono text-xs text-gray-500 dark:text-gray-400;
}

.sdk-section__group {
  @apply rounded overflow-hidden p-3;
  @apply border border-gray-200 dark:border-gray-700;

  & + & {
    @apply mt-3;
  }
}

.sdk-section__subtitle {
  @apply text-xs font-mono font-semibold uppercase tracking-wider;
  @apply text-gray-500 dark:text-gray-400;
  @apply flex items-center gap-2;
}

.sdk-section__count {
  @apply text-2xs px-1.5 py-0.5 rounded-full;
  @apply bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400;
}

.sdk-section__pills {
  @apply flex flex-wrap gap-1.5 mt-2;
}

.sdk-section__pill {
  @apply inline-flex items-center text-xs px-2 py-1 rounded;
  @apply border border-gray-200 dark:border-gray-700;
  @apply bg-white dark:bg-gray-900 font-mono;
}

.sdk-section__pill-kv {
  @apply inline-flex items-center text-xs rounded overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
}

.sdk-section__pill-key {
  @apply px-2 py-1 text-gray-500 dark:text-gray-400;
  @apply bg-gray-50 dark:bg-gray-800;
}

.sdk-section__pill-value {
  @apply px-2 py-1 font-mono font-medium;
  @apply bg-white dark:bg-gray-900;
}
</style>
