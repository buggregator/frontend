<script lang="ts" setup>
import { useTitle } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { THEME_MODES, useSettingsStore } from "@/shared/stores";
import { BadgeNumber, IconSvg } from "@/shared/ui";

const settingsStore = useSettingsStore();
const {
  changeTheme, changeNavbar, changeEventCountsVisibility, changeActiveCodeEditor,
} =
  settingsStore;
const {
  themeType, isFixedHeader, isVisibleEventCounts, codeEditor,
} = storeToRefs(settingsStore);

const isDarkMode = computed(() =>
  themeType.value === THEME_MODES.DARK);

// TODO: add throttle
const changeCodeEditor = (event: Event) => {
  const editor = (event.target as HTMLInputElement).value;
  changeActiveCodeEditor(editor);
};

useTitle("Settings | Buggregator");
</script>

<template>
  <main class="settings-page-content">
    <div class="settings-page-content__title">
      Theme: {{ isDarkMode ? "Dark" : "Light" }}
    </div>

    <div class="settings-page-content__control">
      <IconSvg
        name="sun"
        class="settings-page-content__control-icon"
        :class="{ 'settings-page-content__control-icon--active': !isDarkMode }"
      />

      <button
        class="settings-page-content__control-button"
        :class="{ 'settings-page-content__control-button--active': isDarkMode }"
        @click="changeTheme"
      >
        <span class="settings-page-content__control-button-in" />
      </button>

      <IconSvg
        class="settings-page-content__control-icon"
        name="moon"
        :class="{ 'settings-page-content__control-icon--active': isDarkMode }"
      />
    </div>

    <div class="settings-page-content__title">
      Fixed Header: {{ isFixedHeader ? "On" : "Off" }}
    </div>

    <div class="settings-page-content__control">
      <IconSvg
        name="lock-off"
        class="settings-page-content__control-icon"
        :class="{ 'settings-page-content__control-icon--active': !isFixedHeader }"
      />

      <button
        class="settings-page-content__control-button"
        :class="{ 'settings-page-content__control-button--active': isFixedHeader }"
        @click="changeNavbar"
      >
        <span class="settings-page-content__control-button-in" />
      </button>

      <IconSvg
        class="settings-page-content__control-icon"
        name="lock"
        :class="{ 'settings-page-content__control-icon--active': isFixedHeader }"
      />
    </div>

    <div class="settings-page-content__title">
      Events Counts: {{ isVisibleEventCounts ? "On" : "Off" }}
    </div>

    <div class="settings-page-content__control">
      <div
        class="settings-page-content__control-icon"
        :class="{
          'settings-page-content__control-icon--active': !isVisibleEventCounts,
        }"
      >
        <IconSvg name="inspector" />
      </div>

      <button
        class="settings-page-content__control-button"
        :class="{
          'settings-page-content__control-button--active': isVisibleEventCounts,
        }"
        @click="changeEventCountsVisibility"
      >
        <span class="settings-page-content__control-button-in" />
      </button>

      <div
        class="settings-page-content__control-icon"
        :class="{
          'settings-page-content__control-icon--active': isVisibleEventCounts,
        }"
      >
        <BadgeNumber
          class="settings-page-content__control-icon-badge"
          :number="15"
        >
          <IconSvg name="inspector" />
        </BadgeNumber>
      </div>
    </div>

    <div class="settings-page-content__title">
      Code Editor Open Link:
    </div>

    <div class="settings-page-content__control">
      <div>
        <label class="settings-page-content__control-label">
          <input
            class="settings-page-content__control-input"
            type="text"
            :value="codeEditor"
            @change="changeCodeEditor"
          >
          &nbsp;://open?file=/App/Modules/Logger.php&line=12
        </label>

        <div class="settings-page-content__control-description">
          Example of link to open files in code editor. You can replace the name editor with a more
          preferable one
        </div>
      </div>
    </div>
  </main>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.settings-page-content {
  @apply p-4 grid gap-4 gap-x-10 mr-auto min-w-[50%];
  grid-template-columns: 1fr auto;
}

.settings-page-content__title {
  @apply text-xl font-bold flex items-center flex-shrink-0;
}

.settings-page-content__control {
  @apply flex gap-5 items-center my-5;
}

.settings-page-content__control-icon {
  @apply opacity-10 w-8;
}

.settings-page-content__control-icon-badge {
  :deep(.badge-number__badge) {
    @apply scale-150;
  }
}

.settings-page-content__control-icon--active {
  @apply opacity-100;
}

.settings-page-content__control-button {
  @apply relative inline-flex h-8 w-16 items-center rounded-full bg-gray-200;
}

.settings-page-content__control-button-in {
  @apply inline-block h-6 w-6 transform rounded-full transition bg-blue-600 translate-x-2;

  .settings-page-content__control-button--active & {
    @apply translate-x-8;
  }
}

.settings-page-content__control-label {
  @apply text-xl font-bold items-center flex;
}

.settings-page-content__control-input {
  @apply border-gray-600 p-1 rounded w-[140px] bg-gray-200 dark:bg-gray-600;
}

.settings-page-content__control-description {
  @apply text-xs mt-2;
}
</style>
