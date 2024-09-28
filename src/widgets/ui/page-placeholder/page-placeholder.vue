<script lang="ts" setup>
import { IconSvg } from '@/shared/ui';
import PagePlaceholderItem from './page-placeholder-item.vue';

const items = [
  {
    iconName: 'github',
    title: 'Github repository',
    linkUrl: 'https://github.com/buggregator',
  },
  {
    iconName: 'docs',
    title: 'Documentation',
    linkUrl: 'https://docs.buggregator.dev',
  },
  {
    iconName: 'discord',
    title: 'Join our discord',
    linkUrl: 'https://discord.gg/vDsCD3EKUB',
  },
];
</script>

<template>
  <div class="page-placeholder">
    <div class="page-placeholder__logo">
      <IconSvg
        class="page-placeholder__logo-in"
        name="logo"
      />
    </div>
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
  @apply p-6 lg:p-10 w-1/2 md:w-1/3 lg:w-1/3;
  @apply bg-white dark:bg-gray-900;
  @apply border dark:border-gray-600 rounded-lg;
  @apply text-gray-600 dark:text-gray-300;
}

.page-placeholder__logo {
  @apply mb-4 md:mb-6 lg:mb-10 flex text-black dark:text-white w-full;
}

.page-placeholder__logo-in {
  @apply h-8 md:h-12 lg:h-14;
}

.page-placeholder__list {
  @apply flex flex-col space-y-4;
}
</style>
