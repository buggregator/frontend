<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useSettingsStore } from "~/src/shared/stores";
import type { RayFrame } from "../../types";

type Props = {
  frame: RayFrame;
};

const props = defineProps<Props>();

const { codeEditor } = storeToRefs(useSettingsStore());

const callLink = computed(
  () =>
    `${codeEditor}://open?file=${encodeURIComponent(
      props.frame.file_name
    )}&line=${props.frame.line_number}`
);
</script>

<template>
  <div class="ray-frame">
    <h3>Called from</h3>
    <a class="ray-frame__name" :href="callLink">
      <code class="ray-frame__code">
        {{ frame.class || "null" }}:{{ frame.method }}
      </code>
    </a>
  </div>
</template>

<style lang="scss" scoped>
.ray-frame__name {
  --tw-text-opacity: 1;
  color: rgba(96, 165, 250, var(--tw-text-opacity));
  text-decoration: underline;

  .dark & {
    --tw-text-opacity: 1;
    color: rgba(219, 234, 254, var(--tw-text-opacity));
  }
}

.ray-frame__code {
  word-break: break-all;
  font-weight: 600;
}
</style>
