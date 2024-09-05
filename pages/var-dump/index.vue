<script lang="ts" setup>
import { PageHeader, PageContent } from '@/widgets/ui'
import { PAGE_TYPES } from '@/shared/constants'
</script>

<template>
  <NuxtLayout>
    <template #header>
      <PageHeader :type="PAGE_TYPES.VAR_DUMP" title="Var Dumps" />
    </template>

    <PageContent :type="PAGE_TYPES.VAR_DUMP" title="Var Dumps" />
  </NuxtLayout>
</template>
