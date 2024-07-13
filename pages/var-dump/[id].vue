<script lang="ts" setup>
import { useTitle } from "@vueuse/core";
import { computed, onMounted, ref } from "vue";
import { VarDumpPage } from "~/src/screens/var-dump";
import { useRoute, useRouter } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
import { PageEventHeader } from "~/src/widgets/ui";
import { useVarDump } from "~/src/entities/var-dump";
import type { VarDump } from "~/src/entities/var-dump/types";
import { useEvents } from "~/src/shared/lib/use-events";
import type { EventId, ServerEvent } from "~/src/shared/types";

const { normalizeVarDumpEvent } = useVarDump();

const { params } = useRoute();
const router = useRouter();
const eventId = params.id as EventId;

useTitle(`Var Dump > ${eventId} | Buggregator`);

const {
  events: { getItem },
} = useEvents();

const isLoading = ref(false);
const serverEvent = ref<ServerEvent<VarDump> | null>(null);

const event = computed(() =>
  serverEvent.value ? normalizeVarDumpEvent(serverEvent.value) : null,
);

const getEvent = async () => {
  isLoading.value = true;

  try {
    serverEvent.value = (await getItem(
      eventId,
    )) as unknown as ServerEvent<VarDump>;
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
      <PageEventHeader title="Var Dump" :event-id="eventId" />
    </template>

    <div v-if="isLoading && !event" class="var-dump__loading">
      <div></div>
      <div></div>
      <div></div>
    </div>

    <div v-if="event">
      <VarDumpPage :event="event" />
    </div>
  </NuxtLayout>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.var-dump {
  display: block;
}

.var-dump__loading {
  @include loading;
}
</style>
