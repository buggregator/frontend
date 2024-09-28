<script lang="ts" setup>
// TODO: need to rename component
import { ref, computed } from 'vue';
import { IconSvg } from '@/shared/ui';
import type { RayFrame } from '../../types';

type Props = {
  file: RayFrame;
  isOpen?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
});

const collapsed = ref(props.isOpen);

const hasSnippets = computed(() => (props.file.snippet ? props.file.snippet.length > 0 : false));
</script>
<template>
  <div
    class="ray-file"
    @click="collapsed = !collapsed"
  >
    <div class="ray-file__header">
      <div
        class="ray-file__title"
        :title="file.file_name"
      >
        <div>
          {{ file.class || 'null' }}:{{ file.method }}
          <span class="ray-file__title-in">at line</span>
          {{ file.line_number }}
        </div>
        <span class="ray-file__title-in">{{ file.file_name }}</span>
      </div>

      <IconSvg
        v-if="hasSnippets"
        class="ray-file__icon"
        name="collapsed"
        :class="{ 'ray-file__icon--collapsed': collapsed }"
      />
    </div>

    <div
      v-if="hasSnippets && !collapsed"
      class="ray-file__body"
    >
      <div
        v-for="line in file.snippet"
        :key="line.line_number"
        class="ray-file__snippet"
        :class="{
          'ray-file__snippet--highlight': file.line_number === line.line_number,
        }"
      >
        <div class="ray-file__snippet-num">
          {{ line.line_number }}.
        </div>
        <pre>{{ line.text }}</pre>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import 'src/assets/mixins';
.ray-file {
  @apply text-xs cursor-pointer border-b border-purple-200 dark:border-gray-600;
}

.ray-file__header {
  @apply bg-purple-50 dark:bg-gray-800 py-2 px-3 flex space-x-2 justify-between items-start;
}

.ray-file__title {
  @apply break-all text-gray-800 dark:text-white font-semibold;
}

.ray-file__title-in {
  @include text-muted;
  @apply font-light;
}

.ray-file__icon {
  @apply w-5 h-4 py-1 rounded text-gray-800 dark:text-white;
}

.ray-file__icon--collapsed {
  @apply transform rotate-180;
}

.ray-file__body {
  @apply bg-gray-900 p-2 overflow-x-scroll;
}

.ray-file__snippet {
  @apply flex text-gray-100;
}

.ray-file__snippet--highlight {
  @apply bg-pink-800 text-white;
}

.ray-file__snippet-num {
  @apply w-12;
}
</style>
