<script lang="ts" setup>
import { onMounted, computed, ref } from "vue";
import { useFetch, useHead, useRoute, useRouter } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
import { PageHeader } from "~/src/widgets/ui";
import { useInspector } from "~/src/entities/inspector";
import type { Inspector } from "~/src/entities/inspector/types";
import { useEvents } from "~/src/shared/lib/use-events";
import type { EventId, ServerEvent } from "~/src/shared/types";
import { InspectorPage } from "~/src/screens/inspector";

const { normalizeInspectorEvent } = useInspector();

const { params } = useRoute();
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

const onDelete = () => {
  events.removeById(eventId);

  router.push("/");
};

const getEvent = async () => {
  isLoading.value = true;

  await useFetch(events.getUrl(eventId), {
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
    <PageHeader
      class="inspector-event__head"
      button-title="Delete event"
      @delete="onDelete"
    >
      <NuxtLink to="/">Home</NuxtLink>&nbsp;/&nbsp;
      <NuxtLink to="/inspector">Inspector</NuxtLink>&nbsp;/&nbsp;
      <NuxtLink :disabled="true">{{ eventId }}</NuxtLink>
    </PageHeader>

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
