<script lang="ts" setup>
import type { RayContentException } from "../../types";
import { RayFile } from "../ray-file";

type Props = {
  exception: RayContentException;
};

defineProps<Props>();
</script>

<template>
  <div class="ray-exception">
    <header class="ray-exception__header">
      <h3 class="ray-exception__title">
        {{ exception.class }}
      </h3>

      <div class="ray-exception__title-code">
        {{ exception.message }}
      </div>
    </header>

    <div class="ray-exception__files">
      <RayFile
        v-for="(file, i) in exception.frames"
        :key="i"
        :file="file"
        :collapsed="i !== 0"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";
.ray-exception {
  @apply flex flex-col;
}

.ray-exception__header {
  @apply dark:bg-gray-900 bg-gray-100 p-3 rounded-t-md border border-purple-300 dark:border-gray-400 border-b-0;
}

.ray-exception__title {
  @apply mb-3 font-semibold text-lg;
}

.ray-exception__title-code {
  @include code-example();
  @apply text-sm break-words whitespace-pre-wrap rounded text-opacity-60;
}

.ray-exception__text {
  @include code-example();
  @apply mb-2 text-xs break-words whitespace-pre-wrap overflow-auto text-opacity-60;
}

.ray-exception__files {
  @apply flex-col justify-center w-full border border-purple-300 dark:border-gray-400 border-t-0 rounded-b-md overflow-hidden;
}

.ray__body-text {
  @include text-muted;
  @apply font-bold uppercase text-sm mb-5;
}

.ray__body-table {
  @apply mt-3;
}
</style>
