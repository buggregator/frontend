<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { PageHeader, LayoutBase, LayoutSidebar } from '@/widgets/ui'
import { PAGE_TYPES } from '@/shared/constants'
import { SettingsPageContent } from '../settings-page-content'

useTitle('Settings | Buggregator')
</script>

<template>
  <LayoutBase class="settings-page">
    <template #sidebar>
      <LayoutSidebar />
    </template>

    <template #header>
      <PageHeader :type="PAGE_TYPES.ALL_EVENT_TYPES" title="Settings" />
    </template>

    <SettingsPageContent />
  </LayoutBase>
</template>

<style lang="scss" scoped>
@import 'src/assets/mixins';

.settings-page {
  display: block;
}
</style>
