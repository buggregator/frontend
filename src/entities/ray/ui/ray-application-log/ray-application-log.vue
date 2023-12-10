<script lang="ts" setup>
import type { RayContentApplicationLog } from "../../types";

type Props = {
  content: RayContentApplicationLog;
};

defineProps<Props>();
</script>

<template>
  <pre class="ray-application-log">{{ content.value }}</pre>
</template>

<style lang="scss" scoped>
@import "assets/mixins";

.ray-application-log {
  @include code-example();
  @apply flex w-full overflow-auto;
}
</style>
