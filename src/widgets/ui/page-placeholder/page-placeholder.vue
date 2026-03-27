<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { useConnectionStore } from '@/shared/stores/connections'
import { IconSvg } from '@/shared/ui'

const { isConnectedWS } = storeToRefs(useConnectionStore())
</script>

<template>
  <div class="placeholder">
    <!-- Hero -->
    <div class="placeholder__hero">
      <IconSvg
        class="placeholder__logo"
        name="logo"
      />
      <p class="placeholder__tagline">
        Lightweight server for debugging PHP applications
      </p>

      <!-- Connection status -->
      <div
        class="placeholder__status"
        :class="{ 'placeholder__status--connected': isConnectedWS }"
      >
        <span class="placeholder__status-dot" />
        <span class="placeholder__status-text">
          {{ isConnectedWS ? 'Connected — waiting for events' : 'Disconnected' }}
        </span>
      </div>
    </div>

    <!-- Quick start hint -->
    <div class="placeholder__hint">
      <p class="placeholder__hint-text">
        Send events from your application using Sentry, Ray, VarDumper, Monolog, or any supported
        driver.
      </p>
    </div>

    <!-- Links as cards -->
    <div class="placeholder__cards">
      <a
        href="https://docs.buggregator.dev"
        target="_blank"
        class="placeholder__card"
      >
        <IconSvg
          name="docs"
          class="placeholder__card-icon"
        />
        <div class="placeholder__card-info">
          <span class="placeholder__card-title">Documentation</span>
          <span class="placeholder__card-desc">Setup guides and configuration</span>
        </div>
      </a>

      <a
        href="https://github.com/buggregator"
        target="_blank"
        class="placeholder__card"
      >
        <IconSvg
          name="github"
          class="placeholder__card-icon"
        />
        <div class="placeholder__card-info">
          <span class="placeholder__card-title">GitHub</span>
          <span class="placeholder__card-desc">Source code and issues</span>
        </div>
      </a>

      <a
        href="https://discord.gg/vDsCD3EKUB"
        target="_blank"
        class="placeholder__card"
      >
        <IconSvg
          name="discord"
          class="placeholder__card-icon"
        />
        <div class="placeholder__card-info">
          <span class="placeholder__card-title">Discord</span>
          <span class="placeholder__card-desc">Community and support</span>
        </div>
      </a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.placeholder {
  @apply flex flex-col items-center w-full max-w-md px-6;
}

/* Hero */
.placeholder__hero {
  @apply flex flex-col items-center text-center mb-8;
}

.placeholder__logo {
  @apply h-10 md:h-12 mb-4;
  @apply text-gray-800 dark:text-white;
}

.placeholder__tagline {
  @apply text-sm text-gray-500 dark:text-gray-400 mb-5;
}

.placeholder__status {
  @apply flex items-center gap-2 px-3 py-1.5 rounded-full;
  @apply bg-gray-100 dark:bg-gray-800;
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.placeholder__status--connected {
  @apply text-green-600 dark:text-green-400;
  @apply bg-green-50 dark:bg-green-500/10;
}

.placeholder__status-dot {
  @apply w-2 h-2 rounded-full;
  @apply bg-gray-400 dark:bg-gray-500;

  .placeholder__status--connected & {
    @apply bg-green-500 dark:bg-green-400;
    animation: pulse-dot 2s ease-in-out infinite;
  }
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.placeholder__status-text {
  @apply font-mono;
}

/* Hint */
.placeholder__hint {
  @apply w-full text-center mb-6;
}

.placeholder__hint-text {
  @apply text-xs text-gray-400 dark:text-gray-500 leading-relaxed;
}

/* Cards */
.placeholder__cards {
  @apply w-full flex flex-col gap-2;
}

.placeholder__card {
  @apply flex items-center gap-3 px-4 py-3 rounded-lg w-full;
  @apply border border-gray-200 dark:border-gray-700;
  @apply bg-white dark:bg-gray-800;
  @apply hover:border-gray-300 dark:hover:border-gray-600;
  @apply hover:bg-gray-50 dark:hover:bg-gray-800/80;
  @apply transition-colors cursor-pointer;
}

.placeholder__card-icon {
  @apply w-5 h-5 flex-shrink-0;
  @apply text-gray-400 dark:text-gray-500;
}

.placeholder__card-info {
  @apply flex flex-col;
}

.placeholder__card-title {
  @apply text-sm font-medium text-gray-700 dark:text-gray-200;
}

.placeholder__card-desc {
  @apply text-xs text-gray-400 dark:text-gray-500;
}
</style>
