<script lang="ts" setup>
import { useTitle } from "@vueuse/core";
import { computed, onMounted, ref } from "vue";
import { SentryPage } from "~/src/screens/sentry";
import { useRoute, useRouter } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
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

const {
  events: { getItem },
} = useEvents();
const isLoading = ref(false);
const serverEvent = ref<ServerEvent<Sentry> | null>(null);

const event = computed(() =>
  serverEvent.value ? normalizeSentryEvent(serverEvent.value) : null,
);

const getEvent = async () => {
  isLoading.value = true;

  try {
    serverEvent.value = (await getItem(
      eventId,
    )) as unknown as ServerEvent<Sentry>;
    isLoading.value = false;

    if (!serverEvent.value) {
      throw new Error("Event not found");
    }
  } catch (error) {
    router.push("/404");
  }
};

onMounted(getEvent);
</script>

<template>
  <NuxtLayout>
    <template #header>
      <PageEventHeader title="Sentry" :event-id="eventId" />
    </template>

    <div v-if="isLoading && !event" class="sentry-event__loading">
      <div></div>
      <div></div>
      <div></div>
    </div>

    <SentryPage v-if="event" :event="event" />
  </NuxtLayout>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.sentry-event {
  display: block;
}

.sentry-event__loading {
  @include loading;
}
</style>
