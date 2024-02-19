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
import { useFetch, useRoute, useRouter } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
import { PageHeader } from "~/src/widgets/ui";
import { useInspector } from "~/src/entities/inspector";
import type { Inspector } from "~/src/entities/inspector/types";
import { useEvents } from "~/src/shared/lib/use-events";
import type { EventId, ServerEvent } from "~/src/shared/types";
import { InspectorPage } from "~/src/screens/inspector";

const { normalizeInspectorEvent } = useInspector();

export default defineComponent({
  components: { InspectorPage, PageHeader },

  async setup() {
    const route = useRoute();
    const router = useRouter();
    const eventId = route.params.id as EventId;

    const { events } = useEvents();

    const { data: event, pending } = await useFetch(events.getUrl(eventId), {
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
      clearEvent: () => events.removeById(eventId),
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
        ? normalizeInspectorEvent(
            this.serverEvent as unknown as ServerEvent<Inspector>
          )
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
