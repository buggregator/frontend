<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { IDE_KEYS, IDE_TITLES_TO_KEYS_MAP } from '@/shared/constants'
import { pathToIDEFilePath } from '@/shared/lib/helpers/pathToIDEFilePath'
import { THEME_MODES, useSettingsStore } from '@/shared/stores'
import { EventDetailLayout, EventDetailSection, IconSvg } from '@/shared/ui'
import { version } from '../../../../../package.json' with { type: 'json' }

const settingsStore = useSettingsStore()
const { changeNavbar, changeEventCountsVisibility, changeActiveCodeEditor } = settingsStore
const { themeType, isFixedHeader, isVisibleEventCounts, codeEditor, apiVersion } =
  storeToRefs(settingsStore)

const isDarkMode = computed(() => themeType.value === THEME_MODES.DARK)

const setThemeMode = (mode: string) => {
  if (mode === 'system') {
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if ((isSystemDark && !isDarkMode.value) || (!isSystemDark && isDarkMode.value)) {
      settingsStore.changeTheme()
    }
  } else if (mode === 'dark' && !isDarkMode.value) {
    settingsStore.changeTheme()
  } else if (mode === 'light' && isDarkMode.value) {
    settingsStore.changeTheme()
  }
}

const activeThemeOption = computed(() => {
  return isDarkMode.value ? 'dark' : 'light'
})

const changeCodeEditor = (event: Event) => {
  const editor = (event.target as HTMLInputElement).value as IDE_KEYS
  changeActiveCodeEditor(editor)
}

const clientVersion = ref(!version || version === '0.0.1' ? '@dev' : `v${version}`)

const serverVersion = computed(() =>
  String(apiVersion.value).match(/^[0-9.]+.*$/) ? `v${apiVersion.value}` : `@${apiVersion.value}`
)

useTitle('Settings | Buggregator')
</script>

<template>
  <EventDetailLayout title="Settings">
    <!-- Appearance -->
    <EventDetailSection title="Appearance">
      <div class="s-card">
        <div class="s-row">
          <div class="s-row__info">
            <div class="s-row__label">
              Theme
            </div>
            <div class="s-row__desc">
              Choose how Buggregator looks to you
            </div>
          </div>
          <div class="s-segmented">
            <button
              class="s-segmented__opt"
              :class="{ 's-segmented__opt--active': activeThemeOption === 'light' }"
              @click="setThemeMode('light')"
            >
              <IconSvg
                name="sun"
                class="s-segmented__icon"
              />
              Light
            </button>
            <button
              class="s-segmented__opt"
              :class="{ 's-segmented__opt--active': activeThemeOption === 'dark' }"
              @click="setThemeMode('dark')"
            >
              <IconSvg
                name="moon"
                class="s-segmented__icon"
              />
              Dark
            </button>
            <button
              class="s-segmented__opt"
              @click="setThemeMode('system')"
            >
              System
            </button>
          </div>
        </div>

        <div class="s-row">
          <div class="s-row__info">
            <div class="s-row__label">
              Pin header
            </div>
            <div class="s-row__desc">
              Keep the header bar visible while scrolling
            </div>
          </div>
          <button
            class="s-toggle"
            :class="{ 's-toggle--active': isFixedHeader }"
            role="switch"
            :aria-checked="isFixedHeader"
            aria-label="Pin header to top of page"
            @click="changeNavbar"
          >
            <span class="s-toggle__knob" />
          </button>
        </div>

        <div class="s-row">
          <div class="s-row__info">
            <div class="s-row__label">
              Event counts
            </div>
            <div class="s-row__desc">
              Show event count badges on sidebar navigation items
            </div>
          </div>
          <button
            class="s-toggle"
            :class="{ 's-toggle--active': isVisibleEventCounts }"
            role="switch"
            :aria-checked="isVisibleEventCounts"
            aria-label="Show event counts in sidebar"
            @click="changeEventCountsVisibility"
          >
            <span class="s-toggle__knob" />
          </button>
        </div>
      </div>
    </EventDetailSection>

    <!-- Editor Integration -->
    <EventDetailSection title="Editor Integration">
      <div class="s-card">
        <div class="s-row">
          <div class="s-row__info">
            <div class="s-row__label">
              Code editor
            </div>
            <div class="s-row__desc">
              Click file paths in events to open them in your editor
            </div>
          </div>
          <select
            class="s-select"
            :value="codeEditor"
            aria-label="Code editor"
            @change="changeCodeEditor"
          >
            <option
              v-for="(title, key) in IDE_TITLES_TO_KEYS_MAP"
              :key="key"
              :value="key"
            >
              {{ title }}
            </option>
          </select>
        </div>

        <div class="s-row s-row--compact">
          <span class="s-row__hint">Example link:</span>
          <code class="s-row__code">
            {{ pathToIDEFilePath(codeEditor, '/App/Modules/Logger.php', 12) }}
          </code>
        </div>
      </div>
    </EventDetailSection>

    <!-- About -->
    <EventDetailSection title="About">
      <div class="s-card">
        <div class="s-about-boxes">
          <div class="s-about-box">
            <span class="s-about-box__label">Server</span>
            <span class="s-about-box__value">{{ serverVersion || '—' }}</span>
          </div>
          <div class="s-about-box">
            <span class="s-about-box__label">Client</span>
            <span class="s-about-box__value">{{ clientVersion || '—' }}</span>
          </div>
        </div>

        <div class="s-links">
          <a
            href="https://github.com/buggregator"
            target="_blank"
            class="s-links__item"
          >
            <IconSvg
              name="github"
              class="s-links__icon"
            />
            GitHub
          </a>
          <a
            href="https://docs.buggregator.dev"
            target="_blank"
            class="s-links__item"
          >
            <IconSvg
              name="docs"
              class="s-links__icon"
            />
            Documentation
          </a>
          <a
            href="https://discord.gg/vDsCD3EKUB"
            target="_blank"
            class="s-links__item"
          >
            <IconSvg
              name="discord"
              class="s-links__icon"
            />
            Discord
          </a>
        </div>
      </div>
    </EventDetailSection>
  </EventDetailLayout>
