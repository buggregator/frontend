<template>
  <section v-if="hasDevice" class="sentry-page-device">
    <h3 class="sentry-page-device__title">device</h3>

    <TableBase>
      <TableBaseRow v-if="device.archs" title="Architectures">
        <CodeSnippet class="mt-3" language="json" :code="device.archs" />
      </TableBaseRow>

      <TableBaseRow v-if="device.battery_level" title="Battery Level">
        {{ parseInt(device.battery_level) }}%
      </TableBaseRow>

      <TableBaseRow v-if="device.boot_time" title="Boot Time">
        {{ formatDate(device.boot_time) }}
      </TableBaseRow>

      <TableBaseRow v-if="device.brand" title="Brand">
        {{ device.brand }}
      </TableBaseRow>

      <TableBaseRow v-if="device.charging" title="Charging">
        {{ device.charging }}
      </TableBaseRow>

      <TableBaseRow v-if="device.family" title="Family">
        {{ device.family }}
      </TableBaseRow>

      <TableBaseRow v-if="device.free_memory" title="Free Memory">
        {{ humanFileSize(device.free_memory) }}
      </TableBaseRow>

      <TableBaseRow v-if="device.free_storage" title="Free Storage">
        {{ humanFileSize(device.free_storage) }}
      </TableBaseRow>

      <TableBaseRow v-if="device.id" title="Id">
        {{ device.id }}
      </TableBaseRow>

      <TableBaseRow v-if="device.language" title="Language">
        {{ device.language }}
      </TableBaseRow>

      <TableBaseRow v-if="device.low_memory" title="Low Memory">
        {{ device.low_memory }}
      </TableBaseRow>

      <TableBaseRow v-if="device.manufacturer" title="Manufacturer">
        {{ device.manufacturer }}
      </TableBaseRow>

      <TableBaseRow v-if="device.memory_size" title="Memory Size">
        {{ humanFileSize(device.memory_size) }}
      </TableBaseRow>

      <TableBaseRow v-if="device.model" title="Model">
        {{ device.model }}
      </TableBaseRow>

      <TableBaseRow v-if="device.model_id" title="Model Id">
        {{ device.model_id }}
      </TableBaseRow>

      <TableBaseRow v-if="device.name" title="Name">
        {{ device.name }}
      </TableBaseRow>

      <TableBaseRow v-if="device.orientation" title="Orientation">
        {{ device.orientation }}
      </TableBaseRow>

      <TableBaseRow v-if="device.screen_density" title="Screen Density">
        {{ parseInt(device.screen_density) }}
      </TableBaseRow>

      <TableBaseRow v-if="device.screen_dpi" title="Screen DPI">
        {{ device.screen_dpi }}
      </TableBaseRow>

      <TableBaseRow
        v-if="device.screen_height_pixels"
        title="Screen Height Pixels"
      >
        {{ device.screen_height_pixels }}
      </TableBaseRow>

      <TableBaseRow
        v-if="device.screen_width_pixels"
        title="Screen Width Pixels"
      >
        {{ device.screen_width_pixels }}
      </TableBaseRow>

      <TableBaseRow v-if="device.simulator" title="Simulator">
        {{ device.simulator }}
      </TableBaseRow>

      <TableBaseRow v-if="device.storage_size" title="Storage Size">
        {{ humanFileSize(device.storage_size) }}
      </TableBaseRow>

      <TableBaseRow v-if="device.timezone" title="Timezone">
        {{ device.timezone }}
      </TableBaseRow>

      <TableBaseRow
        v-if="device.battery_temperature"
        title="Battery Temperature"
      >
        {{ device.battery_temperature }}
      </TableBaseRow>

      <TableBaseRow v-if="device.locale" :title="'Locale'">
        {{ device.locale }}
      </TableBaseRow>
    </TableBase>
  </section>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { Sentry } from "~/config/types";
import moment from "moment";
import { TableBase, TableBaseRow, CodeSnippet } from "~/src/shared/ui";
import { useFormats } from "~/src/shared/lib/formats";

const { formatFileSize } = useFormats();

export default defineComponent({
  components: {
    TableBaseRow,
    TableBase,
    CodeSnippet,
  },
  props: {
    event: {
      type: Object as PropType<Sentry>,
      required: true,
    },
  },
  computed: {
    hasDevice() {
      return this.event.contexts?.device !== undefined;
    },
    device() {
      return this.event.contexts.device;
    },
  },
  methods: {
    humanFileSize(data: number) {
      return formatFileSize(data);
    },
    formatDate(date: string) {
      return moment(date).toLocaleString();
    },
  },
});
</script>

<style lang="scss" scoped>
@import "assets/mixins";

.sentry-page-device {
}

.sentry-page-device__title {
  @include text-muted;
  @apply font-bold uppercase text-sm mb-5;
}
</style>
