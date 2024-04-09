<template>
  <div class="main-layout">
    <slot />
  </div>
</template>

<script lang="ts">
</script>

<style lang="scss" scoped>
@import "assets/mixins";

.main-layout {
  @apply flex min-h-screen items-stretch relative;
}
</style>
