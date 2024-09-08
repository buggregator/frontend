<script lang="ts" setup>
import { PageHeader, LayoutPreviewEvents } from '@/widgets/ui'
import { PAGE_TYPES } from '@/shared/constants'
</script>

<template>
  <NuxtLayout>
    <template #header>
      <PageHeader :type="PAGE_TYPES.Monolog" title="Monolog" />
    </template>

    <LayoutPreviewEvents :type="PAGE_TYPES.Monolog" title="Monolog" />
  </NuxtLayout>
</template>
