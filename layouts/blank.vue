<script setup lang="ts"></script>

<template>
  <div class="main-layout">
    <slot />
  </div>
</template>

<script lang="ts"></script>

<style lang="scss" scoped>
@import "src/assets/mixins";

.main-layout {
  @apply flex min-h-screen items-stretch relative;
}
</style>
