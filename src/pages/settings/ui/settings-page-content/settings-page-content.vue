<script lang="ts" setup>
import { useNow, useTitle } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, provide, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { UpdatePanel, useServerUpdateStore } from '@/entities/server-update'
import {
  IDE_KEYS,
  IDE_TITLES_TO_KEYS_MAP,
  SETTINGS_ITEMS,
  SETTINGS_SECTIONS
} from '@/shared/constants'
import { pathToIDEFilePath } from '@/shared/lib/helpers/pathToIDEFilePath'
import { useSettingsStore } from '@/shared/stores'
import type { FilePathMapping } from '@/shared/types'
import { EventDetailLayout, EventDetailSection, IconSvg, SearchBar } from '@/shared/ui'
import { version } from '../../../../../package.json' with { type: 'json' }
import { SETTINGS_SEARCH, useSettingsSearch } from '../../lib/settings-search'
import { useSectionSpy } from '../../lib/use-section-spy'
import { SettingsDesktopNotifications } from '../settings-desktop-notifications'
import { SettingsMenuItems } from '../settings-menu-items'
import { SettingsRow } from '../settings-row'
import { SettingsSwitch } from '../settings-switch'

const settingsStore = useSettingsStore()
const {
  changeNavbar,
  changeEventCountsVisibility,
  changeSingleKeyShortcuts,
  changeKeyHints,
  changeActiveCodeEditor,
  setCustomFilePathMapping,
  changeIsActiveFilePathMapping
} = settingsStore
const {
  themeMode,
  isFixedHeader,
  isVisibleEventCounts,
  isSingleKeyShortcutsEnabled,
  isKeyHintsEnabled,
  customFilePathMapping,
  isActiveFilePathMapping,
  codeEditor,
  apiVersion,
  update
} = storeToRefs(settingsStore)

// GET /api/update: null on older servers, which keep the About block as it was.
const updateStore = useServerUpdateStore()
const {
  status: updateStatus,
  loadedVersion,
  checking,
  checkMessage,
  starting,
  actionError,
  restartGaveUp,
  checkAvailableAt
} = storeToRefs(updateStore)
// «Last checked 2 h ago» and the Check now countdown move on while the page is open.
const now = useNow({ interval: 1000 })

const THEME_OPTIONS = [
  { mode: 'light', label: 'Light', icon: 'sun' },
  { mode: 'dark', label: 'Dark', icon: 'moon' },
  { mode: 'system', label: 'System', icon: '' }
] as const

// «About & updates» needs GET /api/update; older servers show «About».
const sections = computed(() =>
  SETTINGS_SECTIONS.map((section) =>
    section.id === 'updates' && !updateStatus.value ? { ...section, title: 'About' } : section
  )
)

const search = useSettingsSearch(() => sections.value)
provide(SETTINGS_SEARCH, search)
const { query, matches } = search

const isSearching = computed(() => query.value.trim() !== '')
const sectionMatches = (id: string) =>
  sections.value.find((s) => s.id === id)?.items.some((item) => matches.value.has(item.id)) ?? false
const matchCount = computed(() => matches.value.size)
const searchStatus = computed(() => {
  if (!isSearching.value) return ''
  if (matchCount.value === 0) return 'No settings match.'
  return matchCount.value === 1 ? '1 setting matches.' : `${matchCount.value} settings match.`
})

const mainRef = ref<HTMLElement | null>(null)
const clearSearch = () => {
  query.value = ''
  mainRef.value?.querySelector<HTMLInputElement>('input[aria-label="Search settings"]')?.focus()
}

// The list on the left (tabs on a phone) jumps to a section and moves the
// focus there, so Tab goes on inside it.
const router = useRouter()
const route = useRoute()
const { active: activeSection, setActive } = useSectionSpy(
  () => sections.value.map((s) => s.id),
  () => route?.hash ?? ''
)
const goToSection = (id: string) => {
  const el = document.getElementById(id)
  if (!el) return
  setActive(id)
  el.scrollIntoView({ block: 'start' })
  el.focus({ preventScroll: true })
  router.replace({ hash: `#${id}` })
}

