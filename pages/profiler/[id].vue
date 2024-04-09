<template>
  <main class="profiler-event">
    <PageHeader
      class="profiler-event__head"
      button-title="Delete event"
      @delete="onDelete"
    >
      <NuxtLink to="/">Home</NuxtLink>&nbsp;/&nbsp;
      <NuxtLink to="/profiler">Profiler</NuxtLink>&nbsp;/&nbsp;
      <NuxtLink :disabled="true">{{ eventId }}</NuxtLink>
    </PageHeader>

    <div v-if="pending && !event" class="profiler-event__loading">
      <div></div>
      <div></div>
      <div></div>
    </div>

    <div class="profiler-event__body">
      <ProfilerPage v-if="event" :event="event" />
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useFetch, useNuxtApp, useRoute, useRouter } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
import { PageHeader } from "~/src/widgets/ui";
import { useProfiler } from "~/src/entities/profiler";
import type { Profiler } from "~/src/entities/profiler/types";
import { useEvents } from "~/src/shared/lib/use-events";
import type { EventId, ServerEvent } from "~/src/shared/types";
import { ProfilerPage } from "~/src/screens/profiler";

const { normalizeProfilerEvent } = useProfiler();

export default defineComponent({
  components: { ProfilerPage, PageHeader },
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
      title: `Profiler > ${this.eventId} | Buggregator`,
    };
  },
  computed: {
    event() {
      return this.serverEvent
        ? normalizeProfilerEvent(
            this.serverEvent as unknown as ServerEvent<Profiler>
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

.profiler-event {
  @include layout;
}

.profiler-event__head {
  @include layout-head;
}

.profiler-event__loading {
  @include loading;
  @include layout-body;
}

.profiler-event__body {
  @include layout-body;
}
</style>
