<script lang="ts" setup>
import { IconSvg } from '@/shared/ui'

type Props = {
  iconName: string
  title: string
  linkUrl: string
}

defineProps<Props>()
</script>

<template>
  <li class="page-placeholder-item">
    <IconSvg
      :name="iconName"
      class="page-placeholder-item__icon"
    />
    <a
      :href="linkUrl"
      class="page-placeholder-item__link"
      target="_blank"
    >
      {{ title }}
    </a>
  </li>
</template>

<style lang="scss" scoped>
.page-placeholder-item {
  @apply flex items-center;
  @apply space-x-2 md:space-x-3 lg:space-x-4;
}

.page-placeholder-item__link {
  @apply text-blue-600 dark:text-blue-200 underline break-all text-xs md:text-sm lg:text-base leading-none;
}

.page-placeholder-item__icon {
  @apply w-4 md:w-6 lg:w-8;
  @apply dark:text-white text-gray-800;
}
</style>