const changeCodeEditor = (event: Event) => {
  const editor = (event.target as HTMLInputElement).value as IDE_KEYS
  changeActiveCodeEditor(editor)
}

const clientVersion = ref(!version || version === '0.0.1' ? '@dev' : `v${version}`)

const serverVersion = computed(() =>
  String(apiVersion.value).match(/^[0-9.]+.*$/) ? `v${apiVersion.value}` : `@${apiVersion.value}`
)

const changeActiveCustomMapping = () => {
  changeIsActiveFilePathMapping(!isActiveFilePathMapping.value)
}

const newFilePathMapping = ref<FilePathMapping>({ source_path: '', target_path: '' })

const setSourcePath = (event: Event) => {
  newFilePathMapping.value.source_path = (event.target as HTMLInputElement).value
}
const setTargetPath = (event: Event) => {
  newFilePathMapping.value.target_path = (event.target as HTMLInputElement).value
}

const clearMapping = (index: number) => {
  setCustomFilePathMapping(customFilePathMapping.value.filter((_, i) => i !== index))
}

const isVisibleSaveButton = computed(
  () =>
    newFilePathMapping.value.source_path.trim() !== '' &&
    newFilePathMapping.value.target_path.trim() !== ''
)

const saveMapping = () => {
  if (isVisibleSaveButton.value) {
    const trimmedMapping: FilePathMapping = {
      source_path: newFilePathMapping.value.source_path.trim(),
      target_path: newFilePathMapping.value.target_path.trim()
    }
    setCustomFilePathMapping([...customFilePathMapping.value, trimmedMapping])
    newFilePathMapping.value = { source_path: '', target_path: '' }
  }
}

useTitle('Settings | Buggregator')
</script>

