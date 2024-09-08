<script lang="ts" setup>
import { PageHeader, LayoutPreviewEvents } from '@/widgets/ui'
import { PAGE_TYPES } from '@/shared/constants'
</script>

<template>
  <NuxtLayout>
    <template #header>
      <PageHeader :type="PAGE_TYPES.Smtp" title="Smtp" />
    </template>

    <LayoutPreviewEvents :type="PAGE_TYPES.Smtp" title="Smtp" />
  </NuxtLayout>
</template>
