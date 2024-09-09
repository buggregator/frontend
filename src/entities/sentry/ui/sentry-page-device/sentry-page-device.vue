<script lang="ts" setup>
import moment from 'moment'
import { useFormats } from '@/shared/lib/formats'
import { TableBase, TableBaseRow, CodeSnippet } from '@/shared/ui'
import type { SentryDevice } from '../../types'

const { formatFileSize } = useFormats()

type Props = {
  device: SentryDevice
}

defineProps<Props>()

const formatDate = (date: string) => moment(date).toLocaleString()

const formatBatteryLevel = (level: number) => `${parseInt(String(level), 10)}%`
</script>

<template>
  <section class="sentry-page-device">
    <h3 class="sentry-page-device__title">device</h3>

    <TableBase>
      <TableBaseRow v-if="device && device.arch" title="Architectures">
        <CodeSnippet class="mt-3" language="json" :code="device.arch" />
      </TableBaseRow>

      <TableBaseRow v-if="device && device.battery_level" title="Battery Level">
        {{ formatBatteryLevel(device.battery_level) }}
      </TableBaseRow>

      <TableBaseRow v-if="device && device.boot_time" title="Boot Time">
        {{ formatDate(device.boot_time) }}
      </TableBaseRow>

      <TableBaseRow v-if="device && device.brand" title="Brand">
        {{ device.brand }}
      </TableBaseRow>

      <TableBaseRow v-if="device && device.charging" title="Charging">
        {{ device.charging }}
      </TableBaseRow>

      <TableBaseRow v-if="device && device.family" title="Family">
        {{ device.family }}
      </TableBaseRow>

      <TableBaseRow v-if="device && device.free_memory" title="Free Memory">
        {{ formatFileSize(device.free_memory) }}
      </TableBaseRow>

      <TableBaseRow v-if="device && device.free_storage" title="Free Storage">
        {{ formatFileSize(device.free_storage) }}
      </TableBaseRow>

      <TableBaseRow v-if="device && device.id" title="Id">
        {{ device.id }}
      </TableBaseRow>

      <TableBaseRow v-if="device && device.language" title="Language">
        {{ device.language }}
      </TableBaseRow>

      <TableBaseRow v-if="device && device.low_memory" title="Low Memory">
        {{ device.low_memory }}
      </TableBaseRow>

      <TableBaseRow v-if="device && device.manufacturer" title="Manufacturer">
        {{ device.manufacturer }}
      </TableBaseRow>

      <TableBaseRow v-if="device && device.memory_size" title="Memory Size">
        {{ formatFileSize(device.memory_size) }}
      </TableBaseRow>

      <TableBaseRow v-if="device && device.model" title="Model">
        {{ device.model }}
      </TableBaseRow>

      <TableBaseRow v-if="device && device.model_id" title="Model Id">
        {{ device.model_id }}
      </TableBaseRow>

      <TableBaseRow v-if="device && device.name" title="Name">
        {{ device.name }}
      </TableBaseRow>

      <TableBaseRow v-if="device && device.orientation" title="Orientation">
        {{ device.orientation }}
      </TableBaseRow>

      <TableBaseRow v-if="device && device.screen_density" title="Screen Density">
        {{ parseInt(String(device.screen_density)) }}
      </TableBaseRow>

      <TableBaseRow v-if="device && device.screen_dpi" title="Screen DPI">
        {{ device.screen_dpi }}
      </TableBaseRow>

      <TableBaseRow v-if="device && device.screen_height_pixels" title="Screen Height Pixels">
        {{ device.screen_height_pixels }}
      </TableBaseRow>

      <TableBaseRow v-if="device && device.screen_width_pixels" title="Screen Width Pixels">
        {{ device.screen_width_pixels }}
      </TableBaseRow>

      <TableBaseRow v-if="device && device.simulator" title="Simulator">
        {{ device.simulator }}
      </TableBaseRow>

      <TableBaseRow v-if="device && device.storage_size" title="Storage Size">
        {{ formatFileSize(device.storage_size) }}
      </TableBaseRow>

      <TableBaseRow v-if="device && device.timezone" title="Timezone">
        {{ device.timezone }}
      </TableBaseRow>

      <TableBaseRow v-if="device && device.battery_temperature" title="Battery Temperature">
        {{ device.battery_temperature }}
      </TableBaseRow>

      <TableBaseRow v-if="device && device.locale" :title="'Locale'">
        {{ device.locale }}
      </TableBaseRow>
    </TableBase>
  </section>
</template>

<style lang="scss" scoped>
@import 'src/assets/mixins';

.sentry-page-device {
}

.sentry-page-device__title {
  @include text-muted;
  @apply font-bold uppercase text-sm mb-5;
}
</style>
