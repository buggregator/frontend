<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useSettingsStore } from '@/shared/stores';
import type { RayFrame } from '../../types';

type Props = {
  frame: RayFrame;
};

const props = defineProps<Props>();

const { codeEditor } = storeToRefs(useSettingsStore());

const callLink = computed(
  () =>
    `${codeEditor}://open?file=${encodeURIComponent(props.frame.file_name)}&line=${props.frame.line_number}`,
);

</script>

<template>
  <div class="ray-frame">
    <h3>Called from</h3>
    <a
      class="ray-frame__name"
      :href="callLink"
    >
      <code
        class="ray-frame__code"
      > {{ frame.class || 'null' }}:{{ frame.method }} </code>
    </a>
  </div>
</template>

<style lang="scss" scoped>
.ray-frame__name {
  @apply text-blue-400 dark:text-blue-100 underline;
}

.ray-frame__code {
  @apply break-all font-semibold;
}
</style>
