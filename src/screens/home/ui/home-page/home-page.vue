<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { PageHeader, LayoutPreviewEvents, LayoutBase, LayoutSidebar } from '@/widgets/ui'
import { ALL_EVENT_TYPES, PAGE_TYPES, PAGES_SETTINGS } from '@/shared/constants'
import type { PageEventTypes } from '@/shared/types'

const route = useRoute()

const routeName = computed(() => String(route.name) as PageEventTypes)

const title = computed(() => (routeName.value ? PAGES_SETTINGS[routeName.value]?.title : ''))

const type = computed(() =>
  routeName.value ? PAGES_SETTINGS[routeName.value]?.eventType : ALL_EVENT_TYPES
)
</script>

<template>
  <LayoutBase class="home-page">
    <template #sidebar>
      <LayoutSidebar />
    </template>

    <template #header>
      <PageHeader :type="type" :title="title" />
    </template>

    <LayoutPreviewEvents :type="type" :title="title" />
  </LayoutBase>
</template>

<style lang="scss" scoped>
.home-page {
  display: block;
}
</style>
