<script lang="ts" setup>
type Props = {
  checked: boolean
  // Stays focusable so a screen reader still reaches it; a click does nothing.
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), { disabled: false })
const emit = defineEmits<{ toggle: [] }>()

const onClick = () => {
  if (!props.disabled) emit('toggle')
}
</script>

<template>
  <button
    type="button"
    class="settings-switch"
    :class="{ 'settings-switch--on': checked, 'settings-switch--disabled': disabled }"
    role="switch"
    :aria-checked="checked"
    :aria-disabled="disabled || undefined"
    @click="onClick"
  >
    <span class="settings-switch__knob" />
  </button>
</template>

<style lang="scss" scoped>
// Off 3.04:1 (dark) and 4.83:1 (light) against the row; on 3.99:1 and 5.17:1.
.settings-switch {
  @apply relative inline-flex h-6 w-11 items-center rounded-full flex-shrink-0 cursor-pointer;
  @apply bg-gray-500;
  @apply transition-colors duration-200;

  // 44 px to tap on a phone, the switch itself stays small.
  &::before {
    content: '';
    @apply absolute;
    inset: -10px 0;
  }
}

.settings-switch--on {
  @apply bg-blue-600 dark:bg-blue-500;
}

.settings-switch--disabled {
  @apply opacity-50 cursor-not-allowed;
}

.settings-switch__knob {
  @apply inline-block h-4 w-4 transform rounded-full bg-white shadow-sm;
  @apply transition-transform duration-200;
  @apply translate-x-1;

  .settings-switch--on & {
    @apply translate-x-6;
  }
}
</style>
