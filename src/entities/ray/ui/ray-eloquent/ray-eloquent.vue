<script lang="ts" setup>
import { ValueDump } from "@/shared/ui"
import type { RayContentEloquent } from "../../types"

type Props = {
  content: RayContentEloquent
}

defineProps<Props>()
</script>

<template>
  <div class="ray-eloquent">
    <h3 class="ray-eloquent__title">
      Class name:
      <code class="ray-eloquent__title-in">
        {{ content.class_name }}
      </code>
    </h3>
    <ValueDump :value="content.attributes" />
  </div>
</template>

<style lang="scss" scoped>
.ray-eloquent {
}

.ray-eloquent__title {
  @apply p-3 border border-gray-300 dark:border-gray-600 bg-gray-800 flex w-full overflow-auto;
}

.ray-eloquent__title-in {
  @apply font-semibold ml-1;
}
</style>
