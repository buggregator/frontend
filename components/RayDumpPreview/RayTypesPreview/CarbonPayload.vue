<template>
  <div class="ray-type-carbon">
    <TableBase>
      <TableBaseRow title="Formatted">
        {{ eventValue.formatted }}
      </TableBaseRow>
      <TableBaseRow title="Timezone">
        {{ eventValue.timezone }}
      </TableBaseRow>
      <TableBaseRow title="Timestamp">
        {{ eventValue.timestamp }}
      </TableBaseRow>
    </TableBase>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { RayPayload } from "~/src/entities/ray/types";
import { TableBase, TableBaseRow } from "~/src/shared/ui";

export default defineComponent({
  components: {
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
