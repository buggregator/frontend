<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { userInitials } from '../../lib/user-avatar'

// The signed-in user's picture, or their initials when the provider sends
// none or the picture does not load (#6770). Decoration only: the control
// around it carries the user's name.
type Props = {
  src?: string | null
  // Name or email the initials come from.
  name?: string | null
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  src: null,
  name: null,
  size: 28
})

const broken = ref(false)
watch(
  () => props.src,
  () => {
    broken.value = false
  }
)

const showPicture = computed(() => !!props.src && !broken.value)
const initials = computed(() => userInitials(props.name))
</script>

<template>
  <span
    class="user-avatar"
    :style="{ '--ua-size': `${size}px` }"
    aria-hidden="true"
    data-test="user-avatar"
  >
    <img
      v-if="showPicture"
      :src="src!"
      alt=""
      class="user-avatar__img"
      @error="broken = true"
    >
    <span
      v-else
      class="user-avatar__initials"
    >{{ initials }}</span>
  </span>
</template>

<style lang="scss" scoped>
.user-avatar {
  @apply bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200;

  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: var(--ua-size);
  height: var(--ua-size);
  border-radius: 9999px;
  overflow: hidden;
}

.user-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-avatar__initials {
  font-size: calc(var(--ua-size) * 0.4);
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.02em;
  user-select: none;
}
</style>
