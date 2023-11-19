<script lang="ts" setup>
import { RayContentException } from "../../types";
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
.ray-exception {
  display: block;
}

.ray-exception__texts {
  display: block;
}

.ray-exception__texts-in {
  @apply mb-1;
}
.ray-exception__texts-code {
  @apply font-semibold;
}

.ray-exception__text {
  display: block;
}
</style>
