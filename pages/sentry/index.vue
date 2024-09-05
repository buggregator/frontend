<script lang="ts" setup>
import { PageHeader, PageContent } from '@/widgets/ui'
import { PAGE_TYPES } from '@/shared/constants'
</script>

<template>
  <NuxtLayout>
    <template #header>
      <PageHeader :type="PAGE_TYPES.SENTRY" title="Sentry" />
    </template>

    <PageContent :type="PAGE_TYPES.SENTRY" title="Sentry" />
  </NuxtLayout>
</template>
