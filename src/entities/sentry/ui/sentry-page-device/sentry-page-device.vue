<script lang="ts" setup>
import moment from "moment";
import { computed } from "vue";
import { useFormats } from "@/shared/lib/formats";
import { TableBase, TableBaseRow, CodeSnippet } from "@/shared/ui";
import type { SentryDevice } from "../../types";

const { formatFileSize } = useFormats();

type Props = {
  device: SentryDevice;
};

const props = defineProps<Props>();

const formatDate = (date: string) => moment(date).toLocaleString();

const formatedBatteryLevel = computed(() =>
  props.device.battery_level ? `${parseInt(String(props.device.battery_level), 10)}%` : ""
);

const formattedMemory = computed(() =>
  props.device.memory_size ? formatFileSize(props.device.memory_size as number) : ""
);
const formattedFreeMemory = computed(() =>
  props.device.free_memory ? formatFileSize(props.device.free_memory as number) : ""
);
const formattedStorage = computed(() =>
  props.device.storage_size ? formatFileSize(props.device.storage_size as number) : ""
);
const formattedFreeStorage = computed(() =>
  props.device.free_storage ? formatFileSize(props.device.free_storage as number) : ""
);
const formattedBootTime = computed(() =>
  props.device.boot_time ? formatDate(props.device.boot_time as string) : ""
);
</script>

<template>
  <section class="sentry-page-device">
    <h3 class="sentry-page-device__title">
      device
    </h3>

    <TableBase>
      <TableBaseRow
        v-if="device && device.arch"
        title="Architectures"
      >
        <CodeSnippet
          class="mt-3"
          language="json"
          :code="String(device.arch)"
        />
      </TableBaseRow>

      <TableBaseRow
        v-if="formatedBatteryLevel"
        title="Battery Level"
      >
        {{ formatedBatteryLevel }}
      </TableBaseRow>

      <TableBaseRow
        v-if="formattedBootTime"
        title="Boot Time"
      >
        {{ formattedBootTime }}
      </TableBaseRow>

      <TableBaseRow
        v-if="device && device.brand"
        title="Brand"
      >
        {{ device.brand }}
      </TableBaseRow>

      <TableBaseRow
        v-if="device && device.charging"
        title="Charging"
      >
        {{ device.charging }}
      </TableBaseRow>

      <TableBaseRow
        v-if="device && device.family"
        title="Family"
      >
        {{ device.family }}
      </TableBaseRow>

      <TableBaseRow
        v-if="formattedFreeMemory"
        title="Free Memory"
      >
        {{ formattedFreeMemory }}
      </TableBaseRow>

      <TableBaseRow
        v-if="formattedFreeStorage"
        title="Free Storage"
      >
        {{ formattedFreeStorage }}
      </TableBaseRow>

      <TableBaseRow
        v-if="device && device.id"
        title="Id"
      >
        {{ device.id }}
      </TableBaseRow>

      <TableBaseRow
        v-if="device && device.language"
        title="Language"
      >
        {{ device.language }}
      </TableBaseRow>

      <TableBaseRow
        v-if="device && device.low_memory"
        title="Low Memory"
      >
        {{ device.low_memory }}
      </TableBaseRow>

      <TableBaseRow
        v-if="device && device.manufacturer"
        title="Manufacturer"
      >
        {{ device.manufacturer }}
      </TableBaseRow>

      <TableBaseRow
        v-if="formattedMemory"
        title="Memory Size"
      >
        {{ formattedMemory }}
      </TableBaseRow>

      <TableBaseRow
        v-if="device && device.model"
        title="Model"
      >
        {{ device.model }}
      </TableBaseRow>

      <TableBaseRow
        v-if="device && device.model_id"
        title="Model Id"
      >
        {{ device.model_id }}
      </TableBaseRow>

      <TableBaseRow
        v-if="device && device.name"
        title="Name"
      >
        {{ device.name }}
      </TableBaseRow>

      <TableBaseRow
        v-if="device && device.orientation"
        title="Orientation"
      >
        {{ device.orientation }}
      </TableBaseRow>

      <TableBaseRow
        v-if="device && device.screen_density"
        title="Screen Density"
      >
        {{ parseInt(String(device.screen_density)) }}
      </TableBaseRow>

      <TableBaseRow
        v-if="device && device.screen_dpi"
        title="Screen DPI"
      >
        {{ device.screen_dpi }}
      </TableBaseRow>

      <TableBaseRow
        v-if="device && device.screen_height_pixels"
        title="Screen Height Pixels"
      >
        {{ device.screen_height_pixels }}
      </TableBaseRow>

      <TableBaseRow
        v-if="device && device.screen_width_pixels"
        title="Screen Width Pixels"
      >
        {{ device.screen_width_pixels }}
      </TableBaseRow>

      <TableBaseRow
        v-if="device && device.simulator"
        title="Simulator"
      >
        {{ device.simulator }}
      </TableBaseRow>

      <TableBaseRow
        v-if="formattedStorage"
        title="Storage Size"
      >
        {{ formattedStorage }}
      </TableBaseRow>

      <TableBaseRow
        v-if="device && device.timezone"
        title="Timezone"
      >
        {{ device.timezone }}
      </TableBaseRow>

      <TableBaseRow
        v-if="device && device.battery_temperature"
        title="Battery Temperature"
      >
        {{ device.battery_temperature }}
      </TableBaseRow>

      <TableBaseRow
        v-if="device && device.locale"
        :title="'Locale'"
      >
        {{ device.locale }}
      </TableBaseRow>
    </TableBase>
  </section>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.sentry-page-device {
}

.sentry-page-device__title {
  @include text-muted;
  @apply font-bold uppercase text-sm mb-5;
}
</style>
