<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { IDE_KEYS, IDE_TITLES_TO_KEYS_MAP } from '@/shared/constants'
import { pathToIDEFilePath } from '@/shared/lib/helpers/pathToIDEFilePath'
import { THEME_MODES, useSettingsStore } from '@/shared/stores'
import type { FilePathMapping } from '@/shared/types'
import { EventDetailLayout, EventDetailSection, IconSvg } from '@/shared/ui'
import { version } from '../../../../../package.json' with { type: 'json' }

const settingsStore = useSettingsStore()
const {
  changeNavbar,
  changeEventCountsVisibility,
  changeActiveCodeEditor,
  setCustomFilePathMapping
} = settingsStore
const {
  themeType,
  isFixedHeader,
  isVisibleEventCounts,
  customFilePathMapping,
  codeEditor,
  apiVersion
} = storeToRefs(settingsStore)

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

const isActiveCustomMapping = ref(customFilePathMapping.value.length > 0)

const changeActiveCustomMapping = () => {
  isActiveCustomMapping.value = !isActiveCustomMapping.value
}

const newFilePathMapping = ref<FilePathMapping>({ source_path: '', target_path: '' })

const setSourcePath = (event: Event) => {
  newFilePathMapping.value.source_path = (event.target as HTMLInputElement).value
}
const setTargetPath = (event: Event) => {
  newFilePathMapping.value.target_path = (event.target as HTMLInputElement).value
}

// const localFilePathMapping = ref(customFilePathMapping.value);

const clearMapping = (index: number) => {
  // localFilePathMapping.value.splice(index, 1);
  setCustomFilePathMapping(customFilePathMapping.value.filter((_, i) => i !== index))
}

const isVisibleSaveButton = computed(
  () =>
    newFilePathMapping.value.source_path.trim() !== '' &&
    newFilePathMapping.value.target_path.trim() !== ''
)

const saveMapping = () => {
  if (isVisibleSaveButton.value) {
    // localFilePathMapping.value.push({ ...newFilePathMapping.value });
    setCustomFilePathMapping([...customFilePathMapping.value, { ...newFilePathMapping.value }])
    newFilePathMapping.value = { source_path: '', target_path: '' }
  }
}

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

        <div class="s-row">
          <div class="s-row__info">
            <div class="s-row__label">
              Enable Custom File Path Mapping
            </div>
            <div class="s-row__desc">
              Map event file paths to your local project structure automatically, making it possible
              to open files outside your project root or with different path prefixes.
            </div>
          </div>
          <button
            class="s-toggle"
            :class="{ 's-toggle--active': isActiveCustomMapping }"
            role="switch"
            :aria-checked="isActiveCustomMapping"
            aria-label="Enable custom file path mapping"
            @click="changeActiveCustomMapping"
          >
            <span class="s-toggle__knob" />
          </button>
        </div>

        <div
          v-if="isActiveCustomMapping"
          class="s-row s-row--multiline"
        >
          <div
            v-for="(pathMap, index) in customFilePathMapping"
            :key="`${pathMap.source_path}=>${pathMap.target_path}`"
            class="s-row__info s-row__info--mapping"
          >
            <div class="s-row__label">
              <span class="s-row__hint">Source</span>

              {{ pathMap.source_path }}
            </div>

            <div class="s-row__label">
              <span class="s-row__hint">Target</span>

              {{ pathMap.target_path }}
            </div>

            <button
              class="s-row__action"
              title="Remove mapping"
              aria-label="Remove mapping"
              @click="clearMapping(index)"
            >
              <IconSvg
                name="minus"
                class="s-row__action-icon"
              />
              <span class="action-btn__text sr-only">Clear</span>
            </button>
          </div>

          <div class="s-row__info s-row__info--mapping">
            <label class="s-row__label">
              <span class="s-row__hint">Source</span>

              <input
                class="s-row__input"
                :value="newFilePathMapping.source_path"
                @input="setSourcePath"
              >
            </label>

            <label class="s-row__label">
              <span class="s-row__hint">Target</span>
              <input
                class="s-row__input"
                :value="newFilePathMapping.target_path"
                @input="setTargetPath"
              >
            </label>

            <button
              class="s-row__action"
              title="Save mapping"
              aria-label="Save mapping"
              :disabled="!isVisibleSaveButton"
              @click="saveMapping"
            >
              <IconSvg
                name="plus"
                class="s-row__action-icon"
              />
              <span class="action-btn__text sr-only">Save</span>
            </button>
          </div>
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

.s-row--multiline {
  @apply flex-col items-start gap-3;
}

.s-row--compact {
  @apply py-2;
}

.s-row__info {
  @apply flex-1 mr-4;
}

.s-row__info--mapping {
  @apply flex flex-row gap-2 mr-0 min-w-full items-start;
}

.s-row__label {
  @apply text-sm font-medium w-full;
}

.s-row__input {
  @apply text-sm font-medium h-7;
  @apply bg-transparent text-xs flex-1 w-full;
  @apply text-gray-800 dark:text-gray-200;
  @apply placeholder-gray-400 dark:placeholder-gray-500;
  @apply border border-gray-300 dark:border-gray-600 rounded px-2 py-1;
}

.s-row__action {
  @apply h-7 flex items-center gap-1.5 px-2.5 rounded;
  @apply text-xs font-medium;
  @apply text-gray-500 dark:text-gray-400;
  @apply bg-gray-100 dark:bg-gray-700;
  @apply hover:text-gray-700 dark:hover:text-gray-200;
  @apply hover:bg-gray-200 dark:hover:bg-gray-600;
  @apply transition-colors cursor-pointer mt-auto;

  &:disabled {
    @apply opacity-50 pointer-events-none;
  }
}

.s-row__action-icon {
  @apply w-3 h-3;
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
