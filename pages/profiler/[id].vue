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
import { EventId } from "~/src/shared/types";
import { useFetch, useNuxtApp, useRoute, useRouter } from "#app";
import ProfilerPage from "~/components/ProfilerPage/ProfilerPage.vue";
import { PageHeader } from "~/src/widgets/ui";
import { useProfiler } from "~/src/entities/profiler/lib";

const { normalizeProfilerEvent } = useProfiler();

export default defineComponent({
  components: { ProfilerPage, PageHeader },
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
      title: `Profiler > ${this.eventId} | Buggregator`,
    };
  },
  computed: {
    event() {
      return this.serverEvent ? normalizeProfilerEvent(this.serverEvent) : null;
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
