<script lang="ts" setup>
import { PageHeader, PageLayout } from '@/widgets/ui'
import { PAGE_TYPES } from '@/shared/constants'
</script>

<template>
  <NuxtLayout>
    <template #header>
      <PageHeader :type="PAGE_TYPES.RAY_DUMP" title="Ray Dumps" />
    </template>

    <PageLayout :type="PAGE_TYPES.RAY_DUMP" title="Ray Dumps" />
  </NuxtLayout>
</template>
