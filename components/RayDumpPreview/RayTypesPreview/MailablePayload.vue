<template>
  <div class="ray-type-mailable">
    <h3 v-if="eventValue.subject" class="font-bold">
      {{ eventValue.subject }}
    </h3>
    <div v-if="eventValue.mailable_class" class="event-ray__mailable-class">
      {{ eventValue.mailable_class }}
    </div>

    <div class="text-xs font-semibold mt-3 flex flex-wrap items-center">
      <div class="flex border border-purple-300 rounded items-center mr-3 mb-2">
        <div class="px-3 py-1 border-r">From</div>
        <div class="px-3 py-1 bg-gray-800 text-white font-semibold rounded-r" v-for="email in eventValue.from">{{ email.name }} [{{ email.email }}]</div>
      </div>

      <div class="flex border border-purple-300 rounded items-center mr-3 mb-2" v-for="email in eventValue.to">
        <div class="px-3 py-1 border-r">To</div>
        <div class="px-3 py-1 bg-blue-800 text-white font-semibold rounded-r">{{ email.name }} [{{email.email}}]</div>
      </div>

      <div class="flex border border-purple-300 rounded items-center mr-3 mb-2" v-for="email in eventValue.cc">
        <div class="px-3 py-1 border-r">CC</div>
        <div class="px-3 py-1 bg-red-800 text-white font-semibold rounded-r">{{ email.name }} [{{email.email}}]</div>
      </div>

      <div class="flex border border-purple-300 rounded items-center mr-3 mb-2" v-for="email in eventValue.bcc">
        <div class="px-3 py-1 border-r">BCC</div>
        <div class="px-3 py-1 bg-purple-800 text-white font-semibold rounded-r">{{ email.name }} [{{email.email}}]</div>
      </div>

      <div class="flex border border-purple-300 rounded items-center mr-3 mb-2" v-for="email in eventValue.reply_to">
        <div class="px-3 py-1 border-r">Reply to</div>
        <div class="px-3 py-1 bg-green-800 text-white font-semibold rounded-r">{{ email.name }} [{{email.email}}]</div>
      </div>
    </div>
    <div class="collapsed" :class="{'cursor-pointer': !collapsed}">
      <h3 class="collapsed__title-wrap" @click="collapsed = !collapsed">
        HTML
        <div class="ray-type-mailable__icon">
          <svg viewBox="0 0 16 16"
               fill="currentColor"
               height="100%"
               width="100%"
               :class="{'transform rotate-180':  collapsed}"
          >
            <path d="M14,11.75a.74.74,0,0,1-.53-.22L8,6.06,2.53,11.53a.75.75,0,0,1-1.06-1.06l6-6a.75.75,0,0,1,1.06,0l6,6a.75.75,0,0,1,0,1.06A.74.74,0,0,1,14,11.75Z"></path>
          </svg>
        </div>
      </h3>

      <div v-if="collapsed" class="collapsed__body">
        <div v-html="eventValue.html"/>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { RayPayload } from "~/config/types";

export default defineComponent({
  props: {
    payload: {
      type: Object as PropType<RayPayload>,
      required: true,
    },
  },
  data() {
    return {
      collapsed: true,
    }
  },
  computed: {
    isEmptyValue() {
      return this.eventValue === "";
    },
    eventValue(): unknown {
      return this.payload.content || "";
    },
  },
});
</script>

<style lang="scss" scoped>
.ray-type-mailable{
  &__icon {
    @apply w-5 h-4 border border-purple-300 shadow bg-white dark:bg-gray-600 py-1 rounded;
  }
}
</style>
