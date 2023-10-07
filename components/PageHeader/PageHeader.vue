<template>
  <header class="page-header">
    <div class="page-header__title"><slot />&nbsp;</div>

    <div class="page-header__controls">
      <slot name="controls" />

      <button
        v-if="buttonTitle"
        class="page-header__btn-clear"
        @click="buttonClick"
      >
        {{ buttonTitle }}
      </button>
    </div>
  </header>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    title: {
      type: String,
      default: "",
    },
    buttonTitle: {
      type: String,
      default: "",
    },
  },
  emits: {
    delete(payload: boolean) {
      return payload;
    },
  },
  methods: {
    buttonClick() {
      this.$emit("delete", true);
    },
  },
});
</script>

<style lang="scss" scoped>
.page-header {
  @apply flex justify-between;
}

.page-header__title {
  @apply flex items-center flex-row;
}

.page-header__controls {
  @apply flex items-center flex-row;
}

.page-header__btn-clear {
  @apply px-3 py-1 text-xs bg-red-800 text-white rounded-sm hover:bg-red-700 transition transition-all duration-300;
}
</style>