<template>
  <EventDetailLayout title="Settings">
    <div class="settings">
      <nav
        class="settings__nav"
        aria-label="Settings sections"
      >
        <a
          v-for="section in sections"
          :key="section.id"
          :href="`#${section.id}`"
          class="settings__nav-link"
          :class="{
            'settings__nav-link--active': activeSection === section.id,
            'settings__nav-link--dim': isSearching && !sectionMatches(section.id)
          }"
          :aria-current="activeSection === section.id ? 'true' : undefined"
          @click.prevent="goToSection(section.id)"
        >
          {{ section.title }}
        </a>
      </nav>

      <div
        ref="mainRef"
        class="settings__main"
      >
        <SearchBar
          v-model="query"
          class="settings__search"
          placeholder="Search settings"
          label="Search settings"
        />
        <p
          class="sr-only"
          role="status"
        >
          {{ searchStatus }}
        </p>
        <p
          v-if="isSearching && matchCount === 0"
          class="settings__empty"
        >
          No settings match «{{ query.trim() }}».
          <button
            type="button"
            class="settings__clear"
            @click="clearSearch"
          >
            Clear search
          </button>
        </p>

        <EventDetailSection
          id="appearance"
          class="settings__section"
          title="Appearance"
          tabindex="-1"
        >
          <div class="s-card">
            <SettingsRow
              v-slot="{ labelId, hintId }"
              :item="SETTINGS_ITEMS.theme"
            >
              <div
                class="s-segmented"
                role="group"
                :aria-labelledby="labelId"
                :aria-describedby="hintId"
              >
                <button
                  v-for="option in THEME_OPTIONS"
                  :key="option.mode"
                  type="button"
                  class="s-segmented__opt"
                  :class="{ 's-segmented__opt--active': themeMode === option.mode }"
                  :aria-pressed="themeMode === option.mode"
                  @click="settingsStore.setThemeMode(option.mode)"
                >
                  <IconSvg
                    v-if="option.icon"
                    :name="option.icon"
                    class="s-segmented__icon"
                  />
                  {{ option.label }}
                </button>
              </div>
            </SettingsRow>

            <SettingsRow
              v-slot="{ labelId, hintId }"
              :item="SETTINGS_ITEMS.pinHeader"
            >
              <SettingsSwitch
                :checked="isFixedHeader"
                :aria-labelledby="labelId"
                :aria-describedby="hintId"
                @toggle="changeNavbar"
              />
            </SettingsRow>

            <SettingsRow
              v-slot="{ labelId, hintId }"
              :item="SETTINGS_ITEMS.eventCounts"
            >
              <SettingsSwitch
                :checked="isVisibleEventCounts"
                :aria-labelledby="labelId"
                :aria-describedby="hintId"
                @toggle="changeEventCountsVisibility"
              />
            </SettingsRow>
          </div>
        </EventDetailSection>

        <EventDetailSection
          id="notifications"
          class="settings__section"
          title="Notifications"
          tabindex="-1"
        >
          <div class="s-card">
            <SettingsDesktopNotifications />
          </div>
        </EventDetailSection>

        <EventDetailSection
          id="menu"
          class="settings__section"
          title="Menu"
          tabindex="-1"
        >
          <div class="s-card">
            <SettingsMenuItems />
          </div>
        </EventDetailSection>

        <EventDetailSection
          id="keyboard"
          class="settings__section"
          title="Keyboard"
          tabindex="-1"
        >
          <div class="s-card">
            <SettingsRow
              v-slot="{ labelId, hintId }"
              :item="SETTINGS_ITEMS.singleKey"
            >
              <SettingsSwitch
                :checked="isSingleKeyShortcutsEnabled"
                :aria-labelledby="labelId"
                :aria-describedby="hintId"
                @toggle="changeSingleKeyShortcuts"
              />
            </SettingsRow>

            <SettingsRow
              v-slot="{ labelId, hintId }"
              :item="SETTINGS_ITEMS.keyHints"
            >
              <SettingsSwitch
                :checked="isKeyHintsEnabled"
                :aria-labelledby="labelId"
                :aria-describedby="hintId"
                @toggle="changeKeyHints"
              />
            </SettingsRow>
          </div>
        </EventDetailSection>

        <EventDetailSection
          id="editor"
          class="settings__section"
          title="Editor"
          tabindex="-1"
        >
          <div class="s-card">
            <SettingsRow :item="SETTINGS_ITEMS.codeEditor">
              <template #default="{ labelId, hintId }">
                <select
                  class="s-select"
                  :value="codeEditor"
                  :aria-labelledby="labelId"
                  :aria-describedby="hintId"
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
              </template>

              <template #extra>
                <div class="s-example">
                  <span class="s-example__hint">Example link:</span>
                  <code class="s-example__code">
                    {{ pathToIDEFilePath(codeEditor, '/App/Modules/Logger.php', 12) }}
                  </code>
                </div>
              </template>
            </SettingsRow>

            <SettingsRow :item="SETTINGS_ITEMS.pathMapping">
              <template #default="{ labelId, hintId }">
                <SettingsSwitch
                  :checked="isActiveFilePathMapping"
                  :aria-labelledby="labelId"
                  :aria-describedby="hintId"
                  @toggle="changeActiveCustomMapping"
                />
              </template>

              <template #extra>
                <div
                  v-if="isActiveFilePathMapping"
                  class="s-mapping"
                >
                  <div
                    v-for="(pathMap, index) in customFilePathMapping"
                    :key="index"
                    class="s-mapping__row"
                  >
                    <div class="s-mapping__field">
                      <span class="s-mapping__hint">Source</span>
                      <span class="s-mapping__value">{{ pathMap.source_path }}</span>
                    </div>

                    <div class="s-mapping__field">
                      <span class="s-mapping__hint">Target</span>
                      <span class="s-mapping__value">{{ pathMap.target_path }}</span>
                    </div>

                    <button
                      type="button"
                      class="s-mapping__action"
                      title="Remove mapping"
                      aria-label="Remove mapping"
                      @click="clearMapping(index)"
                    >
                      <IconSvg
                        name="minus"
                        class="s-mapping__action-icon"
                      />
                    </button>
                  </div>

                  <div class="s-mapping__row">
                    <label class="s-mapping__field">
                      <span class="s-mapping__hint">Source</span>
                      <input
                        class="s-mapping__input"
                        :value="newFilePathMapping.source_path"
                        @input="setSourcePath"
                      >
                    </label>

                    <label class="s-mapping__field">
                      <span class="s-mapping__hint">Target</span>
                      <input
                        class="s-mapping__input"
                        :value="newFilePathMapping.target_path"
                        @input="setTargetPath"
                      >
                    </label>

                    <button
                      type="button"
                      class="s-mapping__action"
                      title="Save mapping"
                      aria-label="Save mapping"
                      :disabled="!isVisibleSaveButton"
                      @click="saveMapping"
                    >
                      <IconSvg
                        name="plus"
                        class="s-mapping__action-icon"
                      />
                    </button>
                  </div>
                </div>
              </template>
            </SettingsRow>
          </div>
        </EventDetailSection>

        <!-- About & updates (servers with /api/update) -->
        <EventDetailSection
          id="updates"
          class="settings__section"
          :class="{ 'settings__section--dim': isSearching && !sectionMatches('updates') }"
          :title="updateStatus ? 'About & updates' : 'About'"
          tabindex="-1"
        >
          <UpdatePanel
            v-if="updateStatus"
            :status="updateStatus"
            :loaded-version="loadedVersion"
            :checking="checking"
            :check-message="checkMessage"
            :starting="starting"
            :action-error="actionError"
            :restart-gave-up="restartGaveUp"
            :now="now.getTime()"
            :fallback-version="apiVersion"
            :check-available-at="checkAvailableAt"
            @check="updateStore.check()"
            @start="updateStore.start($event)"
            @reload="updateStore.reload()"
          />

          <div
            class="s-card"
            :class="{ 's-card--spaced': updateStatus }"
          >
            <div
              v-if="!updateStatus && update?.available"
              class="s-update"
              data-test="update-available"
            >
              <span class="s-update__text">Buggregator {{ update.latest }} is available (you run {{ update.current }})</span>
              <a
                :href="update.url"
                target="_blank"
                rel="noopener noreferrer"
                class="s-update__link"
              >
                Release notes<span class="sr-only"> (opens in a new tab)</span>
              </a>
            </div>

            <div class="s-about-boxes">
              <div
                v-if="!updateStatus"
                class="s-about-box"
              >
                <span class="s-about-box__label">Server</span>
                <span class="s-about-box__value">{{ serverVersion || '—' }}</span>
                <span
                  v-if="update && !update.available"
                  class="s-about-box__note"
                  data-test="update-current"
                >Up to date</span>
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
                rel="noopener noreferrer"
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
                rel="noopener noreferrer"
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
                rel="noopener noreferrer"
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
      </div>
    </div>
  </EventDetailLayout>
