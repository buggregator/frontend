<script lang="ts" setup>
import { useTitle } from "@vueuse/core";
import { onMounted, computed, ref } from "vue";
import { InspectorPage } from "~/src/screens/inspector";
import { useFetch, useRoute, useRouter, useNuxtApp } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
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

useTitle(`Inspector > ${eventId} | Buggregator`);

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
  <NuxtLayout>
    <template #header>
      <PageEventHeader title="Inspector" :event-id="eventId" />
    </template>

    <div v-if="isLoading && !event" class="inspector-event__loading">
      <div></div>
      <div></div>
      <div></div>
    </div>

    <InspectorPage v-if="event" :event="event" />
  </NuxtLayout>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";
.inspector-event {
}

.inspector-event__loading {
  @include loading;
}
</style>
