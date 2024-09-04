<script lang="ts" setup>
import { PageHeader, PageLayout } from '@/widgets/ui' // eslint-disable-line @conarti/feature-sliced/public-api
import { PAGE_TYPES } from '@/shared/constants'
</script>

<template>
  <NuxtLayout>
    <template #header>
      <PageHeader :type="PAGE_TYPES.ALL_EVENTS" title="" />
    </template>

    <PageLayout :type="PAGE_TYPES.ALL_EVENTS" title="" />
  </NuxtLayout>
</template>