</template>

<style lang="scss" scoped>
/* Card container — matches Sentry/HTTP Dump section blocks */
.s-card {
  @apply rounded overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
  @apply divide-y divide-gray-200 dark:divide-gray-700;
}

/* Rows */
.s-row {
  @apply flex items-center justify-between;
  @apply px-4 py-3;
  @apply bg-white dark:bg-gray-800;
}

.s-row--compact {
  @apply py-2;
}

.s-row__info {
  @apply flex-1 mr-4;
}

.s-row__label {
  @apply text-sm font-medium;
}

.s-row__desc {
  @apply text-xs text-gray-500 dark:text-gray-400 mt-0.5;
}

.s-row__hint {
  @apply text-xs text-gray-400 dark:text-gray-500 mr-2;
}

.s-row__code {
  @apply text-xs font-mono text-blue-600 dark:text-blue-400 break-all;
}

/* Toggle */
.s-toggle {
  @apply relative inline-flex h-6 w-11 items-center rounded-full flex-shrink-0 cursor-pointer;
  @apply bg-gray-300 dark:bg-gray-600;
  @apply transition-colors duration-200;
}

.s-toggle--active {
  @apply bg-blue-500 dark:bg-blue-600;
}

.s-toggle__knob {
  @apply inline-block h-4 w-4 transform rounded-full bg-white shadow-sm;
  @apply transition-transform duration-200;
  @apply translate-x-1;

  .s-toggle--active & {
    @apply translate-x-6;
  }
}

/* Segmented control */
.s-segmented {
  @apply inline-flex rounded-lg p-0.5;
  @apply bg-gray-100 dark:bg-gray-700;
}

.s-segmented__opt {
  @apply px-3 py-1.5 text-xs font-medium rounded-md;
  @apply text-gray-600 dark:text-gray-400;
  @apply transition-all duration-150 cursor-pointer;
  @apply flex items-center gap-1.5;

  &:hover {
    @apply text-gray-800 dark:text-gray-200;
  }
}

.s-segmented__opt--active {
  @apply bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm;
}

.s-segmented__icon {
  @apply w-3.5 h-3.5;
}

/* Select */
.s-select {
  @apply text-sm rounded-md px-3 py-1.5;
  @apply bg-gray-50 dark:bg-gray-700;
  @apply border border-gray-200 dark:border-gray-600;
  @apply text-gray-800 dark:text-gray-200;
  @apply min-w-[160px];
}

/* About boxes */
.s-about-boxes {
  @apply flex gap-0;
  @apply divide-x divide-gray-200 dark:divide-gray-700;
  @apply bg-white dark:bg-gray-800;
}

.s-about-box {
  @apply flex flex-col flex-1 px-4 py-3;
}

.s-about-box__label {
  @apply text-2xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500;
}

.s-about-box__value {
  @apply text-sm font-mono mt-1;
}

/* Links */
.s-links {
  @apply flex gap-4 px-4 py-3;
  @apply bg-gray-50 dark:bg-gray-900;
}

.s-links__item {
  @apply flex items-center gap-1.5 text-xs;
  @apply text-gray-500 dark:text-gray-400;
  @apply hover:text-blue-600 dark:hover:text-blue-400;
  @apply transition-colors;
}

.s-links__icon {
  @apply w-4 h-4;
}
</style>
