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
      </section>
    </div>
  </main>
</template>

<script lang="ts">
import { storeToRefs } from "pinia";
import { defineComponent } from "vue";
import { PageHeader } from "~/src/widgets/ui";
import { IconSvg } from "~/src/shared/ui";
import { useSettingsStore, THEME_MODES } from "~/stores/settings";

export default defineComponent({
  components: {
    IconSvg,
    PageHeader,
  },
  setup() {
    const settingsStore = useSettingsStore();
    const { changeTheme, changeNavbar } = settingsStore;
    const { themeType, isFixedHeader } = storeToRefs(settingsStore);

    console.log(settingsStore)

    return {
      themeType,
      isFixedHeader,
      changeTheme,
      changeNavbar,
    };
  },
  head: {
    title: "Settings | Buggregator",
  },
  computed: {
    isDarkMode() {
      return this.themeType === THEME_MODES.DARK;
    },
  },
});
</script>

<style lang="scss" scoped>
@import "assets/mixins";

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
  @apply p-4 grid grid-cols-2 gap-4 mr-auto;
}

.settings-page__title {
  @apply text-xl font-bold flex items-center;
}

.settings-page__control {
  @apply flex space-x-5 items-center my-5;
}

.settings-page__control-icon {
  @apply opacity-10 w-8;
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
