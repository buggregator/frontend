<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useProfiler } from '../../lib'
import type { ProfilerSummary } from '../../types'

type Props = {
  profileId: string
}

const props = defineProps<Props>()
const { getSummary } = useProfiler()

const summary = ref<ProfilerSummary | null>(null)
const loading = ref(true)
const open = ref(false)
const popover = ref<HTMLElement | null>(null)
const trigger = ref<HTMLElement | null>(null)

const formatMs = (us: number) => `${(us / 1000).toFixed(1)}ms`
const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

const toggle = () => {
  open.value = !open.value
}
const copied = ref('')

const selectFunction = (fn: string) => {
  navigator.clipboard.writeText(fn).then(() => {
    copied.value = fn
    setTimeout(() => {
      copied.value = ''
    }, 1500)
  })
}

const onClickOutside = (e: MouseEvent) => {
  if (
    open.value &&
    popover.value &&
    !popover.value.contains(e.target as Node) &&
    trigger.value &&
    !trigger.value.contains(e.target as Node)
  ) {
    open.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', onClickOutside)
  try {
    summary.value = await getSummary(props.profileId)
  } catch {
    // silently degrade
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<template>
  <div
    v-if="!loading && summary"
    class="ps-wrap"
  >
    <button
      ref="trigger"
      class="ps-btn"
      :class="{ 'ps-btn--active': open }"
      title="Profile insights"
      @click="toggle"
    >
      <svg
        class="ps-btn__icon"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.684a1 1 0 01.633.632l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.898l-2.051-.683a1 1 0 01-.633-.633L6.95 5.684zM13.949 13.684a1 1 0 00-1.898 0l-.184.551a1 1 0 01-.632.633l-.551.183a1 1 0 000 1.898l.551.183a1 1 0 01.633.633l.183.551a1 1 0 001.898 0l.184-.551a1 1 0 01.632-.633l.551-.183a1 1 0 000-1.898l-.551-.184a1 1 0 01-.633-.632l-.183-.551z"
        />
      </svg>
      <span class="ps-btn__text">Insights</span>
    </button>

    <div
      v-if="open"
      ref="popover"
      class="ps-popover"
    >
      <div
        v-if="summary.slowest_function"
        class="ps-card ps-card--slow ps-card--clickable"
        title="Click to copy function name"
        @click="selectFunction(summary.slowest_function!.function)"
      >
        <div class="ps-card__header">
          <span class="ps-card__dot" />
          <span class="ps-card__label">{{
            copied === summary.slowest_function.function ? 'Copied!' : 'Slowest function'
          }}</span>
        </div>
        <span class="ps-card__fn">{{ summary.slowest_function.function }}</span>
        <span class="ps-card__value">
          {{ formatMs(summary.slowest_function.excl_wt) }}
          <span class="ps-card__pct">{{ summary.slowest_function.p_excl_wt }}%</span>
        </span>
      </div>

      <div
        v-if="summary.memory_hotspot"
        class="ps-card ps-card--memory ps-card--clickable"
        title="Click to copy function name"
        @click="selectFunction(summary.memory_hotspot!.function)"
      >
        <div class="ps-card__header">
          <span class="ps-card__dot" />
          <span class="ps-card__label">{{
            copied === summary.memory_hotspot.function ? 'Copied!' : 'Memory hotspot'
          }}</span>
        </div>
        <span class="ps-card__fn">{{ summary.memory_hotspot.function }}</span>
        <span class="ps-card__value">
          {{ formatBytes(summary.memory_hotspot.excl_mu) }}
          <span class="ps-card__pct">{{ summary.memory_hotspot.p_excl_mu }}%</span>
        </span>
      </div>

      <div
        v-if="summary.most_called"
        class="ps-card ps-card--calls ps-card--clickable"
        title="Click to copy function name"
        @click="selectFunction(summary.most_called!.function)"
      >
        <div class="ps-card__header">
          <span class="ps-card__dot" />
          <span class="ps-card__label">{{
            copied === summary.most_called.function ? 'Copied!' : 'Most called'
          }}</span>
        </div>
        <span class="ps-card__fn">{{ summary.most_called.function }}</span>
        <span class="ps-card__value">{{ summary.most_called.ct }} calls</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ps-wrap {
  @apply relative inline-flex;
}

.ps-btn {
  @apply flex items-center gap-1.5 h-7 px-2.5 rounded cursor-pointer;
  @apply text-xs font-medium;
  @apply text-violet-500 dark:text-violet-400;
  @apply bg-violet-50 dark:bg-violet-500/10;
  @apply hover:text-violet-700 dark:hover:text-violet-300;
  @apply hover:bg-violet-100 dark:hover:bg-violet-500/20;
  @apply transition-colors;
}

.ps-btn--active {
  @apply text-violet-700 dark:text-violet-300;
  @apply bg-violet-100 dark:bg-violet-500/20;
}

.ps-btn__icon {
  @apply w-3.5 h-3.5;
}

.ps-btn__text {
  @apply hidden sm:inline;
}

/* Popover */
.ps-popover {
  @apply absolute top-full right-0 mt-1.5 z-50;
  @apply flex gap-2.5 p-3;
  @apply bg-white dark:bg-gray-800;
  @apply border border-gray-200 dark:border-gray-700;
  @apply rounded-lg shadow-lg;
  width: max-content;
  max-width: 680px;
}

.ps-card {
  @apply flex flex-col gap-1 px-3 py-2.5 rounded-md;
  width: 200px;
}

.ps-card--clickable {
  @apply cursor-pointer transition-all duration-100;

  &:hover {
    @apply scale-[1.02] shadow-md;
  }
}

.ps-card--slow {
  @apply bg-red-50/60 dark:bg-red-500/5;
}

.ps-card--memory {
  @apply bg-violet-50/60 dark:bg-violet-500/5;
}

.ps-card--calls {
  @apply bg-amber-50/60 dark:bg-amber-500/5;
}

.ps-card__header {
  @apply flex items-center gap-1.5;
}

.ps-card__dot {
  @apply w-1.5 h-1.5 rounded-full flex-shrink-0;

  .ps-card--slow & {
    @apply bg-red-500;
  }
  .ps-card--memory & {
    @apply bg-violet-500;
  }
  .ps-card--calls & {
    @apply bg-amber-500;
  }
}

.ps-card__label {
  @apply text-2xs uppercase tracking-wider font-semibold;
  @apply text-gray-400 dark:text-gray-500;
}

.ps-card__fn {
  @apply text-xs font-mono truncate;
  @apply text-gray-800 dark:text-gray-200;
}

.ps-card__value {
  @apply text-xs font-medium;

  .ps-card--slow & {
    @apply text-red-600 dark:text-red-400;
  }
  .ps-card--memory & {
    @apply text-violet-600 dark:text-violet-400;
  }
  .ps-card--calls & {
    @apply text-amber-600 dark:text-amber-400;
  }
}

.ps-card__pct {
  @apply text-gray-400 dark:text-gray-500 font-normal;
}
</style>
