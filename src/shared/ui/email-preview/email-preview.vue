<script lang="ts" setup>
import { ref } from 'vue';
import { IconSvg } from '../icon-svg';
import { Device } from './types';

type Props = {
  device: Device;
};

const props = withDefaults(defineProps<Props>(), {
  device: Device.Desktop,
});

const currentDevice = ref(props.device);

const selectDevice = (device: Device) => {
  currentDevice.value = device;
};
</script>

<template>
  <div class="attachment-preview">
    <div class="attachment-preview__in">
      <button
        class="attachment-preview__btn"
        :class="{
          'attachment-preview__btn--active': currentDevice === Device.Mobile,
        }"
        @click="selectDevice(Device.Mobile)"
      >
        <IconSvg
          class="attachment-preview__btn-icon"
          name="mobile-device"
        />
      </button>
      <button
        class="attachment-preview__btn"
        :class="{
          'attachment-preview__btn--active': currentDevice === Device.Tablet,
        }"
        @click="selectDevice(Device.Tablet)"
      >
        <IconSvg
          class="attachment-preview__btn-icon"
          name="tablet-device"
        />
      </button>
      <button
        class="attachment-preview__btn"
        :class="{
          'attachment-preview__btn--active': currentDevice === Device.Desktop,
        }"
        @click="selectDevice(Device.Desktop)"
      >
        <IconSvg
          class="attachment-preview__btn-icon"
          name="desktop-device"
        />
      </button>
    </div>
    <div
      class="attachment-preview__device"
      :class="{
        'attachment-preview__device--desktop': currentDevice === Device.Desktop,
        'attachment-preview__device--tablet': currentDevice === Device.Tablet,
        'attachment-preview__device--mobile': currentDevice === Device.Mobile,
      }"
    >
      <div class="attachment-preview__device-in">
        <slot />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
iframe {
  @apply w-full h-full min-h-[80vh];
  transition-property: width !important;
}
</style>

<style lang="scss" scoped>
@import 'src/assets/mixins';

.attachment-preview {
  @apply flex-1 flex flex-col items-center h-full;
}

.attachment-preview__in {
  @apply flex justify-center mb-5;
}

.attachment-preview__btn {
  @apply p-1 rounded;
}

.attachment-preview__btn--active {
  @apply bg-blue-50 text-blue-600;
}

.attachment-preview__btn-icon {
  @apply w-10 fill-current;
}

.attachment-preview__device {
  @apply flex flex-col items-center bg-gray-50 dark:bg-gray-900;

  html.dark & {
    @apply text-gray-800;
  }
}

.attachment-preview__device-in {
  @apply rounded-md bg-white ease-in duration-150;
  transition-property: width !important;

  .attachment-preview__device--desktop & {
    @apply flex-1 flex flex-col w-full h-full;

    > div {
      @apply flex-1 flex flex-col w-full h-full;
    }
  }

  .attachment-preview__device--tablet & {
    @apply border;
    height: 1004px;
    width: 768px;

    > div {
      @apply w-full h-full;
    }
  }

  .attachment-preview__device--mobile & {
    @apply border;
    height: 568px;
    width: 320px;
    overflow: auto;

    > div {
      @apply w-full h-full;
    }
  }
}

.attachment-preview__device--desktop {
  @apply w-full h-full border rounded-md;
}

.attachment-preview__device--tablet {
  @apply justify-center border-2 rounded-3xl px-5 ease-in duration-150 w-auto;
  transition-property: width !important;

  &::after {
    @include border-style;
    @apply bg-gray-100 dark:bg-gray-900 rounded-full block w-12 h-12 my-4;
    content: '';
  }

  &::before {
    @include border-style;
    @apply bg-gray-100 dark:bg-gray-900 rounded-full block w-3 h-3 my-2;
    content: '';
  }
}

.attachment-preview__device--mobile {
  @apply justify-center border-2 rounded-3xl px-3;

  &::before {
    @include border-style;
    @apply bg-gray-100 dark:bg-gray-900 rounded-full block w-3 h-3 my-2;
    content: '';
  }

  &::after {
    @include border-style;
    @apply bg-gray-100 dark:bg-gray-900 rounded-full block w-8 h-8 my-3;
    content: '';
  }
}
</style>
