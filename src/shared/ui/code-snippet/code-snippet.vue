<script lang="ts" setup>
import highlightPlugin from '@highlightjs/vue-plugin';
import isString from 'lodash/isString';
import { ref, computed } from 'vue';
import { IconSvg } from '../icon-svg';

const CodeHighlight = highlightPlugin.component;

type Props = {
  code?: string | Record<string, unknown> | Array<unknown> | null;
  language?: string;
};

const props = withDefaults(
  defineProps<Props>(),
  {
    language: 'plaintext',
    code: '',
  },
);

const isCopied = ref(false);

const normalizedCode = computed(() =>
  isString(props.code)
    ? props.code
    : JSON.stringify(
      props.code,
      null,
      ' ',
    ));

const copyCode = (): void => {
  isCopied.value = true;

  navigator.clipboard
    .writeText(normalizedCode.value)
    .then(() => {
      setTimeout(
        () => {
          isCopied.value = false;
        },
        200,
      );
    })
    .catch((e) => {
      console.error(e);
    });
};

</script>

<template>
  <div class="code-snippet">
    <button
      type="button"
      class="code-snippet__copy"
      :class="{ 'code-snippet__copy--active': isCopied }"
      @click.stop="copyCode"
    >
      <IconSvg
        name="copy"
        class="code-snippet__copy-icon"
      />
      Copy
    </button>

    <CodeHighlight
      :language="language"
      :autodetect="false"
      :code="normalizedCode"
    />
  </div>
</template>

<style lang="scss" scoped>
.code-snippet {
  @apply relative bg-gray-200 dark:bg-gray-800;
}

.code-snippet__copy {
  @apply bg-gray-800 text-gray-100 text-xs font-bold;
  @apply border border-gray-600;
  @apply invisible rounded-full transition-all;
  @apply absolute top-3 right-3 px-2;
  @apply flex items-center gap-x-2;

  &:hover {
    @apply border-gray-200 text-white bg-gray-900;
  }

  .code-snippet:hover & {
    @apply visible;
  }
}

.code-snippet__copy--active {
  @apply scale-110 bg-green-500 hover:bg-green-500;
  @apply transform transition-colors;
}

.code-snippet__copy-icon {
  @apply w-2 h-2;
}
</style>
