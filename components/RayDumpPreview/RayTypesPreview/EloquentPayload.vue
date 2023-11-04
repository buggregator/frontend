<template>
  <div class="ray-type-model">
    <h3 class="ray-type-model__title">
      Class name:
      <code class="ray-type-model__title-in">
        {{ payload.content.class_name }}
      </code>
    </h3>
    <ValueDump :value="payload.content.attributes" />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { RayPayload } from "~/config/types";
import { ValueDump } from "~/src/shared/ui";

export default defineComponent({
  components: { ValueDump },
  props: {
    payload: {
      type: Object as PropType<RayPayload>,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped>
.ray-type-model {
}

.ray-type-model__title {
  @apply p-3 border border-gray-300 dark:border-gray-600 bg-gray-800 flex w-full overflow-auto;
}

.ray-type-model__title-in {
  @apply font-semibold ml-1;
}
</style>
