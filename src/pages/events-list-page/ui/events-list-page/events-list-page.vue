<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  ChannelPanel,
  PageHeader,
  LayoutPreviewEvents,
  LayoutBase,
  LayoutSidebar,
  useEmptyHome
} from '@/widgets/ui'
import { ALL_EVENT_TYPES, PAGES_SETTINGS } from '@/shared/constants'
import { EventTypes, RouteName, type PageEventTypes } from '@/shared/types'

const route = useRoute()

const isFavorites = computed(() => route.name === RouteName.Favorites)

const paramsType = computed(() => (route.params?.type || undefined) as PageEventTypes | undefined)

const title = computed(() => {
  if (isFavorites.value) return 'Favorites'
  return paramsType?.value ? PAGES_SETTINGS[paramsType.value]?.title : ''
})

const type = computed(() => (paramsType.value as EventTypes) || ALL_EVENT_TYPES)

// Home of a project with no events: the channel panel, no header (#6012).
const isHome = computed(() => route.name === RouteName.Home)
const { show: showChannels, openList } = useEmptyHome(isHome)
</script>

<template>
  <LayoutBase
    class="events-list-page"
    :heading="showChannels ? '' : title || 'All events'"
  >
    <template #sidebar>
      <LayoutSidebar />
    </template>

    <template
      v-if="!showChannels"
      #header
    >
      <PageHeader
        :type="type"
        :title="title"
        :favorites-only="isFavorites"
      />
    </template>

    <ChannelPanel
      v-if="showChannels"
      @open-list="openList"
    />
    <LayoutPreviewEvents
      v-else
      :type="type"
      :title="title"
      :favorites-only="isFavorites"
    />
  </LayoutBase>
</template>

<style lang="scss" scoped>
.events-list-page {
  display: block;
}
</style>
