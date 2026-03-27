<script lang="ts" setup>
import moment from 'moment'
import { computed } from 'vue'
import { useFormats } from '@/shared/lib/formats'
import { TableBase, TableBaseRow } from '@/shared/ui'
import type { SentryDevice } from '../../types'

const { formatFileSize } = useFormats()

type Props = {
  device: SentryDevice
}

const props = defineProps<Props>()

const formatDate = (date: string) => moment(date).toLocaleString()

const formatedBatteryLevel = computed(() =>
  props.device.battery_level ? `${parseInt(String(props.device.battery_level), 10)}%` : ''
)
const formattedMemory = computed(() =>
  props.device.memory_size ? formatFileSize(props.device.memory_size as number) : ''
)
const formattedFreeMemory = computed(() =>
  props.device.free_memory ? formatFileSize(props.device.free_memory as number) : ''
)
const formattedStorage = computed(() =>
  props.device.storage_size ? formatFileSize(props.device.storage_size as number) : ''
)
const formattedFreeStorage = computed(() =>
  props.device.free_storage ? formatFileSize(props.device.free_storage as number) : ''
)
const formattedBootTime = computed(() =>
  props.device.boot_time ? formatDate(props.device.boot_time as string) : ''
)
</script>

<template>
  <section>
    <h3 class="section-title">
      Device
    </h3>

    <TableBase>
      <TableBaseRow
        v-if="device && device.name"
        title="Name"
      >
        {{ device.name }}
      </TableBaseRow>
      <TableBaseRow
        v-if="device && device.brand"
        title="Brand"
      >
        {{ device.brand }}
      </TableBaseRow>
      <TableBaseRow
        v-if="device && device.model"
        title="Model"
      >
        {{ device.model }}
      </TableBaseRow>
      <TableBaseRow
        v-if="device && device.model_id"
        title="Model ID"
      >
        {{
          device.model_id
        }}
      </TableBaseRow>
      <TableBaseRow
        v-if="device && device.family"
        title="Family"
      >
        {{ device.family }}
      </TableBaseRow>
      <TableBaseRow
        v-if="device && device.arch"
        title="Architecture"
      >
        {{
          device.arch
        }}
      </TableBaseRow>
      <TableBaseRow
        v-if="formatedBatteryLevel"
        title="Battery"
      >
        {{
          formatedBatteryLevel
        }}
      </TableBaseRow>
      <TableBaseRow
        v-if="device && device.charging"
        title="Charging"
      >
        {{
          device.charging
        }}
      </TableBaseRow>
      <TableBaseRow
        v-if="formattedMemory"
        title="Memory"
      >
        {{ formattedMemory }}
      </TableBaseRow>
      <TableBaseRow
        v-if="formattedFreeMemory"
        title="Free Memory"
      >
        {{
          formattedFreeMemory
        }}
      </TableBaseRow>
      <TableBaseRow
        v-if="formattedStorage"
        title="Storage"
      >
        {{ formattedStorage }}
      </TableBaseRow>
      <TableBaseRow
        v-if="formattedFreeStorage"
        title="Free Storage"
      >
        {{
          formattedFreeStorage
        }}
      </TableBaseRow>
      <TableBaseRow
        v-if="formattedBootTime"
        title="Boot Time"
      >
        {{
          formattedBootTime
        }}
      </TableBaseRow>
      <TableBaseRow
        v-if="device && device.orientation"
        title="Orientation"
      >
        {{
          device.orientation
        }}
      </TableBaseRow>
      <TableBaseRow
        v-if="device && device.screen_density"
        title="Screen Density"
      >
        {{
          parseInt(String(device.screen_density))
        }}
      </TableBaseRow>
      <TableBaseRow
        v-if="device && device.screen_dpi"
        title="Screen DPI"
      >
        {{
          device.screen_dpi
        }}
      </TableBaseRow>
      <TableBaseRow
        v-if="device && device.screen_height_pixels"
        title="Screen Height"
      >
        {{ device.screen_height_pixels }}px
      </TableBaseRow>
      <TableBaseRow
        v-if="device && device.screen_width_pixels"
        title="Screen Width"
      >
        {{ device.screen_width_pixels }}px
      </TableBaseRow>
      <TableBaseRow
        v-if="device && device.simulator"
        title="Simulator"
      >
        {{
          device.simulator
        }}
      </TableBaseRow>
      <TableBaseRow
        v-if="device && device.timezone"
        title="Timezone"
      >
        {{
          device.timezone
        }}
      </TableBaseRow>
      <TableBaseRow
        v-if="device && device.language"
        title="Language"
      >
        {{
          device.language
        }}
      </TableBaseRow>
      <TableBaseRow
        v-if="device && device.locale"
        title="Locale"
      >
        {{ device.locale }}
      </TableBaseRow>
      <TableBaseRow
        v-if="device && device.id"
        title="ID"
      >
        {{ device.id }}
      </TableBaseRow>
    </TableBase>
  </section>
</template>

<style lang="scss" scoped>
.section-title {
  @apply text-xs font-mono font-semibold uppercase tracking-wider;
  @apply text-gray-500 dark:text-gray-400 mb-3;
}
</style>
