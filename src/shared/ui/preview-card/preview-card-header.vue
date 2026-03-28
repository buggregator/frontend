<script lang="ts" setup>
import isString from 'lodash.isstring'
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { PAGES_SETTINGS } from '../../constants'
import { type EventType, type NormalizedEvent, RouteName } from '../../types'
import { HighlightText } from '../highlight-text'
import { IconSvg } from '../icon-svg'
import { DownloadType } from './types'

type Props = {
  eventType: EventType | 'unknown'
  eventId: NormalizedEvent<unknown>['id']
  eventUrl: string
  labels: NormalizedEvent<unknown>['labels']
  eventDate: Date | null
  isOpen: boolean
  isLocked: boolean
  isVisibleControls: boolean
}

type Emits = {
  delete: [value: boolean]
  toggleView: [value: boolean]
  copy: [value: boolean]
  download: [value: DownloadType]
  lock: [value: boolean]
}

const props = withDefaults(defineProps<Props>(), {
  tags: () => [],
  eventUrl: '',
  eventDate: null
})

const emit = defineEmits<Emits>()

const relativeTime = ref('')
let timeInterval: ReturnType<typeof setInterval> | null = null

const formatRelativeTime = (date: Date | null): string => {
  if (!date) return ''
  const now = Date.now()
  const diff = now - date.getTime()
  if (diff < 0) return ''
  const seconds = Math.floor(diff / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

onMounted(() => {
  relativeTime.value = formatRelativeTime(props.eventDate)
  timeInterval = setInterval(() => {
    relativeTime.value = formatRelativeTime(props.eventDate)
  }, 10000)
})

onBeforeUnmount(() => {
  if (timeInterval) clearInterval(timeInterval)
})

const typeConfig = computed(() => {
  const key = props.eventType as keyof typeof PAGES_SETTINGS
  return PAGES_SETTINGS[key] || null
})

const changeView = () => emit('toggleView', true)
const deleteEvent = () => emit('delete', true)
const copyEvent = () => emit('copy', true)
const lockEvent = () => emit('lock', true)

const isVisibleTags = computed(() => props.labels.length > 0)
</script>

<template>
  <div class="pc-header">
    <!-- Left: type badge + labels + time -->
    <div class="pc-header__left">
      <!-- Type badge with icon + shape indicator -->
      <div
        class="pc-header__type"
        :class="`pc-header__type--${eventType}`"
      >
        <span
          class="pc-header__type-shape"
          :class="`pc-header__type-shape--${eventType}`"
        />
        <IconSvg
          v-if="typeConfig"
          class="pc-header__type-icon"
          :name="typeConfig.iconName"
        />
        <span class="pc-header__type-name">{{ typeConfig?.title || eventType }}</span>
      </div>

      <!-- Labels -->
      <template v-if="isVisibleTags">
        <template
          v-for="label in labels"
          :key="label"
        >
          <span
            v-if="isString(label)"
            class="pc-header__label"
          >
            <HighlightText :text="label" />
          </span>

          <span
            v-if="!isString(label)"
            class="pc-header__label pc-header__label--kv"
            :title="label.context"
          >
            <span class="pc-header__label-key"><HighlightText :text="label.title" /></span>
            <HighlightText :text="label.value" />
          </span>
        </template>
      </template>

      <!-- Timestamp -->
      <span
        v-if="relativeTime"
        class="pc-header__time"
        :title="eventDate?.toLocaleString()"
      >
        {{ relativeTime }}
      </span>
    </div>

    <!-- Right: actions -->
    <div class="pc-header__actions">
      <!-- Open full page -->
      <RouterLink
        v-if="eventType"
        :to="{ name: RouteName.EventPage, params: { type: eventType, id: eventId } }"
        class="pc-header__action"
        title="Open full event"
        aria-label="Open full event"
      >
        <IconSvg
          name="window-maximize"
          class="pc-header__action-icon"
        />
      </RouterLink>

      <!-- JSON link -->
      <a
        v-if="eventUrl"
        :href="eventUrl"
        target="_blank"
        class="pc-header__action pc-header__action--secondary"
        title="Open JSON payload"
        aria-label="Open JSON payload"
      >
        <IconSvg
          name="file-download"
          class="pc-header__action-icon"
        />
      </a>

      <!-- Copy (only when expanded + controls visible) -->
      <button
        v-if="isOpen && isVisibleControls"
        class="pc-header__action pc-header__action--secondary"
        title="Copy as image"
        aria-label="Copy event as image"
        @click="copyEvent"
      >
        <IconSvg
          name="copy"
          class="pc-header__action-icon"
        />
      </button>

      <!-- Lock -->
      <button
        v-if="isVisibleControls"
        class="pc-header__action pc-header__action--secondary"
        :class="{ 'pc-header__action--active': isLocked }"
        :title="isLocked ? 'Unpin event' : 'Pin event'"
        :aria-label="isLocked ? 'Unpin event' : 'Pin event'"
        :aria-pressed="isLocked"
        @click="lockEvent"
      >
        <IconSvg
          :name="isLocked ? 'pin' : 'pin-off'"
          class="pc-header__action-icon"
        />
      </button>

      <!-- Collapse/Expand -->
      <button
        class="pc-header__action"
        :title="isOpen ? 'Collapse' : 'Expand'"
        :aria-label="isOpen ? 'Collapse event' : 'Expand event'"
        :aria-expanded="isOpen"
        @click="changeView"
      >
        <IconSvg
          name="collapsed"
          class="pc-header__action-icon pc-header__chevron"
          :class="{ 'pc-header__chevron--open': isOpen }"
        />
      </button>

      <!-- Delete -->
      <button
        v-if="isVisibleControls"
        class="pc-header__action pc-header__action--danger"
        title="Delete event"
        aria-label="Delete event"
        :disabled="isLocked"
        @click="deleteEvent"
      >
        <IconSvg
          name="times"
          class="pc-header__action-icon"
        />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* Type color map
   Tailwind safelist:
   'text-rose-500 bg-rose-500/10' 'text-violet-500 bg-violet-500/10'
   'text-amber-500 bg-amber-500/10' 'text-green-500 bg-green-500/10'
   'text-lime-500 bg-lime-500/10' 'text-sky-500 bg-sky-500/10'
   'text-teal-500 bg-teal-500/10' 'text-cyan-500 bg-cyan-500/10'
   'text-fuchsia-500 bg-fuchsia-500/10'
   'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10' */
$typeColors: (
  'sentry': 'rose',
  'profiler': 'violet',
  'smtp': 'amber',
  'http-dump': 'green',
  'inspector': 'lime',
  'var-dump': 'sky',
  'monolog': 'teal',
  'ray': 'cyan',
  'sms': 'fuchsia',
  'unknown': 'gray'
);

.pc-header {
  @apply flex items-start justify-between gap-2;
}

/* ---- Left side ---- */
.pc-header__left {
  @apply flex flex-wrap items-center gap-1.5;
  min-width: 0;
}

/* Type badge */
.pc-header__type {
  @apply inline-flex items-center gap-1 px-1.5 py-0.5 rounded;
  @apply text-2xs font-semibold uppercase tracking-wide;
  @apply bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300;

  @each $type, $color in $typeColors {
    &--#{$type} {
      @apply text-#{$color}-600 dark:text-#{$color}-400;
      @apply bg-#{$color}-50 dark:bg-#{$color}-500/10;
    }
  }
}

/* Shape indicators for color-blind accessibility */
.pc-header__type-shape {
  @apply flex-shrink-0;
  width: 6px;
  height: 6px;
  background: currentColor;
  opacity: 0.6;
}

.pc-header__type-shape--sentry {
  @apply rounded-full; /* circle */
}

.pc-header__type-shape--profiler {
  border-radius: 1px;
  transform: rotate(45deg); /* diamond */
}

.pc-header__type-shape--smtp {
  width: 7px;
  height: 5px;
  border-radius: 0;
  clip-path: polygon(50% 0%, 100% 100%, 0% 100%); /* triangle */
}

.pc-header__type-shape--http-dump {
  border-radius: 0; /* square */
}

.pc-header__type-shape--inspector {
  width: 7px;
  height: 5px;
  border-radius: 0;
  clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%); /* hexagon */
}

