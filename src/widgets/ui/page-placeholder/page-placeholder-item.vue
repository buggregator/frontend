<script lang="ts" setup>
import { IconSvg } from "~/src/shared/ui";

type Props = {
  iconName: string;
  title: string;
  linkUrl: string;
};

defineProps<Props>();
</script>

<template>
  <li class="page-placeholder-item">
    <IconSvg :name="iconName" class="page-placeholder-item__icon" />
    <span>
      <a :href="linkUrl" class="page-placeholder-item__link" target="_blank">
        {{ title }}
      </a>
    </span>
  </li>
</template>

<style lang="scss" scoped>
.page-placeholder-item {
  @apply flex space-x-3 items-center;
}

.page-placeholder-item__link {
  @apply text-blue-600 dark:text-blue-200 underline break-all;
}

.page-placeholder-item__icon {
  @apply w-6 dark:text-white text-gray-800;
}
</style>