</template>

<style lang="scss" scoped>
/* Page: sections on the left, rows no wider than 640 px (#5874) */
.settings {
  @apply grid gap-6;
  grid-template-columns: 11rem minmax(0, 40rem);
}

/* A plain table of contents on one straight 1 px track (#5936): no
   backgrounds, no rounding; the active item is a 2 px segment of the
   track in the text colour. Blue stays for links and primary buttons. */
.settings__nav {
  @apply sticky top-5 self-start flex flex-col;
  @apply border-l border-gray-200 dark:border-gray-700;
}

.settings__nav-link {
  // Overlaps the track by 1 px, so the active 2 px edge sits on it.
  @apply block -ml-px border-l-2 border-transparent px-3 py-1.5 text-sm font-normal;
  @apply text-gray-500 dark:text-gray-400;
  @apply hover:text-gray-700 dark:hover:text-gray-200;
  @apply transition-colors;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400;
}

.settings__nav-link--active {
  @apply font-medium text-gray-800 dark:text-gray-100;
  @apply hover:text-gray-800 dark:hover:text-gray-100 border-current;
}

.settings__nav-link--dim {
  @apply opacity-40;
}

.settings__main {
  @apply flex flex-col gap-6 min-w-0;
}

.settings__search {
  @apply h-9 flex-none;
}

