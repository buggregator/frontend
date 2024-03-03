<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import { useFetch, useRoute, useRouter, useHead } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
import { PageHeader } from "~/src/widgets/ui";
import { useHttpDump } from "~/src/entities/http-dump";
import type { HttpDump } from "~/src/entities/http-dump/types";
import { useEvents } from "~/src/shared/lib/use-events";
import type { EventId, ServerEvent } from "~/src/shared/types";
import { HttpDumpPage } from "~/src/screens/http-dump";

const { normalizeHttpDumpEvent } = useHttpDump();

const { params } = useRoute();
const router = useRouter();
const eventId = params.id as EventId;

useHead({
  title: `Http dumps > ${eventId} | Buggregator`,
});

const { events } = useEvents();

const isLoading = ref(false);
const serverEvent = ref<Event | null>(null);

const event = computed(() =>
  serverEvent.value
    ? normalizeHttpDumpEvent(
        serverEvent.value as unknown as ServerEvent<HttpDump>
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
  <main class="http-dumps-event">
    <PageHeader
      class="http-dumps-event__head"
      button-title="Delete event"
      @delete="onDelete"
    >
      <NuxtLink to="/">Home</NuxtLink>&nbsp;/
      <NuxtLink to="/http-dumps">Http dumps</NuxtLink>&nbsp;/
      <NuxtLink :disabled="true">{{ eventId }}</NuxtLink>
    </PageHeader>

    <div v-if="isLoading && !event" class="http-dumps-event__loading">
      <div></div>
      <div></div>
      <div></div>
    </div>

    <div class="http-dumps-event__body">
      <HttpDumpPage v-if="event" :event="event" />
    </div>
  </main>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";
.http-dumps-event {
  @include layout;
}

.http-dumps-event__head {
  @include layout-head;
}

.http-dumps-event__loading {
  @include loading;
  @include layout-body;
}

.http-dumps-event__body {
  @include layout-body;
}
</style>
