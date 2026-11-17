<script lang="ts" setup>
import { useId } from 'vue'
import { SETTINGS_ITEMS } from '@/shared/constants'
import { useMenuItems } from '../../lib/use-menu-items'
import { SettingsRow } from '../settings-row'
import { SettingsSwitch } from '../settings-switch'

// Settings › Menu: one switch per left-menu entry, and «Show all» (#5949).
const { groups, hiddenCount, toggle, showAll } = useMenuItems()

const uid = useId()
const itemId = (id: string) => `${uid}-${id}`
const lockedNoteId = `${uid}-locked`
</script>

<template>
  <SettingsRow :item="SETTINGS_ITEMS.menuItems">
    <template #default>
      <button
        type="button"
        class="s-menu__show-all"
        data-test="menu-show-all"
        :disabled="hiddenCount === 0"
        @click="showAll"
      >
        Show all
      </button>
    </template>

    <template #extra>
      <div class="s-menu">
        <div
          v-for="(group, gi) in groups"
          :key="group.title"
          role="group"
          :aria-labelledby="itemId(`group-${gi}`)"
          class="s-menu__group"
        >
          <p
            :id="itemId(`group-${gi}`)"
            class="s-menu__group-title"
          >
            {{ group.title }}
          </p>
          <div
            v-for="item in group.items"
            :key="item.id"
            class="s-menu__item"
            :data-menu-item="item.id"
          >
            <span
              :id="itemId(item.id)"
              class="s-menu__label"
              :class="{ 's-menu__label--off': !item.shown }"
            >{{ item.label }}</span>
            <SettingsSwitch
              :checked="item.shown"
              :disabled="item.locked"
              :aria-labelledby="itemId(item.id)"
              :aria-describedby="item.locked ? lockedNoteId : undefined"
              @toggle="toggle(item)"
            />
          </div>
        </div>
      </div>
      <p
        v-if="groups.some((g) => g.items.some((i) => i.locked))"
        :id="lockedNoteId"
        class="s-menu__note"
      >
        One item always stays on.
      </p>
    </template>
  </SettingsRow>
</template>

<style lang="scss" scoped>
.s-menu__show-all {
  @apply h-7 px-2.5 rounded text-xs font-medium flex-shrink-0;
  @apply text-gray-700 dark:text-gray-200;
  @apply bg-gray-100 dark:bg-gray-700;
  @apply hover:bg-gray-200 dark:hover:bg-gray-600;
  @apply transition-colors;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400;

  &:disabled {
    @apply opacity-50 cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700;
  }

  @media (max-width: 639px) {
    @apply h-11 px-4 text-sm;
  }
}

.s-menu {
  @apply mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2;
}

.s-menu__group-title {
  @apply mb-1 text-2xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400;
}

.s-menu__item {
  @apply flex items-center justify-between gap-3 py-1.5;

  @media (max-width: 639px) {
    @apply py-2.5;
  }
}

.s-menu__label {
  @apply text-sm text-gray-900 dark:text-gray-100;
}

.s-menu__label--off {
  @apply text-gray-500 dark:text-gray-400;
}

.s-menu__note {
  @apply mt-2 mb-0 text-xs text-gray-500 dark:text-gray-400;
}
</style>
