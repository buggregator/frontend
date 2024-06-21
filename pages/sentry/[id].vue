<script lang="ts" setup>
import { useTitle } from "@vueuse/core";
import { computed, onMounted, ref } from "vue";
import { SentryPage } from "~/src/screens/sentry";
import { useRoute, useRouter, useFetch, useNuxtApp } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
import { PageEventHeader } from "~/src/widgets/ui";
import { useSentry } from "~/src/entities/sentry";
import type { Sentry } from "~/src/entities/sentry/types";
import { useEvents } from "~/src/shared/lib/use-events";
import type { EventId, ServerEvent } from "~/src/shared/types";

const { normalizeSentryEvent } = useSentry();

const { params } = useRoute();
const router = useRouter();
const eventId = params.id as EventId;

useTitle(`Sentry > ${eventId} | Buggregator`);

const { events } = useEvents();
const { $authToken } = useNuxtApp();
const isLoading = ref(false);
const serverEvent = ref<Event | null>(null);

const event = computed(() =>
  serverEvent.value
    ? normalizeSentryEvent(serverEvent.value as unknown as ServerEvent<Sentry>)
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
  <main class="sentry-event">
    <PageEventHeader title="Sentry" :event-id="eventId" />

    <div v-if="isLoading && !event" class="sentry-event__loading">
      <div></div>
      <div></div>
      <div></div>
    </div>

    <SentryPage v-if="event" :event="event" class="sentry-event__body" />
  </main>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

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
