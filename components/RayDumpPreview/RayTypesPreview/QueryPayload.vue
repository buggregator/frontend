<template>
  <div class="query-payload">
    <CodeSnippet language="sql" :code="formattedSql" />
    <TableBase>
      <TableBaseRow title="Connection name">
        {{ payload.content.connection_name }}
      </TableBaseRow>
      <TableBaseRow title="Time"> {{ payload.content.time }}ms </TableBaseRow>
    </TableBase>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { RayPayload } from "~/config/types";
import { TableBase, TableBaseRow, CodeSnippet } from "~/src/shared/ui";

export default defineComponent({
  components: {
    TableBaseRow,
    TableBase,
    CodeSnippet,
  },
  props: {
    payload: {
      type: Object as PropType<RayPayload>,
      required: true,
    },
  },
  computed: {
    formattedSql() {
      return (this.payload.content?.bindings || []).reduce(
        (result, binding) => (result || "").replace(/\?/, `'${binding}'`),
        this.payload.content?.sql || ""
      );
    },
  },
});
</script>

<style lang="scss" scoped>
.query-payload {
  width: 100%;
}
</style>
