<script lang="ts" setup>
import { onMounted, computed, ref } from "vue";
import { InspectorPage } from "~/src/screens/inspector";
import { useFetch, useHead, useRoute, useRouter, useNuxtApp } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
import { PageEventHeader } from "~/src/widgets/ui";
import { useInspector } from "~/src/entities/inspector";
import type { Inspector } from "~/src/entities/inspector/types";
import { useEvents } from "~/src/shared/lib/use-events";
import type { EventId, ServerEvent } from "~/src/shared/types";

const { normalizeInspectorEvent } = useInspector();

const { params } = useRoute();
const { $authToken } = useNuxtApp();
const router = useRouter();
const eventId = params.id as EventId;

useHead({
  title: `Inspector > ${eventId} | Buggregator`,
});

const { events } = useEvents();

const isLoading = ref(false);
const serverEvent = ref<Event | null>(null);

const event = computed(() =>
  serverEvent.value
    ? normalizeInspectorEvent(
        serverEvent.value as unknown as ServerEvent<Inspector>
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
  <main class="inspector-event">
    <PageEventHeader title="Inspector" :event-id="eventId" />

    <div v-if="isLoading && !event" class="inspector-event__loading">
      <div></div>
      <div></div>
      <div></div>
    </div>

    <div class="inspector-event__body">
      <InspectorPage v-if="event" :event="event" />
    </div>
  </main>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";
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
