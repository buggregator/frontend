<script lang="ts" setup>
import { defineProps } from "vue";
import type { NormalizedEvent } from "~/src/shared/types";
import { PreviewCard } from "~/src/shared/ui";
import type { Inspector } from "../../types";
import InspectorStatBoard from "../inspector-stat-board/inspector-stat-board.vue";

type Props = {
  event: NormalizedEvent<Inspector>;
};

defineProps<Props>();
</script>

<template>
  <PreviewCard class="preview-card" :event="event">
    <div class="preview-card__content">
      <InspectorStatBoard :transaction="event.payload[0]" />
    </div>
  </PreviewCard>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.preview-card {
  @apply flex flex-col;
}

.preview-card__content {
  @apply pb-2 flex-grow;
}
</style>
