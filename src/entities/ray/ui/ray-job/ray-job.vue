<script lang="ts" setup>
import { ValueDump } from "@/shared/ui";
import type { RayContentJob } from "../../types";

type Props = {
  content: RayContentJob;
};

defineProps<Props>();
</script>

<template>
  <div class="ray-job">
    <ValueDump :value="content.job" />
  </div>
</template>

<style lang="scss" scoped>
.ray-job {
  display: block;
}
</style>