.pc-header__type-shape--var-dump {
  clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%); /* pentagon */
}

.pc-header__type-shape--monolog {
  width: 8px;
  height: 4px;
  border-radius: 2px; /* pill/bar */
}

.pc-header__type-shape--ray {
  clip-path: polygon(
    50% 0%,
    61% 35%,
    98% 35%,
    68% 57%,
    79% 91%,
    50% 70%,
    21% 91%,
    32% 57%,
    2% 35%,
    39% 35%
  ); /* star */
}

.pc-header__type-shape--unknown {
  @apply rounded-full;
}

.pc-header__type-icon {
  @apply w-3 h-3 flex-shrink-0;
}

.pc-header__type-name {
  @apply leading-none;
}

/* Labels */
.pc-header__label {
  @apply inline-flex items-center px-1.5 py-0.5 rounded;
  @apply text-2xs font-medium;
  @apply bg-gray-100 dark:bg-gray-600/50 text-gray-600 dark:text-gray-300;
}

.pc-header__label--kv {
  @apply cursor-help;
}

.pc-header__label-key {
  @apply text-gray-400 dark:text-gray-500 mr-1;
}

/* Timestamp */
.pc-header__time {
  @apply text-2xs font-mono text-gray-400 dark:text-gray-500 whitespace-nowrap;
}

/* ---- Right side: actions ---- */
.pc-header__actions {
  @apply flex items-center gap-1 flex-shrink-0;
}

.pc-header__action {
  @apply w-6 h-6 flex items-center justify-center rounded;
  @apply text-gray-400 dark:text-gray-500;
  @apply hover:text-gray-600 dark:hover:text-gray-300;
  @apply hover:bg-gray-100 dark:hover:bg-gray-600;
  @apply transition-colors duration-100;
  @apply cursor-pointer;

  &:disabled {
    @apply opacity-30 pointer-events-none;
  }
}

/* Secondary actions: hidden on small screens, visible on md+ or parent hover */
.pc-header__action--secondary {
  @apply hidden md:flex;

  .preview-card:hover & {
    @apply flex;
  }
}

.pc-header__action--active {
  @apply text-green-500 dark:text-green-400;
  @apply bg-green-50 dark:bg-green-500/10;
}

.pc-header__action--danger {
  @apply hover:text-red-500 dark:hover:text-red-400;
  @apply hover:bg-red-50 dark:hover:bg-red-500/10;
}

.pc-header__action-icon {
  @apply w-3.5 h-3.5;
}

/* Chevron rotation */
.pc-header__chevron {
  transition: transform 0.15s ease;
  transform: rotate(0deg);
}

.pc-header__chevron--open {
  transform: rotate(180deg);
}
</style>
