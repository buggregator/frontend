<script lang="ts" setup>
import { computed } from "vue";
import { useRouter } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
import { REST_API_URL } from "~/src/shared/lib/io";
import { useEvents } from "~/src/shared/lib/use-events";
import type { Uuid } from "~/src/shared/types";
import { PageHeader } from "../page-header";

type Props = {
  title: string;
  eventId: Uuid;
};

const props = defineProps<Props>();

const { events } = useEvents();
const router = useRouter();

const eventsListLink = computed(() =>
  router.currentRoute.value.path.replace(`/${props.eventId}`, "")
);
const onDelete = () => {
  events.removeById(props.eventId);

  router.push("/");
};

const eventUrl = computed(() => `${REST_API_URL}/api/event/${props.eventId}`);
</script>

<template>
  <PageHeader class="page-event-header">
    <NuxtLink to="/">Home</NuxtLink>
    &nbsp;/&nbsp;
    <NuxtLink :to="eventsListLink">{{ title }}</NuxtLink>
    &nbsp;/&nbsp;
    <NuxtLink :disabled="true">{{ eventId }}</NuxtLink>

    <template #controls>
      <a
        v-if="eventUrl"
        :href="eventUrl"
        target="_blank"
        class="page-event-header__button"
        title="Open JSON payload for this event in new tab"
      >
        Open JSON
      </a>

      <button class="page-event-header__clear-button" @click="onDelete">
        Delete event
      </button>
    </template>
  </PageHeader>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.page-event-header {
  @include layout-head;
}

.page-event-header__button {
  @include button;
  @apply bg-gray-800 hover:bg-gray-700;
}

.page-event-header__clear-button {
  @include button;
  @apply bg-red-800 hover:bg-red-700;
}
</style>
