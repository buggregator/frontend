<script lang="ts" setup>
import { computed } from "vue";
import type { NormalizedEvent } from "@/shared/types";
import { PreviewCard, ValueDump } from "@/shared/ui";
import type { VarDump } from "../../types";

type Props = {
  event: NormalizedEvent<VarDump>;
};

const props = defineProps<Props>();

const eventValue = computed(() => String(props.event.payload?.payload?.value || ""));
const eventType = computed(() => String(props.event.payload?.payload?.type || "string"));
const eventLanguage = computed(() => String(props.event.payload?.payload?.language || `plaintext`));
</script>

<template>
  <PreviewCard
    class="preview-card"
    :event="event"
  >
    <ValueDump
      :value="eventValue"
      :type="eventType"
      :language="eventLanguage"
    />
  </PreviewCard>
</template>

<style lang="scss" scoped>
.preview-card {
}
</style>
