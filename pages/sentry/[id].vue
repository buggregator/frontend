<template>
  <main class="sentry-event">
    <PageHeader
      class="sentry-event__head"
      button-title="Delete event"
      @delete="onDelete"
    >
      <NuxtLink to="/">Home</NuxtLink>&nbsp;/&nbsp;
      <NuxtLink to="/sentry">Sentry</NuxtLink>&nbsp;/&nbsp;
      <NuxtLink :disabled="true">{{ eventId }}</NuxtLink>
    </PageHeader>

    <div v-if="pending && !event" class="sentry-event__loading">
      <div></div>
      <div></div>
      <div></div>
    </div>

    <SentryPage v-if="event" :event="event" class="sentry-event__body" />
  </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useRoute, useRouter, useFetch, useNuxtApp } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
import { PageHeader } from "~/src/widgets/ui";
import { useSentry } from "~/src/entities/sentry";
import type { Sentry } from "~/src/entities/sentry/types";
import { useEvents } from "~/src/shared/lib/use-events";
import type { EventId, ServerEvent } from "~/src/shared/types";
import { SentryPage } from "~/src/screens/sentry";

const { normalizeSentryEvent } = useSentry();

export default defineComponent({
  components: {
    SentryPage,
    PageHeader,
  },
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
      title: `Sentry > ${this.eventId} | Buggregator`,
    };
  },
  computed: {
    event() {
      return this.serverEvent
        ? normalizeSentryEvent(
            this.serverEvent as unknown as ServerEvent<Sentry>
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

.sentry-event {
  @include layout;
}

.sentry-event__head {
  @include layout-head;
}

.sentry-event__loading {
  @include loading;
  @include layout-body;
}

.sentry-event__body {
  @include layout-body;
}
</style>
