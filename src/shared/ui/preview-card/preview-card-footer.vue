<script lang="ts" setup>
import { withDefaults, defineProps } from "vue";
import { IconSvg } from "../icon-svg";

type Props = {
  serverName: string;
  originConfig: {
    [key: string]: string;
  } | null;
};

withDefaults(defineProps<Props>(), {
  serverName: "",
  originConfig: null,
});
</script>

<template>
  <div class="preview-card-footer">
    <div class="preview-card-footer__tags">
      <template v-if="originConfig">
        <span
          v-for="(value, key) in originConfig"
          :key="key"
          class="preview-card-footer__tag"
        >
          <strong>{{ key }}: </strong>{{ value }}
        </span>
      </template>
    </div>

    <div v-if="serverName" class="preview-card-footer__host">
      <IconSvg name="host" class="preview-card-footer__host-icon" />
      <span class="preview-card-footer__host-name">
        {{ serverName }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.preview-card-footer {
  @apply w-full flex justify-between;
}

.preview-card-footer__tags {
  @apply flex flex-wrap items-center;
}

.preview-card-footer__tag {
  @apply pr-4 text-xs text-gray-400;
}

.preview-card-footer__host {
  @apply inline-flex items-center justify-start space-x-2 py-1 text-gray-600 dark:text-gray-300;
}

.preview-card-footer__host-icon {
  @apply w-4 h-4;
}

.preview-card-footer__host-name {
  @apply flex-initial font-bold text-xs;
}
</style>