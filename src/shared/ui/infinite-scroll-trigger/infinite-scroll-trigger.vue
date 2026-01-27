<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

type Props = {
  disabled?: boolean
  loading?: boolean
  rootMargin?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  loading: false,
  rootMargin: '200px'
})

const emit = defineEmits<{
  (e: 'trigger'): void
}>()

const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
let isArmed = true

const teardown = () => {
  observer?.disconnect()
  observer = null
}

const setup = () => {
  if (observer || !sentinel.value) {
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries
      if (!entry) return

      if (!entry.isIntersecting) {
        isArmed = true
        return
      }
      // Guard conditions:
      // - disabled: infinite loading temporarily turned off
      // - loading: a load request is already in progress
      // - !isArmed: sentinel already triggered and hasn't been reset yet
      if (props.disabled || props.loading || !isArmed) {
        return
      }

      if (entry?.isIntersecting) {
        // Disarm immediately to avoid duplicate triggers
        // while the sentinel stays in the viewport.
        isArmed = false
        emit('trigger')
      }
    },
    { rootMargin: props.rootMargin }
  )

  observer.observe(sentinel.value)
}

watch(
  () => props.loading,
  (loading) => {
    if (!loading) {
      isArmed = true
    }
  }
)

/**
 * When `disabled` becomes true, we do NOT tear down the observer.
 * Instead, we silently ignore callbacks via guard conditions.
 *
 * Tearing down and recreating the observer at arbitrary moments
 * may cause unintended extra triggers.
 */
watch(
  () => props.disabled,
  (disabled) => {
    if (!disabled) {
      // If re-enabled, ensure the observer is active.
      setup()
    }
  },
  { immediate: true }
)

onMounted(setup)
onBeforeUnmount(teardown)
</script>

<template>
  <div
    ref="sentinel"
    class="infinite-scroll-trigger"
    aria-hidden="true"
  />
</template>

<style scoped lang="scss">
.infinite-scroll-trigger {
  width: 100%;
  height: 1px;
}
</style>
