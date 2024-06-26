<script lang="ts" setup>
import { useTitle } from "@vueuse/core";
import { computed, onMounted, ref } from "vue";
import { HttpDumpPage } from "~/src/screens/http-dump";
import { useFetch, useRoute, useRouter, useNuxtApp } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
import { PageEventHeader } from "~/src/widgets/ui";
import { useHttpDump } from "~/src/entities/http-dump";
import type { HttpDumpServer } from "~/src/entities/http-dump/types";
import { useEvents } from "~/src/shared/lib/use-events";
import type { EventId, ServerEvent } from "~/src/shared/types";

const { normalizeHttpDumpEvent } = useHttpDump();

const { params } = useRoute();
const router = useRouter();
const eventId = params.id as EventId;

useTitle(`Http dumps > ${eventId} | Buggregator`);

const { events } = useEvents();
const { $authToken } = useNuxtApp();

const isLoading = ref(false);
const serverEvent = ref<Event | null>(null);

const event = computed(() =>
  serverEvent.value
    ? normalizeHttpDumpEvent(
        serverEvent.value as unknown as ServerEvent<HttpDumpServer>
      )
    : null
);

const getEvent = async () => {
  await useFetch(events.getUrl(eventId), {
    headers: { "X-Auth-Token": $authToken.token || "" },
    onRequest() {
      isLoading.value = true;
    },
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
      <PageEventHeader title="Http dumps" :event-id="eventId" />
    </template>

    <div v-if="isLoading && !event" class="http-dump-event__loading">
      <div></div>
      <div></div>
      <div></div>
    </div>

    <HttpDumpPage v-if="event" :event="event" />
  </NuxtLayout>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";
.http-dump-event {
}

.http-dump-event__loading {
  @include loading;
}
</style>
