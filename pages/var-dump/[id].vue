<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import { useFetch, useHead, useNuxtApp, useRoute, useRouter } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
import { PageHeader } from "~/src/widgets/ui";
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
  title: `Var Dump > ${eventId} | Buggregator`,
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

const onDelete = () => {
  events.removeById(eventId);

  router.push("/");
};

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
  <main class="var-dump">
    <PageHeader
      class="var-dump__head"
      button-title="Delete event"
      @delete="onDelete"
    >
      <NuxtLink to="/">Home</NuxtLink>&nbsp;/&nbsp;
      <NuxtLink to="/var-dump">Var Dump</NuxtLink>&nbsp;/&nbsp;
      <NuxtLink :disabled="true">{{ eventId }}</NuxtLink>
    </PageHeader>

    <div v-if="isLoading && !event" class="var-dump__loading">
      <div></div>
      <div></div>
      <div></div>
    </div>

    <div class="var-dump__body">
      {{ JSON.stringify(event) }}
    </div>
  </main>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.var-dump {
  @include layout;
}

.var-dump__head {
  @include layout-head;
}

.var-dump__loading {
  @include loading;
  @include layout-body;
}

.var-dump__body {
  @include layout-body;
}
</style>
