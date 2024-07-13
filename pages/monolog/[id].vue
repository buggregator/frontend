<script lang="ts" setup>
import { useTitle } from "@vueuse/core";
import { computed, onMounted, ref } from "vue";
import { MonologPage } from "~/src/screens/monolog";
import { useRoute, useRouter } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
import { PageEventHeader } from "~/src/widgets/ui";
import { useMonolog } from "~/src/entities/monolog";
import type { Monolog } from "~/src/entities/monolog/types";
import { useEvents } from "~/src/shared/lib/use-events";
import type { EventId, ServerEvent } from "~/src/shared/types";

const { normalizeMonologEvent } = useMonolog();

const { params } = useRoute();
const router = useRouter();
const eventId = params.id as EventId;

useTitle(`Monolog > ${eventId} | Buggregator`);

const {
  events: { getItem },
} = useEvents();

const isLoading = ref(false);
const serverEvent = ref<ServerEvent<Monolog> | null>(null);

const event = computed(() =>
  serverEvent.value ? normalizeMonologEvent(serverEvent.value) : null,
);

const getEvent = async () => {
  isLoading.value = true;

  try {
    serverEvent.value = (await getItem(
      eventId,
    )) as unknown as ServerEvent<Monolog>;
    isLoading.value = false;

    if (!serverEvent.value) {
      router.push("/404");
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
      <PageEventHeader title="Monolog" :event-id="eventId" />
    </template>

    <div v-if="isLoading && !event" class="monolog__loading">
      <div></div>
      <div></div>
      <div></div>
    </div>

    <div v-if="event">
      <MonologPage :event="event" />
    </div>
  </NuxtLayout>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.monolog {
}

.monolog__loading {
  @include loading;
  @include layout-body;
}
</style>
