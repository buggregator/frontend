<script lang="ts" setup>
import { PageHeader, PageContent } from '@/widgets/ui'
import { PAGE_TYPES } from '@/shared/constants'
</script>

<template>
  <NuxtLayout>
    <template #header>
      <PageHeader :type="PAGE_TYPES.HTTP_DUMP" title="Http-dump" />
    </template>

    <PageContent :type="PAGE_TYPES.HTTP_DUMP" title="Http-dump" />
  </NuxtLayout>
</template>
