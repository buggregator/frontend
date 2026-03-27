<script lang="ts" setup>
import { Tabs } from 'vue3-tabs-component'

type Props = {
  useUrlFragment?: boolean
}

withDefaults(defineProps<Props>(), {
  useUrlFragment: false
})

const emit = defineEmits<{
  changed: [tab: { tab: { name: string } }]
}>()
</script>

<template>
  <Tabs
    :options="{ useUrlFragment }"
    class="page-tabs"
    @changed="emit('changed', $event)"
  >
    <slot />
  </Tabs>
</template>

<style lang="scss">
.page-tabs .tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: theme('colors.gray.200');
  color: theme('colors.gray.500');
  vertical-align: top;
  margin-left: 4px;
  margin-top: -4px;

  .dark & {
    background: theme('colors.gray.700');
    color: theme('colors.gray.400');
  }

  .is-active & {
    background: theme('colors.blue.100');
    color: theme('colors.blue.600');

    .dark & {
      background: rgba(59, 130, 246, 0.15);
      color: theme('colors.blue.400');
    }
  }
}
</style>
