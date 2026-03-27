<script lang="ts" setup>
import { computed, ref } from 'vue'
import { IconSvg } from '@/shared/ui'

type Props = {
  modules: Record<string, string>
  platform?: string
}

const props = defineProps<Props>()

const search = ref('')

const moduleList = computed(() => {
  const mods = Object.entries(props.modules)
    .map(([name, version]) => ({ name, version }))
    .sort((a, b) => a.name.localeCompare(b.name))

  if (!search.value) return mods

  const q = search.value.toLowerCase()
  return mods.filter((m) => m.name.toLowerCase().includes(q) || m.version.toLowerCase().includes(q))
})

const totalCount = computed(() => Object.keys(props.modules).length)

const clearSearch = () => {
  search.value = ''
}

// Extract vendor/org prefix for grouping visual hint
const getVendor = (name: string) => {
  const slash = name.indexOf('/')
  return slash > 0 ? name.slice(0, slash) : null
}

const getPackage = (name: string) => {
  const slash = name.indexOf('/')
  return slash > 0 ? name.slice(slash + 1) : name
}

const getPackageUrl = (name: string) => {
  if (name.includes('/')) {
    return `https://packagist.org/packages/${name}`
  }
  if (props.platform === 'python') {
    return `https://pypi.org/project/${name}/`
  }
  return null
}
</script>

<template>
  <section class="mod">
    <!-- Search bar -->
    <div class="mod__search-bar">
      <div class="mod__search-wrap">
        <IconSvg
          class="mod__search-icon"
          name="inspector"
        />
        <input
          v-model="search"
          type="text"
          class="mod__search-input"
          :placeholder="`Search ${totalCount} modules...`"
        >
        <button
          v-if="search"
          class="mod__search-clear"
          @click="clearSearch"
        >
          <IconSvg
            class="mod__search-clear-icon"
            name="times"
          />
        </button>
      </div>

      <span class="mod__result-count">
        {{ moduleList.length === totalCount ? totalCount : `${moduleList.length} / ${totalCount}` }}
      </span>
    </div>

    <!-- Table -->
    <div class="mod__table">
      <div class="mod__table-head">
        <span class="mod__table-th mod__table-th--name">Package</span>
        <span class="mod__table-th mod__table-th--version">Version</span>
      </div>

      <div class="mod__table-body">
        <div
          v-for="mod in moduleList"
          :key="mod.name"
          class="mod__row"
        >
          <span class="mod__cell mod__cell--name">
            <a
              v-if="getPackageUrl(mod.name)"
              :href="getPackageUrl(mod.name)"
              target="_blank"
              rel="noopener noreferrer"
              class="mod__link"
            >
              <span class="mod__vendor">{{ getVendor(mod.name) }}/</span>{{ getPackage(mod.name) }}
              <IconSvg
                class="mod__link-icon"
                name="newScreen"
              />
            </a>
            <span v-else>
              {{ mod.name }}
            </span>
          </span>
          <span class="mod__cell mod__cell--version">{{ mod.version }}</span>
        </div>

        <div
          v-if="moduleList.length === 0"
          class="mod__empty"
        >
          No modules matching "{{ search }}"
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
/* Search */
.mod__search-bar {
  @apply flex items-center justify-between gap-3 mb-4;
}

.mod__search-wrap {
  @apply relative flex-1 max-w-sm;
}

.mod__search-icon {
  @apply absolute left-2.5 top-1/2 -translate-y-1/2;
  @apply w-3.5 h-3.5 text-gray-400 dark:text-gray-500;
  @apply fill-current;
  pointer-events: none;
}

.mod__search-input {
  @apply w-full text-xs pl-8 pr-8 py-2 rounded-lg;
  @apply border border-gray-200 dark:border-gray-700;
  @apply bg-white dark:bg-gray-900;
  @apply text-gray-700 dark:text-gray-200;
  @apply placeholder-gray-400 dark:placeholder-gray-500;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400/50;
  @apply transition-shadow duration-150;
}

.mod__search-clear {
  @apply absolute right-2 top-1/2 -translate-y-1/2;
  @apply w-5 h-5 flex items-center justify-center rounded-full;
  @apply text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300;
  @apply hover:bg-gray-100 dark:hover:bg-gray-800;
  @apply cursor-pointer transition-colors;
}

.mod__search-clear-icon {
  @apply w-3 h-3 fill-current;
}

.mod__result-count {
  @apply text-2xs font-mono text-gray-400 dark:text-gray-500 flex-shrink-0;
}

/* Table */
.mod__table {
  @apply rounded-lg overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
  max-height: 600px;
  @apply flex flex-col;
}

.mod__table-head {
  @apply flex text-2xs font-medium uppercase tracking-wide;
  @apply text-gray-400 dark:text-gray-500;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply flex-shrink-0;
}

.mod__table-th {
  @apply px-3 py-2;
}

.mod__table-th--name {
  @apply flex-1;
}

.mod__table-th--version {
  @apply w-36 text-right;
}

.mod__table-body {
  @apply overflow-y-auto flex-1;
  @apply divide-y divide-gray-100 dark:divide-gray-800;
}

.mod__row {
  @apply flex items-center text-xs;
  @apply hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors;
}

.mod__cell {
  @apply px-3 py-1.5;
}

.mod__cell--name {
  @apply flex-1 font-medium truncate;
}

.mod__link {
  @apply inline-flex items-center gap-1;
  @apply hover:text-blue-600 dark:hover:text-blue-400 transition-colors;
}

.mod__link-icon {
  @apply w-3 h-3 opacity-0 flex-shrink-0;
  @apply fill-current text-gray-400 dark:text-gray-500;
  transition: opacity 0.1s;

  .mod__row:hover & {
    @apply opacity-100;
  }
}

.mod__vendor {
  @apply text-gray-400 dark:text-gray-500 font-normal;
}

.mod__cell--version {
  @apply w-36 text-right font-mono text-gray-500 dark:text-gray-400;
}

.mod__empty {
  @apply px-3 py-6 text-center text-xs text-gray-400 dark:text-gray-500 italic;
}
</style>
