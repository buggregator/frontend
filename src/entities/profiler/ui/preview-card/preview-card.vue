<script lang="ts" setup>
import { computed } from "vue";
import type { NormalizedEvent } from "~/src/shared/types";
import { PreviewCard, StatBoard } from "~/src/shared/ui";
import type { Profiler } from "../../types";

type Props = {
  event: NormalizedEvent<Profiler>;
};

const props = defineProps<Props>();
const eventLink = computed(() => `/profiler/${props.event.id}`);
</script>

<template>
  <PreviewCard class="preview-card" :event="event">
    <NuxtLink tag="div" :to="eventLink" class="preview-card__link">
      <StatBoard :cost="event.payload.peaks" />
    </NuxtLink>
  </PreviewCard>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.preview-card {
  @apply flex flex-col;
}

.preview-card__link {
  @apply flex-grow rounded-md overflow-hidden mb-2 border dark:border-gray-500;
}
</style>
