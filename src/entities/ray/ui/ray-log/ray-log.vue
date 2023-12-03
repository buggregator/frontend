<script lang="ts" setup>
import { ValueDump } from "~/src/shared/ui";
import type { RayContentLog } from "../../types";

type Props = {
  log: RayContentLog;
};

defineProps<Props>();
</script>

<template>
  <div class="ray-log">
    <ValueDump v-if="log" :value="String(log)" />
  </div>
</template>

<style lang="scss" scoped>
.ray-log {
  display: block;
}
</style>
