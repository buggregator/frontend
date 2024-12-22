<script lang="ts" setup>
import type { RayContentApplicationLog } from '../../types'

type Props = {
  content: RayContentApplicationLog
}

defineProps<Props>()
</script>

<template>
  <pre class="ray-application-log">{{ content.value }}</pre>
</template>

<style lang="scss" scoped>
@use 'src/assets/mixins' as mixins;

.ray-application-log {
  @include mixins.code-example();
  @apply flex w-full overflow-auto;
}
</style>
