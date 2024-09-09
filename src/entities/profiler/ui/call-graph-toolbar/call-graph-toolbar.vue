<script lang="ts" setup>
//TODO: create storybook file
import { computed } from 'vue'
import { GraphTypes } from '@/shared/types'
import { IconSvg } from '@/shared/ui'
import type { ProfilerCallGraph } from '../../types'

const emit = defineEmits(['onMetricChange', 'onFullscreen', 'onThresholdChange', 'onPercentChange'])

type Props = {
  toolbar: ProfilerCallGraph['toolbar']
  isFullscreen: boolean
  metric: GraphTypes
  threshold: number
  percent: number
}

const props = defineProps<Props>()

const percentLabel = computed(() => (props.metric === GraphTypes.CALLS ? 'Min calls' : 'Percent'))
</script>

<template>
  <div class="call-graph__toolbar-wrapper">
    <div class="call-graph__toolbar">
      <button title="Full screen" @click="emit('onFullscreen')">
        <IconSvg name="fullscreen" class="call-graph__toolbar-icon" />
      </button>

      <button
        v-for="tool in toolbar"
        :key="tool.metric"
        class="call-graph__toolbar-action"
        :class="{
          'call-graph__toolbar-action--active': metric === tool.metric
        }"
        :title="tool.description"
        @click="emit('onMetricChange', tool.metric)"
      >
        {{ tool.label }}
      </button>
    </div>

    <div class="call-graph__toolbar call-graph__toolbar--right">
      <label v-if="metric !== GraphTypes.CALLS" class="call-graph__toolbar-input-wr">
        Threshold

        <input
          class="call-graph__toolbar-input"
          type="number"
          :value="threshold"
          :min="0"
          :max="10"
          :step="0.1"
          @input="emit('onThresholdChange', $event.target.value)"
        />
      </label>

      <label class="call-graph__toolbar-input-wr">
        {{ percentLabel }}

        <input
          class="call-graph__toolbar-input"
          type="number"
          :value="percent"
          :min="metric === GraphTypes.CALLS ? 1 : 0"
          :max="metric === GraphTypes.CALLS ? 1000 : 100"
          :step="metric === GraphTypes.CALLS ? 10 : 5"
          @input="emit('onPercentChange', $event.target.value)"
        />
      </label>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.call-graph--fullscreen {
  @apply rounded-none mt-0 top-0 left-0 fixed w-full h-full bg-gray-800 z-[99999];
}

.call-graph__toolbar {
  @apply absolute top-5 left-5 flex bg-gray-200 p-2 rounded gap-x-5 shadow-lg;
}

.call-graph__toolbar--right {
  @apply right-5 left-auto py-1;
}

.call-graph__toolbar-icon {
  @apply w-4 h-4 fill-blue-500;
}

.call-graph__toolbar-action {
  @apply text-xs uppercase text-gray-600;
}

.call-graph__toolbar-action--active {
  @apply font-bold;
}

.call-graph__toolbar-input-wr {
  @apply text-xs uppercase text-gray-600;
}

.call-graph__toolbar-input {
  @apply border-gray-600 text-gray-600 w-10 font-bold text-right bg-gray-300 ml-1 py-1 rounded;
}
</style>
