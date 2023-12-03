<script lang="ts" setup>
import { computed } from "vue";
import { EVENT_TYPES } from "../../types";
import { IconSvg } from "../icon-svg";

type Props = {
  eventType: EVENT_TYPES;
  eventId: string;
  eventUrl: string;
  tags: string[];
  isOpen: boolean;
  isVisibleControls: boolean;
};

type Emits = {
  delete: [value: boolean];
  toggleView: [value: boolean];
  copy: [value: boolean];
  download: [value: boolean];
};

const props = withDefaults(defineProps<Props>(), {
  tags: () => [],
  eventUrl: "",
});

const emit = defineEmits<Emits>();

const changeView = () => {
  emit("toggleView", true);
};

const onDeleteButtonClick = () => {
  emit("delete", true);
};

const onCopyButtonRightClick = () => {
  emit("copy", true);
};

const onCopyButtonClick = () => {
  emit("download", true);
};

const isVisibleTags = computed(() => props.tags.length > 0);
</script>

<template>
  <div class="preview-card-header">
    <div class="preview-card-header__tags">
      <a
        v-if="eventUrl"
        :href="eventUrl"
        target="_blank"
        class="preview-card-header__tag preview-card-header__button--json"
      >
        JSON
      </a>

      <template v-if="isVisibleTags">
        <div
          v-for="tag in tags"
          :key="tag"
          ref="tags"
          class="preview-card-header__tag"
          :class="`preview-card-header__tag--${eventType}`"
        >
          {{ tag }}
        </div>
      </template>
    </div>

    <div v-if="isVisibleControls" class="preview-card-header__container">
      <button
        class="preview-card-header__button preview-card-header__button--copy"
        @click="onCopyButtonClick"
        @click.right.prevent="onCopyButtonRightClick"
      >
        <IconSvg name="copy" class="preview-card-header__button-icon" />
      </button>

      <button
        class="preview-card-header__button preview-card-header__button--collapse"
        :class="`preview-card-header__button--${eventType}`"
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
        class="preview-card-header__button preview-card-header__button--delete"
        @click="onDeleteButtonClick"
      >
        <IconSvg name="times" class="preview-card-header__button-icon" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$eventTypeColorsMap: (
  "var-dump" "red",
  "smtp" "orange",
  "sentry" "pink",
  "profiler" "purple",
  "monolog" "gray",
  "inspector" "gray",
  "ray" "gray",
  "unknown" "gray"
);

.preview-card-header {
  @apply w-full flex sm:flex-row flex-col-reverse justify-between gap-y-3;
}

.preview-card-header__container {
  @apply flex justify-end space-x-2;
}

.preview-card-header__tags {
  @apply flex flex-wrap gap-3;
}

.preview-card-header__tag {
  @apply font-bold px-2 rounded-full text-xs inline-flex items-center transition-colors border dark:border-gray-600 cursor-help;

  /* Applied tailwind classes depends on event type
   Need to keep declaration for tailwind correct work:
   'var-dump' 'bg-red-50 dark:bg-red-700 text-red-800 dark:text-red-50 dark:border-red-600' 'bg-red-100 dark:bg-red-500',
   'Smtp' 'bg-orange-50 dark:bg-orange-700 text-orange-800 dark:text-orange-50 dark:border-orange-600' 'bg-orange-100 dark:bg-orange-500',
   'Sentry' 'bg-pink-50 dark:bg-pink-700 text-pink-800 dark:text-pink-50 dark:border-pink-600' 'bg-pink-100 dark:bg-pink-500',
   'profiler' 'bg-purple-50 dark:bg-purple-700 text-purple-800 dark:text-purple-50 dark:border-purple-600' 'bg-purple-100 dark:bg-purple-500',
   'monolog' 'bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-50 dark:border-gray-600' 'bg-gray-100 dark:bg-gray-500',
   'inspector' 'bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-50 dark:border-gray-600' 'bg-gray-100 dark:bg-gray-500',
   'ray' 'bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-50 dark:border-gray-600' 'bg-gray-100 dark:bg-gray-500' */

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

.preview-card-header__button {
  @apply w-5 h-5 md:w-4 md:h-4 rounded-full opacity-90 hover:opacity-100 transition-all hover:ring-4 ring-offset-1;
  /* Applied tailwind classes depends on event type
   Need to keep declaration for tailwind correct work:
   'var-dump' 'bg-red-600 ring-red-300',
   'Smtp' 'bg-orange-600 ring-orange-300',
   'Sentry' 'bg-pink-600 ring-pink-300',
   'profiler' 'bg-purple-600 ring-purple-300',
   'monolog' 'bg-gray-600 ring-gray-300',
   'inspector' 'bg-gray-600 ring-gray-300',
   'ray' 'bg-gray-600 ring-gray-300' */

  @each $map in $eventTypeColorsMap {
    $name: nth($map, 1);
    $color: nth($map, 2);

    &--#{$name} {
      @apply bg-#{$color}-600 ring-#{$color}-300;
    }
  }
}

.preview-card-header__button--collapse {
  @apply text-white bg-gray-600 ring-gray-300;
}

.preview-card-header__button--json {
  @apply text-white ring-gray-300 bg-blue-700 hover:bg-blue-500;
}

.preview-card-header__button--delete {
  @apply text-red-700 bg-white dark:bg-red-700 hover:bg-red-700 hover:text-white;
}

.preview-card-header__button-icon {
  @apply p-1 dark:fill-white;
}
</style>
