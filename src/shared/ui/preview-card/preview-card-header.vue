<script lang="ts" setup>
import isString from 'lodash.isstring'
import { computed } from 'vue'
import { type EventType, type NormalizedEvent, RouteName } from '../../types'
import { IconSvg } from '../icon-svg'
import { DownloadType } from './types'

type Props = {
  eventType: EventType | 'unknown'
  eventId: NormalizedEvent<unknown>['id']
  eventUrl: string
  labels: NormalizedEvent<unknown>['labels']
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
  eventUrl: ''
})

const emit = defineEmits<Emits>()

const changeView = () => {
  emit('toggleView', true)
}

const deleteEvent = () => {
  emit('delete', true)
}

const copyEvent = () => {
  emit('copy', true)
}

const downloadImageEvent = () => {
  emit('download', DownloadType.Image)
}

const downloadFile = () => {
  emit('download', DownloadType.File)
}

const lockEvent = () => {
  emit('lock', true)
}

const isVisibleTags = computed(() => props.labels.length > 0)
</script>

<template>
  <div class="preview-card-header">
    <div class="preview-card-header__tags">
      <a
        v-if="eventUrl"
        :href="eventUrl"
        target="_blank"
        class="preview-card-header__tag preview-card-header__tag--json"
        title="Open JSON payload for this event in new tab"
      >
        JSON
      </a>

      <template v-if="isVisibleTags">
        <template
          v-for="label in labels"
          :key="label"
        >
          <div
            v-if="isString(label)"
            ref="tags"
            class="preview-card-header__tag"
            :class="`preview-card-header__tag--${eventType}`"
          >
            {{ label }}
          </div>

          <div
            v-if="!isString(label)"
            ref="tags"
            class="preview-card-header__tag preview-card-header__tag--large"
            :class="`preview-card-header__tag--${eventType}`"
            :title="label.context"
          >
            {{ label.title }}: {{ label.value }}
          </div>
        </template>
      </template>

      <template v-if="eventType">
        <RouterLink
          :to="{ name: RouteName.EventPage, params: { type: eventType, id: eventId } }"
          class="preview-card-header__open"
          title="Open full event"
        >
          <IconSvg name="window-maximize" />
        </RouterLink>
      </template>
    </div>

    <div
      v-if="isVisibleControls"
      class="preview-card-header__buttons"
    >
      <div
        v-if="isOpen"
        class="preview-card-header__buttons-expand"
      >
        <button
          class="preview-card-header__button preview-card-header__button--copy"
          title="Copy event as PNG image to clipboard"
          @click="copyEvent"
        >
          <IconSvg
            name="copy"
            class="preview-card-header__button-icon"
          />
        </button>

        <div class="preview-card-header__buttons-expand-list">
          <button
            class="preview-card-header__button preview-card-header__button--copy"
            title="Download event as JSON file"
            @click="downloadFile"
          >
            <IconSvg
              name="file-download"
              class="preview-card-header__button-icon"
            />
          </button>

          <button
            class="preview-card-header__button preview-card-header__button--copy"
            title="Download event as PNG image"
            @click="downloadImageEvent"
          >
            <IconSvg
              name="image-download"
              class="preview-card-header__button-icon"
            />
          </button>
        </div>
      </div>

      <button
        class="preview-card-header__button preview-card-header__button--collapse"
        :class="{ 'preview-card-header__button--collapse-closed': !isOpen }"
        title="Collapse event"
        @click="changeView"
      >
        <IconSvg
          v-if="isOpen"
          name="minus"
          class="preview-card-header__button-icon"
        />
        <IconSvg
          v-if="!isOpen"
          name="plus"
          class="preview-card-header__button-icon"
        />
      </button>

      <button
        class="preview-card-header__button preview-card-header__button--lock"
        title="Lock event. Locked events will not be deleted"
        :class="{
          'preview-card-header__button--locked': isLocked
        }"
        @click="lockEvent"
      >
        <IconSvg
          name="lock"
          class="preview-card-header__button-icon"
        />
      </button>

      <button
        class="preview-card-header__button preview-card-header__button--delete"
        title="Delete event"
        :disabled="isLocked"
        @click="deleteEvent"
      >
        <IconSvg
          name="times"
          class="preview-card-header__button-icon"
        />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$eventTypeColorsMap: (
  'var-dump' 'red',
  'smtp' 'orange',
  'sentry' 'pink',
  'profiler' 'purple',
  'ray' 'cyan',
  'inspector' 'yellow',
  'http-dump' 'lime',
  'monolog' 'zinc',
  'unknown' 'gray'
);

.preview-card-header__tags {
  @apply flex flex-wrap;
  @apply gap-1 md:gap-3;
}

