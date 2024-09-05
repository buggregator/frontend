<script lang="ts" setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { REST_API_URL } from '@/shared/lib/io'
import { useEvents } from '@/shared/lib/use-events'
import type { Uuid } from '@/shared/types'
import { AppHeader } from '@/shared/ui'

type Props = {
  title: string
  eventId: Uuid
}

const props = defineProps<Props>()

const { events } = useEvents()
const router = useRouter()

const eventsListLink = computed(() =>
  router.currentRoute.value.path.replace(`/${props.eventId}`, '')
)
const onDelete = () => {
  events.removeById(props.eventId)

  router.push('/')
}

const eventUrl = computed(() => `${REST_API_URL}/api/event/${props.eventId}`)
</script>

<template>
  <AppHeader class="page-event-header">
    <RouterLink to="/"> Home </RouterLink>
    &nbsp;/&nbsp;
    <RouterLink :to="eventsListLink">
      {{ title }}
    </RouterLink>
    &nbsp;/&nbsp;
    <RouterLink :disabled="true">
      {{ eventId }}
    </RouterLink>

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

      <button class="page-event-header__clear-button" @click="onDelete">Delete event</button>
    </template>
  </AppHeader>
</template>

<style lang="scss" scoped>
@import 'src/assets/mixins';

.page-event-header {
  @apply flex justify-between h-full flex-wrap py-1 gap-1;
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
