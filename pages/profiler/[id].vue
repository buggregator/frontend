<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import { ProfilerPage } from "~/src/screens/profiler";
import { useFetch, useHead, useNuxtApp, useRoute, useRouter } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
import { PageEventHeader } from "~/src/widgets/ui";
import { useProfiler } from "~/src/entities/profiler";
import type { Profiler } from "~/src/entities/profiler/types";
import { useEvents } from "~/src/shared/lib/use-events";
import type { EventId, ServerEvent } from "~/src/shared/types";

const { normalizeProfilerEvent } = useProfiler();

const { params } = useRoute();
const { $authToken } = useNuxtApp();
const router = useRouter();
const eventId = params.id as EventId;

useHead({
  title: `Profiler > ${eventId} | Buggregator`,
});

const { events } = useEvents();

const isLoading = ref(false);
const serverEvent = ref<Event | null>(null);

const event = computed(() =>
  serverEvent.value
    ? normalizeProfilerEvent(
        serverEvent.value as unknown as ServerEvent<Profiler>
      )
    : null
);
const getEvent = async () => {
  isLoading.value = true;

  await useFetch(events.getUrl(eventId), {
    headers: { "X-Auth-Token": $authToken.token || "" },
    onResponse({ response: { _data } }) {
      serverEvent.value = _data;
      isLoading.value = false;
    },
    onResponseError() {
      router.push("/404");
    },
    onRequestError() {
      router.push("/404");
    },
  });
};

onMounted(getEvent);
</script>

<template>
  <main class="profiler-event">
    <PageEventHeader title="Profiler" :event-id="eventId" />

    <div v-if="isLoading && !event" class="profiler-event__loading">
      <div></div>
      <div></div>
      <div></div>
    </div>

    <div class="profiler-event__body">
      <ProfilerPage v-if="event" :event="event" class="p-5" />
    </div>
  </main>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

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
  @apply h-full;
}
</style>
