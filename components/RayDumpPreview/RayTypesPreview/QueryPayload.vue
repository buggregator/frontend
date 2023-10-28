<template>
  <div class="query-payload">
    <CodeSnippet language="sql" :code="formattedSql" />
    <EventTable>
      <EventTableRow title="Connection name">
        {{ payload.content.connection_name }}
      </EventTableRow>
      <EventTableRow title="Time"> {{ payload.content.time }}ms </EventTableRow>
    </EventTable>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { RayPayload } from "~/config/types";
import EventTable from "~/components/EventTable/EventTable.vue";
import EventTableRow from "~/components/EventTableRow/EventTableRow.vue";
import { CodeSnippet } from "~/src/widgets/ui";

export default defineComponent({
  components: {
    EventTableRow,
    EventTable,
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
