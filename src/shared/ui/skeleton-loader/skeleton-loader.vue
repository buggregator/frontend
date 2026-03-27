<script lang="ts" setup>
type Props = {
  variant?: 'event-detail' | 'card' | 'text'
}

withDefaults(defineProps<Props>(), {
  variant: 'event-detail'
})
</script>

<template>
  <!-- Event detail page skeleton -->
  <div
    v-if="variant === 'event-detail'"
    class="skeleton skeleton--event-detail"
  >
    <!-- Header area -->
    <div class="skeleton__header">
      <div class="skeleton__badges">
        <span class="skeleton__bone skeleton__bone--badge" />
        <span class="skeleton__bone skeleton__bone--badge" />
        <span class="skeleton__bone skeleton__bone--badge-sm" />
      </div>
      <div class="skeleton__bone skeleton__bone--title" />
      <div class="skeleton__bone skeleton__bone--message" />
      <div class="skeleton__bone skeleton__bone--date" />
    </div>

    <!-- Tabs bar -->
    <div class="skeleton__tabs">
      <span class="skeleton__bone skeleton__bone--tab" />
      <span class="skeleton__bone skeleton__bone--tab" />
      <span class="skeleton__bone skeleton__bone--tab-sm" />
    </div>

    <!-- Content area -->
    <div class="skeleton__body">
      <!-- Section 1: card-like block -->
      <div class="skeleton__card">
        <div class="skeleton__bone skeleton__bone--card-title" />
        <div class="skeleton__bone skeleton__bone--card-text" />
        <div class="skeleton__card-rows">
          <div class="skeleton__bone skeleton__bone--row" />
          <div class="skeleton__bone skeleton__bone--row" />
          <div class="skeleton__bone skeleton__bone--row-short" />
        </div>
      </div>

      <!-- Section 2 -->
      <div class="skeleton__card">
        <div class="skeleton__bone skeleton__bone--card-title-sm" />
        <div class="skeleton__card-rows">
          <div class="skeleton__bone skeleton__bone--row" />
          <div class="skeleton__bone skeleton__bone--row" />
          <div class="skeleton__bone skeleton__bone--row" />
          <div class="skeleton__bone skeleton__bone--row-short" />
        </div>
      </div>
    </div>
  </div>

  <!-- Preview card skeleton -->
  <div
    v-else-if="variant === 'card'"
    class="skeleton skeleton--card"
  >
    <div class="skeleton__bone skeleton__bone--card-header" />
    <div class="skeleton__bone skeleton__bone--card-body" />
  </div>

  <!-- Text lines skeleton -->
  <div
    v-else-if="variant === 'text'"
    class="skeleton skeleton--text"
  >
    <div class="skeleton__bone skeleton__bone--row" />
    <div class="skeleton__bone skeleton__bone--row" />
    <div class="skeleton__bone skeleton__bone--row-short" />
  </div>
</template>

<style lang="scss" scoped>
@keyframes shimmer {
  0% {
    background-position: -400px 0;
  }
  100% {
    background-position: 400px 0;
  }
}

.skeleton__bone {
  @apply rounded;
  background: linear-gradient(
    90deg,
    theme('colors.gray.200') 0%,
    theme('colors.gray.100') 40%,
    theme('colors.gray.200') 80%
  );
  background-size: 800px 100%;
  animation: shimmer 1.5s infinite linear;

  .dark & {
    background: linear-gradient(
      90deg,
      theme('colors.gray.700') 0%,
      theme('colors.gray.600') 40%,
      theme('colors.gray.700') 80%
    );
    background-size: 800px 100%;
  }
}

/* Event detail skeleton */
.skeleton--event-detail {
  @apply flex flex-col h-full;
}

.skeleton__header {
  @apply py-5 px-5 md:px-6 lg:px-8;
  @apply border-b border-gray-200 dark:border-gray-700/50;
  @apply bg-gray-50 dark:bg-gray-900;
}

.skeleton__badges {
  @apply flex gap-2 mb-4;
}

.skeleton__bone--badge {
  @apply h-5 rounded-md;
  width: 64px;
}

.skeleton__bone--badge-sm {
  @apply h-5 rounded-md;
  width: 48px;
}

.skeleton__bone--title {
  @apply h-6 mb-3;
  width: 45%;
}

.skeleton__bone--message {
  @apply h-16 rounded-md mb-3;
  width: 100%;
}

.skeleton__bone--date {
  @apply h-3;
  width: 140px;
}

/* Tabs skeleton */
.skeleton__tabs {
  @apply flex gap-3 px-5 md:px-6 lg:px-8 py-3;
  @apply border-b border-gray-200 dark:border-gray-700/80;
}

.skeleton__bone--tab {
  @apply h-5 rounded;
  width: 80px;
}

.skeleton__bone--tab-sm {
  @apply h-5 rounded;
  width: 56px;
}

/* Body */
.skeleton__body {
  @apply flex flex-col gap-6 py-5 px-5 md:px-6 lg:px-8;
}

.skeleton__card {
  @apply rounded-lg overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
  @apply p-4;
}

.skeleton__bone--card-title {
  @apply h-4 mb-3;
  width: 30%;
}

.skeleton__bone--card-title-sm {
  @apply h-3 mb-3;
  width: 20%;
}

.skeleton__bone--card-text {
  @apply h-10 rounded-md mb-3;
  width: 100%;
}

.skeleton__card-rows {
  @apply flex flex-col gap-2;
}

.skeleton__bone--row {
  @apply h-8;
  width: 100%;
}

.skeleton__bone--row-short {
  @apply h-8;
  width: 65%;
}

/* Card skeleton */
.skeleton--card {
  @apply p-3;
}

.skeleton__bone--card-header {
  @apply h-5 mb-2;
  width: 60%;
}

.skeleton__bone--card-body {
  @apply h-12;
  width: 100%;
}

/* Text skeleton */
.skeleton--text {
  @apply flex flex-col gap-2;
}
</style>
