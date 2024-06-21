<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { computed } from "vue";
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { useHead } from "#app";
import { PageHeader } from "~/src/widgets/ui";
import { useSettingsStore, THEME_MODES } from "~/src/shared/stores/settings";
import { BadgeNumber, IconSvg } from "~/src/shared/ui";

const settingsStore = useSettingsStore();
const { changeTheme, changeNavbar, changeEventCountsVisibility } =
  settingsStore;
const { themeType, isFixedHeader, isVisibleEventCounts } =
  storeToRefs(settingsStore);

useHead({
  title: "Settings | Buggregator",
});

const isDarkMode = computed(() => themeType.value === THEME_MODES.DARK);
</script>

<template>
  <main class="settings-page">
    <PageHeader class="settings-page__header">
      <NuxtLink to="/">Home</NuxtLink>&nbsp;/&nbsp;Settings
    </PageHeader>

    <div class="settings-page__content-wr">
      <section class="settings-page__content">
        <div class="settings-page__title">
          Theme: {{ isDarkMode ? "Dark" : "Light" }}
        </div>

        <div class="settings-page__control">
          <IconSvg
            name="sun"
            class="settings-page__control-icon"
            :class="{ 'settings-page__control-icon--active': !isDarkMode }"
          />

          <button
            class="settings-page__control-button"
            :class="{ 'settings-page__control-button--active': isDarkMode }"
            @click="changeTheme"
          >
            <span class="settings-page__control-button-in" />
          </button>

          <IconSvg
            class="settings-page__control-icon"
            name="moon"
            :class="{ 'settings-page__control-icon--active': isDarkMode }"
          />
        </div>

        <div class="settings-page__title">
          Fixed Header: {{ isFixedHeader ? "On" : "Off" }}
        </div>

        <div class="settings-page__control">
          <IconSvg
            name="lock-off"
            class="settings-page__control-icon"
            :class="{ 'settings-page__control-icon--active': !isFixedHeader }"
          />

          <button
            class="settings-page__control-button"
            :class="{ 'settings-page__control-button--active': isFixedHeader }"
            @click="changeNavbar"
          >
            <span class="settings-page__control-button-in" />
          </button>

          <IconSvg
            class="settings-page__control-icon"
            name="lock"
            :class="{ 'settings-page__control-icon--active': isFixedHeader }"
          />
        </div>

        <div class="settings-page__title">
          Events Counts: {{ isVisibleEventCounts ? "On" : "Off" }}
        </div>

        <div class="settings-page__control">
          <div
            class="settings-page__control-icon"
            :class="{
              'settings-page__control-icon--active': !isVisibleEventCounts,
            }"
          >
            <IconSvg name="inspector" />
          </div>

          <button
            class="settings-page__control-button"
            :class="{
              'settings-page__control-button--active': isVisibleEventCounts,
            }"
            @click="changeEventCountsVisibility"
          >
            <span class="settings-page__control-button-in" />
          </button>

          <div
            class="settings-page__control-icon"
            :class="{
              'settings-page__control-icon--active': isVisibleEventCounts,
            }"
          >
            <BadgeNumber class="settings-page__control-icon-badge" :number="15">
              <IconSvg name="inspector" />
            </BadgeNumber>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.settings-page {
  @include layout;
}

.settings-page__header {
  @include layout-head;
}

.settings-page__content-wr {
  @include layout-body;
}

.settings-page__content {
  @apply p-4 grid grid-cols-2 gap-4 mr-auto min-w-[50%];
}

.settings-page__title {
  @apply text-xl font-bold flex items-center flex-shrink-0;
}

.settings-page__control {
  @apply flex space-x-5 items-center my-5;
}

.settings-page__control-icon {
  @apply opacity-10 w-8;
}

.settings-page__control-icon-badge {
  :deep(.badge-number__badge) {
    @apply scale-150;
  }
}

.settings-page__control-icon--active {
  @apply opacity-100;
}

.settings-page__control-button {
  @apply relative inline-flex h-8 w-16 items-center rounded-full bg-gray-200;
}

.settings-page__control-button-in {
  @apply inline-block h-6 w-6 transform rounded-full transition bg-blue-600 translate-x-2;

  .settings-page__control-button--active & {
    @apply translate-x-8;
  }
}
</style>
