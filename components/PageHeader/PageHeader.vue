<template>
  <header class="page-header">
    <div class="page-header__title"><slot />&nbsp;</div>

    <div class="page-header__controls">
      <button class="page-header__btn-auto-refresh" @click="toggleAutoEvents">
        {{ isStopUpdate ? "❚ ❚ Stop Update" : "▶ Auto Update" }}
      </button>

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
    isStopUpdate: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    delete(payload: boolean) {
      return payload;
    },
    stopUpdate(payload: boolean) {
      return payload;
    },
  },
  methods: {
    buttonClick() {
      this.$emit("delete", true);
    },
    toggleAutoEvents() {
      this.$emit("stopUpdate", true);
    },
  },
});
</script>

<style lang="scss" scoped>
.page-header {
  @apply p-3 flex justify-between border-b border-gray-200 dark:border-gray-700;
}

.page-header__title {
}

.page-header__controls {
  @apply flex items-center flex-row;
}

.page-header__btn-auto-refresh {
  @apply mr-3 text-xs text-white rounded-sm hover:opacity-100 transition-all duration-300 opacity-40;
}

.page-header__btn-clear {
  @apply px-3 py-1 text-xs bg-red-800 text-white rounded-sm hover:bg-red-700 transition transition-all duration-300;
}
</style>
