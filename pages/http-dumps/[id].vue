<template>
  <main class="http-dumps-event">
    <PageHeader
      class="http-dumps-event__head"
      button-title="Delete event"
      @delete="onDelete"
    >
      <NuxtLink to="/">Home</NuxtLink>&nbsp;/
      <NuxtLink to="/http-dumps">Http dumps</NuxtLink>&nbsp;/
      <NuxtLink :disabled="true">{{ event.id }}</NuxtLink>
    </PageHeader>

    <div v-if="pending && !event" class="http-dumps-event__loading">
      <div></div>
      <div></div>
      <div></div>
    </div>

    <div class="http-dumps-event__body">
      <HttpDumpPage v-if="event" :event="event" />
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { HttpDumpPage } from "~/src/screens/http-dump";
import { useFetch, useNuxtApp, useRoute, useRouter } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
import { PageHeader } from "~/src/widgets/ui";
import { useHttpDump } from "~/src/entities/http-dump";
import { HttpDump } from "~/src/entities/http-dump/types";
import { EventId, ServerEvent } from "~/src/shared/types";

const { normalizeHttpDumpEvent } = useHttpDump();

export default defineComponent({
  components: { HttpDumpPage, PageHeader },

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
      title: `Http dumps > ${this.eventId} | Buggregator`,
    };
  },
  computed: {
    event() {
      return this.serverEvent
        ? normalizeHttpDumpEvent(this.serverEvent as ServerEvent<HttpDump>)
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
.http-dumps-event {
  @include layout;
}

.http-dumps-event__head {
  @include layout-head;
}

.http-dumps-event__loading {
  @include loading;
  @include layout-body;
}

.http-dumps-event__body {
  @include layout-body;
}
</style>
