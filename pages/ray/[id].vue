<script lang="ts" setup>
import { useTitle } from "@vueuse/core";
import { computed, onMounted, ref } from "vue";
import { RayPage } from "~/src/screens/ray";
import { useFetch, useNuxtApp, useRoute, useRouter } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
import { PageEventHeader } from "~/src/widgets/ui";
import { useRay } from "~/src/entities/ray";
import type { RayDump } from "~/src/entities/ray/types";
import { useEvents } from "~/src/shared/lib/use-events";
import type { EventId, ServerEvent } from "~/src/shared/types";

const { normalizeRayEvent } = useRay();

const { params } = useRoute();
const { $authToken } = useNuxtApp();
const router = useRouter();
const eventId = params.id as EventId;

useTitle(`Ray Dumo > ${eventId} | Buggregator`);

const { events } = useEvents();

const isLoading = ref(false);
const serverEvent = ref<ServerEvent<RayDump> | null>(null);

const event = computed(() =>
  serverEvent.value ? normalizeRayEvent(serverEvent.value) : null
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
  <main class="ray-dump">
    <PageEventHeader title="Ray Dump" :event-id="eventId" />

    <div v-if="isLoading && !event" class="ray-dump__loading">
      <div></div>
      <div></div>
      <div></div>
    </div>

    <div v-if="event" class="ray-dump__body">
      <RayPage :event="event" />
    </div>
  </main>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.ray-dump {
  @include layout;
}

.ray-dump__head {
  @include layout-head;
}

.ray-dump__loading {
  @include loading;
  @include layout-body;
}

.ray-dump__body {
  @include layout-body;
}
</style>
