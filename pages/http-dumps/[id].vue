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
import { useFetch, useRoute, useRouter, useNuxtApp } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
import { PageHeader } from "~/src/widgets/ui";
import { useHttpDump } from "~/src/entities/http-dump";
import type { HttpDump } from "~/src/entities/http-dump/types";
import { useEvents } from "~/src/shared/lib/use-events";
import type { EventId, ServerEvent } from "~/src/shared/types";
import { HttpDumpPage } from "~/src/screens/http-dump";

const { normalizeHttpDumpEvent } = useHttpDump();

export default defineComponent({
  components: { HttpDumpPage, PageHeader },

  async setup() {
    const route = useRoute();
    const router = useRouter();
    const nuxtApp = useNuxtApp();
    const eventId = route.params.id as EventId;

    const { events } = useEvents();

    const { data: event, pending } = await useFetch(events.getUrl(eventId), {
      headers: {"X-Auth-Token": nuxtApp.$authToken.token},
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
      title: `Http dumps > ${this.eventId} | Buggregator`,
    };
  },
  computed: {
    event() {
      return this.serverEvent
        ? normalizeHttpDumpEvent(
            this.serverEvent as unknown as ServerEvent<HttpDump>
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