.settings__empty {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.settings__clear {
  @apply ml-1 underline underline-offset-2;
  @apply text-blue-700 dark:text-blue-300;
  @apply hover:text-blue-900 dark:hover:text-blue-100;
}

.settings__section {
  @apply outline-none;
  scroll-margin-top: 1.25rem;
}

.settings__section--dim {
  @apply opacity-40;
}

/* Phone: the sections become tabs on top */
@media (max-width: 767px) {
  .settings {
    @apply flex flex-col gap-4;
  }

  .settings__nav {
    @apply top-0 z-10 flex-row overflow-x-auto -mx-5 px-5 py-1 border-l-0;
    @apply bg-gray-50 dark:bg-gray-900;
    @apply border-b border-gray-200 dark:border-gray-700/50;
    scrollbar-width: none;
  }

  .settings__nav-link {
    @apply flex-none flex items-center min-h-[44px] ml-0 border-l-0 px-3;
  }

  .settings__nav-link--active {
    box-shadow: inset 0 -2px 0 currentColor;
  }

  .settings__section {
    scroll-margin-top: 3.5rem;
  }
}

/* Card container — matches Sentry/HTTP Dump section blocks */
.s-card {
  @apply rounded overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
  @apply divide-y divide-gray-200 dark:divide-gray-700;
}

.s-card--spaced {
  @apply mt-3;
}

/* Segmented control */
.s-segmented {
  @apply inline-flex rounded-lg p-0.5 flex-shrink-0;
  @apply bg-gray-100 dark:bg-gray-700;
}

.s-segmented__opt {
  @apply px-3 py-1.5 text-xs font-medium rounded-md;
  @apply text-gray-600 dark:text-gray-300;
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

/* Editor: example link and path mapping, under their rows */
.s-example {
  @apply flex flex-wrap items-baseline gap-x-2 mt-2;
}

.s-example__hint,
.s-mapping__hint {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.s-example__code {
  @apply text-xs font-mono text-blue-600 dark:text-blue-400 break-all;
}

.s-mapping {
  @apply flex flex-col gap-2 mt-3;
}

.s-mapping__row {
  @apply flex items-end gap-2;
}

.s-mapping__field {
  @apply flex flex-col gap-1 flex-1 min-w-0;
}

.s-mapping__value {
  @apply text-sm font-mono break-all;
}

.s-mapping__input {
  @apply h-7 w-full text-xs rounded px-2 py-1;
  @apply bg-transparent text-gray-800 dark:text-gray-200;
  @apply border border-gray-300 dark:border-gray-600;
}

.s-mapping__action {
  @apply h-7 w-7 flex items-center justify-center rounded flex-shrink-0;
  @apply text-gray-500 dark:text-gray-400;
  @apply bg-gray-100 dark:bg-gray-700;
  @apply hover:text-gray-700 dark:hover:text-gray-200;
  @apply hover:bg-gray-200 dark:hover:bg-gray-600;
  @apply transition-colors cursor-pointer;

  &:disabled {
    @apply opacity-50 pointer-events-none;
  }
}

.s-mapping__action-icon {
  @apply w-3 h-3;
}

/* Phone: 44 px to tap */
@media (max-width: 639px) {
  .settings__search {
    @apply h-11;
  }

  .s-segmented__opt {
    @apply min-h-[44px] px-4;
  }

  .s-select,
  .s-mapping__input {
    @apply h-11 text-sm;
  }

  .s-mapping__action {
    @apply h-11 w-11;
  }

  .s-links__item {
    @apply min-h-[44px];
  }
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
  @apply text-2xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400;
}

.s-about-box__value {
  @apply text-sm font-mono mt-1;
}

.s-about-box__note {
  @apply text-xs mt-0.5 text-gray-500 dark:text-gray-400;
}

/* Newer server release */
.s-update {
  @apply flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3;
  @apply bg-blue-50 dark:bg-blue-500/10;
  @apply text-sm text-blue-900 dark:text-blue-100;
}

.s-update__link {
  @apply text-sm font-medium underline;
  @apply text-blue-700 dark:text-blue-300;
  @apply hover:text-blue-900 dark:hover:text-blue-100;
}

/* Links */
.s-links {
  @apply flex flex-wrap gap-x-4 gap-y-1 px-4 py-3;
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
