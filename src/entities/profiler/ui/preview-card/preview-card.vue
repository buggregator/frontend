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
  <PreviewCard class="profiler-preview" :event="event">
    <NuxtLink tag="div" :to="eventLink" class="profiler-preview__link">
      <StatBoard :cost="event.payload.peaks" />
    </NuxtLink>
  </PreviewCard>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.profiler-preview {
  @apply flex flex-col;
}

.profiler-preview__link {
  @apply cursor-pointer pb-2 flex-grow;
}
</style>
