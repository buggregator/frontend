<script lang="ts" setup>
import highlightPlugin from "@highlightjs/vue-plugin";
import isString from "lodash/isString";
import { ref, computed } from "vue";
import { IconSvg } from "../icon-svg";

const CondeHighlight = highlightPlugin.component;

type Props = {
  code: string | unknown;
  language: string;
};

const props = withDefaults(defineProps<Props>(), {
  language: "plaintext",
});

const isCopied = ref(false);

const normalizedCode = computed(() =>
  !isString(props.code) ? JSON.stringify(props.code, null, " ") : props.code
);

const copyCode = (): void => {
  isCopied.value = true;

  navigator.clipboard
    .writeText(normalizedCode.value)
    .then(() => {
      setTimeout(() => {
        isCopied.value = false;
      }, 200);
    })
    .catch((e) => {
      console.error(e);
    });
};
</script>

<template>
  <div class="code-snippet">
    <CondeHighlight :language="language" :code="normalizedCode" />

    <button
      type="button"
      class="code-snippet__copy"
      :class="{ 'code-snippet__copy--active': isCopied }"
      @click="copyCode"
    >
      <IconSvg name="copy" class="code-snippet__copy-icon" />
      Copy
    </button>
  </div>
</template>

<style lang="scss" scoped>
.code-snippet {
  @apply relative bg-gray-200 dark:bg-gray-800;
}

.code-snippet__copy {
  @apply invisible flex rounded-full items-center gap-x-2 absolute top-3 right-3 px-2 bg-gray-800 border text-gray-100 transition-all text-xs font-bold border-gray-600;

  &:hover {
    @apply border-gray-200 text-white bg-gray-900;
  }
}

.code-snippet:hover .code-snippet__copy {
  @apply visible;
}

.code-snippet__copy--active {
  @apply transform scale-110 bg-green-500 hover:bg-green-500 transition-colors;
}

.code-snippet__copy-icon {
  @apply w-2 h-2;
}
</style>