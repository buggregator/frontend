<script lang="ts" setup>
import { computed } from "vue";
import type { NormalizedEvent } from "~/src/shared/types";
import { PreviewCard, ValueDump } from "~/src/shared/ui";
import type { VarDump } from "../../types";

type Props = {
  event: NormalizedEvent<VarDump>;
};

const props = defineProps<Props>();

const eventValue = computed(() => String(props.event.payload.payload.value));
</script>

<template>
  <PreviewCard class="preview-card" :event="event">
    <ValueDump
      :value="eventValue"
      :type="event.payload.payload.type"
      :language="event.payload.payload.language || `plaintext`"
    />
  </PreviewCard>
</template>

<style lang="scss" scoped>
.preview-card {
}
</style>
