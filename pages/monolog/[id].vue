<script lang="ts" setup>
import { useTitle } from "@vueuse/core";
import { computed, onMounted, ref } from "vue";
import { MonologPage } from "~/src/screens/monolog";
import { useFetch, useNuxtApp, useRoute, useRouter } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
import { PageEventHeader } from "~/src/widgets/ui";
import { useMonolog } from "~/src/entities/monolog";
import type { Monolog } from "~/src/entities/monolog/types";
import { useEvents } from "~/src/shared/lib/use-events";
import type { EventId, ServerEvent } from "~/src/shared/types";

const { normalizeMonologEvent } = useMonolog();

const { params } = useRoute();
const { $authToken } = useNuxtApp();
const router = useRouter();
const eventId = params.id as EventId;

useTitle(`Monolog > ${eventId} | Buggregator`);

const { events } = useEvents();

const isLoading = ref(false);
const serverEvent = ref<ServerEvent<Monolog> | null>(null);

const event = computed(() =>
  serverEvent.value ? normalizeMonologEvent(serverEvent.value) : null
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
  <main class="monolog">
    <PageEventHeader title="Monolog" :event-id="eventId" />

    <div v-if="isLoading && !event" class="monolog__loading">
      <div></div>
      <div></div>
      <div></div>
    </div>

    <div v-if="event" class="monolog__body">
      <MonologPage :event="event" />
    </div>
  </main>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.monolog {
  @include layout;
}

.monolog__loading {
  @include loading;
  @include layout-body;
}

.monolog__body {
  @include layout-body;
}
</style>
