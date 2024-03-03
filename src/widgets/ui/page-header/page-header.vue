<script lang="ts" setup>
import { IconSvg } from "~/src/shared/ui";

type Props = {
  title?: string;
  buttonTitle?: string;
};

type Emits = {
  delete: [value: boolean];
};

withDefaults(defineProps<Props>(), {
  title: "",
  buttonTitle: "",
});

const emit = defineEmits<Emits>();

const clearEvents = () => {
  emit("delete", true);
};
</script>

<template>
  <header class="page-header">
    <div class="page-header__title"><slot />&nbsp;</div>

    <div class="page-header__controls">
      <slot name="controls" />

      <button
        v-if="buttonTitle"
        class="page-header__btn-clear"
        @click="clearEvents"
      >
        {{ buttonTitle }}
      </button>
    </div>

    <IconSvg class="page-header__lock-icon" name="lock" />
  </header>
</template>

<style lang="scss" scoped>
.page-header {
  @apply flex justify-between;
}

.page-header__title {
  @apply flex items-center flex-row;
}

.page-header__controls {
  @apply flex items-center flex-row;

  gap: 12px;
}

.page-header__btn-clear {
  @apply px-3 py-1 text-xs bg-red-800 text-white rounded-sm hover:bg-red-700 transition transition-all duration-300;
}

.page-header__lock-icon {
  @apply absolute right-0 w-4 h-4;

  top: 50%;
  margin-top: -0.5rem;
  display: none;
  opacity: 0.3;

  html.navbar-fixed & {
    display: block;
  }
}
</style>
