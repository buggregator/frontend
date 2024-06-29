<script lang="ts" setup>
import { PageHeader, PageLayout } from "~/src/widgets/ui";
import { PAGE_TYPES } from "~/src/shared/constants";
</script>

<template>
  <NuxtLayout>
    <template #header>
      <PageHeader :type="PAGE_TYPES.INSPECTOR" title="Inspector" />
    </template>

    <PageLayout :type="PAGE_TYPES.INSPECTOR" title="Inspector" />
  </NuxtLayout>
</template>
