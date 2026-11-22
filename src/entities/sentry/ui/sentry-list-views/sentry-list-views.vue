<script lang="ts" setup>
import { computed } from 'vue'
import { SegmentedControl, type SegmentedOption } from '@/shared/ui'
import { useSentryView, type SentryViewTabName } from '../../lib'
import SentryViewIcon from './sentry-view-icon.vue'

// The view of a Sentry list (#6543), in row 2 of the header (design #6737 A):
// a view switch, icon and label; on a phone the icon only.
type Props = { tab: SentryViewTabName }

const props = defineProps<Props>()

const { views, current, select } = useSentryView(props.tab)
const options = computed<SegmentedOption[]>(() => views.map((v) => ({ value: v.id, label: v.label, icon: v.icon })))
</script>

<template>
  <SegmentedControl
    :model-value="current"
    :options="options"
    :label="tab === 'traces' ? 'Traces view' : 'Exceptions view'"
    size="sm"
    icon-only-on-phone
    test-prefix="view-tab-"
    @update:model-value="select"
  >
    <template #icon="{ option }">
      <SentryViewIcon
        v-if="option.icon"
        :name="option.icon"
      />
    </template>
  </SegmentedControl>
</template>