.preview-card-header__tag {
  @apply rounded-md md:rounded-full;
  @apply inline-flex items-center;
  @apply border dark:border-gray-600;
  @apply transition-colors;
  @apply px-1 md:px-2;
  @apply font-bold text-2xs lg:text-xs leading-none;

  /* Applied tailwind classes depends on event type
   Need to keep declaration for tailwind correct work:
   'var-dump' 'bg-red-50 dark:bg-red-700 text-red-800 dark:text-red-50 dark:border-red-600' 'bg-red-100 dark:bg-red-500',
   'Smtp' 'bg-orange-50 dark:bg-orange-700 text-orange-800 dark:text-orange-50 dark:border-orange-600' 'bg-orange-100 dark:bg-orange-500',
   'Sentry' 'bg-pink-50 dark:bg-pink-700 text-pink-800 dark:text-pink-50 dark:border-pink-600' 'bg-pink-100 dark:bg-pink-500',
   'profiler' 'bg-purple-50 dark:bg-purple-700 text-purple-800 dark:text-purple-50 dark:border-purple-600' 'bg-purple-100 dark:bg-purple-500',
   'ray' 'bg-cyan-50 dark:bg-cyan-700 text-cyan-800 dark:text-cyan-50 dark:border-cyan-600' 'bg-cyan-100 dark:bg-cyan-500',
   'inspector' 'bg-yellow-50 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-50 dark:border-yellow-600' 'bg-yellow-100 dark:bg-yellow-500',
   'monolog' 'bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-50 dark:border-zinc-600' 'bg-zinc-100 dark:bg-zinc-500'
   'http-dump' 'bg-lime-50 dark:bg-lime-700 text-lime-800 dark:text-lime-50 dark:border-lime-600' 'bg-lime-100 dark:bg-lime-500' */

  @each $map in $eventTypeColorsMap {
    $name: nth($map, 1);
    $color: nth($map, 2);

    &--#{$name} {
      @apply bg-#{$color}-50 dark:bg-#{$color}-700 text-#{$color}-800 dark:text-#{$color}-50 dark:border-#{$color}-600;

      &:hover {
        @apply bg-#{$color}-100 dark:bg-#{$color}-500;
      }
    }
  }
}

.preview-card-header__tag--large {
  @apply cursor-help;
}

.preview-card-header__tag--json {
  @apply bg-blue-600 text-blue-50 border-blue-600;

  @apply cursor-help;
  &:hover {
    @apply bg-blue-500 dark:bg-blue-500;
  }
}

.preview-card-header__open {
  @apply flex justify-end;
  @apply h-4 md:h-5;
}

.preview-card-header__buttons {
  @apply flex justify-end;
  @apply gap-2 md:gap-3;
}

.preview-card-header__buttons-expand {
  @apply relative left-[2px] flex border-x-2 rounded-3xl border-transparent dark:border-transparent cursor-pointer;

  &:hover {
    @apply bg-gray-200 dark:bg-gray-700;
    @apply ring-1 ring-gray-200 dark:ring-gray-700;
    @apply border-gray-200 dark:border-gray-700;
  }
}

.preview-card-header__buttons-expand-list {
  @apply flex flex-row justify-end transition-all;
  @apply space-x-2 pr-2;
  @apply hidden overflow-hidden opacity-0;
  order: -1;

  .preview-card-header__buttons-expand:hover & {
    @apply flex overflow-visible opacity-100;
  }
}

.preview-card-header__button {
  @apply w-4 h-4 rounded-full opacity-90 hover:opacity-100 transition-all hover:ring-4 ring-offset-1;
  @apply text-white bg-gray-300 dark:bg-gray-600 ring-blue-200 dark:ring-blue-800;
}

.preview-card-header__button--copy {
  @apply text-gray-800 dark:text-white bg-transparent dark:bg-transparent;
}

.preview-card-header__button--collapse {
  &:hover {
    @apply text-white bg-gray-500;
  }
}

.preview-card-header__button--collapse-closed {
  @apply text-white bg-blue-700 ring-blue-300 dark:bg-blue-700 hover:bg-blue-700;
}

.preview-card-header__button--delete {
  @apply text-white dark:text-white bg-red-700 dark:bg-red-700 ring-red-200 dark:ring-red-800;

  &:disabled {
    @apply opacity-50 pointer-events-none;
  }
}

.preview-card-header__button--lock {
  @apply hover:bg-green-700 hover:dark:bg-green-700;
}

.preview-card-header__button--locked {
  @apply text-white dark:text-white bg-green-700 dark:bg-green-700 ring-2 ring-green-700 dark:ring-green-700 hover:bg-green-800 dark:hover:bg-green-500;
}

.preview-card-header__button-icon {
  @apply p-0.5 dark:fill-white;

  .preview-card-header__button--collapse & {
    @apply p-1;
  }

  .preview-card-header__button--delete & {
    @apply p-1;
  }
}
</style>
