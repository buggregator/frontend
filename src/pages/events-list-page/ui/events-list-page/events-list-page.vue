<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { PageHeader, LayoutPreviewEvents, LayoutBase, LayoutSidebar } from '@/widgets/ui';
import { ALL_EVENT_TYPES, PAGES_SETTINGS } from '@/shared/constants';
import { EventTypes, type PageEventTypes } from '@/shared/types';

const route = useRoute();

const paramsType = computed(() => (route.params?.type || undefined) as PageEventTypes | undefined);

const title = computed(() => (paramsType?.value ? PAGES_SETTINGS[paramsType.value]?.title : ''));

const type = computed(() => (paramsType.value as EventTypes) || ALL_EVENT_TYPES);
</script>

<template>
  <LayoutBase class="events-list-page">
    <template #sidebar>
      <LayoutSidebar />
    </template>

    <template #header>
      <PageHeader
        :type="type"
        :title="title"
      />
    </template>

    <LayoutPreviewEvents
      :type="type"
      :title="title"
    />
  </LayoutBase>
</template>

<style lang="scss" scoped>
.events-list-page {
  display: block;
}
</style>
