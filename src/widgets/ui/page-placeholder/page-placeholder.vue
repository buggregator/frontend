<script lang="ts" setup>
import PagePlaceholderItem from "./page-placeholder-item.vue";

const getHost = () => window?.location?.host || "localhost:3000";
const getHostName = () => window?.location?.hostname || "localhost";

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
  }
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
        :link-name="item.linkName"
        :link-url="item.linkUrl"
      />
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.page-placeholder {
  @apply p-6 bg-white dark:bg-gray-900 rounded-l text-gray-600 dark:text-gray-300 border;
}

.page-placeholder__title {
  @apply text-xl font-bold mb-3;
}

.page-placeholder__list {
  @apply flex flex-col space-y-4;
  @apply flex flex-col space-y-4;
}
</style>
