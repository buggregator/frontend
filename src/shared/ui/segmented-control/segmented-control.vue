<script lang="ts" setup generic="T extends string | number | boolean">
import { IconSvg } from '../icon-svg'
import type { SegmentedOption } from './types'

// One choice out of a few views of the same thing (#6628, design #6737):
// role="group" of buttons with aria-pressed, Tab moves between them. Pages
// and tabs of content use Tabs instead.
type Props = {
  options: SegmentedOption<T>[]
  modelValue: T
  // The group's name; without it give aria-labelledby on the component.
  label?: string
  size?: 'sm' | 'md'
  variant?: 'track' | 'outline'
  // Phones show the icons only; the label stays the button's name.
  iconOnlyOnPhone?: boolean
  // The group fills its row, the options share it.
  block?: boolean
  // data-test of an option: `${testPrefix}${value}`.
  testPrefix?: string
}

withDefaults(defineProps<Props>(), {
  label: undefined,
  size: 'md',
  variant: 'track',
  testPrefix: undefined
})
const emit = defineEmits<{ 'update:modelValue': [value: T] }>()

const pick = (option: SegmentedOption<T>) => {
  if (!option.disabled) emit('update:modelValue', option.value)
}
</script>

<template>
  <div
    class="ui-seg"
    :class="[
      `ui-seg--${variant}`,
      `ui-seg--${size}`,
      { 'ui-seg--icon-phone': iconOnlyOnPhone, 'ui-seg--block': block }
    ]"
    role="group"
    :aria-label="label"
  >
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      class="ui-seg__opt"
      :aria-pressed="option.value === modelValue"
      :aria-disabled="option.disabled || undefined"
      :aria-label="iconOnlyOnPhone ? option.label : undefined"
      :title="option.title"
      :data-test="testPrefix ? `${testPrefix}${option.value}` : undefined"
      @click="pick(option)"
    >
      <slot
        name="icon"
        :option="option"
      >
        <IconSvg
          v-if="option.icon"
          :name="option.icon"
          class="ui-seg__icon"
        />
      </slot>
      <span class="ui-seg__label">{{ option.label }}</span>
      <span
        v-if="option.count != null"
        class="ui-seg__count"
      >{{ option.count }}</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
@use 'src/assets/seg-tokens' as seg;

.ui-seg {
  @include seg.tokens;
  @include seg.track;

  flex: none;
}

.ui-seg__opt {
  @include seg.item;

  &[aria-pressed='true'] {
    @include seg.item-on;
  }
}

.ui-seg--sm .ui-seg__opt {
  @include seg.item-sm;
}

// Outline: no track; options side by side in one bordered box.
.ui-seg--outline {
  gap: 0;
  padding: 0;
  border-radius: 6px;
  background: none;
  overflow: hidden;

  .ui-seg__opt {
    border-radius: 0;

    & + .ui-seg__opt {
      border-left-color: var(--seg-line);
    }

    &[aria-pressed='true'] {
      border-color: var(--seg-on-line);
    }

    &:focus-visible {
      outline-offset: -2px;
    }
  }
}

.ui-seg--block {
  display: flex;
  width: 100%;

  .ui-seg__opt {
    flex: 1 1 0;
  }
}

.ui-seg__icon,
.ui-seg__opt :slotted(svg) {
  @include seg.icon;
}

.ui-seg__count {
  @include seg.count;

  [aria-pressed='true'] > & {
    color: var(--seg-on-text);
  }
}

@media (max-width: 639px) {
  .ui-seg--icon-phone .ui-seg__label {
    display: none;
  }
}
</style>
