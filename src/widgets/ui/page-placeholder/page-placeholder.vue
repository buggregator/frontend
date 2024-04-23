<script lang="ts" setup>
import PagePlaceholderItem from "./page-placeholder-item.vue";

const items = [
  {
    iconName: "github",
    title: "Github repository",
    linkUrl: "https://github.com/buggregator",
  },
  {
    iconName: "docs",
    title: "Documentation",
    linkUrl: "https://docs.buggregator.dev",
  },
  {
    iconName: "discord",
    title: "Join our discord",
    linkUrl: "https://discord.gg/vDsCD3EKUB",
  },
];
</script>

<template>
  <div class="page-placeholder">
    <ul class="page-placeholder__list">
      <PagePlaceholderItem
        v-for="item in items"
        :key="item.title"
        :icon-name="item.iconName"
        :title="item.title"
        :link-url="item.linkUrl"
      />
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.page-placeholder {
  @apply p-4 md:p-6 lg:p-10;
  @apply bg-white dark:bg-gray-900;
  @apply border dark:border-gray-600 rounded-lg;
  @apply text-gray-600 dark:text-gray-300;
}

.page-placeholder__list {
  @apply flex flex-col space-y-4;
}
</style>
