<template>
  <div class="ray-type-mailable">
    <EventTable>
      <EventTableRow v-if="eventValue.subject" title="Subject">
        {{ eventValue.subject }}
      </EventTableRow>
      <EventTableRow v-if="eventValue.mailable_class" title="Mailable class">
        {{ eventValue.mailable_class }}
      </EventTableRow>
      <EventTableRow
        v-if="eventValue.from && eventValue.from.length > 0"
        title="From"
      >
        {{ getValuesField(eventValue.from) }}
      </EventTableRow>
      <EventTableRow
        v-if="eventValue.to && eventValue.to.length > 0"
        title="To"
      >
        {{ getValuesField(eventValue.to) }}
      </EventTableRow>
      <EventTableRow
        v-if="eventValue.cc && eventValue.cc.length > 0"
        title="Cc"
      >
        {{ getValuesField(eventValue.cc) }}
      </EventTableRow>
      <EventTableRow
        v-if="eventValue.bcc && eventValue.bcc.length > 0"
        title="Bcc"
      >
        {{ getValuesField(eventValue.bcc) }}
      </EventTableRow>
      <EventTableRow
        v-if="eventValue.reply_to && eventValue.reply_to.length > 0"
        title="Reply to"
      >
        {{ getValuesField(eventValue.reply_to) }}
      </EventTableRow>
    </EventTable>
    <div
      class="ray-type-mailable__collapsed"
      :class="{ 'cursor-pointer': !collapsed }"
    >
      <h3
        class="ray-type-mailable__collapsed-header"
        @click="collapsed = !collapsed"
      >
        <span>HTML</span>
        <div class="ray-type-mailable__icon">
          <IconSvg
            name="collapsed"
            :class="{ 'transform rotate-180': collapsed }"
          />
        </div>
      </h3>

      <div v-if="collapsed" class="ray-type-mailable__body">
        <div v-html="eventValue.html" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { RayPayload } from "~/config/types";
import EventTableRow from "~/components/EventTableRow/EventTableRow.vue";
import EventTable from "~/components/EventTable/EventTable.vue";
import { IconSvg } from "~/src/shared/ui";

export default defineComponent({
  components: {
    EventTableRow,
    EventTable,
    IconSvg,
  },
  props: {
    payload: {
      type: Object as PropType<RayPayload>,
      required: true,
    },
  },
  data() {
    return {
      collapsed: true,
    };
  },
  computed: {
    isEmptyValue() {
      return this.eventValue === "";
    },
    eventValue(): unknown {
      return this.payload.content || "";
    },
  },
  methods: {
    getValuesField(values: { name: string; email: string }[]): string {
      const formattedValues = values!.map((v) => `${v.name}[${v.email}]`) || [];
      return formattedValues.join(", ");
    },
  },
});
</script>

<style lang="scss" scoped>
.ray-type-mailable {
  &__icon {
    @apply w-5 h-4 border border-purple-300 shadow bg-white dark:bg-gray-600 py-1 rounded mt-0.5 flex items-center justify-center;
    .icon-svg {
      width: 10px;
    }
  }
  &__collapsed-header {
    @apply flex w-full justify-between my-2;
  }
}
</style>
