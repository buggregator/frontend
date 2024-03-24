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
    <div class="ray-exception__texts">
      <h3 class="ray-exception__texts-in">
        <code class="ray-exception__texts-code">{{ exception.class }}</code>
      </h3>
      <div class="ray-exception__text">
        {{ exception.message }}
      </div>
    </div>

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
@import "assets/mixins";
.ray-exception {
  @apply block;
}

.ray-exception__texts {
  @apply block;
}

.ray-exception__texts-code {
  @apply block mb-2;
  @apply text-xs sm:text-sm md:text-base font-semibold;
}

.ray-exception__text {
  @include code-example();
  @apply mb-2;
  @apply text-xs break-words whitespace-pre-wrap overflow-auto text-opacity-60;
}

</style>
