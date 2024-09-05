<script lang="ts" setup>
import { PageHeader, PageContent, LayoutBase } from '@/widgets/ui'
import { PAGE_TYPES } from '@/shared/constants'
</script>

<template>
  <LayoutBase>
    <template #header>
      <PageHeader :type="PAGE_TYPES.ALL_EVENTS" title="" />
    </template>

    <PageContent :type="PAGE_TYPES.ALL_EVENTS" title="" />
  </LayoutBase>
</template>

<style lang="scss" scoped></style>
