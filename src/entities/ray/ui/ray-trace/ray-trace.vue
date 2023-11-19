<script lang="ts" setup>
import { RayFrame } from "../../types";
import { RayFile } from "../ray-file";

type Props = {
  frames: RayFrame[];
};

defineProps<Props>();
</script>

<template>
  <div class="ray-trace">
    <RayFile
      v-for="frame in frames"
      :key="`${frame.file_name}-${frame.line_number}`"
      :file="frame"
    />
  </div>
</template>

<style lang="scss" scoped>
.ray-trace {
  display: block;
}
</style>
