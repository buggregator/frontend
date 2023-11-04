<template>
  <div class="ray-type-table">
    <TableBase>
      <TableBaseRow
        v-for="(value, title) in eventValue.values"
        :key="title"
        :title="title"
      >
        <ValueDump :value="value" />
      </TableBaseRow>
    </TableBase>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { RayPayload } from "~/config/types";
import { TableBase, TableBaseRow, ValueDump } from "~/src/shared/ui";

export default defineComponent({
  components: {
    ValueDump,
    TableBaseRow,
    TableBase,
  },
  props: {
    payload: {
      type: Object as PropType<RayPayload>,
      required: true,
    },
  },
  computed: {
    eventValue(): unknown {
      return this.payload.content;
    },
  },
});
</script>

<style lang="scss" scoped></style>
