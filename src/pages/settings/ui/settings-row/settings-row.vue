<script lang="ts" setup>
import { computed, ref, useId } from 'vue'
import { HighlightText } from '@/shared/ui'
import type { SettingItem } from '../../config/settings-catalog'
import { matchesQuery, useSettingMatch } from '../../lib/settings-search'

type Props = {
  item: SettingItem
}

const props = defineProps<Props>()

const { query, isMatch } = useSettingMatch(() => props.item.id)

const uid = useId()
const labelId = `${uid}-label`
const hintId = `${uid}-hint`
const moreId = `${uid}-more`

const isMoreOpen = ref(false)
// A search that hits only the long text opens it, so the match is visible.
const isMoreShown = computed(
  () =>
    isMoreOpen.value ||
    (!!props.item.more &&
      !!query.value.trim() &&
      matchesQuery(query.value, [props.item.more]) &&
      !matchesQuery(query.value, [props.item.label, props.item.hint]))
)
</script>

<template>
  <div
    class="settings-row"
    :class="{ 'settings-row--dim': !isMatch }"
    :data-setting="item.id"
  >
    <div class="settings-row__main">
      <div class="settings-row__info">
        <div
          :id="labelId"
          class="settings-row__label"
        >
          <HighlightText
            :text="item.label"
            :query="query"
          />
        </div>
        <div
          :id="hintId"
          class="settings-row__hint"
        >
          <HighlightText
            :text="item.hint"
            :query="query"
          />
          <button
            v-if="item.more"
            type="button"
            class="settings-row__more"
            :aria-expanded="isMoreShown"
            :aria-controls="moreId"
            @click="isMoreOpen = !isMoreShown"
          >
            {{ isMoreShown ? 'Less' : 'More' }}<span class="sr-only"> about {{ item.label }}</span>
          </button>
        </div>
        <p
          v-if="item.more"
          v-show="isMoreShown"
          :id="moreId"
          class="settings-row__more-text"
        >
          <HighlightText
            :text="item.more"
            :query="query"
          />
        </p>
      </div>

      <slot
        :label-id="labelId"
        :hint-id="hintId"
      />
    </div>

    <slot name="extra" />
  </div>
</template>

<style lang="scss" scoped>
.settings-row {
  @apply px-4 py-3;
  @apply bg-white dark:bg-gray-800;
  @apply transition-opacity duration-150;
}

// A search hides nothing: rows that do not match fade.
.settings-row--dim {
  @apply opacity-40;
}

.settings-row__main {
  @apply flex items-center justify-between gap-4;
}

.settings-row__info {
  @apply flex-1 min-w-0;
}

.settings-row__label {
  @apply text-sm font-medium text-gray-900 dark:text-gray-100;
}

.settings-row__hint {
  @apply text-xs text-gray-500 dark:text-gray-400 mt-0.5;
}

.settings-row__more {
  @apply ml-1 underline underline-offset-2;
  @apply text-blue-700 dark:text-blue-300;
  @apply hover:text-blue-900 dark:hover:text-blue-100;
}

.settings-row__more-text {
  @apply text-xs text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed;
}

// Phone: a wide control (the theme buttons) goes under the label instead of
// squeezing it; «More» gets 44 px to tap without breaking the line.
@media (max-width: 639px) {
  .settings-row__main {
    @apply flex-wrap gap-y-2;
  }

  .settings-row__info {
    min-width: 10rem;
  }

  .settings-row__more {
    padding: 0.875rem 0.25rem;
    margin: -0.875rem -0.25rem -0.875rem 0;
  }
}
</style>
