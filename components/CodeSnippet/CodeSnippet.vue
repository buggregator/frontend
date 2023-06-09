<template>
  <div class="code-snippet">
    <highlightjs :language="language" :code="normalizedCode" />
    <button
      type="button"
      class="code-snippet__copy"
      :class="{ 'code-snippet__copy--active': isCopied }"
      @click="copyCode"
    >
      <IconSvg name="copy" class="code-snippet__copy-icon" />
      copy
    </button>
  </div>
</template>

<script lang="ts">
import IconSvg from "~/components/IconSvg/IconSvg.vue";
import hljsVuePlugin from "@highlightjs/vue-plugin";
import { defineComponent } from "vue";

export default defineComponent({
  components: {
    IconSvg,
    highlightjs: hljsVuePlugin.component,
  },
  props: {
    code: {
      type: [String, Object],
      required: true,
    },
    language: {
      type: String,
      default: "plaintext",
    },
  },
  data() {
    return {
      isCopied: false,
    };
  },
  computed: {
    normalizedCode(): string {
      return typeof this.code === "string"
        ? this.code
        : JSON.stringify(this.code, null, " ");
    },
  },
  methods: {
    copyCode(): void {
      this.isCopied = true;

      navigator.clipboard
        .writeText(this.normalizedCode)
        .then(() => {
          setTimeout(() => {
            this.isCopied = false;
          }, 200);
        })
        .catch((e) => {
          console.error(e);
        });
    },
  },
});
</script>

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
