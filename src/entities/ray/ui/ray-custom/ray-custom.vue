<script lang="ts" setup>
import { ValueDump } from "~/src/shared/ui";
import type { RayContentCustom } from "../../types";

type Props = {
  content: RayContentCustom;
};

defineProps<Props>();
</script>

<template>
  <div class="ray-custom">
    <ValueDump v-if="content.content" :value="content.content" />
  </div>
</template>

<style lang="scss" scoped>
.ray-custom {
  @apply py-3;
}
</style>
