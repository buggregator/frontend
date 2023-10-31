<template>
  <main class="inspector-event">
    <PageHeader
      class="inspector-event__head"
      button-title="Delete event"
      @delete="onDelete"
    >
      <NuxtLink to="/">Home</NuxtLink>&nbsp;/&nbsp;
      <NuxtLink to="/inspector">Inspector</NuxtLink>&nbsp;/&nbsp;
      <NuxtLink :disabled="true">{{ event.id }}</NuxtLink>
    </PageHeader>

    <div v-if="pending && !event" class="inspector-event__loading">
      <div></div>
      <div></div>
      <div></div>
    </div>

    <div class="inspector-event__body">
      <InspectorPage v-if="event" :event="event" />
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { EventId } from "~/src/shared/types";
import { useFetch, useNuxtApp, useRoute, useRouter } from "#app";
import { normalizeInspectorEvent } from "~/utils/normalize-event";
import InspectorPage from "~/components/InspectorPage/InspectorPage.vue";
import { PageHeader } from "~/src/widgets/ui";

export default defineComponent({
  components: { InspectorPage, PageHeader },

  async setup() {
    const route = useRoute();
    const router = useRouter();
    const eventId = route.params.id as EventId;

    if (process.client) {
      const { $events } = useNuxtApp();
      const { data: event, pending } = await useFetch($events.getUrl(eventId), {
        onResponse({ response }) {
          return response.data;
        },
        onResponseError() {
          router.push("/404");
        },
        onRequestError() {
          router.push("/404");
        },
      });

      return {
        serverEvent: event,
        pending,
        eventId,
        clearEvent: () => $events.removeById(eventId),
      };
    }

    return {
      serverEvent: null,
      pending: false,
      eventId,
      clearEvent: () => {},
    };
  },
  head() {
    return {
      title: `Inspector > ${this.eventId} | Buggregator`,
    };
  },
  computed: {
    event() {
      return this.serverEvent
        ? normalizeInspectorEvent(this.serverEvent)
        : null;
    },
  },
  methods: {
    onDelete() {
      this.clearEvent();

      this.$router.push("/");
    },
  },
});
</script>

<style lang="scss" scoped>
@import "assets/mixins";
.inspector-event {
  @include layout;
}

.inspector-event__head {
  @include layout-head;
}

.inspector-event__loading {
  @include loading;
  @include layout-body;
}

.inspector-event__body {
  @include layout-body;
}
</style>
