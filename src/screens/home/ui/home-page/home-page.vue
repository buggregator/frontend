<script lang="ts" setup>
import { PageHeader, PageContent, LayoutBase, LayoutSidebar } from '@/widgets/ui'
import { PAGE_TYPES } from '@/shared/constants'
</script>

<template>
  <LayoutBase class="home-page">
    <template #sidebar>
      <LayoutSidebar />
    </template>

    <template #header>
      <PageHeader :type="PAGE_TYPES.ALL_EVENTS" title="" />
    </template>

    <PageContent :type="PAGE_TYPES.ALL_EVENTS" title="" />
  </LayoutBase>
</template>

<style lang="scss" scoped>
.home-page {
  display: block;
}
</style>
