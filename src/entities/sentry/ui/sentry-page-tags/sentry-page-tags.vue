<script lang="ts" setup>
import { computed, ref } from 'vue'
import { IconSvg } from '@/shared/ui'
import type { Sentry, SentryContextRuntime, SentryContexts } from '../../types'

type Props = {
  payload: Sentry
}

const props = defineProps<Props>()

const isModulesOpen = ref(false)

const contextsRuntime = computed(() => {
  const { name = '', version = '' } =
    (props.payload.contexts?.runtime as SentryContextRuntime) || {}

  return { name, version }
})

const contextsOS = computed(() => {
  const { name = '', version = '' } = (props.payload.contexts?.os as SentryContexts['os']) || {}

  return { name, version }
})

const boxes = computed(() => [
  {
    title: 'Runtime',
    name: contextsRuntime.value.name,
    version: contextsRuntime.value.version
  },
  {
    title: 'OS',
    name: contextsOS.value.name,
    version: contextsOS.value.version
  },
  {
    title: 'SDK',
    name: props.payload.sdk?.name,
    version: props.payload.sdk?.version
  }
])

const tags = computed(() => [
  { name: 'env', value: props.payload.environment },
  { name: 'logger', value: props.payload.logger },
  { name: 'os', value: `${contextsOS.value.name} ${contextsOS.value.version}` },
  { name: 'runtime', value: `${contextsRuntime.value.name} ${contextsRuntime.value.version}` },
  { name: 'server', value: props.payload.server_name }
])

const modules = computed(() => {
  const mods = props.payload.modules || {}
  return Object.keys(mods).map((name) => ({ name, version: mods[name] }))
})
</script>

<template>
  <section class="tags-section">
    <!-- Context boxes -->
    <div class="tags-section__boxes">
      <div
        v-for="box in boxes"
        :key="box.title"
        class="tags-section__box"
      >
        <span class="tags-section__box-label">{{ box.title }}</span>
        <span class="tags-section__box-name">{{ box.name }}</span>
        <span class="tags-section__box-version">{{ box.version }}</span>
      </div>
    </div>

    <!-- Tags -->
    <div class="tags-section__group">
      <h3 class="tags-section__title">
        Tags
      </h3>
      <div class="tags-section__pills">
        <div
          v-for="tag in tags"
          :key="tag.name"
          class="tags-section__pill"
        >
          <span class="tags-section__pill-key">{{ tag.name }}</span>
          <span class="tags-section__pill-value">{{ tag.value }}</span>
        </div>

        <template v-if="payload.tags">
          <div
            v-for="(name, value) in payload.tags"
            :key="value"
            class="tags-section__pill"
          >
            <span class="tags-section__pill-key">{{ value }}</span>
            <span class="tags-section__pill-value">{{ name || '—' }}</span>
          </div>
        </template>
      </div>
    </div>

    <!-- Modules -->
    <div
      v-if="modules.length"
      class="tags-section__group"
    >
      <h3
        class="tags-section__title tags-section__title--toggle"
        @click="isModulesOpen = !isModulesOpen"
      >
        Modules
        <span class="tags-section__count">{{ modules.length }}</span>
        <IconSvg
          class="tags-section__chevron"
          :class="{ 'tags-section__chevron--open': isModulesOpen }"
          name="collapsed"
        />
      </h3>
      <div
        v-if="isModulesOpen"
        class="tags-section__pills"
      >
        <div
          v-for="mod in modules"
          :key="mod.name"
          class="tags-section__pill"
        >
          <span class="tags-section__pill-key">{{ mod.name }}</span>
          <span class="tags-section__pill-value">{{ mod.version }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
/* Context boxes */
.tags-section__boxes {
  @apply flex flex-col sm:flex-row gap-2 mb-4;
}

.tags-section__box {
  @apply flex flex-col flex-1 p-3 rounded;
  @apply border border-gray-200 dark:border-gray-700;
  @apply bg-gray-50 dark:bg-gray-900;
}

.tags-section__box-label {
  @apply text-2xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500;
}

.tags-section__box-name {
  @apply text-sm font-semibold mt-0.5;
}

.tags-section__box-version {
  @apply text-xs font-mono text-gray-500 dark:text-gray-400;
}

/* Groups */
.tags-section__group {
  @apply rounded overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
  @apply p-3;

  & + & {
    @apply mt-3;
  }
}

.tags-section__title {
  @apply text-xs font-mono font-semibold uppercase tracking-wider;
  @apply text-gray-500 dark:text-gray-400;
  @apply flex items-center gap-2;
}

.tags-section__title--toggle {
  @apply cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors;
}

.tags-section__count {
  @apply text-2xs px-1.5 py-0.5 rounded-full;
  @apply bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400;
}

.tags-section__chevron {
  @apply w-3.5 h-3.5 ml-auto;
  transition: transform 0.15s ease;
}

.tags-section__chevron--open {
  transform: rotate(180deg);
}

/* Pills */
.tags-section__pills {
  @apply flex flex-wrap gap-1.5 mt-2;
}

.tags-section__pill {
  @apply inline-flex items-center text-xs rounded overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
}

.tags-section__pill-key {
  @apply px-2 py-1 text-gray-500 dark:text-gray-400;
  @apply bg-gray-50 dark:bg-gray-800;
}

.tags-section__pill-value {
  @apply px-2 py-1 font-mono font-medium;
  @apply bg-white dark:bg-gray-900;
}
</style>
