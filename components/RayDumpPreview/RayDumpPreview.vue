<template>
  <PreviewCard class="ray-dump-preview" :event="event">
    <RayDumpTypeMapper
      v-for="payload in event.payload.payload.payloads"
      :key="payload.id"
      :class="classes"
      :payload="payload"
    />
  </PreviewCard>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { NormalizedEvent } from "~/config/types";
import RayDumpTypeMapper from "~/components/RayDumpTypeMapper/RayDumpTypeMapper.vue";
import { PreviewCard } from "~/src/shared/ui";

export default defineComponent({
  components: {
    PreviewCard,
    RayDumpTypeMapper,
  },
  props: {
    event: {
      type: Object as PropType<NormalizedEvent>,
      required: true,
    },
  },
  computed: {
    classes() {
      const classes = [];

      classes.push(`text-${this.event.size}`);
      classes.push(
        `text-${this.event.color}-900 dark:text-${this.event.color}-200`
      );

      return classes;
    },
  },
});
</script>
