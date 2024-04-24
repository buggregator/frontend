<script lang="ts" setup>
import { computed, defineProps } from "vue";
import type { NormalizedEvent } from "~/src/shared/types";
import { PreviewCard } from "~/src/shared/ui";
import type { Inspector } from "../../types";
import InspectorStatBoard from "../inspector-stat-board/inspector-stat-board.vue";

type Props = {
  event: NormalizedEvent<Inspector>;
};

const props = defineProps<Props>();

const eventLink = computed(() => `/inspector/${props.event.id}`);
</script>

<template>
  <PreviewCard class="preview-card" :event="event">
    <NuxtLink :to="eventLink" class="preview-card__link">
      <InspectorStatBoard :transaction="event.payload[0]" />
    </NuxtLink>
  </PreviewCard>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.preview-card {
  @apply flex flex-col;
}

.preview-card__link {
  @apply cursor-pointer pb-2 flex-grow;
}
</style>
