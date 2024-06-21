<script lang="ts" setup>
import { useTitle } from "@vueuse/core";
import { computed, onMounted, ref } from "vue";
import { VarDumpPage } from "~/src/screens/var-dump";
import { useFetch, useNuxtApp, useRoute, useRouter } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
import { PageEventHeader } from "~/src/widgets/ui";
import { useVarDump } from "~/src/entities/var-dump";
import type { VarDump } from "~/src/entities/var-dump/types";
import { useEvents } from "~/src/shared/lib/use-events";
import type { EventId, ServerEvent } from "~/src/shared/types";

const { normalizeVarDumpEvent } = useVarDump();

const { params } = useRoute();
const { $authToken } = useNuxtApp();
const router = useRouter();
const eventId = params.id as EventId;

useTitle(`Var Dump > ${eventId} | Buggregator`);

const { events } = useEvents();

const isLoading = ref(false);
const serverEvent = ref<ServerEvent<VarDump> | null>(null);

const event = computed(() =>
  serverEvent.value ? normalizeVarDumpEvent(serverEvent.value) : null
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
  <main class="var-dump">
    <PageEventHeader title="Var Dump" :event-id="eventId" />

    <div v-if="isLoading && !event" class="var-dump__loading">
      <div></div>
      <div></div>
      <div></div>
    </div>

    <div v-if="event" class="var-dump__body">
      <VarDumpPage :event="event" />
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
