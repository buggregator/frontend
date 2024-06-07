<script lang="ts" setup>
import type { NormalizedEvent } from "~/src/shared/types";
import { PreviewCard, StatBoard } from "~/src/shared/ui";
import type { Profiler } from "../../types";

type Props = {
  event: NormalizedEvent<Profiler>;
};

defineProps<Props>();
</script>

<template>
  <PreviewCard class="profiler-preview" :event="event">
    <div class="profiler-preview__link">
      <StatBoard :cost="event.payload.peaks" />
    </div>
  </PreviewCard>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.profiler-preview {
  @apply flex flex-col;
}

.profiler-preview__link {
  @apply pb-2 flex-grow;
}
</style>
